// controllers/chapter.controller.js
import db from '../models/index.js';
import { handleServerError } from '../utils/errorUtils.js';
import fs from 'fs/promises';
import path from 'path';
import { generateSlug } from '../utils/slugUtils.js'; // Import

const Chapter = db.Chapter;
const Comic = db.Comic;
const ComicPage = db.ComicPage;


// Helper xóa file local an toàn
const deleteLocalFile = async (relativePath) => {
    if (!relativePath) return;
    // Đường dẫn từ thư mục gốc của backend, giả sử thư mục 'uploads' nằm ở gốc
    const fullPath = path.resolve('uploads', relativePath);
    try {
        await fs.access(fullPath); // Kiểm tra file tồn tại
        await fs.unlink(fullPath);
        console.log(`Successfully deleted local file: ${fullPath}`);
    } catch (error) {
        if (error.code === 'ENOENT') {
            console.warn(`Local file not found, cannot delete: ${fullPath}`);
        } else {
            console.error(`Error deleting local file ${fullPath}:`, error);
        }
    }
};

// Middleware để chuẩn bị req cho Multer
export const prepareChapterUpload = async (req, res, next) => {
    try {
        if (req.body.comicId) {
            const comic = await Comic.findByPk(req.body.comicId, { attributes: ['slug'] });
            if (comic) {
                req.comicSlugForUpload = comic.slug;
            } else {
                // Nếu comicId không hợp lệ, không nên cho upload
                return res.status(400).json({success: false, message: "Comic ID không hợp lệ để upload chapter."})
            }
        } else if (req.params.chapterId) { // Trường hợp thêm page vào chapter đã có
            const chapter = await Chapter.findByPk(req.params.chapterId, {include: [{model: Comic, as: 'comic', attributes:['slug']}]});
            if(chapter && chapter.comic) {
                req.comicSlugForUpload = chapter.comic.slug;
                req.chapterNumberSlugForUpload = generateSlug(String(chapter.chapterNumber));
            } else {
                 return res.status(400).json({success: false, message: "Chapter ID không hợp lệ để upload page."})
            }
        }

        req.chapterNumberSlugForUpload = generateSlug(String(req.body.chapterNumber || `chap-temp-${Date.now()}`));
        req.pageUploadCounter = 0; // Khởi tạo biến đếm cho Multer filename
        next();
    } catch (error) {
        handleServerError(res, error, "Lỗi chuẩn bị upload chapter");
    }
};

// Lấy tất cả chương của một truyện (có phân trang nếu cần cho admin, hoặc full cho trang đọc)
export const getChaptersByComicId = async (req, res) => {
    const { comicId } = req.params;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 1000;
    const offset = (page - 1) * limit;

    try {
        const chapters = await Chapter.findAll({
            where: { comicId },
            order: [['order', 'ASC']],
            limit,
            offset,
            subQuery: false 
        });
        const count = await Chapter.count({ where: { comicId } });
        const totalPages = Math.ceil(count / limit);
        res.status(200).json({
            success: true,
            chapters,
            pagination: { totalItems: count, totalPages, currentPage: page, itemsPerPage: limit }
        });
    } catch (error) {
        handleServerError(res, error, `Lấy chương cho truyện ID ${comicId}`);
    }
};

// Lấy chi tiết một chương bao gồm các trang ảnh
export const getChapterWithPages = async (req, res) => {
    const { chapterId } = req.params;
    try {
        const chapter = await Chapter.findByPk(chapterId, {
            include: [
                { model: ComicPage, as: 'pages', order: [['pageNumber', 'ASC']] }, // Lấy các trang và sắp xếp
                { model: Comic, as: 'comic', attributes: ['id', 'title', 'slug'] } // Thông tin truyện cha
            ]
        });
        if (!chapter) {
            return res.status(404).json({ success: false, message: "Không tìm thấy chương." });
        }
        // Tăng view cho chương
        await chapter.increment('views');
        res.status(200).json({ success: true, chapter });
    } catch (error) {
        handleServerError(res, error, `Lấy chi tiết chương ID ${chapterId}`);
    }
};

