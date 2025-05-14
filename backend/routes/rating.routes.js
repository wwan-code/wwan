import express from 'express';
import * as ratingController from '../controllers/rating.controller.js';
import authJwt from '../middlewares/authJwt.js';

const router = express.Router();

router.post('/', authJwt.verifyToken, ratingController.createOrUpdateRatingReview);
// Route Like/Unlike một review (ratingId ở đây là ID của bản ghi Rating)
router.post(
    '/:ratingId/like',
    authJwt.verifyToken, // Yêu cầu đăng nhập
    ratingController.likeUnlikeReview
);

router.put(
    '/:ratingId',
    [authJwt.verifyToken], // Yêu cầu đăng nhập
    ratingController.updateReview
);

// Route xóa một review (chỉ chủ sở hữu)
router.delete(
    '/:ratingId',
    [authJwt.verifyToken], // Yêu cầu đăng nhập
    ratingController.deleteReview
);

router.get('/:slug', ratingController.getAverageRating);

export default router;

