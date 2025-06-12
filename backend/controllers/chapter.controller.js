// controllers/chapter.controller.js
import db from '../models/index.js';
import { handleServerError } from '../utils/errorUtils.js';
import fs from 'fs/promises';
import path from 'path';
import { generateSlug } from '../utils/slugUtils.js'; // Import
import { saveUserComicHistory } from '../services/comic.service.js';

const Chapter = db.Chapter;
const Comic = db.Comic;
const ComicPage = db.ComicPage;
const FollowedComic = db.UserFollowedComic;

const deleteLocalFile = async (relativePath) => {
    if (!relativePath) return;
    const fullPath = path.resolve('uploads', relativePath);
    try {
        await fs.access(fullPath);
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

const deleteLocalDirectoryRecursive = async (relativeDirPath) => {
    if (!relativeDirPath) return;
    const fullPath = path.resolve('uploads', relativeDirPath);
    try {
        await fs.access(fullPath);
        await fs.rm(fullPath, { recursive: true, force: true });
        console.log(`Đã xóa thư mục và nội dung bên trong: ${fullPath}`);
    } catch (error) {
        if (error.code !== 'ENOENT') {
            console.error(`Lỗi khi xóa thư mục ${fullPath}:`, error);
        }
    }
};

export const prepareChapterUpload = async (req, res, next) => {
    const comicId = req.body.comicId;
    const chapterId = req.params.chapterId;
    let comicSlug;
    let chapterNumberSlug;

    try {
        if (comicId) {
            const comic = await Comic.findByPk(comicId, { attributes: ['slug'] });
            if (comic) {
                comicSlug = comic.slug;
            } else {
                return res.status(400).json({ success: false, message: 'Comic ID không hợp lệ để upload chapter.' });
            }
        } else if (chapterId) {
            const chapter = await Chapter.findByPk(chapterId, {
                include: [{ model: Comic, as: 'comic', attributes: ['slug'] }],
            });
            if (chapter && chapter.comic) {
                comicSlug = chapter.comic.slug;
                chapterNumberSlug = generateSlug(String(chapter.chapterNumber));
            } else {
                return res.status(400).json({ success: false, message: 'Chapter ID không hợp lệ để upload page.' });
            }
        }

        chapterNumberSlug = generateSlug(String(req.body.chapterNumber));
        req.comicSlugForUpload = comicSlug;
        req.chapterNumberSlugForUpload = chapterNumberSlug;
        req.pageUploadCounter = 0;
        next();
    } catch (error) {
        handleServerError(res, error, 'Lỗi chuẩn bị upload chapter');
    }
};

export const batchUploadChapters = async (req, res) => {
    const { comicId, comicSlug, chapters: chaptersInfoStringified } = req.body;
    const allUploadedFiles = req.files; // Đây là một mảng các file

    if (!comicId || !comicSlug || !allUploadedFiles || allUploadedFiles.length === 0) {
        return res.status(400).json({ success: false, message: "Thiếu thông tin hoặc không có file nào được upload." });
    }

    let chaptersInfo;
    try {
        chaptersInfo = typeof chaptersInfoStringified === 'string' ? JSON.parse(chaptersInfoStringified) : chaptersInfoStringified;
    } catch (e) {
        return res.status(400).json({ success: false, message: "Dữ liệu thông tin chương không hợp lệ.", chaptersInfoStringified });
    }
    if (!Array.isArray(chaptersInfo) || chaptersInfo.length === 0) {
        return res.status(400).json({ success: false, message: "Không có thông tin chương nào được cung cấp." });
    }

    const t = await db.sequelize.transaction();
    const allProcessedFileRelativePaths = [];
    try {
        const comic = await Comic.findByPk(comicId, { transaction: t });
        if (!comic) { await t.rollback(); return res.status(404).json({ success: false, message: "Truyện không tồn tại." }); }

        const filesByOriginalFieldname = {};
        allUploadedFiles.forEach(file => {
            if (!filesByOriginalFieldname[file.fieldname]) {
                filesByOriginalFieldname[file.fieldname] = [];
            }
            filesByOriginalFieldname[file.fieldname].push(file);
            filesByOriginalFieldname[file.fieldname].sort((a, b) => a.filename.localeCompare(b.filename, undefined, { numeric: true }));
        });

        for (let i = 0; i < chaptersInfo.length; i++) {
            const chapterInfoClient = chaptersInfo[i];
            const chapterOriginalDirName = chapterInfoClient.name;
            const chapterNumber = String(chapterInfoClient.number);
            const filesFieldKey = `chapter_${i}_pages`;
            const chapterSpecificFiles = filesByOriginalFieldname[filesFieldKey] || [];

            if (chapterSpecificFiles.length === 0) {
                console.warn(`Không có file nào cho chương ${chapterOriginalDirName} với field key ${filesFieldKey}`);
                continue;
            }

            let chapter = await Chapter.findOne({
                where: { comicId: comic.id, chapterNumber: chapterNumber },
                transaction: t
            });

            if (!chapter) {
                chapter = await Chapter.create({
                    comicId: comic.id,
                    title: chapterOriginalDirName,
                    chapterNumber: chapterNumber,
                    order: parseFloat(chapterNumber) || (i + 1),
                }, { transaction: t });
            } else {
                console.log(`Chương ${chapterNumber} đã tồn tại. Cân nhắc logic cập nhật/bỏ qua trang.`);
                for (const file of chapterSpecificFiles) {
                    await deleteLocalFile(file.path.replace(path.resolve('uploads').replace(/\\/g, '/') + '/', ''));
                }
                continue;
            }

            const comicPagesToCreate = [];
            for (let j = 0; j < chapterSpecificFiles.length; j++) {
                const file = chapterSpecificFiles[j];
                let relativePath = file.path.replace(/\\/g, '/');
                const uploadsDirRoot = path.resolve('uploads').replace(/\\/g, '/');

                if (relativePath.startsWith(uploadsDirRoot)) {
                    relativePath = relativePath.substring(uploadsDirRoot.length + 1);
                } else if (relativePath.startsWith('uploads/')) {
                    relativePath = relativePath.substring('uploads/'.length);
                }
                allProcessedFileRelativePaths.push(relativePath);

                comicPagesToCreate.push({
                    chapterId: chapter.id,
                    imageUrl: relativePath,
                    pageNumber: j + 1
                });
            }
            if (comicPagesToCreate.length > 0) {
                await ComicPage.bulkCreate(comicPagesToCreate, { transaction: t });
            }
        }

        comic.lastChapterUpdatedAt = new Date();
        await comic.save({ transaction: t });
        await t.commit();
        res.status(201).json({ success: true, message: "Upload hàng loạt thành công." });

    } catch (error) {
        await t.rollback();
        for (const relPath of allProcessedFileRelativePaths) {
            await deleteLocalFile(relPath);
        }
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(409).json({ success: false, message: `Một hoặc nhiều chương đã tồn tại.` });
        }
        handleServerError(res, error, "Upload hàng loạt chương truyện");
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
    const userId = req.userId;
    try {
        const chapter = await Chapter.findByPk(chapterId, {
            include: [
                { model: ComicPage, as: 'pages', order: [['pageNumber', 'ASC']] },
                { model: Comic, as: 'comic', attributes: ['id', 'title', 'slug'] }
            ]
        });
        if (!chapter) {
            return res.status(404).json({ success: false, message: "Không tìm thấy chương." });
        }
        // Tăng view cho chương
        await chapter.increment('views');
        if (userId) {
            await saveUserComicHistory(userId, chapter.comicId, chapterId);
        }
        
        res.status(200).json({ success: true, chapter });
    } catch (error) {
        handleServerError(res, error, `Lấy chi tiết chương ID ${chapterId}`);
    }
};

// --- ADMIN: Tạo Chapter mới với các trang ảnh ---
export const createChapter = async (req, res) => {
    const { comicId, title, chapterNumber, order } = req.body;
    const pageFiles = req.files;
    
    if (!comicId || chapterNumber === undefined || order === undefined) {
        return res.status(400).json({ success: false, message: "Thiếu thông tin comicId, chapterNumber hoặc order." });
    }
    if (!pageFiles || pageFiles.length === 0) {
        return res.status(400).json({ success: false, message: "Cần ít nhất một trang ảnh cho chương." });
    }

    const t = await db.sequelize.transaction();
    const uploadedFilePaths = pageFiles.map(file => file.path.replace(/\\/g, '/'));

    try {
        const comic = await Comic.findByPk(comicId, { transaction: t });
        if (!comic) {
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

        const followers = await FollowedComic.findAll({
            where: { comicId: comic.id },
            attributes: ['userId'],
            transaction: t
        });

        if (followers.length > 0) {
            const chapterTitleDisplay = newChapter.title ? ` - ${newChapter.title}` : '';
            const notificationMessage = `Truyện <strong>${comic.title}</strong> vừa có chương mới: <a href="/truyen/${comic.slug}/chap/${newChapter.id}" class="notification-link-highlight">Chương ${newChapter.chapterNumber}${chapterTitleDisplay}</a>.`;
            const notificationLink = `/truyen/${comic.slug}/chap/${newChapter.id}`;

            for (const follower of followers) {
                await createAndEmitNotification({
                    recipientId: follower.userId,
                    type: 'NEW_CHAPTER',
                    message: notificationMessage,
                    link: notificationLink,
                    iconUrl: comic.coverImage,
                    transaction: t
                });
            }
        }

        await t.commit();
        const finalChapter = await Chapter.findByPk(newChapter.id, {
            include: [{ model: ComicPage, as: 'pages', order: [['pageNumber', 'ASC']] }]
        });
        res.status(201).json({ success: true, chapter: finalChapter });
    } catch (error) {
        await t.rollback();
        for (const filePath of uploadedFilePaths) {
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
        if (!chapter) {
            return res.status(404).json({ success: false, message: "Chương không tồn tại." });
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
    let chapterDirectoryPath = null; // Đường dẫn tương đối của thư mục chương
    let comicChaptersDirPath = null; // Đường dẫn tương đối của thư mục 'chapters' của truyện
    let comicBaseDirPath = null;     // Đường dẫn tương đối của thư mục gốc của truyện

    try {
        const chapter = await Chapter.findByPk(chapterId, {
            include: [
                { model: ComicPage, as: 'pages' },
                { model: Comic, as: 'comic', attributes: ['slug'] }
            ],
            transaction: t
        });

        if (!chapter) {
            await t.rollback();
            return res.status(404).json({ success: false, message: "Không tìm thấy chương." });
        }

        // 1. Xóa các file ảnh của từng trang
        for (const page of chapter.pages) {
            if (page.imageUrl) {
                // page.imageUrl đã là đường dẫn tương đối từ 'uploads'
                // ví dụ: comics/comic-slug/chapters/chapter-slug/page_001.jpg
                await deleteLocalFile(page.imageUrl);
            }
        }

        // 2. Xác định các đường dẫn thư mục TRƯỚC KHI xóa bản ghi chapter
        if (chapter.comic && chapter.comic.slug) {
            const chapterNumberSlug = `chapter-${chapter.chapterNumber}`;
            // Đường dẫn tương đối từ thư mục 'uploads'
            chapterDirectoryPath = path.join('comics', chapter.comic.slug, 'chapters', chapterNumberSlug);
            comicChaptersDirPath = path.join('comics', chapter.comic.slug, 'chapters');
            comicBaseDirPath = path.join('comics', chapter.comic.slug);
        }

        // 3. Xóa bản ghi Chapter và các ComicPage liên quan (do onDelete: 'CASCADE')
        const comicId = chapter.comicId;
        await chapter.destroy({ transaction: t });
        // 4. Xóa thư mục của chương này (Nên thực hiện sau khi đã commit transaction nếu chỉ xóa khi DB thành công)
        // Tuy nhiên, để đảm bảo dọn dẹp file ngay cả khi DB có thể rollback vì lý do khác, ta có thể xóa ở đây.
        // Nếu transaction rollback, file đã xóa thì cũng không sao lắm.
        if (chapterDirectoryPath) {
            await deleteLocalDirectoryRecursive(chapterDirectoryPath);
        }

        // 5. Cập nhật lastChapterUpdatedAt cho comic
        const comic = await Comic.findByPk(comicId, {
            include: [{ model: Chapter, as: 'chapters', attributes: ['createdAt'], order: [['order', 'DESC']], limit: 1 }],
            transaction: t // Quan trọng: Phải cùng transaction
        });
        if (comic) {
            comic.lastChapterUpdatedAt = comic.chapters && comic.chapters.length > 0 ? comic.chapters[0].createdAt : comic.createdAt;
            await comic.save({ transaction: t });
        }

        await t.commit(); // Commit transaction SAU KHI các thao tác DB hoàn tất

        // 6. Kiểm tra và xóa thư mục cha nếu chúng rỗng (SAU KHI COMMIT)
        // Việc này tách biệt với transaction DB, vì nó là thao tác trên file system
        if (comicChaptersDirPath) {
            try {
                const chaptersDirFullPath = path.resolve('uploads', comicChaptersDirPath);
                const itemsInChaptersDir = await fs.readdir(chaptersDirFullPath);
                if (itemsInChaptersDir.length === 0) {
                    await deleteLocalDirectoryRecursive(comicChaptersDirPath); // Xóa thư mục /chapters của truyện
                }
            } catch (dirError) {
                if (dirError.code !== 'ENOENT') { // Bỏ qua nếu thư mục chapters không còn
                    console.warn(`Không thể kiểm tra/xóa thư mục chapters của truyện: ${comicChaptersDirPath}`, dirError.message);
                }
            }
        }

        if (comicBaseDirPath && chapter.comic.slug) { // Cần chapter.comic.slug để chắc chắn
            try {
                const comicDirFullPath = path.resolve('uploads', comicBaseDirPath);
                const itemsInComicDir = await fs.readdir(comicDirFullPath);
                // Kiểm tra xem thư mục truyện có trống không, hoặc chỉ còn thư mục 'covers' trống
                let isComicDirEffectivelyEmpty = itemsInComicDir.length === 0;
                if (itemsInComicDir.length === 1 && itemsInComicDir[0] === 'covers') {
                    const coversDirFullPath = path.join(comicDirFullPath, 'covers');
                    try {
                        const itemsInCoversDir = await fs.readdir(coversDirFullPath);
                        if (itemsInCoversDir.length === 0) {
                            await deleteLocalDirectoryRecursive(path.join(comicBaseDirPath, 'covers')); // Xóa thư mục covers trước
                            // Kiểm tra lại thư mục truyện sau khi xóa covers
                            const itemsAfterCoversDelete = await fs.readdir(comicDirFullPath);
                            if (itemsAfterCoversDelete.length === 0) {
                                isComicDirEffectivelyEmpty = true;
                            }
                        }
                    } catch (coversError) {
                        if (coversError.code !== 'ENOENT') console.warn(`Không thể kiểm tra/xóa thư mục covers: ${path.join(comicBaseDirPath, 'covers')}`, coversError.message);
                        else isComicDirEffectivelyEmpty = true; // Nếu covers không tồn tại thì coi như trống
                    }
                }

                if (isComicDirEffectivelyEmpty) {
                    await deleteLocalDirectoryRecursive(comicBaseDirPath); // Xóa thư mục gốc của truyện
                }
            } catch (dirError) {
                if (dirError.code !== 'ENOENT') {
                    console.warn(`Không thể kiểm tra/xóa thư mục gốc của truyện: ${comicBaseDirPath}`, dirError.message);
                }
            }
        }


        res.status(200).json({ success: true, message: "Đã xóa chương và các tệp liên quan thành công." });
    } catch (error) {
        await t.rollback();
        console.error(`Error deleting chapter ID ${chapterId}:`, error);
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
            include: [{ model: Comic, as: 'comic', attributes: ['slug'] }], // Cần để lấy comicSlug cho Multer
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
        if (!page) {
            return res.status(404).json({ success: false, message: "Trang không tồn tại." });
        }
        if (page.imageUrl) {
            const imagePath = path.join('uploads', page.imageUrl);
            try { await fs.unlink(imagePath); } catch (e) { console.warn("Failed to delete page image file:", e); }
        }
        await page.destroy();
        res.status(200).json({ success: true, message: "Đã xóa trang." });
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
        } else if (orderedPageIds && orderedPageIds.length === 0 && chapter.pages && chapter.pages.length > 0) {
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