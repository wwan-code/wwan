// backend/services/rating.service.js
import db from "../models/index.js";
import { Op } from 'sequelize';
import { awardPoints, checkAndAwardBadges } from "../utils/gamificationUtils.js";
import { createAndEmitNotification } from "../utils/notificationUtils.js";

const Rating = db.Rating;
const User = db.User;
const Movie = db.Movie;
const Friend = db.Friend;

const POINTS_FOR_RATING = 15; //

// Helper function to parse likes
const parseRatingLikes = (likes) => {
    if (Array.isArray(likes)) return likes;
    if (typeof likes === 'string') {
        try {
            const parsed = JSON.parse(likes);
            return Array.isArray(parsed) ? parsed : [];
        } catch {
            return [];
        }
    }
    return [];
};

/**
 * Creates or updates a rating/review for a movie.
 * @param {number} userId - The ID of the user.
 * @param {object} data - { movieId, rating, reviewContent }.
 * @returns {Promise<object>} The created or updated rating instance with user details.
 */
export const processCreateOrUpdateRatingReview = async (userId, data) => {
    const { movieId, rating, reviewContent } = data;

    if (!movieId || rating === undefined) {
        const error = new Error('Thiếu thông tin movieId hoặc rating.'); //
        error.statusCode = 400;
        throw error;
    }
    if (rating < 1 || rating > 10) { //
        const error = new Error('Điểm rating phải từ 1 đến 10.'); //
        error.statusCode = 400;
        throw error;
    }

    const t = await db.sequelize.transaction();
    try {
        const userWhoRated = await User.findByPk(userId, { attributes: ['id', 'name', 'uuid', 'avatar', 'level', 'points'], transaction: t }); //
        if (!userWhoRated) {
            await t.rollback();
            const error = new Error('Người dùng không tồn tại.'); //
            error.statusCode = 404;
            throw error;
        }
        const ratedMovie = await Movie.findByPk(movieId, { attributes: ['id', 'title', 'slug', 'posterURL'], transaction: t }); //
        if (!ratedMovie) {
            await t.rollback();
            const error = new Error('Phim không tồn tại.');
            error.statusCode = 404;
            throw error;
        }

        const [ratingInstance, created] = await Rating.findOrCreate({
            where: { userId, movieId },
            defaults: {
                userId,
                movieId,
                rating,
                reviewContent: reviewContent && reviewContent.trim() ? reviewContent.trim() : null, //
                isApproved: true, // Mặc định là đã duyệt
                likes: []
            },
            transaction: t
        });

        const isNewRatingAction = created;

        if (!created) {
            ratingInstance.rating = rating;
            ratingInstance.reviewContent = reviewContent && reviewContent.trim() ? reviewContent.trim() : ratingInstance.reviewContent;
            ratingInstance.isApproved = true;
        }
        await ratingInstance.save({ transaction: t }); //

        const pointResult = await awardPoints(userId, POINTS_FOR_RATING, t);
        const userForBadgeCheck = pointResult?.user || userWhoRated;
        await checkAndAwardBadges(userForBadgeCheck, { eventType: 'new_rating', movieId: movieId, ratingValue: rating }, t);

        // Gửi thông báo cho bạn bè
        const friendships = await Friend.findAll({
            where: {
                status: 'accepted',
                [Op.or]: [{ userId: userId }, { friendId: userId }]
            },
            attributes: ['userId', 'friendId'],
            transaction: t
        });
        const friendIds = friendships
            .map(f => (f.userId === userId ? f.friendId : f.userId))
            .filter(id => id !== userId); //

        if (friendIds.length > 0) { //
            const notificationMessage = `<strong>${userWhoRated.name}</strong> vừa đánh giá ${rating} <i class="fas fa-star text-warning"></i> cho phim <a href="/album/${ratedMovie.slug}" class="notification-link-highlight">${ratedMovie.title}</a>.`; //
            const notificationLink = `/album/${ratedMovie.slug}`; //

            for (const friendId of friendIds) {
                await createAndEmitNotification({ //
                    recipientId: friendId,
                    senderId: userId,
                    type: 'FRIEND_ACTIVITY_RATED_MOVIE', //
                    message: notificationMessage,
                    link: notificationLink,
                    iconUrl: userWhoRated.avatar, //
                    transaction: t
                });
            }
        }

        await t.commit();

        const finalRating = await Rating.findByPk(ratingInstance.id, { //
            include: [{ model: User, as: 'user', attributes: ['id', 'name', 'avatar', 'uuid'] }] // Thêm uuid
        });
        // Chuẩn hóa likes trong finalRating
        if (finalRating) {
            finalRating.likes = parseRatingLikes(finalRating.likes);
        }

        return {
            created: isNewRatingAction, // Dùng isNewRatingAction đã lưu từ đầu
            rating: finalRating
        };

    } catch (error) {
        if (t.finished !== 'commit' && t.finished !== 'rollback') {
            await t.rollback();
        }
        throw error;
    }
};

