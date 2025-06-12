import { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useSearchParams } from 'react-router-dom';

import SingleFilm from '@components/SingleFilm';
import Pagination from '@components/Common/Pagination';
import { handleApiError } from '@utils/handleApiError';

const TrendingAnimePage = () => {
    const [trendingAnime, setTrendingAnime] = useState([]);
    const [pagination, setPagination] = useState({
        totalItems: 0,
        totalPages: 1,
        currentPage: 1,
        itemsPerPage: 12,
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchParams, setSearchParams] = useSearchParams();
    const currentPage = parseInt(searchParams.get('page') || '1', 10);

    useEffect(() => {
        const fetchTrendingAnime = async (currentPage = 1) => {
            setLoading(true);
            setError(null);
            try {
                const response = await axios.get('/api/prevailing', {
                    params: {
                        category: 'Anime',
                        page: currentPage,
                        limit: pagination.itemsPerPage
                    }
                });
    
                if (response.data?.success) {
                    setTrendingAnime(response.data.movies || []);
                    setPagination(response.data.pagination);
                } else {
                    throw new Error(response.data?.message || 'Không thể tải danh sách Anime thịnh hành');
                }
            } catch (err) {
                setError(err.message);
                handleApiError(err, 'tải phim Anime thịnh hành');
                setTrendingAnime([]);
            } finally {
                setLoading(false);
            }
        };
    
        fetchTrendingAnime(currentPage);
    }, [handleApiError, currentPage, pagination.itemsPerPage]);

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= pagination.totalPages && newPage !== pagination.currentPage) {
            setSearchParams({ page: newPage.toString() });
        }
    };

    useEffect(() => {
        document.title = "Anime Thịnh Hành | WWAN Film";
    }, []);

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
                    <li className="breadcrumb-item"><Link to="/anime">Anime</Link></li>
                    <li className="breadcrumb-item active" aria-current="page">Thịnh hành</li>
                </ol>
            </nav>
            <div className="page-section__title">
                <h3 className="page-section__title-text">
                    <i className="fas fa-fire"></i> Anime thịnh hành
                </h3>
            </div>

            {error && !loading && (
                <div className="alert alert-danger" role="alert">
                    {error}
                </div>
            )}
            
            {!loading && !error && (
                <>
                    {trendingAnime.length > 0 ? (
                        <div className="card-section">
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

export default TrendingAnimePage;