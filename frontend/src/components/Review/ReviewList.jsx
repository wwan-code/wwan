// components/Review/ReviewList.jsx
import React from 'react';
import PropTypes from 'prop-types';
import Pagination from '@components/Common/Pagination';
import RatingDisplayStars from '@components/Review/RatingDisplayStars';
import classNames from '@utils/classNames';
import useDropdown from '@hooks/useDropdown';

const ReviewList = ({
    reviews = [],
    loading = false,
    error = null,
    pagination = { currentPage: 1, totalPages: 1 },
    currentSort = 'newest',
    onSortChange,
    onPageChange,
    currentUser = null,
    onLikeReview,
    onDeleteReview,
    reviewLikeLoading = {}
}) => {
    const { openDropdown, toggleDropdown, dropdownRefCallback } = useDropdown();

    const handleSortClick = (sortValue) => {
        if (sortValue !== currentSort) {
            onSortChange(sortValue);
        }
    };

    // Helper hiển thị thời gian (có thể chuyển ra utils)
    const timeSince = (date) => {
        if (!date) return '';
        const seconds = Math.floor((new Date() - new Date(date)) / 1000);
        let interval = seconds / 31536000;
        if (interval > 1) return Math.floor(interval) + " năm trước";
        interval = seconds / 2592000;
        if (interval > 1) return Math.floor(interval) + " tháng trước";
        interval = seconds / 86400;
        if (interval > 1) return Math.floor(interval) + " ngày trước";
        interval = seconds / 3600;
        if (interval > 1) return Math.floor(interval) + " giờ trước";
        interval = seconds / 60;
        if (interval > 1) return Math.floor(interval) + " phút trước";
        return Math.floor(seconds) + " giây trước";
    }

    // Hàm xử lý khi nhấn nút Delete
    const handleDeleteClick = (reviewId) => {
        if (window.confirm('Bạn có chắc chắn muốn xóa đánh giá này?')) {
            if (onDeleteReview) {
                onDeleteReview(reviewId);
            }
        }
    };

    return (
        <div className="review-list-section mt-4">
            {/* Header và Sắp xếp */}
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="mb-0">Đánh giá từ người xem ({pagination.totalItems || 0})</h5>
                <div className="dropdown" ref={(el) => dropdownRefCallback(el, 921)}>
                    <button className="btn btn-sm btn-outline-secondary dropdown-toggle" type="button" id="sortReviewDropdown" data-bs-toggle="dropdown" aria-expanded="false" onClick={(e) => toggleDropdown(921, e)}>
                        Sắp xếp: {
                            currentSort === 'newest' ? 'Mới nhất' :
                                currentSort === 'rating_desc' ? 'Điểm cao nhất' :
                                    currentSort === 'rating_asc' ? 'Điểm thấp nhất' : 'Mới nhất'
                        }
                    </button>
                    <ul className={classNames("dropdown-menu dropdown-menu-end", { "show": openDropdown === 921 })} aria-labelledby="sortReviewDropdown" data-bs-popper>
                        <li><button className={`dropdown-item ${currentSort === 'newest' ? 'active' : ''}`} onClick={() => handleSortClick('newest')}>Mới nhất</button></li>
                        <li><button className={`dropdown-item ${currentSort === 'rating_desc' ? 'active' : ''}`} onClick={() => handleSortClick('rating_desc')}>Điểm cao nhất</button></li>
                        <li><button className={`dropdown-item ${currentSort === 'rating_asc' ? 'active' : ''}`} onClick={() => handleSortClick('rating_asc')}>Điểm thấp nhất</button></li>
                        <li><button className={`dropdown-item ${currentSort === 'likes_desc' ? 'active' : ''}`} onClick={() => handleSortClick('likes_desc')}>Nhiều like nhất</button></li>
                    </ul>
                </div>
            </div>

            {/* Loading và Error */}
            {loading && <div className="text-center p-3"><i className="fas fa-spinner fa-spin"></i> Đang tải đánh giá...</div>}
            {error && !loading && <div className="alert alert-warning">{error}</div>}

            {/* Danh sách Reviews */}
            {!loading && !error && reviews.length > 0 && (
                <ul className="list-unstyled review-list">
                    {reviews.map((review) => {
                        
                        const isLikedByCurrentUser = currentUser && Array.isArray(review.likes) && review.likes.includes(currentUser.id);
                        const canInteract = currentUser?.id === review.userId;
                        const isLiking = reviewLikeLoading[review.id];

                        return (
                            <li key={review.id} className="review-item mb-3 pb-3">
                                <div className="d-flex align-items-start">
                                    <img
                                        src={review.user?.avatar || `https://ui-avatars.com/api/?name=${review.user?.name?.split(' ').map(w => w[0]).join('')}&background=random&color=fff`}
                                        alt={review.user?.name}
                                        className="rounded-circle me-2"
                                        width="40"
                                        height="40"
                                    />
                                    <div className="flex-grow-1">
                                        <div className="d-flex justify-content-between align-items-center mb-1">
                                            <span className="fw-bold">{review.user?.name || 'Người dùng ẩn'}</span>
                                            <small className="text-muted">{timeSince(review.createdAt)}</small>
                                        </div>
                                        <RatingDisplayStars rating={review.rating} />
                                        {review.reviewContent && (
                                            <p className="review-content mt-2 mb-1">{review.reviewContent}</p>
                                        )}
                                        <div className="review-actions mt-1">
                                            {review.reviewContent && onLikeReview && (
                                                <button
                                                    className={classNames("btn btn-sm btn-link text-secondary p-0 me-2", { 'text-primary fw-bold': isLikedByCurrentUser })}
                                                    onClick={() => onLikeReview(review.id)}
                                                    disabled={!currentUser || isLiking}
                                                    title={isLikedByCurrentUser ? "Bỏ thích" : "Thích"}
                                                >
                                                    {isLiking ? (
                                                        <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                                                    ) : (
                                                        <i className={`${isLikedByCurrentUser ? 'fas' : 'far'} fa-thumbs-up me-1`}></i>
                                                    )}
                                                    ({review.likes.length || 0})
                                                </button>
                                            )}
                                            {canInteract && (
                                                <>

                                                    {onDeleteReview && (
                                                        <button className="btn btn-sm btn-link text-danger p-0" onClick={() => handleDeleteClick(review.id)}>Xóa</button>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </li>
                        )
                    })}
                </ul>
            )}

            {/* Thông báo không có review */}
            {!loading && !error && reviews.length === 0 && (
                <p className="text-center text-muted mt-3">Chưa có đánh giá nào cho phim này.</p>
            )}

            {/* Phân trang */}
            {!loading && !error && reviews.length > 0 && pagination.totalPages > 1 && (
                <Pagination
                    currentPage={pagination.currentPage}
                    totalPages={pagination.totalPages}
                    onPageChange={onPageChange}
                />
            )}
        </div>
    );
};

ReviewList.propTypes = {
    reviews: PropTypes.array,
    loading: PropTypes.bool,
    error: PropTypes.string,
    pagination: PropTypes.object,
    currentSort: PropTypes.string,
    onSortChange: PropTypes.func.isRequired,
    onPageChange: PropTypes.func.isRequired,
    currentUser: PropTypes.object,
    reviewLikeLoading: PropTypes.object,
    onLikeReview: PropTypes.func,
    onDeleteReview: PropTypes.func,
};


export default ReviewList;