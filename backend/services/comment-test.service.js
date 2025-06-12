// backend/services/comment.service.js
import db from "../models/index.js";
import { literal } from 'sequelize';
import { awardPoints, checkAndAwardBadges } from "../utils/gamificationUtils.js";
import { createAndEmitNotification } from "../utils/notificationUtils.js";
import * as challengeService from './challenge.service.js';

const Comment = db.Comment;
const User = db.User;
const Role = db.Role;
const Episode = db.Episode;
const Movie = db.Movie;

const POINTS_FOR_COMMENTING = 10;

const VALID_CONTENT_TYPES = ['episode', 'movie', 'comic', 'chapter'];

const parseCommentLikes = (likes) => {
    if (Array.isArray(likes)) return [...likes];
    if (typeof likes === "string") {
        try {
            return JSON.parse(likes) || [];
        } catch {
            return [];
        }
    }
    return [];
};

// Helper function to normalize comments and their replies including parsing likes
const normalizeCommentStructure = (commentInstance) => {
    if (!commentInstance) return null;
    const comment = commentInstance.toJSON ? commentInstance.toJSON() : commentInstance;
    comment.likes = parseCommentLikes(comment.likes);
    if (comment.user && comment.user.roles) {
        comment.user.roles = comment.user.roles.map(r => r.name);
    }
    if (comment.replies && Array.isArray(comment.replies)) {
        comment.replies = comment.replies.map(normalizeCommentStructure).filter(r => r && !r.is_hidden);
    }
    return comment;
};


/**
 * Fetches all comments.
 * (Consider adding pagination and filtering options for production)
 * @returns {Promise<Array<object>>} An array of comments.
 */
export const fetchAllComments = async (queryParams = {}) => {
    // Basic pagination example (can be expanded)
    const page = parseInt(queryParams.page, 10) || 1;
    const limit = parseInt(queryParams.limit, 10) || 20;
    const offset = (page - 1) * limit;

    const { count, rows } = await Comment.findAndCountAll({
        include: [
            {
                model: User,
                as: 'user',
                attributes: ['id', 'name', 'avatar', 'uuid'],
                include: [{ model: Role, as: 'roles', attributes: ['name'] }]
            },
            {
                model: Comment,
                as: 'replies',
                required: false,
                include: [{ model: User, as: 'user', attributes: ['id', 'name', 'avatar', 'uuid'] }]
            }
        ],
        where: { parentId: null, is_hidden: false },
        order: [['createdAt', 'DESC']],
        limit,
        offset,
        distinct: true,
    });

    const normalizedComments = rows.map(normalizeCommentStructure);
    return {
        comments: normalizedComments,
        pagination: {
            totalItems: count,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
            itemsPerPage: limit,
        }
    };
};

/**
 * Fetches a single comment by its ID.
 * @param {string|number} commentId - The ID of the comment.
 * @returns {Promise<object|null>} The comment object or null if not found.
 */
export const fetchCommentById = async (commentId) => {
    const id = parseInt(commentId);
    if (isNaN(id)) {
        const error = new Error("Comment ID không hợp lệ.");
        error.statusCode = 400;
        throw error;
    }
    const commentInstance = await Comment.findByPk(id, {
         include: [
            {
                model: User,
                as: 'user',
                attributes: ['id', 'name', 'avatar', 'uuid'],
                 include: [{ model: Role, as: 'roles', attributes: ['name'], through: { attributes: [] } }]
            },
            {
                model: Comment,
                as: 'replies',
                required: false,
                include: [{ model: User, as: 'user', attributes: ['id', 'name', 'avatar', 'uuid'], include: [{ model: Role, as: 'roles', attributes: ['name'], through: { attributes: [] } }] }]
            }
        ]
    });
    if (!commentInstance || commentInstance.is_hidden) { // Kiểm tra cả is_hidden
        const error = new Error("Bình luận không được tìm thấy hoặc đã bị ẩn.");
        error.statusCode = 404;
        throw error;
    }
    return normalizeCommentStructure(commentInstance);
};

