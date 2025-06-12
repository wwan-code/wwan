// backend/services/comment.service.js
import db from "../models/index.js";
import { literal, Sequelize } from 'sequelize';
import { awardPoints, checkAndAwardBadges } from "../utils/gamificationUtils.js";
import { createAndEmitNotification } from "../utils/notificationUtils.js";

const Comment = db.Comment;
const User = db.User;
const Role = db.Role;
const Episode = db.Episode;
const Movie = db.Movie;
const Comic = db.Comic;
const Chapter = db.Chapter;
const UserInventory = db.UserInventory;
const ShopItem = db.ShopItem;

const POINTS_FOR_COMMENTING = 15;
const REPORT_THRESHOLD_FOR_AUTO_HIDE = 5;
const VALID_CONTENT_TYPES = ['episode', 'movie', 'comic', 'chapter'];

// Helper: Lấy các item đang kích hoạt của user
async function attachActiveUserInventory(user) {
    let activeAvatarFrame = null;
    let activeChatColor = null;
    let activeTheme = null;
    let activeProfileBackground = null;

    if (user && user.id) {
        const activeItems = await UserInventory.findAll({
            where: { userId: user.id, isActive: true },
            include: [{ model: ShopItem, as: 'itemDetails', attributes: ['type', 'value'] }]
        });

        activeItems.forEach(invItem => {
            if (invItem.itemDetails) {
                switch (invItem.itemDetails.type) {
                    case 'AVATAR_FRAME':
                        activeAvatarFrame = invItem.itemDetails.value;
                        break;
                    case 'CHAT_COLOR':
                        activeChatColor = invItem.itemDetails.value;
                        break;
                    case 'THEME_UNLOCK':
                        activeTheme = invItem.itemDetails.value;
                        break;
                    case 'PROFILE_BACKGROUND':
                        activeProfileBackground = invItem.itemDetails.value;
                        break;
                }
            }
        });
    }
    user.activeAvatarFrame = activeAvatarFrame;
    user.activeChatColor = activeChatColor;
    user.activeTheme = activeTheme;
    user.activeProfileBackground = activeProfileBackground;
    return user;
}

/**
 * Helper function to parse likes JSON field safely.
 * @param {string|Array|null} likes - The likes field from a comment.
 * @returns {Array<number>} An array of user IDs.
 */
