// backend/controllers/rating.controller.js
import * as ratingService from '../services/rating.service.js';
import { handleServerError } from "../utils/errorUtils.js";
// Xóa các import không cần thiết: Op, db, gamificationUtils, notificationUtils, models trực tiếp

export const createOrUpdateRatingReview = async (req, res) => {
    try {
        const userId = req.userId; // Lấy từ authJwt
        // Các kiểm tra userId, movieId, rating đã được service xử lý

        const result = await ratingService.processCreateOrUpdateRatingReview(userId, req.body);
        res.status(result.created ? 201 : 200).json({ //
            success: true,
            message: result.created ? 'Đánh giá đã được tạo.' : 'Đánh giá đã được cập nhật.', //
            rating: result.rating //
        });
    } catch (error) {
        console.error("Create/Update Rating Error in Controller:", error);
        const statusCode = error.statusCode || 500;
        handleServerError(res, error, "Tạo/Cập nhật đánh giá", statusCode); //
    }
};

export const likeUnlikeReview = async (req, res) => {
    try {
        const userId = req.userId; //
        const { ratingId } = req.params; //

        if (!userId) { //
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const result = await ratingService.toggleLikeUnlikeReview(userId, ratingId);
        res.status(200).json({ //
            success: true,
            message: result.message,
            likesCount: result.likesCount,
            isLiked: result.isLiked
        });
    } catch (error) {
        console.error("Like/Unlike Review Error in Controller:", error);
        const statusCode = error.statusCode || 500;
        handleServerError(res, error, `Like/Unlike review ID ${req.params.ratingId}`, statusCode); //
    }
};

export const updateReview = async (req, res) => {
    try {
        const userId = req.userId; //
        const { ratingId } = req.params; //
        // Service sẽ xử lý validation của req.body

        if (!userId) { //
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const updatedReview = await ratingService.updateOwnReview(userId, ratingId, req.body);
        res.status(200).json({ //
            success: true,
            message: 'Đánh giá đã được cập nhật.', //
            review: updatedReview //
        });
    } catch (error) {
        console.error("Update Review Error in Controller:", error);
        const statusCode = error.statusCode || 500;
        handleServerError(res, error, `Cập nhật review ID ${req.params.ratingId}`, statusCode); //
    }
};

export const deleteReview = async (req, res) => {
    try {
        const userId = req.userId; //
        const { ratingId } = req.params; //

        if (!userId) { //
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        await ratingService.deleteOwnReview(userId, ratingId);
        res.status(200).json({ success: true, message: 'Đánh giá đã được xóa.' }); //
    } catch (error) {
        console.error("Delete Review Error in Controller:", error);
        const statusCode = error.statusCode || 500;
        handleServerError(res, error, `Xóa review ID ${req.params.ratingId}`, statusCode); //
    }
};

export const getAverageRating = async (req, res) => {
    try {
        const movieId = parseInt(req.params.movieId);
        if (isNaN(movieId)) {
            return res.status(400).json({ success: false, message: "Movie ID không hợp lệ." });
        }
        const result = await ratingService.calculateAverageRatingForMovie(movieId);
        res.status(200).json({ success: true, ...result });
    } catch (error) {
        console.error("Get Average Rating Error:", error);
        const statusCode = error.statusCode || 500;
        // Controller gốc trả về error.message
        handleServerError(res, error, "Lỗi khi lấy đánh giá trung bình", statusCode);
    }
};

// Hàm createRating trong controller gốc đã được gộp vào createOrUpdateRatingReview.
// Nếu bạn vẫn muốn giữ nó riêng, nó sẽ gọi một hàm service tương ứng.
// export const createRating = async (req, res) => { ... };