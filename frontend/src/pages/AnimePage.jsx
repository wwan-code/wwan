import { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useSearchParams } from 'react-router-dom';
import SingleFilm from "@components/SingleFilm";
import Pagination from '@components/Common/Pagination';
import { handleApiError } from '@utils/handleApiError';

const AnimePage = () => {
    const [animeList, setAnimeList] = useState([]);
    const [pagination, setPagination] = useState({
        totalItems: 0,
        totalPages: 1,
        currentPage: 1,
        itemsPerPage: 30,
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [searchParams, setSearchParams] = useSearchParams();

    const currentPage = parseInt(searchParams.get('page') || '1', 10);

    useEffect(() => {
        const fetchAnime = async (page) => {
            setLoading(true);
            setError(null);
            try {
                const response = await axios.get('/api/anime', {
                    params: {
                        page: page,
                        limit: pagination.itemsPerPage
                    }
                });

                if (response.data?.success) {
                    setAnimeList(response.data.movies || []);
                    setPagination(prev => ({
                        ...prev,
                        ...(response.data.pagination || {}),
                        currentPage: page
                    }));
                } else {
                    throw new Error(response.data?.message || 'Failed to fetch anime data');
                }
            } catch (err) {
                handleApiError(err, 'tải phim Anime');
                setError('Failed to fetch anime data: ' + err.message);
                setAnimeList([]);
                setPagination(prev => ({ ...prev, totalItems: 0, totalPages: 1, currentPage: 1 }));
            } finally {
                setLoading(false);
            }
        };

        fetchAnime(currentPage);
        window.scrollTo({ top: 0, behavior: 'smooth' });

    }, [currentPage, pagination.itemsPerPage, handleApiError]);

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= pagination.totalPages && newPage !== pagination.currentPage) {
            setSearchParams({ page: newPage.toString() });
        }
    };

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
        <section className="container page-section">
            <nav aria-label="breadcrumb" className="mb-3">
                <ol className="breadcrumb">
                    <li className="breadcrumb-item"><Link to="/">Trang chủ</Link></li>
                    <li className="breadcrumb-item active" aria-current="page">Anime</li>
                </ol>
            </nav>
            <div className="page-section__title">
                <h3 className="page-section__title-text">
                    <i className="fas fa-film"></i> Phim Anime
                </h3>
            </div>
            {error && (
                <div className="alert alert-danger" role="alert">
                    {error}
                </div>
            )}

            {!loading && !error && (
                <>
                    {animeList.length > 0 ? (
                        <div className="card-section category__list">
                            <ul className="section-list section-list__multi section-list__column">
                                {animeList.map((movie) => (
                                    <li key={movie.id} className="section-list__item">
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

export default AnimePage;
