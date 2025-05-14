import db from '../models/index.js';

const Comment = db.Comment;
const User = db.User;
const Episode = db.Episode;
const Movie = db.Movie; // Có thể cần join với Movie để hiển thị tên phim

// Lấy tất cả bình luận (có phân trang, tìm kiếm, lọc nếu cần)
export const getAllComments = async (req, res) => {
    try {
        // Ở đây chỉ lấy đơn giản, bạn có thể thêm query params cho pagination, filtering, sorting
        const comments = await Comment.findAll({
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['id', 'name', 'email'] // Bao gồm thông tin user tạo comment
                },
                {
                    model: Episode,
                    as: 'episode',
                    attributes: ['id', 'episodeNumber'], // Bao gồm thông tin episode
                    include: [
                        {
                            model: Movie,
                            attributes: ['id', 'title'] // Bao gồm thông tin phim
                        }
                    ]
                }
            ],
            order: [['createdAt', 'DESC']] // Sắp xếp theo thời gian tạo giảm dần
        });

        res.status(200).json(comments);

    } catch (error) {
        console.error("Lỗi khi lấy tất cả bình luận:", error);
        res.status(500).json({ message: "Lỗi server khi lấy danh sách bình luận." });
    }
};

// Cập nhật trạng thái ẩn/hiện bình luận
export const updateCommentStatus = async (req, res) => {
    const commentId = req.params.id;
    const { is_hidden } = req.body; // Nhận trạng thái mới từ body

    try {
        const comment = await Comment.findByPk(commentId);

        if (!comment) {
            return res.status(404).json({ message: "Không tìm thấy bình luận." });
        }

        comment.is_hidden = is_hidden; // Cập nhật trạng thái
        await comment.save(); // Lưu thay đổi vào DB

        res.status(200).json({ message: "Cập nhật trạng thái bình luận thành công.", comment });

    } catch (error) {
        console.error(`Lỗi khi cập nhật trạng thái bình luận ${commentId}:`, error);
        res.status(500).json({ message: "Lỗi server khi cập nhật trạng thái bình luận." });
    }
};

// Xóa bình luận
export const deleteComment = async (req, res) => {
    const commentId = req.params.id;

    try {
        const comment = await Comment.findByPk(commentId);

        if (!comment) {
            return res.status(404).json({ message: "Không tìm thấy bình luận." });
        }

        // Xóa bình luận (và các phản hồi của nó nếu cần - tùy thuộc vào cấu hình cascade delete trong DB hoặc bạn tự xử lý)
        // Nếu sử dụng cascade delete ở mức DB, chỉ cần xóa comment gốc.
        // Nếu không, bạn có thể cần xóa các phản hồi trước:
        // await Comment.destroy({ where: { parentId: commentId } });
        await comment.destroy(); // Xóa bình luận gốc

        res.status(200).json({ message: "Xóa bình luận thành công." });

    } catch (error) {
        console.error(`Lỗi khi xóa bình luận ${commentId}:`, error);
        res.status(500).json({ message: "Lỗi server khi xóa bình luận." });
    }
};

// Bạn có thể thêm các hàm khác như getCommentById, editComment (admin edit nội dung), v.v.