// src/pages/CollectionsPage.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import NProgress from 'nprogress';
import classNames from '@utils/classNames'; // Sử dụng alias

import Pagination from '@components/Common/Pagination';
import UserAvatarDisplay from '@components/Common/UserAvatarDisplay';

// SCSS cho trang này
import '@assets/scss/pages/_collections-page.scss'; // Sử dụng alias

const ITEMS_PER_PAGE_COLLECTIONS = 12; // Số bộ sưu tập mỗi trang

// Component con để render mỗi card collection
const PublicCollectionCard = ({ collection }) => {
    if (!collection) return null;

    const coverImage = collection.coverImageUrl
        ? (collection.coverImageUrl.startsWith('http') ? collection.coverImageUrl : `/${collection.coverImageUrl}`)
        : null; // Hoặc một ảnh placeholder chung cho collection

    const typeLabel = collection.type === 'movie' ? 'Phim' : collection.type === 'comic' ? 'Truyện' : 'Tổng hợp';
    const previewItems = collection.type === 'movie' ? collection.movies : collection.comics;

    return (
        <div className="collection-card-public">
            <Link to={`/collections/${collection.slug}`} className="collection-card-public__link">
                <div
                    className="collection-card-public__cover"
                    style={coverImage ? { backgroundImage: `url(${coverImage})` } : {}}
                >
                    {!coverImage && (
                        <div className="collection-card-public__cover-placeholder">
                            <i className="fas fa-photo-video fa-2x"></i>
                        </div>
                    )}
                    {/* Hiển thị preview 3 item đầu tiên */}
                    {previewItems && previewItems.length > 0 && (
                        <div className="collection-card-public__preview-items">
                            {previewItems.slice(0, 3).map(item => (
                                <img
                                    key={item.id}
                                    src={item.posterURL || item.coverImage ? (
                                        (item.posterURL || item.coverImage).startsWith('http') ? (item.posterURL || item.coverImage) : `${process.env.REACT_APP_API_URL_IMAGE}/${(item.posterURL || item.coverImage)}`
                                    ) : '/placeholder-item.png'}
                                    alt={item.title}
                                    className="preview-item-img"
                                />
                            ))}
                        </div>
                    )}
                </div>
                <div className="collection-card-public__content">
                    <h4 className="collection-card-public__title" title={collection.name}>
                        {collection.name}
                    </h4>
                    <div className="collection-card-public__meta">
                        <span className={`collection-card-public__type-badge type-${collection.type}`}>
                            {typeLabel}
                        </span>
                        <span className="collection-card-public__item-count">
                            <i className="fas fa-list-ul icon-before-small"></i>{collection.itemCount || 0} mục
                        </span>
                    </div>
                    {collection.user && (
                        <div className="collection-card-public__creator">
                            <UserAvatarDisplay userToDisplay={collection.user} size="24" />
                            <span className="creator-name ms-2">{collection.user.name}</span>
                        </div>
                    )}
                </div>
            </Link>
        </div>
    );
};


