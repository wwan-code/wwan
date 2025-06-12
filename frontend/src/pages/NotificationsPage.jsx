// src/pages/NotificationsPage.jsx
import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import NProgress from 'nprogress';
import classNames from '@utils/classNames';

import {
    fetchNotifications,
    markAsRead,
    deleteNotification,
    markAllAsRead
} from '@features/notificationSlice';
import Pagination from '@components/Common/Pagination';

import '@assets/scss/pages/_notifications-page.scss';

const ITEMS_PER_PAGE_NOTIF = 15;

const NotificationsPage = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const {
        items: notifications,
        pagination,
        unreadCount,
        loadingMore,
        loading: loadingNotifications,
        error: notificationError
    } = useSelector(state => state.notifications);
    const [searchParams, setSearchParams] = useSearchParams();
    const currentPage = parseInt(searchParams.get('page') || '1', 10);
    const currentStatusFilter = searchParams.get('status') || 'all';

    const [deletingId, setDeletingId] = useState(null);

    useEffect(() => {
        document.title = "Thông báo của bạn | WWAN Film";
    }, []);

    useEffect(() => {
        NProgress.start();
        dispatch(fetchNotifications({
            page: currentPage,
            limit: ITEMS_PER_PAGE_NOTIF,
            status: currentStatusFilter === 'all' ? undefined : currentStatusFilter
        }))
        .unwrap()
        .catch(err => {
            console.error("Lỗi fetchNotifications trên NotificationsPage:", err);
            toast.error(err.message || "Lỗi tải danh sách thông báo.");
        })
        .finally(() => NProgress.done());
    }, [dispatch, currentPage, currentStatusFilter]);

    const handlePageChange = (newPage) => {
        if (newPage !== currentPage && newPage >= 1 && newPage <= (pagination?.totalPages || 1)) {
            setSearchParams({ status: currentStatusFilter, page: newPage.toString() });
        }
    };

    const handleFilterChange = (newStatus) => {
        if (newStatus !== currentStatusFilter) {
            setSearchParams({ status: newStatus, page: '1' })
        }
    };

    const handleItemClick = (notification) => {
        if (!notification.isRead) {
            dispatch(markAsRead(notification.id))
                .unwrap()
                .catch(err => toast.error(err.message || "Lỗi đánh dấu đã đọc."));
        }
        if (notification.link && notification.link !== '#') {
            navigate(notification.link);
        }
    };

    const handleDelete = async (notificationId) => {
        if (deletingId === notificationId) return;
        if (!window.confirm("Bạn chắc chắn muốn xóa thông báo này?")) return;
        setDeletingId(notificationId);
        try {
            await dispatch(deleteNotification(notificationId)).unwrap();
            toast.success("Đã xóa thông báo.");
            // Nếu trang hiện tại trống sau khi xóa và không phải trang 1, quay về trang trước
            if (notifications.length === 1 && currentPage > 1) {
                handlePageChange(currentPage - 1);
            }
            // Slice đã tự cập nhật danh sách notifications và pagination
        } catch (error) {
            toast.error(error.message || "Lỗi khi xóa thông báo.");
        } finally {
            setDeletingId(null);
        }
    };

    const handleGlobalMarkAllRead = async () => {
        if (unreadCount > 0) {
            try {
                 await dispatch(markAllAsRead()).unwrap();
                 toast.success("Đã đánh dấu tất cả là đã đọc.");
            } catch(error) {
                toast.error(error.message || "Lỗi khi đánh dấu tất cả đã đọc.");
            }
        }
    };

    const getNotificationIcon = (type, iconUrl) => {
        if (iconUrl && !iconUrl.startsWith('fa')) return <img src={iconUrl.startsWith('http') ? iconUrl : `/${iconUrl}`} alt="icon" className="notification-list-item__icon-img" />;
        const iconClassMap = {
            'NEW_CONTENT_REPORT': 'fas fa-flag text-warning',
            'LEVEL_UP': 'fas fa-arrow-up text-success',
            'NEW_BADGE': 'fas fa-medal text-info',
            'DAILY_CHECK_IN_REWARD': 'fas fa-calendar-check text-primary',
            'FRIEND_REQUEST': 'fas fa-user-plus text-primary',
            'REQUEST_ACCEPTED': 'fas fa-user-check text-success',
            'NEW_EPISODE': 'fas fa-tv text-info',
            'NEW_CHAPTER': 'fas fa-book-open text-info',
            'REPORT_STATUS_UPDATE': 'fas fa-info-circle text-primary',
            'REPLY_TO_COMMENT': 'fas fa-reply text-secondary',
            'FRIEND_ACTIVITY_RATED_MOVIE': 'fas fa-star text-warning',
            'SYSTEM_ANNOUNCEMENT': 'fas fa-bullhorn text-danger',
            'default': 'fas fa-bell text-secondary'
        };
        return <i className={classNames("notification-list-item__icon-fa", iconClassMap[type] || iconClassMap.default)}></i>;
    };


    return (
        <div className="container notifications-page-container mb-5">
            <div className="notifications-page-header">
                <h2 className="notifications-page-title">Tất cả Thông báo</h2>
                {notifications.length > 0 && unreadCount > 0 && (
                    <button
                        className="btn btn-outline-secondary btn-sm"
                        onClick={handleGlobalMarkAllRead}
                    >
                        <i className="fas fa-check-double me-2"></i> Đánh dấu đọc tất cả
                    </button>
                )}
            </div>

            <div className="notifications-filters mb-4">
                <button
                    className={classNames("filter-btn", { active: currentStatusFilter === 'all' })}
                    onClick={() => handleFilterChange('all')}
                >
                    Tất cả <span className="filter-count">({pagination?.totalItems || 0})</span>
                </button>
                <button
                    className={classNames("filter-btn", { active: currentStatusFilter === 'unread' })}
                    onClick={() => handleFilterChange('unread')}
                >
                    Chưa đọc <span className="filter-count">({unreadCount || 0})</span>
                </button>
                <button
                    className={classNames("filter-btn", { active: currentStatusFilter === 'read' })}
                    onClick={() => handleFilterChange('read')}
                >
                    Đã đọc
                </button>
            </div>

            {loadingNotifications === 'pending' && notifications.length === 0 && (
                <div className="loading-placeholder page-level-loader">
                    <div className="spinner-eff"></div>
                    <p>Đang tải thông báo...</p>
                </div>
            )}
            {loadingNotifications === 'failed' && notificationError && (
                <div className="alert-message alert-danger">{notificationError}</div>
            )}
            {loadingNotifications !== 'pending' && !notificationError && notifications.length === 0 && (
                <div className="alert-message alert-info text-center empty-notifications">
                    <i className="fas fa-bell-slash empty-icon"></i>
                    <p className="empty-text">Bạn không có thông báo nào.</p>
                    <Link to="/" className="btn btn-outline-primary btn-sm mt-2">
                        <i className="fas fa-home me-2"></i> Về Trang Chủ
                    </Link>
                </div>
            )}

            {!notificationError && notifications.length > 0 && (
                <ul className="notifications-list">
                    {notifications.map(notif => (
                        <li
                            key={notif.id}
                            className={classNames('notification-list-item', {
                                'is-read': notif.isRead,
                                'is-deleting': deletingId === notif.id,
                            })}
                            role="button"
                            tabIndex={0} 
                            onClick={() => handleItemClick(notif)}
                            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleItemClick(notif);}}
                        >
                            <div className="notification-list-item__icon-wrapper">
                                {getNotificationIcon(notif.type, notif.iconUrl)}
                            </div>
                            <div className="notification-list-item__content" onClick={() => handleItemClick(notif)} role="button">
                                <p className="notification-list-item__message" dangerouslySetInnerHTML={{ __html: notif.message }}></p>
                                <small className="notification-list-item__timestamp">
                                    {new Date(notif.createdAt).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' })}
                                </small>
                            </div>
                            <div className="notification-list-item__actions">
                                <button
                                    className="btn-action btn-delete-notif"
                                    onClick={(e) => { e.stopPropagation(); handleDelete(notif.id); }}
                                    disabled={deletingId === notif.id}
                                    title="Xóa thông báo"
                                    aria-label="Xóa thông báo"
                                >
                                    {deletingId === notif.id ? <span className="spinner--small-light"></span> : <i className="fas fa-times"></i>}
                                </button>
                                {!notif.isRead && (
                                    <button
                                        className="btn-action btn-mark-read-notif"
                                        onClick={(e) => { e.stopPropagation(); dispatch(markAsRead(notif.id)); }}
                                        title="Đánh dấu đã đọc"
                                        aria-label="Đánh dấu đã đọc"
                                    >
                                        <i className="fas fa-check-circle"></i>
                                    </button>
                                )}
                            </div>
                        </li>
                    ))}
                </ul>
            )}

            {loadingMore && notifications.length > 0 && (
                <div className="loading-placeholder text-center py-3"><span className="spinner--small"></span> Đang tải thêm...</div>
            )}

            {!loadingNotifications && pagination && pagination.totalPages > 1 && (
                <Pagination
                    currentPage={pagination.currentPage}
                    totalPages={pagination.totalPages}
                    onPageChange={handlePageChange}
                />
            )}
        </div>
    );
};

export default NotificationsPage;