import express from 'express';
import { getAllComments, updateCommentStatus, deleteComment } from '../controllers/admin.comment.controller.js';
import authJwt from '../middlewares/authJwt.js'; // Import middleware xác thực và kiểm tra quyền

const router = express.Router();

// Route lấy tất cả bình luận
router.get('/admin/comments', authJwt.verifyToken, authJwt.isAdmin, getAllComments);

// Route cập nhật trạng thái bình luận (ẩn/hiện)
router.put('/admin/comments/:id/status', authJwt.verifyToken, authJwt.isAdmin, updateCommentStatus);

// Route xóa bình luận
router.delete('/admin/comments/:id', authJwt.verifyToken, authJwt.isAdmin, deleteComment);

export default router;