// middlewares/uploadComicFiles.js
import multer from 'multer';
import path from 'path';
import fs from 'fs'; // Dùng fs thường, không phải fs/promises ở đây vì multer dùng callback
import { generateSlug } from '../utils/slugUtils.js'; // Đảm bảo bạn có hàm này

// Helper tạo thư mục đệ quy (synchronous version for multer, or ensure async is handled)
const ensureDirectoryExistence = (dirPath) => {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
};

// Cấu hình lưu trữ cho ảnh bìa truyện
const comicCoverStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const titleForSlug = req.body.title || `comic-temp-${Date.now()}`;
        const comicSlug = generateSlug(titleForSlug);
        const destPath = path.join('uploads', 'comics', comicSlug, 'covers');
        ensureDirectoryExistence(destPath);
        cb(null, destPath);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const safeOriginalName = generateSlug(path.parse(file.originalname).name);
        cb(null, `${safeOriginalName}-${uniqueSuffix}${path.extname(file.originalname)}`);
    }
});

// Cấu hình lưu trữ cho các trang của chương
const chapterPagesStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const comicSlug = req.comicSlugForUpload || 'unknown-comic';
        const chapterSlug = req.chapterNumberSlugForUpload || 'unknown-chapter';
        const destPath = path.join('uploads', 'comics', comicSlug, 'chapters', chapterSlug);
        ensureDirectoryExistence(destPath);
        cb(null, destPath);
    },
    filename: (req, file, cb) => {
        // Đánh số trang dựa trên thứ tự file trong mảng upload.
        // Controller sẽ cần quản lý `req.pageUploadCounter`
        if (req.pageUploadCounter === undefined) {
            req.pageUploadCounter = 0;
        }
        req.pageUploadCounter++;
        const pageNum = String(req.pageUploadCounter).padStart(3, '0'); // Ví dụ: 001, 002
        cb(null, `page_${pageNum}${path.extname(file.originalname)}`);
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
    storage: comicCoverStorage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: fileFilter
}).fields([ // Cho phép nhiều field khác nhau nếu cần, ví dụ 'bannerImage'
    { name: 'coverImage', maxCount: 1 }
]);

const chapterPagesUpload = multer({
    storage: chapterPagesStorage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB/page
    fileFilter: fileFilter
}).array('pages', 100); // Field tên 'pages', tối đa 50 file ảnh

export { comicCoverUpload, chapterPagesUpload };