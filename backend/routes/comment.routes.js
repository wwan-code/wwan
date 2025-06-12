// backend/routes/comment.routes.js
import express from 'express';
import * as commentController from '../controllers/comment.controller.js';
import authJwt from '../middlewares/authJwt.js';

const router = express.Router();

// Tạo bình luận mới
router.post(
    '/',
    [authJwt.verifyToken], // Cần đăng nhập để bình luận
    commentController.createComment
);

// Lấy bình luận cho một content cụ thể
// Ví dụ: /api/comments/episode/123 hoặc /api/comments/comic/456
router.get(
    '/:contentType/:contentId',
    [authJwt.verifyTokenOptional],
    commentController.getComments
);

// Like/Unlike một bình luận
router.post(
    '/:commentId/like',
    [authJwt.verifyToken],
    commentController.likeComment
);

// Xóa một bình luận
router.delete(
    '/:commentId',
    [authJwt.verifyToken],
    commentController.deleteComment
);

// Cập nhật một bình luận
router.put(
    '/:commentId',
    [authJwt.verifyToken],
    commentController.updateComment
);

// Báo cáo một bình luận
router.post(
    '/:commentId/report',
    [authJwt.verifyToken],
    commentController.reportComment
);

// Lấy replies cho một comment cha (phân trang)
router.get(
    '/replies',
    [authJwt.verifyTokenOptional], // Cho phép xem replies dù chưa đăng nhập
    commentController.getRepliesForComment
);

export default router;