const CollectionsPage = () => {
    const [collections, setCollections] = useState([]);
    const [pagination, setPagination] = useState({
        totalItems: 0, totalPages: 1, currentPage: 1, itemsPerPage: ITEMS_PER_PAGE_COLLECTIONS,
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchParams, setSearchParams] = useSearchParams();

    const currentPage = parseInt(searchParams.get('page') || '1', 10);
    const currentSearchTerm = searchParams.get('q') || '';
    const currentTypeFilter = searchParams.get('type') || '';
    const currentSortBy = searchParams.get('sort') || 'updatedAt_desc';

    const handleApiError = useCallback((err, operation = "tải dữ liệu") => {
        console.error(`Lỗi ${operation}:`, err);
        const message = err.response?.data?.message || err.message || `Không thể ${operation}.`;
        setError(message);
        toast.error(message);
    }, []);

    useEffect(() => {
        const fetchPublicCollections = async (page, q, type, sort) => {
            setLoading(true); setError(null); NProgress.start();
            try {
                const sortParams = sort.split('_');
                const params = {
                    page,
                    limit: ITEMS_PER_PAGE_COLLECTIONS,
                    q: q || undefined,
                    type: type || undefined,
                    sortBy: sortParams[0] || 'updatedAt',
                    sortOrder: sortParams[1]?.toUpperCase() || 'DESC',
                };
                Object.keys(params).forEach(key => params[key] === undefined && delete params[key]);

                const response = await axios.get('/api/collections', { params });
                if (response.data?.success) {
                    setCollections(response.data.collections || []);
                    setPagination(response.data.pagination || { totalItems: 0, totalPages: 1, currentPage: page, itemsPerPage: ITEMS_PER_PAGE_COLLECTIONS });
                } else {
                    throw new Error(response.data?.message || "Không thể tải danh sách bộ sưu tập.");
                }
            } catch (err) {
                handleApiError(err, "tải bộ sưu tập công khai");
                setCollections([]);
                setPagination(prev => ({ ...prev, totalItems: 0, totalPages: 1, currentPage: 1 }));
            } finally {
                setLoading(false); NProgress.done();
            }
        };
        fetchPublicCollections(currentPage, currentSearchTerm, currentTypeFilter, currentSortBy);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [currentPage, currentSearchTerm, currentTypeFilter, currentSortBy, handleApiError]);


    const handlePageChange = (newPage) => {
        setSearchParams(prev => {
            const newSearch = new URLSearchParams(prev);
            newSearch.set('page', newPage.toString());
            return newSearch;
        });
    };

    const handleSearch = (e) => {
        const term = e.target.value;
        setSearchParams(prev => {
            const newSearch = new URLSearchParams(prev);
            if (term) newSearch.set('q', term); else newSearch.delete('q');
            newSearch.set('page', '1'); // Reset về trang 1 khi tìm kiếm
            return newSearch;
        });
    };
    const debouncedSearch = useCallback(debounce(handleSearch, 500), []);


    const handleTypeFilterChange = (e) => {
        const type = e.target.value;
        setSearchParams(prev => {
            const newSearch = new URLSearchParams(prev);
            if (type) newSearch.set('type', type); else newSearch.delete('type');
            newSearch.set('page', '1');
            return newSearch;
        });
    };

    const handleSortChange = (e) => {
        const sort = e.target.value;
        setSearchParams(prev => {
            const newSearch = new URLSearchParams(prev);
            newSearch.set('sort', sort);
            newSearch.set('page', '1');
            return newSearch;
        });
    };

    useEffect(() => {
        document.title = "Khám Phá Bộ Sưu Tập | WWAN Film";
    }, []);

    return (
        <div className="container collections-page-container py-lg-5 py-4">
            <div className="collections-page-header">
                <h1 className="collections-page-title">
                    <i className="fas fa-layer-group icon-before"></i> Khám Phá Bộ Sưu Tập
                </h1>
                <p className="collections-page-subtitle">
                    Những danh sách phim và truyện tranh thú vị được cộng đồng chia sẻ.
                </p>
            </div>

            <div className="collections-filters-bar">
                <input
                    type="search"
                    className="form-control filter-search-input"
                    placeholder="Tìm kiếm tên bộ sưu tập..."
                    defaultValue={currentSearchTerm} // Dùng defaultValue để debounce hoạt động tốt
                    onChange={debouncedSearch}
                />
                <div className="filter-selects">
                    <select className="form-select filter-select" value={currentTypeFilter} onChange={handleTypeFilterChange}>
                        <option value="">Tất cả loại</option>
                        <option value="movie">Chỉ Phim</option>
                        <option value="comic">Chỉ Truyện</option>
                    </select>
                    <select className="form-select filter-select" value={currentSortBy} onChange={handleSortChange}>
                        <option value="updatedAt_desc">Mới cập nhật</option>
                        <option value="createdAt_desc">Mới tạo</option>
                        <option value="name_asc">Tên A-Z</option>
                        <option value="likesCount_desc">Nhiều lượt thích</option>
                        <option value="itemCount_desc">Nhiều mục nhất</option>
                    </select>
                </div>
            </div>

            {loading && collections.length === 0 && (
                 <div className="page-loader"><div className="spinner-eff"></div><p>Đang tải...</p></div>
            )}
            {error && !loading && (
                <div className="alert-message alert-danger text-center">{error}</div>
            )}
            {!loading && !error && collections.length === 0 && (
                <div className="alert-message alert-info text-center empty-collections">
                    <i className="fas fa-folder-open empty-icon"></i>
                    <p className="empty-text">Không tìm thấy bộ sưu tập nào phù hợp.</p>
                </div>
            )}

            {collections.length > 0 && (
                <div className="collections-grid mt-4">
                    {collections.map(collection => (
                        <PublicCollectionCard key={collection.id} collection={collection} />
                    ))}
                </div>
            )}

            {!loading && pagination && pagination.totalPages > 1 && (
                <Pagination
                    currentPage={pagination.currentPage}
                    totalPages={pagination.totalPages}
                    onPageChange={handlePageChange}
                />
            )}
        </div>
    );
};

// Helper debounce (nếu bạn chưa có)
function debounce(func, delay) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, delay);
    };
}


export default CollectionsPage;