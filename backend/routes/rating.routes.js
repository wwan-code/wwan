// backend/routes/rating.routes.js
import express from 'express';
import * as ratingController from '../controllers/rating.controller.js';
import authJwt from '../middlewares/authJwt.js';

const router = express.Router();

router.post(
    '/ratings',
    [authJwt.verifyToken],
    ratingController.createOrUpdateRatingReview
);

router.post(
    '/ratings/:ratingId/like',
    [authJwt.verifyToken],
    ratingController.likeUnlikeReview
);

router.put(
    '/ratings/:ratingId',
    [authJwt.verifyToken],
    ratingController.updateReview
);

router.delete(
    '/ratings/:ratingId',
    [authJwt.verifyToken],
    ratingController.deleteReview
);

router.get(
    '/movies/:movieId/average-rating',
    ratingController.getAverageRating
);

export default router;