/**
 * Updates a comment.
 * @param {string|number} commentId - The ID of the comment to update.
 * @param {object} updateData - Data to update (e.g., { content }).
 * @param {number} requestingUserId - The ID of the user requesting the update.
 * @returns {Promise<object>} The updated comment object.
 * @throws {Error} If comment not found, or user lacks permission.
 */
export const updateExistingComment = async (commentId, updateData, requestingUserId) => {
    const id = parseInt(commentId);
    if (isNaN(id)) {
        const error = new Error("Comment ID không hợp lệ.");
        error.statusCode = 400;
        throw error;
    }

    const comment = await Comment.findByPk(id);
    if (!comment || comment.is_hidden) {
        const error = new Error("Bình luận không được tìm thấy hoặc đã bị ẩn.");
        error.statusCode = 404;
        throw error;
    }

    // Kiểm tra quyền: chỉ chủ sở hữu mới được sửa
    // (Logic quyền của admin/editor có thể được thêm ở đây nếu cần)
    if (comment.userId !== requestingUserId) {
        const error = new Error("Bạn không có quyền chỉnh sửa bình luận này.");
        error.statusCode = 403; // Forbidden
        throw error;
    }

    // Chỉ cho phép cập nhật content (hoặc các trường khác nếu muốn)
    if (updateData.content !== undefined) {
        comment.content = updateData.content;
    } else {
        // Nếu không có content để update, có thể không làm gì hoặc báo lỗi tùy logic
        const error = new Error("Không có nội dung để cập nhật.");
        error.statusCode = 400;
        throw error;
    }
    
    await comment.save();
    const updatedCommentInstance = await Comment.findByPk(comment.id, { // Query lại để lấy associations
         include: [
            {
                model: User,
                as: 'user',
                attributes: ['id', 'name', 'avatar', 'uuid'],
                 include: [{ model: Role, as: 'roles', attributes: ['name'], through: { attributes: [] } }]
            }
        ]
    });
    return normalizeCommentStructure(updatedCommentInstance);
};

/**
 * Processes liking or unliking a comment.
 * @param {string|number} commentId - The ID of the comment.
 * @param {number} userId - The ID of the user liking/unliking.
 * @returns {Promise<{likesCount: number, isLiked: boolean, message: string}>}
 * An object containing the new likes count, current like status for the user, and a message.
 * @throws {Error} If comment not found.
 */
export const processToggleLikeComment = async (commentId, userId) => {
    const id = parseInt(commentId);
    if (isNaN(id)) {
        const error = new Error("Comment ID không hợp lệ.");
        error.statusCode = 400;
        throw error;
    }

    const comment = await Comment.findByPk(id);
    if (!comment) {
        const error = new Error("Không tìm thấy bình luận.");
        error.statusCode = 404;
        throw error;
    }

    let currentLikes = parseCommentLikes(comment.likes);
    const userIndex = currentLikes.indexOf(userId);
    console.log(currentLikes, userIndex)
    let isLiked = false;

    if (userIndex > -1) {
        currentLikes.splice(userIndex, 1);
        isLiked = false;
    } else {
        currentLikes.push(userId);
        isLiked = true;
    }

    comment.likes = currentLikes;
    await comment.save();

    return {
        likesCount: currentLikes.length,
        isLiked: isLiked,
        message: isLiked ? "Đã thích bình luận." : "Đã bỏ thích bình luận."
    };
};

/**
 * Fetches comments for a specific episode, including replies and user info, with sorting.
 * @param {string|number} episodeId - The ID of the episode.
 * @param {object} queryParams - Query parameters (e.g., sort, page, limit).
 * @returns {Promise<Array<object>>} An array of normalized comment objects.
 */
