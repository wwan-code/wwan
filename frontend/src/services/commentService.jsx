// frontend/src/services/commentService.js
import api from './api'; // Giả sử bạn có một instance axios đã cấu hình là 'api'
import authHeader from './auth-header'; //

const API_URL = '/api/comments'; // Base URL cho API comments (backend đã định nghĩa trong comment.routes.js)

/**
 * Lấy bình luận cho một nội dung cụ thể.
 * @param {string} contentType - Loại nội dung (ví dụ: "episode", "comic", "chapter").
 * @param {string|number} contentId - ID của nội dung.
 * @param {number} [page=1] - Trang hiện tại cho phân trang.
 * @param {number} [limit=10] - Số lượng bình luận trên mỗi trang.
 * @returns {Promise<object>} Promise chứa { success, comments, pagination }.
 */
const getCommentsByContent = (contentType, contentId, page = 1, limit = 10, sortOption='newest' ) => {
    return api.get(`${API_URL}/${contentType}/${contentId}`, {
        params: { page, limit, sort: sortOption },
        headers: authHeader(true)
    }).then(response => response.data);
};

/**
 * Tạo một bình luận mới (hoặc trả lời).
 * @param {object} commentData - { contentId, contentType, text, parentId (optional), isSpoiler (optional) }
 * @returns {Promise<object>} Promise chứa { success, comment }.
 */
const createComment = (commentData) => {
    // API backend là POST /
    return api.post(API_URL, commentData, { headers: authHeader() }) // Cần token để tạo comment
        .then(response => response.data);
};

/**
 * Thích hoặc bỏ thích một bình luận.
 * @param {string|number} commentId - ID của bình luận.
 * @returns {Promise<object>} Promise chứa { success, liked, likesCount, message }.
 */
const toggleLikeComment = (commentId) => {
    // API backend là POST /:commentId/like
    return api.post(`${API_URL}/${commentId}/like`, {}, { headers: authHeader() }) // Cần token
        .then(response => response.data);
};

/**
 * Xóa một bình luận.
 * @param {string|number} commentId - ID của bình luận.
 * @returns {Promise<object>} Promise chứa { success, message }.
 */
const deleteComment = (commentId) => {
    // API backend là DELETE /:commentId
    return api.delete(`${API_URL}/${commentId}`, { headers: authHeader() }) // Cần token và backend sẽ kiểm tra quyền
        .then(response => response.data);
};

/**
 * Cập nhật một bình luận.
 * @param {string|number} commentId - ID của bình luận.
 * @param {object} updateData - { text, isSpoiler (optional) }.
 * @returns {Promise<object>} Promise chứa { success, comment }.
 */
const updateComment = (commentId, updateData) => {
    // API backend là PUT /:commentId (bạn cần tạo route và controller/service cho việc này)
    return api.put(`${API_URL}/${commentId}`, updateData, { headers: authHeader() })
        .then(response => response.data);
};

/**
 * Báo cáo một bình luận.
 * @param {string|number} commentId - ID của bình luận.
 * @param {string} reason - Lý do báo cáo.
 * @returns {Promise<object>}
 */
const reportComment = (commentId, reason) => {
    return api.post(`${API_URL}/${commentId}/report`, { reason }, { headers: authHeader() })
        .then(response => response.data);
};

/**
 * Lấy replies cho một parent comment (phân trang).
 * @param {string|number} parentId - ID của comment cha.
 * @param {number} [page=1]
 * @param {number} [limit=5]
 * @returns {Promise<object>} Promise chứa { success, replies, pagination }.
 */
const getReplies = (parentId, page = 1, limit = 5) => {
    return api.get(`${API_URL}/replies`, {
        params: { parentId, page, limit },
        headers: authHeader(true)
    }).then(response => response.data);
};

const commentService = {
    getCommentsByContent,
    createComment,
    toggleLikeComment,
    deleteComment,
    updateComment,
    reportComment,
    getReplies,
};

export default commentService;