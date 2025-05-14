// components/Review/ReviewForm.jsx
import React, { useState, useEffect } from 'react';
// ... (các import khác nếu có)

// Thêm prop textareaStyle
const ReviewForm = ({ movieId, initialRating = 0, initialContent = '', onSubmit, isSubmitting, existingReviewId, textareaStyle }) => {
    const [rating, setRating] = useState(initialRating);
    const [hover, setHover] = useState(0);
    const [reviewContent, setReviewContent] = useState(initialContent);

    useEffect(() => {
        setRating(initialRating);
        setReviewContent(initialContent);
    }, [initialRating, initialContent, movieId]); // Thêm movieId để reset khi phim thay đổi

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit({ rating, reviewContent });
    };

    return (
        <form onSubmit={handleSubmit} className="review-form mt-2">
            <div className="mb-2 star-rating-input">
                {[...Array(10)].map((_, index) => {
                    const starValue = index + 1;
                    return (
                        <span
                            key={starValue}
                            className={`star ${(starValue <= (hover || rating)) ? "filled" : "empty"}`}
                            onClick={() => !isSubmitting && setRating(starValue)}
                            onMouseEnter={() => !isSubmitting && setHover(starValue)}
                            onMouseLeave={() => !isSubmitting && setHover(0)}
                            role="button"
                            tabIndex={0}
                            aria-label={`Rate ${starValue} out of 10`}
                        >
                           &#9733; {/* Hoặc dùng icon font */}
                        </span>
                    );
                })}
                 {rating > 0 && <span className="ms-2 text-warning fw-bold">{rating}/10</span>}
            </div>
            <div className="mb-2">
                <textarea
                    className="form-control form-control-sm"
                    rows="3"
                    placeholder="Viết đánh giá của bạn (tùy chọn)..."
                    value={reviewContent}
                    onChange={(e) => setReviewContent(e.target.value)}
                    disabled={isSubmitting}
                    maxLength={1000}
                    style={textareaStyle || {}} // <--- ÁP DỤNG STYLE Ở ĐÂY
                />
                 <small className="text-muted float-end">{reviewContent.length}/1000</small>
            </div>
            <button type="submit" className="btn btn-sm btn-primary" disabled={isSubmitting || rating === 0}>
                {isSubmitting ? 'Đang gửi...' : (existingReviewId ? 'Cập nhật đánh giá' : 'Gửi đánh giá')}
            </button>
        </form>
    );
};

export default ReviewForm;