export const fetchCommentsForEpisode = async (episodeIdParam, queryParams) => {
    const episodeId = parseInt(episodeIdParam);
    if (isNaN(episodeId)) {
        const error = new Error("Episode ID không hợp lệ.");
        error.statusCode = 400;
        throw error;
    }

    const sort = queryParams.sort || 'newest';
    const page = parseInt(queryParams.page, 10) || 1;
    const limit = parseInt(queryParams.limit, 10) || 100;
    const offset = (page - 1) * limit;


    const orderOptions = [];
    if (sort === 'mostLiked') {
        orderOptions.push([literal('JSON_LENGTH(`comments`.`likes`)'), 'DESC']);
    }
    orderOptions.push(['createdAt', 'DESC']);

    const { count, rows: commentInstances } = await Comment.findAndCountAll({
        where: {
            episodeId,
            parentId: null,
            is_hidden: false
        },
        include: [
            {
                model: User,
                as: 'user',
                attributes: ['id', 'name', 'avatar', 'uuid'],
                include: [{ model: Role, as: 'roles', attributes: ['name'], through: { attributes: [] } }],
            },
            {
                model: Comment,
                as: 'replies',
                required: false,
                where: { is_hidden: false },
                include: [{
                    model: User,
                    as: 'user',
                    attributes: ['id', 'name', 'avatar', 'uuid'],
                    include: [{ model: Role, as: 'roles', attributes: ['name'], through: { attributes: [] } }],
                }],
                order: [['createdAt', 'ASC']]
            }
        ],
        order: orderOptions,
        limit: limit,
        offset: offset,
        distinct: true,
    });

    const normalizedComments = commentInstances.map(normalizeCommentStructure);

    return {
        comments: normalizedComments,
        pagination: {
            totalItems: count,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
            itemsPerPage: limit,
            currentSort: sort
        }
    };
};

/**
 * Creates a new comment or a reply for an episode.
 * Handles awarding points, badges, and sending notifications.
 * @param {string|number} episodeIdParam - The ID of the episode.
 * @param {object} commentData - Data for the new comment
 * (content, userId, parentId, replyingTo - replyingTo is userId of the person being replied to).
 * @returns {Promise<object>} The created and normalized comment object.
 * @throws {Error} If user or episode not found, or on other errors.
 */
export const createNewCommentForEpisode = async (episodeIdParam, commentData) => {
    const episodeId = parseInt(episodeIdParam);
    if (isNaN(episodeId)) {
        const error = new Error("Episode ID không hợp lệ.");
        error.statusCode = 400;
        throw error;
    }

    const { content, userId: commenterId, parentId, replyingTo } = commentData;

    if (!commenterId || !content || content.trim() === '') {
        const error = new Error("Thông tin người bình luận hoặc nội dung không được để trống.");
        error.statusCode = 400;
        throw error;
    }

    const t = await db.sequelize.transaction();
    try {
        const commenter = await User.findByPk(commenterId, {
            attributes: ['id', 'name', 'uuid', 'avatar'],
            transaction: t
        });
        if (!commenter) {
            await t.rollback();
            const error = new Error("Người bình luận không tìm thấy.");
            error.statusCode = 404;
            throw error;
        }

        const episode = await Episode.findByPk(episodeId, {
            include: [{ model: Movie, as: 'movie', attributes: ['id', 'title', 'slug'] }],
            transaction: t
        });
        if (!episode) {
            await t.rollback();
            const error = new Error("Tập phim không tìm thấy.");
            error.statusCode = 404;
            throw error;
        }

        let parentCommentInstance = null;
        if (parentId) {
            parentCommentInstance = await Comment.findByPk(parentId, {
                attributes: ['id', 'userId', 'episodeId'],
                transaction: t
            });
            if (!parentCommentInstance || parentCommentInstance.episodeId !== episodeId) {
                await t.rollback();
                const error = new Error("Bình luận cha không hợp lệ hoặc không thuộc tập phim này.");
                error.statusCode = 400;
                throw error;
            }
        }

        const newComment = await Comment.create({
            content,
            userId: commenterId,
            episodeId,
            parentId: parentId || null,
            replyingTo: parentId ? replyingTo : null,
            likes: []
        }, { transaction: t });

        if (!parentId) {
            const pointResult = await awardPoints(commenterId, POINTS_FOR_COMMENTING, t);
            const userToAwardBadge = pointResult?.user || commenter;
            await checkAndAwardBadges(userToAwardBadge, { eventType: 'new_comment' }, t);
            // Gọi challenge service
            await challengeService.updateUserProgressOnAction(
                commenterId,
                'POST_COMMENT_COUNT',
                { contentId: newComment.id, episodeId: episodeId, movieId: episode.movieId }
            );
        }
        
        if (parentCommentInstance && parentCommentInstance.userId !== commenterId) {
            const movieTitle = episode.movie?.title || 'một bộ phim';
            const episodeNumber = episode.episodeNumber || '?';
            const linkToComment = `/play/${episode.movie?.slug}?t=${episodeNumber}&commentId=${parentId}&highlightReply=${newComment.id}`;

            await createAndEmitNotification({
                recipientId: parentCommentInstance.userId,
                senderId: commenterId,
                type: 'REPLY_TO_COMMENT',
                message: `<strong>${commenter.name}</strong> đã trả lời bình luận của bạn trong phim <a href="${linkToComment}" class="notification-link-highlight">${movieTitle} - Tập ${episodeNumber}</a>.`,
                link: linkToComment,
                iconUrl: commenter.avatar,
                transaction: t
            });
        }

        await t.commit();

        const fullCommentDetails = await Comment.findByPk(newComment.id, {
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['id', 'uuid', 'name', 'avatar'],
                    include: [{ model: Role, as: 'roles', attributes: ['name'] }],
                },
            ],
        });
        return normalizeCommentStructure(fullCommentDetails);
    } catch (error) {
        if (t.finished !== 'commit' && t.finished !== 'rollback') {
            await t.rollback();
        }
        throw error;
    }
};