const parseCommentLikes = (likes) => {
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
 * Validates if the content exists for the given type and ID.
 * @param {string} contentType
 * @param {number} contentId
 * @param {object} [transaction]
 * @returns {Promise<object|null>} The content instance or null.
 */
const validateContentExists = async (contentType, contentId, transaction) => {
    const models = {
        episode: Episode,
        movie: Movie,
        comic: Comic,
        chapter: Chapter,
    };
    const model = models[contentType];
    if (!model) return null;
    return await model.findByPk(contentId, { attributes: ['id'], transaction });
};



/**
 * Create a new comment or a reply.
 */
export const createNewComment = async (userId, contentId, contentType, text, parentId = null, isSpoiler = false) => {
    if (!VALID_CONTENT_TYPES.includes(contentType)) {
        const error = new Error("Loại nội dung không hợp lệ.");
        error.statusCode = 400;
        throw error;
    }
    if (!text || text.trim() === '') {
        const error = new Error("Nội dung bình luận không được để trống.");
        error.statusCode = 400;
        throw error;
    }

    const t = await db.sequelize.transaction();
    try {
        const user = await User.findByPk(userId, { attributes: ['id', 'name', 'uuid', 'avatar'], transaction: t });
        if (!user) {
            await t.rollback();
            const error = new Error("Người dùng không tìm thấy.");
            error.statusCode = 404;
            throw error;
        }

        const content = await validateContentExists(contentType, contentId, t);
        if (!content) {
            await t.rollback();
            const error = new Error("Nội dung bạn đang bình luận không tồn tại.");
            error.statusCode = 404;
            throw error;
        }

        let parentComment = null;
        if (parentId) {
            parentComment = await Comment.findByPk(parentId, { transaction: t });
            if (!parentComment || parentComment.contentId !== contentId || parentComment.contentType !== contentType) {
                await t.rollback();
                const error = new Error("Bình luận cha không hợp lệ.");
                error.statusCode = 400;
                throw error;
            }
        }


        const comment = await Comment.create({
            userId,
            contentId,
            contentType,
            text,
            parentId,
            isSpoiler,
            likes: [],
        }, { transaction: t });

        // Gamification: Thưởng điểm & huy hiệu chỉ cho bình luận gốc
        if (!parentId) {
            const pointResult = await awardPoints(userId, POINTS_FOR_COMMENTING, t);
            await checkAndAwardBadges(pointResult?.user || user, { eventType: 'new_comment' }, t);
        }

        // Thông báo cho người được trả lời
        if (parentComment && parentComment.userId !== userId) {
            // Logic tạo link và message thông báo...
            await createAndEmitNotification({
                recipientId: parentComment.userId,
                senderId: userId,
                type: 'REPLY_TO_COMMENT',
                message: `<strong>${user.name}</strong> đã trả lời bình luận của bạn.`,
                link: `/path/to/${contentType}/${contentId}?commentId=${parentId}`, // Cần URL cụ thể
                iconUrl: user.avatar,
                transaction: t
            });
        }

        await t.commit();
        const newComment = await Comment.findByPk(comment.id, {
            include: [{
                model: User,
                as: 'user',
                attributes: ['id', 'name', 'avatar', 'uuid'], // Giả sử user có slug
                include: [{ model: Role, as: 'roles', attributes: ['name'], through: { attributes: [] } }]
            }],
        });

        const commentJSON = newComment.toJSON();
        commentJSON.isLiked = false;
        commentJSON.likes = [];
        return commentJSON;

    } catch (error) {
        if (t.finished !== 'commit' && t.finished !== 'rollback') {
            await t.rollback();
        }
        throw error;
    }
};
/**
 * Get comments by contentId and contentType with pagination.
 */
export const getCommentsByContent = async (contentId, contentType, queryParams, requestingUserId = null) => {
    if (!VALID_CONTENT_TYPES.includes(contentType)) {
        const error = new Error("Loại nội dung không hợp lệ.");
        error.statusCode = 400;
        throw error;
    }

    const sort = queryParams.sort || 'newest';
    const page = parseInt(queryParams.page, 10) || 1;
    const limit = parseInt(queryParams.limit, 10) || 100;
    const offset = (page - 1) * limit;
    
    try {
        const orderOptions = [];
        if (sort === 'mostLiked') {
            orderOptions.push([literal('JSON_LENGTH(`Comment`.`likes`)'), 'DESC']);
        }
        orderOptions.push(['createdAt', 'DESC'], ['isPinned', 'DESC']);

        const { count, rows: comments } = await Comment.findAndCountAll({
            where: {
                contentId,
                contentType,
                parentId: null,
                isApproved: true,
                is_hidden: false,
            },
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
                    include: [{ model: User, as: 'user', attributes: ['id', 'name', 'avatar', 'uuid'], include: [{ model: Role, as: 'roles', attributes: ['name'] }] }],
                    order: [['createdAt', 'DESC']]
                }
            ],
            attributes: {
                include: [
                    [
                        Sequelize.literal(`(
                            SELECT COUNT(*)
                            FROM Comments AS ReplyCount
                            WHERE
                                ReplyCount.parentId = Comment.id AND
                                ReplyCount.isApproved = true AND
                                ReplyCount.is_hidden = false
                        )`),
                        'repliesCount'
                    ]
                ]
            },
            order: orderOptions,
            limit,
            offset,
            distinct: true,
        });

        const processedComments = await Promise.all(comments.map(async comment => {
            const commentJSON = comment.toJSON();
            commentJSON.isLiked = requestingUserId && Array.isArray(commentJSON.likes) ? commentJSON.likes.includes(parseInt(requestingUserId)) : false;
            commentJSON.likes = parseCommentLikes(commentJSON.likes);
            commentJSON.repliesCount = parseInt(commentJSON.repliesCount || 0);

            // Lấy active inventory cho user của comment
            if (commentJSON.user) {
                await attachActiveUserInventory(commentJSON.user);
            }

            if (commentJSON.replies) {
                commentJSON.replies = await Promise.all(commentJSON.replies.map(async reply => {
                    reply.isLiked = requestingUserId && Array.isArray(reply.likes) ? reply.likes.includes(parseInt(requestingUserId)) : false;
                    reply.likes = parseCommentLikes(reply.likes);
                    // Lấy active inventory cho user của reply
                    if (reply.user) {
                        await attachActiveUserInventory(reply.user);
                    }
                    return reply;
                }));
            }
            return commentJSON;
        }));

        return {
            comments: processedComments,
            pagination: {
                totalItems: count,
                totalPages: Math.ceil(count / limit),
                currentPage: parseInt(page),
                itemsPerPage: parseInt(limit),
            }
        };
    } catch (error) {
        console.error("Lỗi khi lấy bình luận (service):", error);
        throw error;
    }
};

/**
 * Toggle like on a comment.
 */
