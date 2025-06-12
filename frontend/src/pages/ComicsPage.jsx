// src/pages/ComicsPage.jsx
import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useSearchParams } from 'react-router-dom';
import NProgress from 'nprogress';

import SingleComic from '@components/Comics/SingleComic';
import Pagination from '@components/Common/Pagination';
import ComicFilter from '@components/Comics/ComicFilter';
import { handleApiError } from '@utils/handleApiError';

import '@assets/scss/card-section.scss';
import '@assets/scss/components/_single-comic.scss';
import '@assets/scss/pages/_comics-page.scss';
import HeaderBanner from '../components/HeaderBanner';

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
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState(null);
    const [searchParams, setSearchParams] = useSearchParams();

    const currentPage = parseInt(searchParams.get('page') || '1', 10);

    const activeFilters = useMemo(() => {
        const params = {};
        for (const [key, value] of searchParams.entries()) {
            if (key !== 'page' && value) {
                params[key] = value;
            }
        }
        if (!params.sort) {
            params.sort = 'lastChapterUpdatedAt_desc';
        }
        return params;
    }, [searchParams]);

    const fetchComicsData = async (page, currentAPIFilters, append = false) => {
        if (append) setLoadingMore(true); else setLoading(true);
        setError(null); NProgress.start();
        try {
            const apiParams = {
                page: page,
                limit: ITEMS_PER_PAGE_COMICS,
                sortBy: currentAPIFilters.sort ? currentAPIFilters.sort.split('_')[0] : 'lastChapterUpdatedAt',
                sortOrder: currentAPIFilters.sort ? currentAPIFilters.sort.split('_')[1]?.toUpperCase() : 'DESC',
                status: currentAPIFilters.status === 'all' ? undefined : currentAPIFilters.status,
                genre: currentAPIFilters.genre,
                country: currentAPIFilters.country,
                category: currentAPIFilters.category,
                year: currentAPIFilters.year,
                q: currentAPIFilters.q,
            };
            Object.keys(apiParams).forEach(key => (apiParams[key] === undefined || apiParams[key] === '' || apiParams[key] === null || apiParams[key] === 'all') && delete apiParams[key]);

            const response = await axios.get('/api/comics', { params: apiParams });

            if (response.data?.success) {
                setComics(prev => append ? [...prev, ...(response.data.comics || [])] : (response.data.comics || []));
                setPagination(response.data.pagination || { totalItems: 0, totalPages: 1, currentPage: page, itemsPerPage: ITEMS_PER_PAGE_COMICS });
            } else {
                throw new Error(response.data?.message || 'Failed to fetch comics data');
            }
        } catch (err) {
            handleApiError(err, 'tải danh sách truyện');
            setComics([]);
            setPagination(prev => ({ ...prev, totalItems: 0, totalPages: 1, currentPage: 1 }));
        } finally {
            if (append) setLoadingMore(false); else setLoading(false);
            NProgress.done();
        }
    };

    useEffect(() => {
        setComics([]);
        setPagination({
            totalItems: 0,
            totalPages: 1,
            currentPage: 1,
            itemsPerPage: ITEMS_PER_PAGE_COMICS,
        });
        fetchComicsData(1, activeFilters, false);
    }, [activeFilters]);

    useEffect(() => {
        const handleScroll = () => {
            if (
                window.innerHeight + window.scrollY >= document.body.offsetHeight - 200 &&
                !loadingMore &&
                !loading &&
                pagination.currentPage < pagination.totalPages
            ) {
                fetchComicsData(pagination.currentPage + 1, activeFilters, true);
                setPagination(prev => ({ ...prev, currentPage: prev.currentPage + 1 }));
            }
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [loadingMore, loading, pagination, activeFilters]);

    useEffect(() => {
        const qParam = searchParams.get('q');
        let title = "Truyện Tranh";
        if (qParam) title += ` - Tìm: "${qParam}"`;
        document.title = `${title} - Trang ${pagination.currentPage} | WWAN Film`;
    }, [pagination.currentPage, searchParams]);

    return (
        <section className="comics-page">
            <HeaderBanner />
            <div className="comics-page__row">
                <div className="comics-page__sidebar-col">
                    <div className="filter-sidebar sticky-filter">
                        <ComicFilter />
                    </div>
                </div>
                <div className="comics-page__main-content-col">
                    <div className="comics-page__section-header">
                        <h2 className="comics-page__section-title">
                            <i className="fas fa-book-reader icon-before"></i>Truyện Tranh
                            {activeFilters.q && <span className="comics-page__search-query-display">: "{activeFilters.q}"</span>}
                        </h2>
                        {!loading && pagination.totalItems > 0 && (
                            <span className="comics-page__search-results-count">
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
                                <div className="comics-page__card-grid comics-page__comic-grid">
                                    {comics.map((comic) => (
                                        <SingleComic key={comic.id} comic={comic} />
                                    ))}
                                </div>
                            ) : (
                                <div className="comics-page__no-results-found">
                                    <i className="fas fa-info-circle"></i> Khoông tìm thấy kết quả.
                                </div>
                            )}
                            {loadingMore && (
                                <div className="loading-indicator more-loader">
                                    <div className="spinner-eff"></div>
                                </div>
                            )}
                            {/* Pagination component đã bị loại bỏ */}
                        </>
                    )}
                </div>
            </div>
        </section>
    );
};

export default ComicsPage;