/**
 * Updates an existing comment or reply for an episode.
 * @param {object} params - IDs: { episodeId, commentToUpdateId (có thể là commentId hoặc replyId) }
 * @param {object} updateDetails - { content, requestingUserId }
 * @returns {Promise<object>} The updated and normalized comment object.
 * @throws {Error} If comment not found or user lacks permission.
 */
export const updateSpecificCommentOrReply = async (params, updateDetails) => {
    const { episodeId: rawEpisodeId, commentId: rawCommentId, replyId: rawReplyId } = params;
    const { content, requestingUserId } = updateDetails;

    const episodeId = parseInt(rawEpisodeId);
    const commentToUpdateId = parseInt(rawReplyId || rawCommentId);

    if (isNaN(episodeId) || isNaN(commentToUpdateId)) {
        const error = new Error("ID không hợp lệ.");
        error.statusCode = 400;
        throw error;
    }
    if (!content || content.trim() === "") {
        const error = new Error("Nội dung không được để trống.");
        error.statusCode = 400;
        throw error;
    }

    const t = await db.sequelize.transaction();
    try {
        const whereConditions = {
            id: commentToUpdateId,
            episodeId: episodeId,
            userId: requestingUserId
        };

        if (rawReplyId && rawCommentId) {
            whereConditions.parentId = parseInt(rawCommentId);
        }

        const comment = await Comment.findOne({ where: whereConditions, transaction: t });

        if (!comment || comment.is_hidden) {
            await t.rollback();
            const error = new Error('Bình luận không được tìm thấy hoặc đã bị ẩn.');
            error.statusCode = 404;
            throw error;
        }

        if (comment.userId !== requestingUserId) {
            await t.rollback();
            const error = new Error('Bạn không có quyền chỉnh sửa bình luận này.');
            error.statusCode = 403;
            throw error;
        }

        comment.content = content;
        await comment.save({ transaction: t });
        await t.commit();

        const updatedCommentInstance = await Comment.findByPk(comment.id, {
             include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['id', 'uuid', 'name', 'avatar'],
                    include: [{ model: Role, as: 'roles', attributes: ['name']}]
                }
            ]
        });
        return normalizeCommentStructure(updatedCommentInstance);
    } catch (error) {
         if (t.finished !== 'commit' && t.finished !== 'rollback') {
            await t.rollback();
        }
        throw error;
    }
};

