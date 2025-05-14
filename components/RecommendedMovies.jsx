// src/components/RecommendedMovies.jsx
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import authHeader from '../services/auth-header'; // Đảm bảo đường dẫn
import SingleFilm from './SingleFilm'; // Component hiển thị card phim
import { toast } from 'react-toastify';
import { useSelector } from 'react-redux';

const RecommendedMovies = ({ title = "Đề xuất cho bạn" }) => {
    const [recommendations, setRecommendations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { isLoggedIn } = useSelector(state => state.user); // Kiểm tra user đăng nhập

    const fetchRecommendations = useCallback(async () => {
        if (!isLoggedIn) { // Chỉ fetch nếu đã đăng nhập
            setLoading(false);
            return;
        }
        setLoading(true);
        setError(null);
        try {
            // Gọi API mới để lấy đề xuất
            const response = await axios.get('/api/users/me/movie-recommendations', {
                headers: authHeader(),
                params: { limit: 12 } // Lấy 12 phim ví dụ
            });
            if (response.data?.success) {
                setRecommendations(response.data.recommendations || []);
            } else {
                throw new Error(response.data?.message || "Không thể tải đề xuất");
            }
        } catch (err) {
            console.error("Error fetching recommendations:", err);
            // Không nhất thiết phải báo lỗi lớn cho user ở đây, có thể chỉ ẩn section
            // toast.error("Lỗi tải phim đề xuất.");
            setError("Không thể tải phim đề xuất lúc này.");
            setRecommendations([]);
        } finally {
            setLoading(false);
        }
    }, [isLoggedIn]);

    useEffect(() => {
        fetchRecommendations();
    }, [fetchRecommendations]);

    if (!isLoggedIn || (!loading && recommendations.length === 0 && !error)) {
        // Không hiển thị gì nếu chưa đăng nhập, hoặc không có đề xuất và không lỗi
        return null;
    }

    return (
        <section className="recommended-movies-section mt-5 mb-5">
            <div className="container">
                <div className="section-title">
                    <h3>{title}</h3>
                    {/* Có thể thêm nút "Xem thêm" nếu API hỗ trợ phân trang */}
                </div>

                {loading && (
                    <div className="text-center py-3"><div className="spinner-border text-primary"></div></div>
                )}
                {error && !loading && (
                    <div className="alert alert-warning">{error}</div>
                )}
                {!loading && !error && recommendations.length > 0 && (
                    <div className="row g-3">
                        {recommendations.map(movie => (
                            <div key={movie.id} className="col-6 col-md-4 col-lg-3"> {/* Responsive columns */}
                                <SingleFilm movie={movie} />
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
};

export default RecommendedMovies;