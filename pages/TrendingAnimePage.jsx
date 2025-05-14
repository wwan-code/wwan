import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { toast, Bounce } from 'react-toastify';

// Import Components
import SingleFilm from '../components/SingleFilm'; // Đảm bảo đường dẫn đúng
// import Pagination from '../components/Pagination'; // Import nếu bạn muốn thêm phân trang sau

const TrendingAnimePage = () => {
    const [trendingAnime, setTrendingAnime] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // --- Hàm xử lý lỗi API chung ---
    const handleApiError = useCallback((err, operation = "tải dữ liệu") => {
        console.error(`Error ${operation}:`, err);
        let message = `Không thể ${operation}. Vui lòng thử lại.`;
        if (err.response?.data?.message) {
            message = err.response.data.message;
        } else if (err.message) {
            message = err.message;
        }
        setError(message);
        toast.error(message, {
            theme: document.documentElement.getAttribute("data-ww-theme") || "light",
            transition: Bounce,
        });
    }, []);

    // --- Fetch dữ liệu Anime thịnh hành ---
    useEffect(() => {
        const fetchTrendingAnime = async (currentPage = 1) => { // Nhận currentPage
            setLoading(true);
            setError(null);
            try {
                const response = await axios.get('/api/prevailing', { // Hoặc route mới của bạn
                    params: {
                        category: 'Anime', // Hoặc để trống nếu muốn lấy chung, hoặc lấy từ URL param khác
                        page: currentPage,
                        limit: 12 // Số lượng bạn muốn hiển thị
                    }
                    // headers: authHeader() // Nếu API yêu cầu
                });
    
                if (response.data?.success) {
                    setTrendingAnime(response.data.movies || []);
                    // Cập nhật state pagination nếu component này có phân trang riêng
                    // setPagination(response.data.pagination);
                } else {
                    throw new Error(response.data?.message || 'Không thể tải danh sách Anime thịnh hành');
                }
            } catch (err) {
                handleApiError(err, 'tải phim Anime thịnh hành');
                setTrendingAnime([]);
            } finally {
                setLoading(false);
            }
        };
    
        fetchTrendingAnime(); // Truyền trang hiện tại từ URL hoặc state
    }, [handleApiError]); // Dependency handleApiError

    // --- Đặt tiêu đề trang ---
    useEffect(() => {
        document.title = "Anime Thịnh Hành | WWAN Film";
    }, []);

    return (
        <section className="category-page container mt-4">
            {/* Breadcrumb */}
            <nav aria-label="breadcrumb" className="mb-3">
                <ol className="breadcrumb">
                    <li className="breadcrumb-item"><Link to="/">Trang chủ</Link></li>
                    <li className="breadcrumb-item"><Link to="/anime">Anime</Link></li>
                    <li className="breadcrumb-item active" aria-current="page">Thịnh hành</li>
                </ol>
            </nav>

            <h2 className="category-page__title mb-4">Anime Thịnh Hành</h2>

            {/* Hiển thị lỗi nếu có */}
            {error && !loading && (
                <div className="alert alert-danger" role="alert">
                    {error}
                </div>
            )}

            {/* Hiển thị loading */}
            {loading && (
                <div className="loading-indicator text-center py-5">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                    <p className="mt-2">Đang tải danh sách phim...</p>
                </div>
            )}

            {/* Hiển thị danh sách phim */}
            {!loading && !error && (
                <>
                    {trendingAnime.length > 0 ? (
                        <div className="card-section category__list">
                            <ul className="section-list section-list__multi section-list__column">
                                {trendingAnime.map((movie) => (
                                    <li key={movie.id} className="section-list__item">
                                        <SingleFilm movie={movie} />
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ) : (
                        <div className="text-center py-5 text-muted">
                            Hiện không có bộ phim Anime thịnh hành nào.
                        </div>
                    )}
                    {/* Nếu API /api/prevailing có phân trang, bạn có thể thêm component Pagination ở đây */}
                </>
            )}
        </section>
    );
};

export default TrendingAnimePage;