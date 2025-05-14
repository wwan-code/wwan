import Comment from "../models/Comment.js";
import User from "../models/User.js";
import Role from "../models/Role.js";
import sequelize from '../config/database.js';
import { Op, fn, col, literal } from 'sequelize';
import { awardPoints, checkAndAwardBadges } from "../utils/gamificationUtils.js";

const POINTS_FOR_COMMENTING = 10;

export const getComments = async (req, res) => {
    try {
        const comments = await Comment.findAll();
        res.status(200).json(comments);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getCommentById = async (req, res) => {
    try {
        const comment = await Comment.findByPk(req.params.id);
        if (comment) {
            res.status(200).json(comment);
        } else {
            res.status(404).json({ message: "Comment not found" });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const updateComment = async (req, res) => {
    try {
        const comment = await Comment.findByPk(req.params.id);
        if (comment) {
            await comment.update(req.body);
            res.status(200).json(comment);
        } else {
            res.status(404).json({ message: "Comment not found" });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const likeComment = async (req, res) => {
    const commentId = req.params.id;
    const userId = req.userId; // Lấy userId từ middleware xác thực (authJwt.verifyToken)

    // Kiểm tra xem userId có tồn tại không (người dùng phải đăng nhập)
    if (!userId) {
        return res.status(401).json({ success: false, message: "Yêu cầu đăng nhập để thích bình luận." });
    }

    try {
        const comment = await Comment.findByPk(commentId);
        if (!comment) {
            return res.status(404).json({ success: false, message: "Không tìm thấy bình luận." });
        }

        // Lấy mảng likes hiện tại, khởi tạo mảng rỗng nếu chưa có hoặc null
        const currentLikes = Array.isArray(comment.likes) ? [...comment.likes] : [];
        const userIndex = currentLikes.indexOf(userId);
        let isLiked = false;

        if (userIndex > -1) {
            // Nếu đã like -> unlike (xóa userId khỏi mảng)
            currentLikes.splice(userIndex, 1);
            isLiked = false;
        } else {
            // Nếu chưa like -> like (thêm userId vào mảng)
            currentLikes.push(userId);
            isLiked = true;
        }

        // Cập nhật lại trường likes trong database
        // Lưu ý: Sequelize tự động xử lý việc chuyển đổi mảng thành JSON khi lưu
        comment.likes = currentLikes;
        await comment.save();

        // Trả về trạng thái mới và số like cập nhật
        res.status(200).json({
            success: true,
            message: isLiked ? "Đã thích bình luận." : "Đã bỏ thích bình luận.",
            likesCount: currentLikes.length,
            isLiked: isLiked // Trạng thái like của user hiện tại đối với comment này
        });

    } catch (error) {
        console.error("Lỗi khi like/unlike bình luận:", error);
        res.status(500).json({ success: false, message: "Lỗi server khi xử lý like." });
    }
};

export const getCommentsByEpisodeId = async (req, res) => {
    const episodeId = req.params.episodeId;
    const sort = req.query.sort || 'newest';

    try {
        const orderOptions = [];

        if (sort === 'mostLiked') {
            orderOptions.push([literal('JSON_LENGTH(`comments`.`likes`)'), 'DESC']);
        }

        orderOptions.push(['createdAt', 'DESC']);

        const comments = await Comment.findAll({
            where: {
                episodeId,
                parentId: null
            },
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['id', 'name', 'avatar'],
                    include: [{
                        model: Role,
                        as: 'roles',
                        attributes: ['name'],
                        through: { attributes: [] }
                    }],
                },
                {
                    model: Comment,
                    as: 'replies',
                    required: false,
                    where: { is_hidden: false },
                    include: [{
                        model: User,
                        as: 'user',
                        attributes: ['id', 'name', 'avatar'],
                         include: [{
                            model: Role,
                            as: 'roles',
                            attributes: ['name'],
                            through: { attributes: [] }
                        }],
                    }],
                     order: [['createdAt', 'ASC']]
                }
            ],
            order: orderOptions
        });

        const visibleComments = comments.filter(comment => !comment.is_hidden);


        res.status(200).json(visibleComments);
    } catch (error) {
        console.error("Error fetching comments by episode ID:", error);
        res.status(500).json({ error: "Lỗi khi tải bình luận: " + error.message });
    }
};

export const createCommentOfEpiosde = async (req, res) => {
    const { content, userId, parentId, replyingTo } = req.body;
    const episodeId = req.params.episodeId;

    try {
        const user = await User.findByPk(userId);
        if (!user) return res.status(404).json({ error: "User not found" });
        const resp = await Comment.create({ content, userId, episodeId, parentId, replyingTo });
        if (!parentId) {
            const pointResult = await awardPoints(userId, POINTS_FOR_COMMENTING); // awardPoints sẽ gọi checkAndAwardBadges cho points/level
            // Gọi riêng checkAndAwardBadges cho tiêu chí 'comments'
            if (pointResult && pointResult.user) { // Dùng user instance đã cập nhật từ awardPoints
                 await checkAndAwardBadges(pointResult.user, { eventType: 'new_comment' });
            } else { // Hoặc nếu awardPoints không trả về user, fetch lại hoặc dùng user hiện tại
                 await checkAndAwardBadges(user, { eventType: 'new_comment' }); // user này có thể chưa cập nhật điểm mới nhất
            }
        }
        const comment = await Comment.findOne({
            where: { id: resp.id },
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['id', 'name', 'avatar'],
                    include: [{
                        model: Role,
                        as: 'roles',
                        attributes: ['name'],
                    }],
                },
                { model: Comment, as: 'replies', include: [{ model: User, as: 'user', attributes: ['id', 'name', 'avatar'] }] }
            ],
        });
        res.status(201).json(comment);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const updateCommentOfEpiosde = async (req, res) => {
    const { episodeId, commentId } = req.params;
    const { content, userId } = req.body;
    try {
        const comment = await Comment.findOne({ where: { id: commentId, episodeId, userId } });
        if (!comment) {
            return res.status(404).json({ error: 'Comment not found' });
        }

        if (comment.userId !== userId) {
            return res.status(403).json({ error: 'You do not have permission to edit this comment.' });
        }

        comment.content = content;
        await comment.save();
        
        res.status(201).json(comment);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const updateReplyOfComment = async (req, res) => {
    const { episodeId, commentId, replyId } = req.params;
    const { content, userId } = req.body;
    try {
        const comment = await Comment.findOne({ where: { id: replyId, episodeId, userId, parentId: commentId } });
        if (!comment) {
            return res.status(404).json({ error: 'Comment not found' });
        }

        if (comment.userId !== userId) {
            return res.status(403).json({ error: 'You do not have permission to edit this comment.' });
        }

        comment.content = content;
        await comment.save();
        
        res.status(201).json(comment);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

export const getCommentOfEpiosdeById = async (req, res) => {
    const commentId = req.params.commentId;
    const episodeId = req.params.episodeId;
    try {
        const replies = await Comment.findAll({ where: { parentId: commentId, episodeId }, include: [{ model: User, as: 'user' }] });
        const comment = await Comment.findOne({ where: { id: commentId, episodeId }, include: [{ model: User, as: 'user' }] });
        res.status(200).json({ comment, replies });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi tải dữ liệu replies' });
    }
}

export const deleteComment = async (req, res) => {
    const { episodeId, commentId } = req.params;
    const { userId } = req.body;
    const authenticatedUserId = req.userId;
    if (!authenticatedUserId) {
         return res.status(401).json({ error: 'Unauthorized' });
    }
    if (!commentId) {
        return res.status(400).json({ error: 'Comment ID is required' });
    }
    try {
        const commentToDelete = await Comment.findOne({ where: { id: commentId } });

        if (!commentToDelete) {
            return res.status(404).json({ error: 'Comment not found' });
        }

        if (authenticatedUserId !== userId) {
            const user = await User.findByPk(authenticatedUserId, { include: [{ model: Role, as: 'roles' }] });
             const isAdminOrEditor = user?.roles?.some(role => ['admin', 'editor'].includes(role.name));
             if (!isAdminOrEditor) {
                return res.status(403).json({ error: 'Bạn không có quyền xóa bình luận này.' });
             }
        }
        const deleteRepliesRecursive = async (parentId) => {
            const replies = await Comment.findAll({ where: { parentId: parentId } });
            for (const reply of replies) {
                await deleteRepliesRecursive(reply.id); // Xóa replies của reply trước
                await reply.destroy(); // Xóa reply
            }
        };

        if (commentToDelete.parentId === null) {
            await deleteRepliesRecursive(commentId);
        }

        await commentToDelete.destroy();

        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: 'Error deleting comment: ' + error.message });
    }
};