/**
 * Toggles like/unlike on a review.
 * @param {number} userId - The ID of the user performing the action.
 * @param {string|number} ratingIdParam - The ID of the rating (review).
 * @returns {Promise<object>} { likesCount, isLiked, message }
 */
export const toggleLikeUnlikeReview = async (userId, ratingIdParam) => {
    const ratingId = parseInt(ratingIdParam);
    if (isNaN(ratingId)) {
        const error = new Error("Rating ID không hợp lệ.");
        error.statusCode = 400;
        throw error;
    }

    const ratingInstance = await Rating.findByPk(ratingId); //
    if (!ratingInstance) {
        const error = new Error('Review không tìm thấy.'); //
        error.statusCode = 404;
        throw error;
    }
    if (!ratingInstance.reviewContent) { //
        const error = new Error('Không thể thích một đánh giá không có nội dung review.'); //
        error.statusCode = 400;
        throw error;
    }
    
    // if (ratingInstance.userId === userId) {
    //     const error = new Error('Bạn không thể tự thích review của mình.');
    //     error.statusCode = 403;
    //     throw error;
    // }

    const likesSet = new Set(parseRatingLikes(ratingInstance.likes)); //
    let isLiked;
    let message;

    if (likesSet.has(userId)) { //
        likesSet.delete(userId); //
        isLiked = false; //
        message = 'Đã bỏ thích review.'; //
    } else {
        likesSet.add(userId);
        isLiked = true;
        message = 'Đã thích review.';

        // Gửi thông báo cho chủ nhân của review (nếu không phải là người tự like)
        if (ratingInstance.userId !== userId) {
            const userWhoLiked = await User.findByPk(userId, { attributes: ['name', 'uuid', 'avatar'] });
            const movieOfReview = await Movie.findByPk(ratingInstance.movieId, { attributes: ['slug', 'title'] });
            if (userWhoLiked && movieOfReview) {
                await createAndEmitNotification({
                    recipientId: ratingInstance.userId,
                    senderId: userId,
                    type: 'REVIEW_LIKED',
                    message: `<strong>${userWhoLiked.name}</strong> đã thích review của bạn cho phim <a href="/album/${movieOfReview.slug}?reviewId=${ratingInstance.id}" class="notification-link-highlight">${movieOfReview.title}</a>.`,
                    link: `/album/${movieOfReview.slug}?reviewId=${ratingInstance.id}`,
                    iconUrl: userWhoLiked.avatar
                });
            }
        }
    }

    const updatedLikesArray = Array.from(likesSet); //
    ratingInstance.likes = updatedLikesArray; //
    await ratingInstance.save(); //

    return {
        likesCount: updatedLikesArray.length, //
        isLiked: isLiked, //
        message: message
    };
};

/**
 * Updates a user's own review.
 * @param {number} userId - The ID of the user performing the update.
 * @param {string|number} ratingIdParam - The ID of the rating (review) to update.
 * @param {object} data - { rating, reviewContent }.
 * @returns {Promise<object>} The updated review instance with user details.
 */
