// backend/middlewares/uploadBadgeIcon.js
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { generateSlug } from '../utils/slugUtils.js';

const ensureDirectoryExistence = (dirPath) => {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
};

const badgeIconStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const destPath = path.join('uploads', 'badges_icons');
        ensureDirectoryExistence(destPath);
        cb(null, destPath);
    },
    filename: (req, file, cb) => {
        const badgeName = req.body.name || `badge-${Date.now()}`;
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const safeOriginalName = generateSlug(path.parse(file.originalname).name);
        const finalFileName = `${generateSlug(badgeName).substring(0,30)}-${safeOriginalName.substring(0,30)}-${uniqueSuffix}${path.extname(file.originalname)}`;
        cb(null, finalFileName);
    }
});

const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype === 'image/svg+xml') { // Cho phép cả SVG
        cb(null, true);
    } else {
        cb(new Error('Chỉ cho phép upload file ảnh (PNG, JPG, GIF, SVG)!'), false);
    }
};

const uploadBadgeIcon = multer({
    storage: badgeIconStorage,
    limits: { fileSize: 2 * 1024 * 1024 }, // Giới hạn 2MB
    fileFilter: fileFilter
}).single('badgeIconFile'); // Tên field từ frontend

export default uploadBadgeIcon;