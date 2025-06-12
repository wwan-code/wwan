// src/pages/CollectionDetailPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import NProgress from 'nprogress';
import classNames from '@utils/classNames';

import Pagination from '@components/Common/Pagination';
import UserAvatarDisplay from '@components/Common/UserAvatarDisplay';
import SingleFilm from '@components/SingleFilm';
import SingleComic from '@components/Comics/SingleComic';

import '@assets/scss/pages/_collection-detail-page.scss';
const ITEMS_PER_COLLECTION_PAGE = 20;

const CollectionDetailPage = () => {
    const { slug } = useParams();
    const [searchParams, setSearchParams] = useSearchParams();
    const currentItemPage = parseInt(searchParams.get('itemPage') || '1', 10);

    const [collection, setCollection] = useState(null);
    const [items, setItems] = useState([]);
    const [itemPagination, setItemPagination] = useState({
        totalItems: 0, totalPages: 1, currentPage: 1, itemsPerPage: ITEMS_PER_COLLECTION_PAGE,
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isLiking, setIsLiking] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const handleApiError = useCallback((err, operation = "tải dữ liệu") => {
        console.error(`Lỗi ${operation}:`, err);
        setError(err.response?.data?.message || err.message || `Không thể ${operation}.`);
        toast.error(err.response?.data?.message || err.message || `Không thể ${operation}.`);
    }, []);

    useEffect(() => {
        const fetchCollectionDetail = async (page) => {
            if (!slug) return;
            setLoading(true); setError(null); NProgress.start();
            try {
                const response = await axios.get(`/api/collections/${slug}`, {
                    params: { itemPage: page, itemLimit: ITEMS_PER_COLLECTION_PAGE }
                });
                if (response.data?.success && response.data.collection) {
                    setCollection(response.data.collection);
                    setItems(response.data.collection.items || []);
                    setItemPagination(response.data.collection.itemPagination || { totalItems: 0, totalPages: 1, currentPage: page, itemsPerPage: ITEMS_PER_COLLECTION_PAGE });
                    document.title = `${response.data.collection.name} - Bộ Sưu Tập | WWAN Film`;
                } else {
                    throw new Error(response.data?.message || "Không tìm thấy bộ sưu tập.");
                }
            } catch (err) {
                handleApiError(err, `tải bộ sưu tập "${slug}"`);
                if (err.response?.status === 404) setError("Bộ sưu tập không tồn tại hoặc không được công khai.");
            } finally {
                setLoading(false); NProgress.done();
            }
        };
        fetchCollectionDetail(currentItemPage);
    }, [slug, currentItemPage, handleApiError]);

    const handleItemPageChange = (newPage) => {
        setSearchParams({ itemPage: newPage.toString() });
        window.scrollTo({ top: document.getElementById('collection-items-grid')?.offsetTop || 0, behavior: 'smooth' });
    };


    if (loading && !collection) return <div className="page-loader"><div className="spinner-eff"></div><p>Đang tải bộ sưu tập...</p></div>;
    if (error) return <div className="container text-center py-5"><div className="alert-message alert-danger"><h4>Lỗi</h4><p>{error}</p><Link to="/collections" className="btn-custom btn--outline-primary mt-2">Xem các bộ sưu tập khác</Link></div></div>;
    if (!collection) return <div className="container text-center py-5"><div className="alert-message alert-info"><h4>Không tìm thấy</h4><p>Bộ sưu tập này không tồn tại.</p><Link to="/collections" className="btn-custom btn--outline-primary mt-2">Xem các bộ sưu tập khác</Link></div></div>;

    return (
        <div className="collection-detail-page-wrapper">
            <div
                className="collection-detail-header"
                style={{ backgroundImage: `linear-gradient(to bottom, rgba(var(--w-body-bg-rgb), 0.5) 0%, var(--w-body-bg) 100%)` }}
            >
                <div className="container collection-header-content">
                    <div className="collection-header__info">
                        <div className="collection-header__type-badge">
                            Bộ sưu tập {collection.type === 'movie' ? 'Phim' : 'Truyện'}
                        </div>
                        <h1 className="collection-header__title">{collection.name}</h1>
                        {collection.description && <p className="collection-header__description">{collection.description}</p>}
                        <div className="collection-header__meta">
                            <div className="creator-info">
                                <UserAvatarDisplay userToDisplay={collection.user} size="32" />
                                <Link to={`/profile/${collection.user.uuid}`} className="creator-name ms-2">
                                    {collection.user.name}
                                </Link>
                            </div>
                            <span className="meta-separator">·</span>
                            <span className="item-count-meta">
                                <i className="fas fa-list-ul icon-before-small"></i>
                                {itemPagination.totalItems || 0} mục
                            </span>
                            <span className="meta-separator">·</span>
                            <span className="last-updated-meta">
                                Cập nhật: {new Date(collection.updatedAt).toLocaleDateString('vi-VN')}
                            </span>
                            {collection.likesCount > 0 && <><span className="meta-separator">·</span><span className="likes-count-meta"><i className="fas fa-heart text-danger icon-before-small"></i> {collection.likesCount}</span></>}
                        </div>

                        <div className="collection-actions mt-3 btn-group">
                            <button className="btn btn-primary btn-sm me-2"><i className="fas fa-heart me-2"></i> Thích</button>
                            <button className="btn btn-secondary btn-sm"><i className="fas fa-bookmark me-2"></i> Lưu lại</button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container collection-items-container py-4" id="collection-items-grid">
                <h3 className="collection-items-title">Các mục trong bộ sưu tập</h3>
                {loading && items.length === 0 && <div className="text-center py-3"><span className="spinner--small"></span> Đang tải mục...</div>}
                {!loading && items.length === 0 && (
                    <div className="alert-message alert-info text-center">Bộ sưu tập này chưa có mục nào.</div>
                )}

                {items.length > 0 && (
                    <div className={`items-grid ${collection.type === 'movie' ? 'movie-grid' : 'comic-grid'}`}>
                        {items.map(item => (
                            collection.type === 'movie' ?
                                <SingleFilm key={`movie-${item.id}`} movie={item} /> :
                                collection.type === 'comic' ?
                                    <SingleComic key={`comic-${item.id}`} comic={item} /> :
                                    null
                        ))}
                    </div>
                )}

                {!loading && itemPagination && itemPagination.totalPages > 1 && (
                    <Pagination
                        currentPage={itemPagination.currentPage}
                        totalPages={itemPagination.totalPages}
                        onPageChange={handleItemPageChange}
                    />
                )}
            </div>
        </div>
    );
};

export default CollectionDetailPage;