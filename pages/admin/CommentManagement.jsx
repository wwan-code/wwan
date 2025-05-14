// pages/admin/CommentManagement.jsx

import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { Bounce, toast } from 'react-toastify';
import authHeader from '../../services/auth-header'; // Hàm lấy header xác thực

const CommentManagement = () => {
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Hàm fetch bình luận từ backend
    const fetchComments = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await axios.get('/api/admin/comments', { headers: authHeader() });
            setComments(response.data);
        } catch (err) {
            console.error("Error fetching comments:", err);
            setError("Lỗi khi tải danh sách bình luận.");
            toast.error("Lỗi khi tải danh sách bình luận.", {
                theme: document.documentElement.getAttribute("data-ww-theme") || "light",
                transition: Bounce
            });
        } finally {
            setLoading(false);
        }
    }, []); // Dependencies

    // Fetch comments khi component mount
    useEffect(() => {
        // AdminRoute đã bảo vệ route này, nên user đã đăng nhập và có quyền admin
        fetchComments();
    }, [fetchComments]);

    // Hàm xử lý ẩn/hiện bình luận
    const handleToggleHide = useCallback(async (commentId, currentStatus) => {
        try {
            await axios.put(`/api/admin/comments/${commentId}/status`, { is_hidden: !currentStatus }, { headers: authHeader() });
            // Cập nhật state comments sau khi thành công (immutably)
            setComments(prevComments =>
                prevComments.map(comment =>
                    comment.id === commentId ? { ...comment, is_hidden: !currentStatus } : comment
                )
            );
            toast.success(`Đã ${!currentStatus ? 'ẩn' : 'hiện'} bình luận.`, {
                theme: document.documentElement.getAttribute("data-ww-theme") || "light",
                transition: Bounce
            });
        } catch (err) {
            console.error("Error toggling comment status:", err);
            toast.error("Lỗi khi cập nhật trạng thái bình luận.", {
                theme: document.documentElement.getAttribute("data-ww-theme") || "light",
                transition: Bounce
            });
        }
    }, []); // Dependencies

    // Hàm xử lý xóa bình luận
    const handleDeleteComment = useCallback(async (commentId) => {
        if (!window.confirm("Bạn chắc chắn muốn xóa bình luận này?")) return; // Xác nhận trước khi xóa

        try {
            await axios.delete(`/api/admin/comments/${commentId}`, { headers: authHeader() });
            // Cập nhật state comments sau khi thành công (immutably)
            setComments(prevComments => prevComments.filter(comment => comment.id !== commentId));
            toast.success("Đã xóa bình luận.", {
                theme: document.documentElement.getAttribute("data-ww-theme") || "light",
                transition: Bounce
            });
        } catch (err) {
            console.error("Error deleting comment:", err);
            toast.error("Lỗi khi xóa bình luận.", {
                theme: document.documentElement.getAttribute("data-ww-theme") || "light",
                transition: Bounce
            });
        }
    }, []); // Dependencies

    return (
        <div className="container-fluid">
            <h2 className="mt-4 mb-3">Quản lý Bình luận</h2>

            {loading && <div className="text-center"><i className="fas fa-spinner fa-spin"></i> Đang tải bình luận...</div>}
            {error && <div className="alert alert-danger">{error}</div>}

            {!loading && !error && comments.length > 0 && (
                <table className="table table-striped table-bordered">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Nội dung</th>
                            <th>Người dùng</th>
                            <th>Episode</th>
                            <th>Phim</th>
                            <th>Thời gian</th>
                            <th>Trạng thái</th>
                            <th>Hành động</th>
                        </tr>
                    </thead>
                    <tbody>
                        {comments.map(comment => (
                            <tr key={comment.id}>
                                <td>{comment.id}</td>
                                <td>{comment.content}</td>
                                <td>{comment.user?.name || 'N/A'}</td>
                                <td>{comment.episode?.episodeNumber || 'N/A'}</td>
                                <td>{comment.episode?.movie?.title || 'N/A'}</td>
                                <td>{new Date(comment.createdAt).toLocaleString()}</td>
                                <td>
                                    <span className={`badge ${comment.is_hidden ? 'bg-warning' : 'bg-success'}`}>
                                        {comment.is_hidden ? 'Đã ẩn' : 'Hiển thị'}
                                    </span>
                                </td>
                                <td>
                                    <button
                                        className={`btn btn-sm me-2 ${comment.is_hidden ? 'btn-success' : 'btn-warning'}`}
                                        onClick={() => handleToggleHide(comment.id, comment.is_hidden)}
                                    >
                                        {comment.is_hidden ? 'Hiện' : 'Ẩn'}
                                    </button>
                                    {/* Có thể thêm nút chỉnh sửa */}
                                    {/* <button className="btn btn-sm btn-primary me-2">Sửa</button> */}
                                    <button
                                        className="btn btn-sm btn-danger"
                                        onClick={() => handleDeleteComment(comment.id)}
                                    >
                                        Xóa
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
            {!loading && !error && comments.length === 0 && (
                <div className="alert alert-info">Không có bình luận nào để hiển thị.</div>
            )}
        </div>
    );
};

export default CommentManagement;