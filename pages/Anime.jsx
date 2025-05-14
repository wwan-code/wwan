import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useSearchParams } from 'react-router-dom';
import { toast, Bounce } from 'react-toastify';
import SingleFilm from "../components/SingleFilm";
import Pagination from '../components/Pagination';
const Anime = () => {
    const [animeList, setAnimeList] = useState([]);
    const [pagination, setPagination] = useState({
        totalItems: 0,
        totalPages: 1,
        currentPage: 1,
        itemsPerPage: 30,
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [searchParams, setSearchParams] = useSearchParams(); // Hook để đọc/ghi query params

    // Lấy page từ URL hoặc mặc định là 1
    const currentPage = parseInt(searchParams.get('page') || '1', 10);

    // --- Hàm xử lý lỗi API chung ---
    const handleApiError = useCallback((err, operation = "tải dữ liệu") => {
        console.error(`Error ${operation}:`, err);
        let message = `Không thể ${operation}. Vui lòng thử lại.`;
        if (err.response?.data?.message) {
            message = err.response.data.message;
        } else if (err.message) {
            message = err.message;
        }
        setError(message); // Set state lỗi để hiển thị
        toast.error(message, {
            theme: document.documentElement.getAttribute("data-ww-theme") || "light",
            transition: Bounce,
        });
    }, []);

    // --- Fetch dữ liệu Anime theo trang ---
    useEffect(() => {
        const fetchAnime = async (page) => {
            setLoading(true);
            setError(null); // Reset lỗi trước khi fetch
            try {
                // Gọi API với tham số page và limit (itemsPerPage)
                const response = await axios.get('/api/anime', {
                    params: {
                        page: page,
                        limit: pagination.itemsPerPage
                    }
                });

                if (response.data?.success) {
                    setAnimeList(response.data.movies || []);
                    setPagination(prev => ({ // Cập nhật thông tin phân trang từ API
                        ...prev,
                        ...(response.data.pagination || {}), // Merge với pagination trả về
                        currentPage: page // Đảm bảo currentPage đồng bộ
                    }));
                } else {
                    throw new Error(response.data?.message || 'Failed to fetch anime data');
                }
            } catch (err) {
                handleApiError(err, 'tải phim Anime');
                setAnimeList([]); // Reset danh sách nếu lỗi
                setPagination(prev => ({ ...prev, totalItems: 0, totalPages: 1, currentPage: 1 })); // Reset pagination
            } finally {
                setLoading(false);
            }
        };

        fetchAnime(currentPage);
        // Cuộn lên đầu trang khi chuyển trang
        window.scrollTo({ top: 0, behavior: 'smooth' });

    }, [currentPage, pagination.itemsPerPage, handleApiError]); // Fetch lại khi trang hoặc số mục/trang thay đổi

    // --- Xử lý chuyển trang ---
    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= pagination.totalPages && newPage !== pagination.currentPage) {
            // Cập nhật query param 'page' trên URL, useEffect sẽ tự động fetch lại
            setSearchParams({ page: newPage.toString() });
        }
    };

    // --- Đặt tiêu đề trang ---
    useEffect(() => {
        document.title = `Phim Anime - Trang ${pagination.currentPage} | WWAN Film`;
    }, [pagination.currentPage]);

    if (loading) {
        return (
            <div className="loader-overlay">
                <div id="container-loader">
                    <div className="loader-box" id="loader1"></div>
                    <div className="loader-box" id="loader2"></div>
                    <div className="loader-box" id="loader3"></div>
                    <div className="loader-box" id="loader4"></div>
                    <div className="loader-box" id="loader5"></div>
                </div>
            </div>
        );
    }
    return (
        <section className='container mt-4'>
            <h2 className="category-page__title mb-4">Phim Anime</h2>

            {/* Hiển thị lỗi nếu có */}
            {error && (
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
                </div>
            )}
            {/* Hiển thị danh sách phim */}
            {!loading && !error && (
                <>
                    {animeList.length > 0 ? (
                        <div className="card-section category__list">
                            <ul className="section-list section-list__multi section-list__column">
                                {animeList.map((movie) => (
                                    <li key={movie.id} className="section-list__item">
                                        {/* Sử dụng component SingleFilm đã có */}
                                        <SingleFilm movie={movie} />
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ) : (
                        <div className="text-center py-5 text-muted">
                            Không tìm thấy bộ phim Anime nào phù hợp.
                        </div>
                    )}

                    {/* Component Phân trang */}
                    {pagination.totalPages > 1 && (
                         <Pagination
                            currentPage={pagination.currentPage}
                            totalPages={pagination.totalPages}
                            onPageChange={handlePageChange}
                        />
                    )}
                </>
            )}
        </section>
    );
};

export default Anime;
