// middlewares/uploadComicFiles.js
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { generateSlug } from '../utils/slugUtils.js';
import Comic from '../models/Comic.js';

const ensureDirectoryExistence = (dirPath) => {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
};

const comicImageStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const titleForSlug = req.body.title || `comic-temp-${Date.now()}`;
        const comicSlug = generateSlug(titleForSlug);
        const destPath = path.join('uploads', 'comics', comicSlug, 'images');
        ensureDirectoryExistence(destPath);
        cb(null, destPath);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const safeOriginalName = generateSlug(path.parse(file.originalname).name);
        cb(null, `${safeOriginalName}-${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
    }
});

// Cấu hình lưu trữ cho các trang của chương
const chapterPagesStorage = multer.diskStorage({
    destination: async (req, file, cb) => {
        const comic = await Comic.findByPk(req.body.comicId, { attributes: ['slug'] });
        const comicSlug = comic.slug;
        const chapterNumber = `chapter-${req.body.chapterNumber}`;
        const destPath = path.join('uploads', 'comics', comicSlug, 'chapters', chapterNumber);
        ensureDirectoryExistence(destPath);
        cb(null, destPath);
    },
    filename: (req, file, cb) => {
        if (req.pageUploadCounter === undefined) {
            req.pageUploadCounter = 0;
        }
        req.pageUploadCounter++;
        const pageNum = String(req.pageUploadCounter).padStart(3, '0');
        cb(null, `page_${pageNum}${path.extname(file.originalname)}`);
    }
});

const dynamicChapterPagesStorage = multer.diskStorage({
    destination: async (req, file, cb) => {
        try {
            const fieldNameParts = file.fieldname.split('_');
            const chapterIndex = parseInt(fieldNameParts[1], 10);

            const comicSlug = req.body.comicSlug;
            if (!comicSlug) {
                return cb(new Error("Không tìm thấy comic slug để tạo đường dẫn."));
            }

            const chapterInfo = req.body.chapters && req.body.chapters[chapterIndex];
            const chapterDirName = chapterInfo ? generateSlug(chapterInfo.name) : `temp-chapter-${Date.now()}`;

            const destPath = path.join('uploads', 'comics', comicSlug, 'chapters', chapterDirName);
            ensureDirectoryExistence(destPath);
            req.currentUploadDestPath = destPath; 
            cb(null, destPath);
        } catch (error) {
            cb(error);
        }
    },
    filename: (req, file, cb) => {
        const fieldname = file.fieldname;
        if (!req.pageUploadCounters) {
            req.pageUploadCounters = {};
        }
        if (req.pageUploadCounters[fieldname] === undefined) {
            req.pageUploadCounters[fieldname] = 0;
        }
        req.pageUploadCounters[fieldname]++;

        const pageNum = String(req.pageUploadCounters[fieldname]).padStart(3, '0');
        // Đảm bảo giữ phần mở rộng gốc của file ảnh
        cb(null, `page_${pageNum}${path.extname(file.originalname).toLowerCase()}`);
    }
});

const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Chỉ cho phép upload file ảnh! Vui lòng kiểm tra lại.'), false);
    }
};

const comicCoverUpload = multer({
    storage: comicImageStorage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: fileFilter
}).fields([
    { name: 'coverImage', maxCount: 1 },
    { name: 'bannerImage', maxCount: 1 }
]);

const chapterPagesUpload = multer({
    storage: chapterPagesStorage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: fileFilter
}).array('pages', 250);

const batchChapterPagesUploadAny = multer({
    storage: dynamicChapterPagesStorage,
    limits: { fileSize: 5 * 1024 * 1024 * 250 },
    fileFilter: fileFilter
}).any();;

export { comicCoverUpload, chapterPagesUpload, batchChapterPagesUploadAny };