/**
 * Fetches a specific comment and its direct replies for an episode.
 * @param {string|number} episodeIdParam - The ID of the episode.
 * @param {string|number} commentIdParam - The ID of the parent comment.
 * @returns {Promise<{comment: object, replies: Array<object>}>}
 * An object containing the parent comment and its replies, both normalized.
 * @throws {Error} If parent comment not found.
 */
export const fetchCommentWithReplies = async (episodeIdParam, commentIdParam) => {
    const episodeId = parseInt(episodeIdParam);
    const commentId = parseInt(commentIdParam);

    if (isNaN(episodeId) || isNaN(commentId)) {
        const error = new Error("ID không hợp lệ.");
        error.statusCode = 400;
        throw error;
    }

    const parentCommentInstance = await Comment.findOne({
        where: { id: commentId, episodeId: episodeId, is_hidden: false },
        include: [{ model: User, as: 'user', attributes: ['id', 'uuid', 'name', 'avatar'], include: [{ model: Role, as: 'roles', attributes: ['name']}] }]
    });

    if (!parentCommentInstance) {
        const error = new Error('Bình luận không được tìm thấy hoặc đã bị ẩn.');
        error.statusCode = 404;
        throw error;
    }

    const repliesInstances = await Comment.findAll({
        where: { parentId: commentId, episodeId: episodeId, is_hidden: false },
        include: [{ model: User, as: 'user', attributes: ['id', 'uuid', 'name', 'avatar'], include: [{ model: Role, as: 'roles', attributes: ['name']}] }],
        order: [['createdAt', 'ASC']]
    });

    return {
        comment: normalizeCommentStructure(parentCommentInstance),
        replies: repliesInstances.map(normalizeCommentStructure)
    };
};

/**
 * Deletes a comment and its replies (if it's a parent comment).
 * Checks for ownership or admin/editor privileges.
 * @param {string|number} commentIdToDeleteParam - The ID of the comment/reply to delete.
 * @param {number} authenticatedUserId - The ID of the user performing the delete action.
 * @param {string|number} [episodeIdParamForCheck] - Optional: episodeId to further ensure context (not used in controller's current logic for findOne).
 * @returns {Promise<void>}
 * @throws {Error} If comment not found or user lacks permission.
 */
export const removeCommentAndReplies = async (commentIdToDeleteParam, authenticatedUserId, episodeIdParamForCheck = null) => {
    const commentIdToDelete = parseInt(commentIdToDeleteParam);
    if (isNaN(commentIdToDelete)) {
        const error = new Error("Comment ID không hợp lệ.");
        error.statusCode = 400;
        throw error;
    }

    const t = await db.sequelize.transaction();
    try {
        const commentToDelete = await Comment.findByPk(commentIdToDelete, { transaction: t });

        if (!commentToDelete) {
            await t.rollback();
            const error = new Error('Bình luận không tìm thấy.');
            error.statusCode = 404;
            throw error;
        }

        if (commentToDelete.userId !== authenticatedUserId) {
            const adminUser = await User.findByPk(authenticatedUserId, {
                include: [{ model: Role, as: 'roles', attributes: ['name'] }],
                transaction: t
            });
            const isAdminOrEditor = adminUser?.roles?.some(role => ['admin', 'editor'].includes(role.name));
            if (!isAdminOrEditor) {
                await t.rollback();
                const error = new Error('Bạn không có quyền xóa bình luận này.');
                error.statusCode = 403;
                throw error;
            }
        }

        const deleteRepliesRecursive = async (parentId) => {
            const replies = await Comment.findAll({ where: { parentId: parentId }, transaction: t });
            for (const reply of replies) {
                await deleteRepliesRecursive(reply.id);
                await reply.destroy({ transaction: t });
            }
        };

        if (commentToDelete.parentId === null) { //
            await deleteRepliesRecursive(commentIdToDelete);
        }

        await commentToDelete.destroy({ transaction: t });

        await t.commit();
    } catch (error) {
        if (t.finished !== 'commit' && t.finished !== 'rollback') {
            await t.rollback();
        }
        throw error;
    }
};