// --- ADMIN: Tạo Chapter mới với các trang ảnh ---
export const createChapter = async (req, res) => {
    const { comicId, title, chapterNumber, order } = req.body;
    const pageFiles = req.files; // Từ multer.array('pages')

    if (!comicId || chapterNumber === undefined || order === undefined) {
        return res.status(400).json({ success: false, message: "Thiếu thông tin comicId, chapterNumber hoặc order." });
    }
    if (!pageFiles || pageFiles.length === 0) {
        return res.status(400).json({ success: false, message: "Cần ít nhất một trang ảnh cho chương." });
    }

    const t = await db.sequelize.transaction();
    const uploadedFilePaths = pageFiles.map(file => file.path.replace(/\\/g, '/')); // Lưu lại để xóa nếu lỗi

    try {
        // comic đã được kiểm tra trong prepareChapterUpload (nếu dùng middleware đó)
        // Nếu không, cần kiểm tra lại ở đây:
        const comic = await Comic.findByPk(comicId, { transaction: t });
        if(!comic) {
            await t.rollback();
             // Xóa file đã upload nếu rollback
            for (const filePath of uploadedFilePaths) { await deleteLocalFile(filePath.replace(path.resolve('uploads').replace(/\\/g, '/') + '/', '')); }
            return res.status(404).json({ success: false, message: "Truyện không tồn tại." });
        }


        const newChapter = await Chapter.create({
            comicId,
            title: title || `Chương ${chapterNumber}`,
            chapterNumber: String(chapterNumber),
            order: parseFloat(order)
        }, { transaction: t });

        const comicPagesToCreate = pageFiles.map((file, index) => {
            let relativePath = file.path.replace(/\\/g, '/');
            const uploadsDir = path.resolve('uploads').replace(/\\/g, '/') + '/';
            if (relativePath.startsWith(uploadsDir)) {
                relativePath = relativePath.substring(uploadsDir.length);
            } else if (relativePath.startsWith('uploads/')) {
                 relativePath = relativePath.substring('uploads/'.length);
            }
            return {
                chapterId: newChapter.id,
                imageUrl: relativePath,
                pageNumber: index + 1 // Dựa trên thứ tự file upload
            };
        });
        await ComicPage.bulkCreate(comicPagesToCreate, { transaction: t });

        comic.lastChapterUpdatedAt = new Date();
        await comic.save({ transaction: t });

        await t.commit();
        const finalChapter = await Chapter.findByPk(newChapter.id, {
            include: [{ model: ComicPage, as: 'pages', order: [['pageNumber', 'ASC']] }]
        });
        res.status(201).json({ success: true, chapter: finalChapter });
    } catch (error) {
        await t.rollback();
        for (const filePath of uploadedFilePaths) { // Xóa file đã upload nếu transaction lỗi
            await deleteLocalFile(filePath.replace(path.resolve('uploads').replace(/\\/g, '/') + '/', ''));
        }
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(409).json({ success: false, message: `Chương số '${chapterNumber}' của truyện này đã tồn tại.` });
        }
        handleServerError(res, error, "Tạo chương mới");
    }
};

// --- ADMIN: Cập nhật thông tin Chapter (không bao gồm quản lý pages ở đây) ---
export const updateChapterInfo = async (req, res) => {
    const { chapterId } = req.params;
    const { title, chapterNumber, order } = req.body;
    try {
        const chapter = await Chapter.findByPk(chapterId);
        if(!chapter){
            return res.status(404).json({success: false, message: "Chương không tồn tại."});
        }
        // TODO: Kiểm tra chapterNumber và order có bị trùng với chương khác trong cùng comic không nếu cần
        await chapter.update({
            title: title || chapter.title,
            chapterNumber: chapterNumber !== undefined ? String(chapterNumber) : chapter.chapterNumber,
            order: order !== undefined ? parseFloat(order) : chapter.order,
        });
        // Cập nhật lastChapterUpdatedAt của Comic cha
        const comic = await Comic.findByPk(chapter.comicId);
        if (comic) {
            comic.lastChapterUpdatedAt = new Date();
            await comic.save();
        }
        res.status(200).json({ success: true, chapter });
    } catch (error) {
        handleServerError(res, error, `Cập nhật thông tin chương ID ${chapterId}`);
    }
};

