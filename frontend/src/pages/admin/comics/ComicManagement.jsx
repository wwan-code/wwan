// src/pages/admin/comics/ComicManagement.jsx
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Link, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import authHeader from '@services/auth-header';
import ComicCard from '@components/Admin/Comic/ComicCard';
import Pagination from '@components/Common/Pagination';
import useDropdown from '@hooks/useDropdown';

import '@assets/scss/admin/ContentList.scss';

const ITEMS_PER_PAGE_ADMIN_COMIC = 12;

const ComicManagement = () => {
    const [comics, setComics] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const { openDropdown, toggleDropdown, dropdownRefCallback } = useDropdown();

    const [searchParams, setSearchParams] = useSearchParams();
    const currentPage = parseInt(searchParams.get('page') || '1', 10);
    const currentSearchTerm = searchParams.get('q') || '';

    const [paginationData, setPaginationData] = useState({
        totalItems: 0,
        totalPages: 1,
        itemsPerPage: ITEMS_PER_PAGE_ADMIN_COMIC,
    });

    const fetchAllComics = useCallback(async (page, term) => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await axios.get('/api/admin/comics', {
                headers: authHeader(),
                params: {
                    page,
                    limit: ITEMS_PER_PAGE_ADMIN_COMIC,
                    q: term,
                    sortBy: 'lastChapterUpdatedAt',
                    sortOrder: 'DESC'
                }
            });
            if (response.data?.success) {
                setComics(response.data.comics || []);
                setPaginationData(response.data.pagination || { totalItems: 0, totalPages: 1, itemsPerPage: ITEMS_PER_PAGE_ADMIN_COMIC, currentPage: page });
            } else {
                throw new Error(response.data?.message || "Không thể tải danh sách truyện.");
            }
        } catch (err) {
            console.error("Lỗi tải truyện:", err);
            setError(err.response?.data?.message || err.message || "Lỗi không xác định.");
            setComics([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAllComics(currentPage, currentSearchTerm);
    }, [currentPage, currentSearchTerm, fetchAllComics]);

    const handleSearchChange = (e) => {
        const newSearchTerm = e.target.value;
        setSearchParams({ q: newSearchTerm, page: '1' });
    };

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= paginationData.totalPages && newPage !== currentPage) {
            setSearchParams({ q: currentSearchTerm, page: newPage.toString() });
        }
    };

    const handleDeleteComic = async (comicId) => {
        if (!window.confirm(`Xóa truyện ID ${comicId} và tất cả chương, trang liên quan?`)) return;
        try {
            await axios.delete(`/api/admin/comics/${comicId}`, { headers: authHeader() });
            toast.success("Đã xóa truyện thành công.");
            if (comics.length === 1 && currentPage > 1) {
                handlePageChange(currentPage - 1);
            } else {
                fetchAllComics(currentPage, currentSearchTerm);
            }
        } catch (error) {
            console.error("Lỗi xóa truyện:", error);
            toast.error(error.response?.data?.message || "Lỗi khi xóa truyện.");
        }
    };

    return (
        <div className="container-fluid flex-grow-1 container-p-y admin-content-list-page">
            <div className="page-header">
                <h4 className="page-title">Quản lý Truyện Ảnh</h4>
                <Link to="/admin/comics/add" className="btn btn-outline-primary">
                    <i className="fas fa-plus me-2"></i> Thêm Truyện Mới
                </Link>
            </div>

            <div className="controls-bar">
                <input
                    type="text"
                    placeholder="Tìm kiếm truyện theo tên, tác giả..."
                    value={currentSearchTerm}
                    onChange={handleSearchChange}
                    className="form-control search-input"
                />
            </div>

            {isLoading && comics.length === 0 && (
                <div className="loading-spinner-container"><div className="spinner"></div><p>Đang tải truyện...</p></div>
            )}
            {error && !isLoading && (
                <div className="error-alert text-center">
                    <p>{error}</p>
                    <button className="btn btn-primary" onClick={() => fetchAllComics(1, '')}>Thử lại</button>
                </div>
            )}

            {!isLoading && !error && comics.length === 0 && (
                <div className="alert-info-custom mt-3 text-center">Không có truyện nào. <Link to="/admin/comics/add">Thêm truyện mới?</Link></div>
            )}

            {!error && (
                <>
                    <div className="row-custom card-grid-container">
                        {comics.map(comic => (
                            <ComicCard
                                key={comic.id}
                                comic={comic}
                                onDeleteComic={handleDeleteComic}
                                dropdownProps={{
                                    openDropdownId: openDropdown,
                                    toggleDropdown,
                                    dropdownRefCallback
                                }}
                            />
                        ))}
                    </div>

                    {isLoading && comics.length > 0 && <div className="text-center py-3"><span className="spinner"></span></div>}

                    {!isLoading && comics.length > 0 && paginationData.totalPages > 1 && (
                        <Pagination
                            currentPage={currentPage}
                            totalPages={paginationData.totalPages}
                            onPageChange={handlePageChange}
                        />
                    )}
                </>
            )}
        </div>
    );
};

export default ComicManagement;