export const updateOwnReview = async (userId, ratingIdParam, data) => {
    const ratingId = parseInt(ratingIdParam);
    if (isNaN(ratingId)) {
        const error = new Error("Rating ID không hợp lệ.");
        error.statusCode = 400;
        throw error;
    }
    const { rating, reviewContent } = data;

    if (rating !== undefined && (rating < 1 || rating > 10)) {
        const error = new Error('Điểm rating phải từ 1 đến 10.');
        error.statusCode = 400;
        throw error;
    }
    if (reviewContent !== undefined && typeof reviewContent !== 'string') {
        const error = new Error('Nội dung review không hợp lệ.');
        error.statusCode = 400;
        throw error;
    }

    const t = await db.sequelize.transaction();
    try {
        const ratingInstance = await Rating.findByPk(ratingId, { transaction: t });
        if (!ratingInstance) {
            await t.rollback();
            const error = new Error('Review không tìm thấy.');
            error.statusCode = 404;
            throw error;
        }

        if (ratingInstance.userId !== userId) {
            await t.rollback();
            const error = new Error('Bạn không có quyền chỉnh sửa đánh giá này.');
            error.statusCode = 403;
            throw error;
        }

        if (rating !== undefined) ratingInstance.rating = rating;
        if (reviewContent !== undefined) ratingInstance.reviewContent = reviewContent.trim() || null;
        ratingInstance.isApproved = true;
        await ratingInstance.save({ transaction: t });
        await t.commit();

        const updatedReview = await Rating.findByPk(ratingInstance.id, {
            include: [{ model: User, as: 'user', attributes: ['id', 'name', 'avatar', 'uuid'] }]
        });
        if (updatedReview) updatedReview.likes = parseRatingLikes(updatedReview.likes);
        return updatedReview;
    } catch (error) {
        await t.rollback();
        throw error;
    }
};

/**
 * Deletes a user's own review.
 * @param {number} userId - The ID of the user performing the deletion.
 * @param {string|number} ratingIdParam - The ID of the rating (review) to delete.
 * @returns {Promise<void>}
 */
export const deleteOwnReview = async (userId, ratingIdParam) => {
    const ratingId = parseInt(ratingIdParam);
    if (isNaN(ratingId)) {
        const error = new Error('Rating ID không hợp lệ.');
        error.statusCode = 400;
        throw error;
    }

    const t = await db.sequelize.transaction();
    try {
        const ratingInstance = await Rating.findByPk(ratingId, { transaction: t });
        if (!ratingInstance) {
            await t.rollback();
            const error = new Error('Review không tìm thấy.');
            error.statusCode = 404;
            throw error;
        }

        if (ratingInstance.userId !== userId) {
            await t.rollback();
            const error = new Error('Bạn không có quyền xóa đánh giá này.');
            error.statusCode = 403;
            throw error;
        }
        await ratingInstance.destroy({ transaction: t });
        await t.commit();
    } catch (error) {
        await t.rollback();
        throw error;
    }
};

/**
 * Calculates the average rating for a movie.
 * @param {number} movieId - The ID of the movie.
 * @returns {Promise<{averageRating: number, totalRatings: number}>}
 */
export const calculateAverageRatingForMovie = async (movieId) => {
    if (movieId === undefined || isNaN(parseInt(movieId))) {
        const error = new Error("Movie ID không hợp lệ.");
        error.statusCode = 400;
        throw error;
    }
    const result = await Rating.findOne({
        where: { movieId: parseInt(movieId), isApproved: true },
        attributes: [
            [db.sequelize.fn('AVG', db.sequelize.col('rating')), 'averageRating'],
            [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'totalRatings']
        ],
        raw: true
    });

    const averageRating = result && result.averageRating ? parseFloat(parseFloat(result.averageRating).toFixed(1)) : 0;
    const totalRatings = result && result.totalRatings ? parseInt(result.totalRatings) : 0;

    return { averageRating, totalRatings };
};