// --- ADMIN: Xóa Chapter (sẽ tự động xóa pages do onDelete: 'CASCADE') ---
export const deleteChapter = async (req, res) => {
    const { chapterId } = req.params;
    const t = await db.sequelize.transaction();
    try {
        const chapter = await Chapter.findByPk(chapterId, {
            include: [{ model: ComicPage, as: 'pages' }],
            transaction: t
        });
        if (!chapter) {
            await t.rollback();
            return res.status(404).json({ success: false, message: "Không tìm thấy chương." });
        }

        for (const page of chapter.pages) {
            if (page.imageUrl) await deleteLocalFile(page.imageUrl);
        }

        const comicId = chapter.comicId; // Lưu lại comicId
        await chapter.destroy({ transaction: t });

        // Cập nhật lại lastChapterUpdatedAt cho comic
        const comic = await Comic.findByPk(comicId, {
            include: [{ model: Chapter, as: 'chapters', attributes: ['createdAt'], order: [['order', 'DESC']], limit: 1}],
            transaction: t
        });
        if (comic) {
            comic.lastChapterUpdatedAt = comic.chapters && comic.chapters.length > 0 ? comic.chapters[0].createdAt : comic.createdAt; // Hoặc một giá trị mặc định
            await comic.save({ transaction: t });
        }

        await t.commit();
        res.status(200).json({ success: true, message: "Đã xóa chương thành công." });
    } catch (error) {
        await t.rollback();
        handleServerError(res, error, `Xóa chương ID ${chapterId}`);
    }
};

// --- ADMIN: API để quản lý Pages của một Chapter (Thêm, Xóa, Sắp xếp lại) ---
export const addPagesToChapter = async (req, res) => {
    const { chapterId } = req.params;
    const pageFiles = req.files;

    if (!pageFiles || pageFiles.length === 0) {
        return res.status(400).json({ success: false, message: "Cần ít nhất một trang ảnh." });
    }
    const t = await db.sequelize.transaction();
    const uploadedFilePaths = pageFiles.map(file => file.path.replace(/\\/g, '/'));
    try {
        const chapter = await Chapter.findByPk(chapterId, {
            include: [{model: Comic, as: 'comic', attributes:['slug']}], // Cần để lấy comicSlug cho Multer
            transaction: t
        });
        if (!chapter) {
            await t.rollback();
            return res.status(404).json({ success: false, message: "Chương không tồn tại." });
        }

        const existingMaxPageNumber = await ComicPage.max('pageNumber', { where: { chapterId }, transaction: t }) || 0;

        const comicPagesToCreate = pageFiles.map((file, index) => {
            let relativePath = file.path.replace(/\\/g, '/');
            return {
                chapterId: chapter.id,
                imageUrl: relativePath,
                pageNumber: existingMaxPageNumber + index + 1
            };
        });

        await ComicPage.bulkCreate(comicPagesToCreate, { transaction: t });
        await t.commit();
        res.status(201).json({ success: true, message: `Đã thêm ${pageFiles.length} trang vào chương.` });
    } catch (error) {
        await t.rollback();
        for (const filePath of uploadedFilePaths) { await deleteLocalFile(filePath.replace(path.resolve('uploads').replace(/\\/g, '/') + '/', '')); }
        handleServerError(res, error, `Thêm trang vào chương ID ${chapterId}`);
    }
};

// --- ADMIN: Xóa một Page cụ thể ---
export const deletePageFromChapter = async (req, res) => {
    const { pageId } = req.params;
    try {
        const page = await ComicPage.findByPk(pageId);
        if(!page){
            return res.status(404).json({success: false, message: "Trang không tồn tại."});
        }
        if (page.imageUrl) {
            const imagePath = path.join('uploads', page.imageUrl);
            try { await fs.unlink(imagePath); } catch (e) { console.warn("Failed to delete page image file:", e); }
        }
        await page.destroy();
        res.status(200).json({success: true, message: "Đã xóa trang."});
    } catch (error) {
        handleServerError(res, error, `Xóa trang ID ${pageId}`);
    }
};