export const toggleLikeComment = async (commentId, userId) => {
    const comment = await Comment.findByPk(commentId);
    if (!comment) {
        const error = new Error("Bình luận không tồn tại.");
        error.statusCode = 404;
        throw error;
    }

    let likesArray = Array.isArray(comment.likes) ? [...comment.likes] : [];
    const userIndex = likesArray.indexOf(userId);
    let liked = false;

    if (userIndex > -1) { // User đã like, giờ unlike
        likesArray.splice(userIndex, 1);
    } else { // User chưa like, giờ like
        likesArray.push(userId);
        liked = true;
    }
    comment.likes = likesArray;
    await comment.save();

    // TODO: Tạo thông báo cho chủ bình luận (nếu không phải tự like)
    if (liked && comment.userId !== userId) {
        // await createNotification(comment.userId, 'COMMENT_LIKED', `Người dùng ${likerUsername} đã thích bình luận của bạn.`, `/link-to-content/${comment.contentType}/${comment.contentId}#comment-${comment.id}`, comment.id, 'Comment');
    }

    return { liked, likesCount: likesArray.length };
};


/**
 * Delete a comment.
 * Admins can delete any comment. Users can only delete their own.
 */
export const deleteUserComment = async (commentId, userId) => {
    const comment = await Comment.findByPk(commentId);
    if (!comment) {
        const error = new Error("Bình luận không tồn tại.");
        error.statusCode = 404;
        throw error;
    }
    if (comment.userId !== userId) {
        const adminUser = await User.findByPk(userId, {
            include: [{ model: Role, as: 'roles', attributes: ['name'] }]
        });
        const isAdminOrEditor = adminUser?.roles?.some(role => ['admin', 'editor'].includes(role.name));
        if (!isAdminOrEditor) {
            await t.rollback();
            const error = new Error('Bạn không có quyền xóa bình luận này.');
            error.statusCode = 403;
            throw error;
        }
    }


    // Xóa tất cả replies của comment này trước (nếu có và không dùng onDelete: CASCADE)
    // await Comment.destroy({ where: { parentId: commentId } });
    await comment.destroy(); // Nếu có onDelete: 'CASCADE' cho parentId, replies sẽ tự xóa

    return { message: "Bình luận đã được xóa." };
};

/**
 * Update an existing comment if the user is the owner.
 * @param {number} commentId
 * @param {number} userId - ID of the user trying to update.
 * @param {string} newText
 * @param {boolean} newIsSpoiler
 * @returns {Promise<object>} The updated comment.
 */
export const updateUserComment = async (commentId, userId, newText, newIsSpoiler) => {
    if (!newText || newText.trim() === '') {
        const error = new Error("Nội dung bình luận không được để trống.");
        error.statusCode = 400;
        throw error;
    }

    const t = await db.sequelize.transaction();
    try {
        const comment = await Comment.findByPk(commentId, { transaction: t });
        if (!comment || comment.is_hidden) { // Không cho sửa comment đã bị ẩn (logic này tùy bạn)
            await t.rollback();
            const error = new Error("Bình luận không tồn tại hoặc đã bị ẩn.");
            error.statusCode = 404;
            throw error;
        }

        if (comment.userId !== userId) {
            await t.rollback();
            const error = new Error("Bạn không có quyền chỉnh sửa bình luận này.");
            error.statusCode = 403;
            throw error;
        }

        comment.text = newText.trim();
        comment.isSpoiler = newIsSpoiler !== undefined ? newIsSpoiler : comment.isSpoiler;
        comment.isEdited = true;

        await comment.save({ transaction: t });
        await t.commit();

        // Trả về comment đã cập nhật với thông tin user
        const updatedCommentWithUser = await Comment.findByPk(comment.id, {
            include: [{
                model: User,
                as: 'user',
                attributes: ['id', 'name', 'avatar', 'uuid'],
                include: [{ model: Role, as: 'roles', attributes: ['name'], through: { attributes: [] } }]
            }],
        });
        if (updatedCommentWithUser) {
            updatedCommentWithUser.likes = parseCommentLikes(updatedCommentWithUser.likes);
        }
        return updatedCommentWithUser;

    } catch (error) {
        if (t.finished !== 'commit' && t.finished !== 'rollback') {
            await t.rollback();
        }
        console.error("Lỗi khi cập nhật bình luận (service):", error);
        throw error;
    }
};

/**
 * Report an existing comment.
 * @param {number} commentId
 * @param {number} reportingUserId
 * @param {string} reason
 * @returns {Promise<{message: string, reportsCount: number}>}
 */
