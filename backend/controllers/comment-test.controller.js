import * as commentService from '../services/comment.service.js';
import { handleServerError } from "../utils/errorUtils.js";


export const getComments = async (req, res) => {
    try {
        const result = await commentService.fetchAllComments(req.query);
        res.status(200).json(result);
    } catch (error) {
        console.error("Get Comments Error in Controller:", error);
        handleServerError(res, error, "Lấy danh sách bình luận");
    }
};

export const getCommentById = async (req, res) => {
    try {
        const commentId = req.params.id;
        const comment = await commentService.fetchCommentById(commentId);
        res.status(200).json(comment);
    } catch (error) {
        console.error(`Get Comment By ID Error (ID: ${req.params.id}):`, error);
        const statusCode = error.statusCode || 500;
        handleServerError(res, error, "Lấy bình luận theo ID", statusCode);
    }
};

export const updateComment = async (req, res) => {
    try {
        const commentId = req.params.id;
        const requestingUserId = req.userId;

        if (!requestingUserId) {
            return res.status(401).json({ success: false, message: "Yêu cầu đăng nhập để cập nhật bình luận." });
        }
        if (!req.body.content || typeof req.body.content !== 'string' || req.body.content.trim() === '') {
            return res.status(400).json({ success: false, message: "Nội dung bình luận không được để trống." });
        }

        const updatedComment = await commentService.updateExistingComment(commentId, { content: req.body.content }, requestingUserId);
        res.status(200).json(updatedComment);
    } catch (error) {
        console.error(`Update Comment Error (ID: ${req.params.id}):`, error);
        const statusCode = error.statusCode || 500;
        handleServerError(res, error, "Cập nhật bình luận", statusCode);
    }
};

export const likeComment = async (req, res) => {
    try {
        const commentId = req.params.id;
        const userId = req.userId; // Lấy userId từ middleware xác thực

        if (!userId) {
            return res.status(401).json({ success: false, message: "Yêu cầu đăng nhập để thích bình luận." });
        }

        const result = await commentService.processToggleLikeComment(commentId, userId);
        res.status(200).json({
            success: true,
            message: result.message,
            likesCount: result.likesCount,
            isLiked: result.isLiked
        });
    } catch (error) {
        console.error("Like/Unlike Comment Error in Controller:", error);
        const statusCode = error.statusCode || 500;
        const message = error.message || "Lỗi server khi xử lý like.";
        // Controller gốc không dùng handleServerError ở đây
        // nhưng nên dùng cho nhất quán
        handleServerError(res, error, "Xử lý thích/bỏ thích bình luận", statusCode);
    }
};

export const getCommentsByEpisodeId = async (req, res) => {
    try {
        const episodeId = req.params.episodeId; //
        const result = await commentService.fetchCommentsForEpisode(episodeId, req.query);
        res.status(200).json(result); // Trả về object chứa comments và pagination
    } catch (error) {
        console.error("Error fetching comments by episode ID in Controller:", error);
        // Controller gốc trả về error.message trực tiếp
        const statusCode = error.statusCode || 500;
        handleServerError(res, error, `Lỗi khi tải bình luận cho tập phim ID ${req.params.episodeId}`, statusCode);
    }
};

export const createCommentOfEpiosde = async (req, res) => {
    try {
        const episodeId = req.params.episodeId;
        const { content, parentId, replyingTo } = req.body;
        const commenterId = req.userId;

        if (!commenterId) {
            return res.status(401).json({ success: false, error: "Yêu cầu đăng nhập để bình luận." });
        }
        if (!content || content.trim() === "") {
            return res.status(400).json({ success: false, error: "Nội dung bình luận không được để trống." });
        }

        const commentData = {
            content,
            userId: commenterId,
            parentId: parentId ? parseInt(parentId) : null,
            replyingTo
        };

        const newComment = await commentService.createNewCommentForEpisode(episodeId, commentData);
        res.status(201).json(newComment);
    } catch (error) {
        console.error("Create Comment Error in Controller:", error);
        const statusCode = error.statusCode || 500;
        handleServerError(res, error, "Tạo bình luận/phản hồi", statusCode);
    }
};

export const updateCommentOfEpiosde = async (req, res) => {
    try {
        const { episodeId, commentId } = req.params;
        const { content } = req.body;
        const requestingUserId = req.userId;

        if (!requestingUserId) {
            return res.status(401).json({ success: false, message: "Yêu cầu đăng nhập." });
        }

        const params = { episodeId, commentId };
        const updateDetails = { content, requestingUserId };

        const updatedComment = await commentService.updateSpecificCommentOrReply(params, updateDetails);
        res.status(200).json(updatedComment);
    } catch (error) {
        console.error("Update Comment of Episode Error:", error);
        const statusCode = error.statusCode || 500;
        handleServerError(res, error, "Cập nhật bình luận", statusCode);
    }
};

export const updateReplyOfComment = async (req, res) => {
    try {
        const { episodeId, commentId, replyId } = req.params;
        const { content } = req.body;
        const requestingUserId = req.userId;

        if (!requestingUserId) {
            return res.status(401).json({ success: false, message: "Yêu cầu đăng nhập." });
        }

        const params = { episodeId, commentId, replyId };
        const updateDetails = { content, requestingUserId };

        const updatedReply = await commentService.updateSpecificCommentOrReply(params, updateDetails);
        res.status(200).json(updatedReply);
    } catch (error) {
        console.error("Update Reply of Comment Error:", error);
        const statusCode = error.statusCode || 500;
        handleServerError(res, error, "Cập nhật phản hồi bình luận", statusCode);
    }
};

export const getCommentOfEpiosdeById = async (req, res) => {
    try {
        const { episodeId, commentId } = req.params;
        const result = await commentService.fetchCommentWithReplies(episodeId, commentId);
        res.status(200).json(result);
    } catch (error) {
        console.error("Get Comment by ID (with replies) Error:", error);
        const statusCode = error.statusCode || 500;
        handleServerError(res, error, "Lỗi tải dữ liệu bình luận và phản hồi", statusCode);
    }
};

export const deleteComment = async (req, res) => {
    try {
        const { episodeId, commentId } = req.params;
        const authenticatedUserId = req.userId;

        if (!authenticatedUserId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        if (!commentId) {
            return res.status(400).json({ error: 'Comment ID is required' });
        }

        await commentService.removeCommentAndReplies(commentId, authenticatedUserId, episodeId);
        res.status(204).send();
    } catch (error) {
        console.error("Delete Comment Error in Controller:", error);
        const statusCode = error.statusCode || 500;
        handleServerError(res, error, "Xóa bình luận", statusCode);
    }
};