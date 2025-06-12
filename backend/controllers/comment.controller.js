// backend/controllers/comment.controller.js
import * as commentService from '../services/comment.service.js';
import { handleServerError } from '../utils/errorUtils.js';

export const createComment = async (req, res) => {
    try {
        const userId = req.userId;
        const { contentId, contentType, text, parentId, isSpoiler } = req.body;

        if (!contentId || !contentType || !text) {
            return res.status(400).json({ success: false, message: "Thiếu thông tin contentId, contentType hoặc text." });
        }

        const newComment = await commentService.createNewComment(userId, parseInt(contentId), contentType, text, parentId ? parseInt(parentId) : null, isSpoiler);
        res.status(201).json({ success: true, comment: newComment });
    } catch (error) {
        const statusCode = error.statusCode || 500;
        handleServerError(res, error, "Lỗi khi tạo bình luận", statusCode);
    }
};

export const getComments = async (req, res) => {
    try {
        const { contentId, contentType } = req.params;
        const userId = req.userId;

        if (!contentId || !contentType) {
            return res.status(400).json({ success: false, message: "Thiếu contentId hoặc contentType." });
        }

        const result = await commentService.getCommentsByContent(parseInt(contentId), contentType, req.query, userId ? parseInt(userId) : null);
        res.status(200).json({ success: true, ...result });
    } catch (error) {
        const statusCode = error.statusCode || 500;
        handleServerError(res, error, `Lỗi khi lấy bình luận cho ${req.params.contentType} #${req.params.contentId}`, statusCode);
    }
};

export const likeComment = async (req, res) => {
    try {
        const userId = req.userId;
        const { commentId } = req.params;
        const result = await commentService.toggleLikeComment(parseInt(commentId), userId);
        res.status(200).json({ success: true, ...result });
    } catch (error) {
        const statusCode = error.statusCode || 500;
        handleServerError(res, error, `Lỗi khi thích bình luận #${req.params.commentId}`, statusCode);
    }
};

export const deleteComment = async (req, res) => {
    try {
        const userId = req.userId;
        const { commentId } = req.params;

        const result = await commentService.deleteUserComment(parseInt(commentId), userId);
        res.status(200).json({ success: true, message: result.message });
    } catch (error) {
        const statusCode = error.statusCode || 500;
        handleServerError(res, error, `Lỗi khi xóa bình luận #${req.params.commentId}`, statusCode);
    }
};

export const updateComment = async (req, res) => {
    try {
        const userId = req.userId;
        const { commentId } = req.params;
        const { text, isSpoiler } = req.body;

        if (!text || text.trim() === '') {
            return res.status(400).json({ success: false, message: "Nội dung không được để trống." });
        }

        const updatedComment = await commentService.updateUserComment(parseInt(commentId), userId, text, isSpoiler);
        res.status(200).json({ success: true, comment: updatedComment, message: "Bình luận đã được cập nhật." });
    } catch (error) {
        const statusCode = error.statusCode || 500;
        handleServerError(res, error, `Lỗi khi cập nhật bình luận #${req.params.commentId}`, statusCode);
    }
};

export const reportComment = async (req, res) => {
    try {
        const reportingUserId = req.userId;
        const { commentId } = req.params;
        const { reason } = req.body;

        if (!reason || reason.trim() === '') {
            return res.status(400).json({ success: false, message: "Lý do báo cáo là bắt buộc." });
        }

        const result = await commentService.reportExistingComment(parseInt(commentId), reportingUserId, reason);
        res.status(200).json({ success: true, ...result });
    } catch (error) {
        const statusCode = error.statusCode || 500;
        handleServerError(res, error, `Lỗi khi báo cáo bình luận #${req.params.commentId}`, statusCode);
    }
};

export const getRepliesForComment = async (req, res) => {
    try {
        const { parentId, page, limit } = req.query;
        const userId = req.userId;

        if (!parentId || isNaN(parseInt(parentId))) {
            return res.status(400).json({ success: false, message: "Parent Comment ID không hợp lệ." });
        }

        const result = await commentService.fetchRepliesForParent(parseInt(parentId), page, limit, userId ? parseInt(userId) : null);
        res.status(200).json({ success: true, ...result });
    } catch (error) {
        const statusCode = error.statusCode || 500;
        handleServerError(res, error, `Lỗi khi lấy replies cho comment #${req.params.parentId}`, statusCode);
    }
};