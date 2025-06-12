// backend/middlewares/uploadChallengeIcon.js
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const UPLOAD_DIR = './uploads/challenge-icons/';

// Đảm bảo thư mục uploads tồn tại
if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, UPLOAD_DIR);
    },
    filename: (req, file, cb) => {
        // Tạo tên file duy nhất để tránh ghi đè
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const extension = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + extension);
    }
});

const fileFilter = (req, file, cb) => {
    // Chỉ chấp nhận các định dạng ảnh phổ biến
    if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png' || file.mimetype === 'image/gif' || file.mimetype === 'image/webp') {
        cb(null, true);
    } else {
        cb(new Error('Định dạng file không được hỗ trợ. Chỉ chấp nhận JPG, PNG, GIF, WEBP.'), false);
    }
};

const uploadChallengeIconMiddleware = multer({
    storage: storage,
    limits: {
        fileSize: 1024 * 1024 * 2 // Giới hạn 2MB
    },
    fileFilter: fileFilter
});

// Middleware để xử lý một file duy nhất có fieldname là 'iconFile'
// Nếu bạn không muốn lưu file trực tiếp mà xử lý ngay bằng ImageKit, có thể dùng multer.memoryStorage()
// và sau đó trong service sẽ upload buffer lên ImageKit.
// Hiện tại, ví dụ này lưu file vào server trước.
export const handleChallengeIconUpload = uploadChallengeIconMiddleware.single('iconFile');