export const reportExistingComment = async (commentId, reportingUserId, reason) => {
    if (!reason || reason.trim() === '') {
        const error = new Error("Lý do báo cáo không được để trống.");
        error.statusCode = 400;
        throw error;
    }

    const t = await db.sequelize.transaction();
    try {
        const comment = await Comment.findByPk(commentId, { transaction: t });
        if (!comment || comment.is_hidden) { // Không cho report comment đã bị ẩn
            await t.rollback();
            const error = new Error("Bình luận không tồn tại hoặc đã được xử lý.");
            error.statusCode = 404;
            throw error;
        }

        if (comment.userId === reportingUserId) {
            await t.rollback();
            const error = new Error("Bạn không thể tự báo cáo bình luận của mình.");
            error.statusCode = 400;
            throw error;
        }

        let reportsArray = Array.isArray(comment.reports) ? [...comment.reports] : [];
        const existingReportIndex = reportsArray.findIndex(report => report.userId === reportingUserId);

        if (existingReportIndex > -1) {
            // Người dùng này đã report trước đó, cập nhật lý do (hoặc báo lỗi tùy bạn)
            reportsArray[existingReportIndex].reason = reason;
            reportsArray[existingReportIndex].reportedAt = new Date();
            // await t.rollback();
            // const error = new Error("Bạn đã báo cáo bình luận này trước đó.");
            // error.statusCode = 409;
            // throw error;
        } else {
            reportsArray.push({
                userId: reportingUserId,
                reason: reason.trim(),
                reportedAt: new Date().toISOString()
            });
        }

        comment.reports = reportsArray;

        // Tự động ẩn/bỏ duyệt nếu vượt ngưỡng report (ví dụ)
        if (reportsArray.length >= REPORT_THRESHOLD_FOR_AUTO_HIDE && comment.isApproved) {
            comment.isApproved = false;
            // Hoặc comment.is_hidden = true;
            console.log(`Comment ID ${commentId} auto-unapproved due to ${reportsArray.length} reports.`);
            // TODO: Tạo thông báo cho Admin về việc bình luận này cần xem xét
            // await createNotificationForAdmins('COMMENT_AUTO_UNAPPROVED', `Bình luận #${commentId} đã bị tự động bỏ duyệt do có nhiều báo cáo.`, `/admin/comments/manage?commentId=${commentId}`, t);
        }

        await comment.save({ transaction: t });
        await t.commit();

        return { message: "Báo cáo của bạn đã được gửi.", reportsCount: reportsArray.length };

    } catch (error) {
        if (t.finished !== 'commit' && t.finished !== 'rollback') {
            await t.rollback();
        }
        console.error("Lỗi khi báo cáo bình luận (service):", error);
        throw error;
    }
};

/**
 * Fetches paginated replies for a parent comment.
 * @param {number} parentId - The ID of the parent comment.
 * @param {number} [page=1]
 * @param {number} [limit=5] - Số replies mỗi lần tải thêm.
 * @param {number} [requestingUserId] - Optional: ID của người dùng đang request để check isLiked.
 * @returns {Promise<object>} { replies, pagination }
 */
export const fetchRepliesForParent = async (parentId, page = 1, limit = 5, requestingUserId = null) => {
    page = parseInt(page, 10);
    limit = parseInt(limit, 10);
    const offset = (page - 1) * limit;

    try {
        const { count, rows: repliesInstances } = await Comment.findAndCountAll({
            where: {
                parentId: parentId,
                isApproved: true,
                is_hidden: false,
            },
            include: [{
                model: User,
                as: 'user',
                attributes: ['id', 'name', 'avatar', 'uuid'],
                include: [{ model: Role, as: 'roles', attributes: ['name'], through: { attributes: [] } }],
            }],
            order: [['createdAt', 'ASC']],
            limit,
            offset,
            distinct: true,
        });

        const processedReplies = repliesInstances.map(reply => {
            const replyJSON = reply.toJSON();
            replyJSON.isLiked = requestingUserId && Array.isArray(replyJSON.likes) ? replyJSON.likes.includes(parseInt(requestingUserId)) : false;
            replyJSON.likes = Array.isArray(replyJSON.likes) ? replyJSON.likes : [];
            return replyJSON;
        });

        return {
            replies: processedReplies,
            pagination: {
                totalItems: count,
                totalPages: Math.ceil(count / limit),
                currentPage: parseInt(page),
                itemsPerPage: parseInt(limit),
            }
        };
    } catch (error) {
        console.error(`Lỗi khi lấy replies cho parentId ${parentId} (service):`, error);
        throw error;
    }
};