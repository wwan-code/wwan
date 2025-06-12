import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { Link, useParams, useSearchParams } from 'react-router-dom';

import SingleFilm from '@components/SingleFilm';
import Pagination from '@components/Common/Pagination';
import { handleApiError } from '@utils/handleApiError';

const ITEMS_PER_PAGE = 24;

const GenreMoviesPage = () => {
    const { slug } = useParams();
    const [searchParams, setSearchParams] = useSearchParams();

    const [genreTitle, setGenreTitle] = useState('');
    const [movieList, setMovieList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const currentPage = parseInt(searchParams.get('page') || '1', 10);
    const totalPages = useMemo(() => Math.ceil(movieList.length / ITEMS_PER_PAGE), [movieList]);

    useEffect(() => {
        const fetchGenreData = async () => {
            setLoading(true);
            setError(null);
            setMovieList([]);
            setGenreTitle('');
            try {
                const response = await axios.get(`/api/genre/${slug}`);

                if (response.data.success) {
                    setGenreTitle(response.data.genre.title || slug);
                    const movies = response.data.genre.Movies || response.data.genre.movies || [];
                    setMovieList(Array.isArray(movies) ? movies : []);
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
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [slug, handleApiError, setSearchParams, currentPage]);

    const displayedMovies = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return movieList.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [movieList, currentPage]);

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= totalPages && newPage !== currentPage) {
            setSearchParams({ page: newPage.toString() });
        }
    };

    useEffect(() => {
        if (genreTitle) {
            document.title = `Thể loại ${genreTitle} - Trang ${currentPage} | WWAN Film`;
        } else if (!loading) {
            document.title = 'Thể loại không xác định | WWAN Film';
        }
    }, [genreTitle, currentPage, loading]);
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
        <section className="container page-section">
            <nav aria-label="breadcrumb" className="mb-3">
                <ol className="breadcrumb">
                    <li className="breadcrumb-item"><Link to="/">Trang chủ</Link></li>
                    <li className="breadcrumb-item"><Link to="/the-loai">Thể loại</Link></li>
                    <li className="breadcrumb-item active" aria-current="page">{loading ? 'Đang tải...' : genreTitle || 'Không xác định'}</li>
                </ol>
            </nav>
            <div className="page-section__title">
                <h3 className="page-section__title-text">
                    <i className="fas fa-film"></i> Thể loại: {loading ? 'Đang tải...' : genreTitle || 'Không xác định'}
                </h3>
            </div>
            {error && !loading && (
                <div className="alert alert-danger" role="alert">
                    {error}
                </div>
            )}

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