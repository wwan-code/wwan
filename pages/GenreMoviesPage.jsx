import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { useParams, useSearchParams } from 'react-router-dom'; // Thêm useSearchParams
import { toast, Bounce } from 'react-toastify';

// Import Components
import SingleFilm from '../components/SingleFilm'; // Component hiển thị card phim
import Pagination from '../components/Pagination'; // Component phân trang đã tạo

const ITEMS_PER_PAGE = 24; // Số phim hiển thị trên mỗi trang

const GenreMoviesPage = () => {
    const { slug } = useParams(); // Lấy slug thể loại từ URL
    const [searchParams, setSearchParams] = useSearchParams(); // Quản lý page qua URL

    // State cho dữ liệu và UI
    const [genreTitle, setGenreTitle] = useState(''); // Lưu tên thể loại
    const [movieList, setMovieList] = useState([]); // Danh sách tất cả phim thuộc thể loại
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // State cho phân trang client-side
    const currentPage = parseInt(searchParams.get('page') || '1', 10); // Lấy page từ URL
    const totalPages = useMemo(() => Math.ceil(movieList.length / ITEMS_PER_PAGE), [movieList]);

    // --- Hàm xử lý lỗi API ---
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

    // --- Fetch dữ liệu thể loại và phim ---
    useEffect(() => {
        const fetchGenreData = async () => {
            setLoading(true);
            setError(null);
            setMovieList([]); // Reset danh sách phim khi fetch mới
            setGenreTitle(''); // Reset tiêu đề
            try {
                const response = await axios.get(`/api/genre/${slug}`); // Gọi API lấy genre theo slug

                if (response.data.success) { // Backend trả về genre object chứa Movies
                    setGenreTitle(response.data.genre.title || slug); // Lấy title, fallback về slug
                    // Backend trả về genre.Movies, cần kiểm tra cấu trúc
                    const movies = response.data.genre.Movies || response.data.genre.movies || [];
                    setMovieList(Array.isArray(movies) ? movies : []);
                    // Reset về trang 1 khi slug thay đổi
                     if (currentPage !== 1) {
                         setSearchParams({ page: '1' });
                     }
                } else {
                    throw new Error('Không tìm thấy thể loại hoặc dữ liệu không hợp lệ.');
                }
            } catch (err) {
                handleApiError(err, `tải phim thể loại "${slug}"`);
            } finally {
                setLoading(false);
            }
        };

        if (slug) {
            fetchGenreData();
        } else {
             setError("Không có slug thể loại được cung cấp.");
             setLoading(false);
        }
        // Cuộn lên đầu trang khi slug thay đổi
         window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [slug, handleApiError, setSearchParams, currentPage]); // Fetch lại khi slug thay đổi

    // --- Logic Phân trang Client-side ---
    const displayedMovies = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return movieList.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [movieList, currentPage]);

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= totalPages && newPage !== currentPage) {
            // Cập nhật query param 'page'
            setSearchParams({ page: newPage.toString() });
        }
    };

    // --- Cập nhật Tiêu đề Trang ---
    useEffect(() => {
        if (genreTitle) {
            document.title = `Thể loại ${genreTitle} - Trang ${currentPage} | WWAN Film`;
        } else if (!loading) {
             document.title = 'Thể loại không xác định | WWAN Film';
        }
    }, [genreTitle, currentPage, loading]);

    // --- Render ---
    return (
        <section className="category-page container mt-4">
            <h2 className="category-page__title mb-4">
                Thể loại: {loading ? 'Đang tải...' : genreTitle || 'Không xác định'}
            </h2>

            {/* Hiển thị lỗi */}
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
                </div>
            )}

            {/* Hiển thị danh sách phim */}
            {!loading && !error && (
                <>
                    {displayedMovies.length > 0 ? (
                        <div className="card-section category__list">
                            <ul className="section-list section-list__multi section-list__column">
                                {displayedMovies.map((movie) => (
                                    <li key={movie.id} className="section-list__item">
                                        <SingleFilm movie={movie} />
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ) : (
                        <div className="text-center py-5 text-muted">
                            Không tìm thấy bộ phim nào thuộc thể loại "{genreTitle}".
                        </div>
                    )}

                    {/* Phân trang */}
                    {totalPages > 1 && (
                         <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={handlePageChange}
                        />
                    )}
                </>
            )}
        </section>
    );
};

export default GenreMoviesPage;