export const manageChapterPages = async (req, res) => {
    const { chapterId } = req.params;
    const { orderedPageIds } = req.body; // Mảng các ID của page đã có, theo thứ tự mới
    const newPageFiles = req.files; // Mảng các file ảnh mới từ multer (field 'newPages')

    const t = await db.sequelize.transaction();
    const newlyUploadedFilePaths = []; // Để rollback nếu lỗi

    try {
        const chapter = await Chapter.findByPk(chapterId, {
            include: [{ model: Comic, as: 'comic', attributes: ['slug'] }], // Cần comicSlug để tạo đường dẫn
            transaction: t
        });

        if (!chapter) {
            await t.rollback();
            return res.status(404).json({ success: false, message: "Chương không tồn tại." });
        }

        // 1. Cập nhật pageNumber cho các trang hiện có dựa trên orderedPageIds
        if (orderedPageIds && Array.isArray(orderedPageIds) && orderedPageIds.length > 0) {
            for (let i = 0; i < orderedPageIds.length; i++) {
                const pageId = parseInt(orderedPageIds[i]);
                const newPageNumber = i + 1;
                await ComicPage.update(
                    { pageNumber: newPageNumber },
                    { where: { id: pageId, chapterId: chapter.id }, transaction: t }
                );
            }
        } else if (orderedPageIds && orderedPageIds.length === 0 && chapter.pages && chapter.pages.length > 0){
            // Nếu orderedPageIds rỗng nghĩa là người dùng đã xóa hết các page hiện có (thông qua UI)
            // Bước này chỉ reorder, việc xóa page được xử lý bằng API DELETE /comic-pages/:pageId riêng
            // Hoặc bạn có thể thêm logic ở đây để xóa các page không có trong orderedPageIds
        }

        // 2. Xử lý các file ảnh mới được upload
        let maxExistingPageNumber = await ComicPage.max('pageNumber', { where: { chapterId }, transaction: t }) || 0;

        if (newPageFiles && newPageFiles.length > 0) {
            const comicPagesToCreate = [];
            for (let i = 0; i < newPageFiles.length; i++) {
                const file = newPageFiles[i];
                let relativePath = file.path.replace(/\\/g, '/');
                const uploadsDir = path.resolve('uploads').replace(/\\/g, '/') + '/';
                if (relativePath.startsWith(uploadsDir)) {
                    relativePath = relativePath.substring(uploadsDir.length);
                } else if (relativePath.startsWith('uploads/')) {
                    relativePath = relativePath.substring('uploads/'.length);
                }
                newlyUploadedFilePaths.push(file.path); // Lưu lại đường dẫn đầy đủ để xóa nếu rollback

                comicPagesToCreate.push({
                    chapterId: chapter.id,
                    imageUrl: relativePath,
                    pageNumber: maxExistingPageNumber + i + 1
                });
            }
            await ComicPage.bulkCreate(comicPagesToCreate, { transaction: t });
        }

        // Cập nhật lastChapterUpdatedAt của Comic
        const parentComic = await Comic.findByPk(chapter.comicId, { transaction: t });
        if (parentComic) {
            parentComic.lastChapterUpdatedAt = new Date();
            await parentComic.save({ transaction: t });
        }

        await t.commit();
        res.status(200).json({ success: true, message: "Đã cập nhật và thêm trang thành công." });

    } catch (error) {
        await t.rollback();
        // Xóa các file mới đã upload nếu transaction lỗi
        for (const filePath of newlyUploadedFilePaths) {
            await deleteLocalFile(filePath.replace(path.resolve('uploads').replace(/\\/g, '/') + '/', ''));
        }
        handleServerError(res, error, `Quản lý trang cho chương ID ${chapterId}`);
    }
};