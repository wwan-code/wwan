// pages/LeaderboardPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Link, useSearchParams } from 'react-router-dom';
import '../assets/scss/LeaderboardPage.scss';

const ITEMS_PER_PAGE = 15;

const LeaderboardPage = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
        sortBy: 'points'
    });
    const [searchParams, setSearchParams] = useSearchParams();

    const currentPage = parseInt(searchParams.get('page') || '1', 10);
    const currentSortBy = searchParams.get('sortBy') || 'points';

    const fetchLeaderboard = useCallback(async (page, sortBy) => {
        setLoading(true);
        setError(null);
        try {
            const response = await axios.get('/api/leaderboard', {
                params: { page, limit: ITEMS_PER_PAGE, sortBy }
            });
            if (response.data?.success) {
                setUsers(response.data.users || []);
                setPagination(response.data.pagination);
            } else {
                throw new Error(response.data?.message || "Không thể tải bảng xếp hạng.");
            }
        } catch (err) {
            console.error("Lỗi tải bảng xếp hạng:", err);
            setError(err.response?.data?.message || err.message || "Lỗi không xác định.");
            setUsers([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchLeaderboard(currentPage, currentSortBy);
    }, [currentPage, currentSortBy, fetchLeaderboard]);

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= pagination.totalPages) {
            setSearchParams({ page: newPage.toString(), sortBy: currentSortBy });
        }
    };

    const handleSortChange = (newSortBy) => {
        if (newSortBy !== currentSortBy) {
            setSearchParams({ page: '1', sortBy: newSortBy });
        }
    };

    const getAvatarUrl = (user) => {
        if (!user) return "https://ui-avatars.com/api/?name=?&background=random&color=fff&size=40";
        return user.avatar || `https://ui-avatars.com/api/?name=${user.name?.split(' ').map(word => word[0]).join('').toUpperCase()}&background=random&color=fff&size=40`;
    };

    const getRank = (index) => {
        return (pagination.currentPage - 1) * ITEMS_PER_PAGE + index + 1;
    };

    useEffect(() => {
        document.title = `Bảng Xếp Hạng - Trang ${currentPage} | WWAN Film`;
    }, [currentPage]);

    const top3Users = pagination.currentPage === 1 ? users.slice(0, 3) : [];
    const otherUsers = pagination.currentPage === 1 ? users.slice(3) : users;

    const renderPagination = () => {
        if (!pagination.totalPages || pagination.totalPages <= 1) return null;
        let items = [];
        const maxPagesToShow = 5;
        let startPage, endPage;

        if (pagination.totalPages <= maxPagesToShow) {
            startPage = 1;
            endPage = pagination.totalPages;
        } else {
            if (currentPage <= Math.ceil(maxPagesToShow / 2)) {
                startPage = 1;
                endPage = maxPagesToShow;
            } else if (currentPage + Math.floor(maxPagesToShow / 2) >= pagination.totalPages) {
                startPage = pagination.totalPages - maxPagesToShow + 1;
                endPage = pagination.totalPages;
            } else {
                startPage = currentPage - Math.floor(maxPagesToShow / 2);
                endPage = currentPage + Math.floor(maxPagesToShow / 2);
            }
        }

        // Nút Previous
        items.push(
            <button
                key="prev"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="pagination__button"
            >
                &laquo;
            </button>
        );

        if (startPage > 1) {
            items.push(<button key="start-ellipsis" className="pagination__button disabled">...</button>);
        }

        for (let i = startPage; i <= endPage; i++) {
            items.push(
                <button
                    key={i}
                    onClick={() => handlePageChange(i)}
                    className={`pagination__button ${currentPage === i ? 'active' : ''}`}
                >
                    {i}
                </button>
            );
        }

        if (endPage < pagination.totalPages) {
            items.push(<button key="end-ellipsis" className="pagination__button disabled">...</button>);
        }
        // Nút Next
        items.push(
            <button
                key="next"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === pagination.totalPages}
                className="pagination__button"
            >
                &raquo;
            </button>
        );
        return <nav className="pagination-nav">{items}</nav>;
    };


    return (
        <div className="container mt-4 mb-5 leaderboard-page">
            <div className="leaderboard-card">
                <div className="leaderboard-header">
                    <h1 className="leaderboard-title"><i className="fas fa-trophy leaderboard-title-icon"></i>Bảng Vinh Danh</h1>
                    <p className="leaderboard-subtitle">Những thành viên xuất sắc nhất cộng đồng</p>
                </div>
                <div className="leaderboard-body">
                    <div className="leaderboard-controls">
                        <h4 className="leaderboard-section-title">Top {pagination.totalItems || 0} Thành Viên</h4>
                        <div className="leaderboard-sort">
                            <label htmlFor="sortBySelect" className="leaderboard-sort-label">Sắp xếp:</label>
                            <select
                                id="sortBySelect"
                                value={currentSortBy}
                                onChange={(e) => handleSortChange(e.target.value)}
                                className="leaderboard-sort-select"
                            >
                                <option value="points">Điểm Kinh Nghiệm</option>
                                <option value="level">Cấp Độ</option>
                                <option value="movies_watched">Phim Đã Xem</option>
                                <option value="comments_count">Bình Luận</option>
                            </select>
                        </div>
                    </div>

                    {loading && (
                        <div className="leaderboard-loading">
                            <div className="spinner"></div>
                            <p>Đang tải bảng xếp hạng...</p>
                        </div>
                    )}
                    {error && !loading && <div className="leaderboard-error">Lỗi: {error}</div>}

                    {!loading && !error && users.length > 0 && (
                        <>
                            {top3Users.length > 0 && (
                                <div className="leaderboard-top3-container">
                                    {top3Users.map((user, index) => {
                                        const rank = getRank(index);
                                        let rankIconClass = '';
                                        if (rank === 1) rankIconClass = 'fas fa-crown rank-gold';
                                        else if (rank === 2) rankIconClass = 'fas fa-medal rank-silver';
                                        else if (rank === 3) rankIconClass = 'fas fa-award rank-bronze';
                                        const orderClass = rank === 1 ? 'top3-order-2' : (rank === 2 ? 'top3-order-1' : 'top3-order-3');

                                        return (
                                            <div key={user.id} className={`top3-user-card ${orderClass} rank-${rank}`}>
                                                <div className="top3-user-card-inner">
                                                    {rankIconClass && <i className={`${rankIconClass} top3-rank-icon`}></i>}
                                                    <img src={getAvatarUrl(user)} alt={user.name} className="top3-avatar"/>
                                                    <h5 className="top3-name">
                                                        <Link to={`/profile-user/${user.uuid}`} className="top3-name-link">{user.name}</Link>
                                                    </h5>
                                                    <p className="top3-stats">Cấp {user.level} - {user.points.toLocaleString()} điểm</p>
                                                    {currentSortBy === 'movies_watched' && <small className="top3-sub-stats">Đã xem: {user.moviesWatchedCount || 0}</small>}
                                                    {currentSortBy === 'comments_count' && <small className="top3-sub-stats">Bình luận: {user.commentsCount || 0}</small>}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            <div className="leaderboard-table-wrapper">
                                <table className="leaderboard-table">
                                    <thead>
                                        <tr>
                                            <th className="rank-col">#</th>
                                            <th>Thành viên</th>
                                            <th className="level-col">Cấp</th>
                                            <th className="points-col">Điểm KN</th>
                                            {currentSortBy === 'movies_watched' && <th className="stat-col">Phim xem</th>}
                                            {currentSortBy === 'comments_count' && <th className="stat-col">Bình luận</th>}
                                            <th className="joined-col">Tham gia</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {otherUsers.map((user, index) => {
                                            const rankInTable = getRank(pagination.currentPage === 1 ? index + 3 : index);
                                            return (
                                                <tr key={user.id}>
                                                    <td className="rank-col">{rankInTable}</td>
                                                    <td>
                                                        <Link to={`/profile-user/${user.uuid}`} className="user-link">
                                                            <img src={getAvatarUrl(user)} alt={user.name} className="user-avatar-table"/>
                                                            <span>{user.name}</span>
                                                        </Link>
                                                    </td>
                                                    <td className="level-col"><span className="level-badge">{user.level}</span></td>
                                                    <td className="points-col">{user.points.toLocaleString()}</td>
                                                    {currentSortBy === 'movies_watched' && <td className="stat-col">{user.moviesWatchedCount || 0}</td>}
                                                    {currentSortBy === 'comments_count' && <td className="stat-col">{user.commentsCount || 0}</td>}
                                                    <td className="joined-col">{new Date(user.createdAt).toLocaleDateString('vi-VN')}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            {renderPagination()}
                        </>
                    )}
                    {!loading && !error && users.length === 0 && (
                        <div className="leaderboard-empty">Chưa có dữ liệu để hiển thị bảng xếp hạng.</div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LeaderboardPage;