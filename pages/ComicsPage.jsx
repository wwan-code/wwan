// src/pages/ComicsPage.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { useSearchParams, Link, useLocation } from 'react-router-dom';
import { toast, Bounce } from 'react-toastify';
import NProgress from 'nprogress';

import SingleComic from '../components/Comics/SingleComic';
import Pagination from '../components/Pagination';
import ComicFilter from '../components/Comics/ComicFilter'; // <--- IMPORT BỘ LỌC MỚI

// SCSS
import '../assets/scss/card-section.scss';
import '../assets/scss/components/_single-comic.scss';
import '../assets/scss/pages/_comics-page.scss'; // SCSS riêng cho trang này (bao gồm cả filter)


const ITEMS_PER_PAGE_COMICS = 20;

const ComicsPage = () => {
    const [comics, setComics] = useState([]);
    const [pagination, setPagination] = useState({
        totalItems: 0,
        totalPages: 1,
        currentPage: 1,
        itemsPerPage: ITEMS_PER_PAGE_COMICS,
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchParams, setSearchParams] = useSearchParams();

    const currentPage = parseInt(searchParams.get('page') || '1', 10);

    // Lấy tất cả các filter từ URL params để truyền cho API
    const activeFilters = useMemo(() => {
        const params = {};
        for (const [key, value] of searchParams.entries()) {
            if (key !== 'page' && value) { // Bỏ qua page và các giá trị rỗng
                params[key] = value;
            }
        }
        // Đảm bảo có sort mặc định nếu không có trên URL
        if (!params.sort) {
            params.sort = 'lastChapterUpdatedAt_desc';
        }
        return params;
    }, [searchParams]);


    const handleApiError = useCallback((error, operation = "thực hiện") => {
        console.error(`Failed to ${operation}:`, error);
        let message = `Thao tác ${operation} thất bại. Vui lòng thử lại.`;
        if (error.response?.data?.message) {
            message = error.response.data.message;
        } else if (error.message) {
            message = error.message;
        }
        toast.error(message, {
            position: "top-right",
            autoClose: 4000,
            theme: document.documentElement.getAttribute("data-ww-theme") || "light",
            transition: Bounce,
        });
    }, []);

    useEffect(() => {
        const fetchComicsData = async (page, currentAPIFilters) => {
            setLoading(true); setError(null); NProgress.start();
            try {
                const apiParams = {
                    page: page,
                    limit: ITEMS_PER_PAGE_COMICS,
                    sortBy: currentAPIFilters.sort ? currentAPIFilters.sort.split('_')[0] : 'lastChapterUpdatedAt',
                    sortOrder: currentAPIFilters.sort ? currentAPIFilters.sort.split('_')[1]?.toUpperCase() : 'DESC',
                    status: currentAPIFilters.status === 'all' ? undefined : currentAPIFilters.status, // Bỏ 'all'
                    genre: currentAPIFilters.genre, // API sẽ nhận slug hoặc ID
                    country: currentAPIFilters.country,
                    category: currentAPIFilters.category,
                    year: currentAPIFilters.year,
                    q: currentAPIFilters.q,
                };
                Object.keys(apiParams).forEach(key => (apiParams[key] === undefined || apiParams[key] === '' || apiParams[key] === null || apiParams[key] === 'all') && delete apiParams[key]);

                const response = await axios.get('/api/comics', { params: apiParams });

                if (response.data?.success) {
                    setComics(response.data.comics || []);
                    setPagination(response.data.pagination || { totalItems: 0, totalPages: 1, currentPage: page, itemsPerPage: ITEMS_PER_PAGE_COMICS });
                } else {
                    throw new Error(response.data?.message || 'Failed to fetch comics data');
                }
            } catch (err) {
                handleApiError(err, 'tải danh sách truyện');
                setComics([]);
                setPagination(prev => ({ ...prev, totalItems: 0, totalPages: 1, currentPage: 1 }));
            } finally {
                setLoading(false); NProgress.done();
            }
        };

        fetchComicsData(currentPage, activeFilters);

    }, [currentPage, activeFilters, handleApiError]);

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= pagination.totalPages && newPage !== currentPage) {
            setSearchParams(prev => {
                const newSearch = new URLSearchParams(prev);
                newSearch.set('page', newPage.toString());
                return newSearch;
            });
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    useEffect(() => {
        const qParam = searchParams.get('q');
        const genreParam = searchParams.get('genre');
        let title = "Truyện Tranh";
        if (qParam) title += ` - Tìm: "${qParam}"`;
        // Thêm các filter khác vào title nếu muốn
        document.title = `${title} - Trang ${pagination.currentPage} | WWAN Film`;
    }, [pagination.currentPage, searchParams]);

    return (
        <section className="container content-section genre-movies-page comic-list-page">
            <div className="row-custom">
                <div className="sidebar-col col-custom-3 order-md-first">
                    <div className="filter-sidebar sticky-filter">
                        <ComicFilter />
                    </div>
                </div>
                <div className="main-content-col col-custom-9 order-md-last">
                    <div className="section-header">
                        <h2 className="section-title">
                            <i className="fas fa-book-reader icon-before"></i>Truyện Tranh
                            {activeFilters.q && <span className="search-query-display">: "{activeFilters.q}"</span>}
                        </h2>
                        {!loading && pagination.totalItems > 0 && (
                            <span className="search-results-count">
                                ({pagination.totalItems} kết quả)
                            </span>
                        )}
                    </div>

                    {loading && comics.length === 0 && (
                        <div className="loading-indicator full-page-loader">
                            <div className="spinner-eff"></div>
                        </div>
                    )}
                    {error && !loading && (
                        <div className="error-message">
                            <i className="fas fa-exclamation-triangle"></i> {error}
                        </div>
                    )}

                    {!loading && !error && (
                        <>
                            {comics.length > 0 ? (
                                <div className="card-grid comic-grid">
                                    {comics.map((comic) => (
                                        <SingleComic key={comic.id} comic={comic} />
                                    ))}
                                </div>
                            ) : (
                                <div className="no-results-found">
                                    <i className="fas fa-info-circle"></i> Khoông tìm thấy kết quả.
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
                </div>
            </div>
        </section>
    );
};

// Không cần CategoryProvider nếu ComicFilter tự fetch options của nó
export default ComicsPage;