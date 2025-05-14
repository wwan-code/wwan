// src/components/Admin/layout/Header.jsx
import React, { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from "react-redux";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { Tooltip, OverlayTrigger } from 'react-bootstrap'; 
import "../../../assets/scss/admin-header.scss";
import "../../../assets/scss/header-notification.scss";
import useDropdown from "../../../hooks/useDropdown";
import { useAppContext } from "../../../AppContext";
import { logout } from "../../../features/userSlice";
import {
    fetchNotifications,
    markAsRead,
    markAllAsRead
} from "../../../features/notificationSlice";
import classNames from '../../../utils/classNames';

const USER_DROPDOWN_ID = 234;
const NOTIFICATION_DROPDOWN_ID = 432;

const Header = ({ handleToggleSidebar }) => {
    const { user: currentUser } = useSelector((state) => state.user);
    const {
        uiPreferences,
        setUIPreference,
        AVAILABLE_ACCENT_COLORS
    } = useAppContext();

    const {
        notifications,
        unreadCount,
        loading: loadingNotifications,
        pagination: notificationPagination,
        error: notificationError // Lấy thêm error để hiển thị
    } = useSelector(state => state.notifications);

    const { openDropdown, toggleDropdown, dropdownRefCallback } = useDropdown();
    const dispatch = useDispatch();
    const location = useLocation();
    const navigate = useNavigate(); // Để điều hướng

    const [showThemeSettingsPanel, setShowThemeSettingsPanel] = useState(false);

    const breadcrumbItems = location.pathname.replace('/admin', '').split('/').filter(item => item !== '');
    const convertUrlToText = (url) => {
        return url.replace(/-/g, ' ').replace(/_/g, ' ').replace(/\//g, ' ').trim();
    };

    const logOut = useCallback(() => dispatch(logout())
        .then(() => {
            window.location.href = '/login'; // Chuyển về trang login sau khi admin logout
        })
        , [dispatch]);

    const getAvatarUrl = () => {
        if (!currentUser) return `https://ui-avatars.com/api/?name=A&background=random&color=white`;
        if (currentUser.avatar === null || !currentUser.avatar) {
            const namePart = currentUser.name || 'Admin';
            const initials = namePart.split(' ').map(word => word[0]).join('').toUpperCase();
            return `https://ui-avatars.com/api/?name=${initials}&background=random&color=white`;
        } else {
            return currentUser.avatar.startsWith('http') ? currentUser.avatar : `/${currentUser.avatar}`;
        }
    };

    // --- Xử lý Notification Dropdown ---
    const handleToggleNotificationDropdown = (e) => {
        toggleDropdown(NOTIFICATION_DROPDOWN_ID, e);
        if (openDropdown !== NOTIFICATION_DROPDOWN_ID && currentUser) {
            dispatch(fetchNotifications({ page: 1, limit: 10, status: 'all' }));
        }
    };

    const handleNotificationClick = (notification) => {
        if (!notification.isRead) {
            dispatch(markAsRead(notification.id));
        }
        toggleDropdown(NOTIFICATION_DROPDOWN_ID);
        if (notification.link) {
            navigate(notification.link);
        }
    };

    const handleMarkAllRead = () => {
        if (unreadCount > 0) {
            dispatch(markAllAsRead());
        }
    };

    const loadMoreNotifications = () => {
        if (notificationPagination.currentPage < notificationPagination.totalPages && !loadingNotifications) {
            dispatch(fetchNotifications({
                page: notificationPagination.currentPage + 1,
                limit: 10,
                status: 'all'
            }));
        }
    };

    // --- Xử lý User Dropdown và Theme Settings Panel ---
    const handleUserDropdownToggle = (e) => {
        toggleDropdown(USER_DROPDOWN_ID, e);
        if (openDropdown === USER_DROPDOWN_ID) { // Nếu dropdown sắp đóng
            setShowThemeSettingsPanel(false); // Đóng panel theme
        }
    };

    const handleThemeSettingToggle = (e) => {
        e.stopPropagation(); // Ngăn dropdown user đóng lại
        setShowThemeSettingsPanel(prev => !prev);
    };

    const handleThemeChange = (themeValue) => {
        setUIPreference('theme', themeValue);
    };

    const handleAccentColorChange = (colorValue) => {
        setUIPreference('accentColor', colorValue);
    };

    // Fetch thông báo khi admin đăng nhập
    useEffect(() => {
        if (currentUser && (currentUser.roles?.includes('ROLE_ADMIN') || currentUser.roles?.includes('ROLE_EDITOR'))) {
            dispatch(fetchNotifications({ page: 1, limit: 10, status: 'all' }));
        }
    }, [currentUser, dispatch]);


    return (
        <header className="admin-header header-sticky p-0 mb-4">
            <div className="container-fluid border-bottom px-4 d-flex flex-wrap align-items-center justify-content-between">
                {/* Nút Toggle Sidebar */}
                <button className="header-toggler" type="button" onClick={handleToggleSidebar}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" className="bi bi-list" viewBox="0 0 16 16">
                        <path fillRule="evenodd" d="M2.5 12.5a.5.5 0 0 1 0-1h11a.5.5 0 0 1 0 1h-11zm0-5a.5.5 0 0 1 0-1h11a.5.5 0 0 1 0 1h-11zm0-5a.5.5 0 0 1 0-1h11a.5.5 0 0 1 0 1h-11z"/>
                    </svg>
                </button>

                <ul className="header-nav ms-auto align-items-center">
                    {/* --- Notification Dropdown --- */}
                    <li className="nav-item dropdown mx-2" ref={(el) => dropdownRefCallback(el, NOTIFICATION_DROPDOWN_ID)}>
                        <span
                            role='button'
                            className="header-notification-icon dropdown-toggle"
                            onClick={handleToggleNotificationDropdown}
                            aria-haspopup="true"
                            aria-expanded={openDropdown === NOTIFICATION_DROPDOWN_ID}
                        >
                            <i className="fa-regular fa-bell"></i>
                            {unreadCount > 0 && (
                                <span className="header-notification-badge badge rounded-pill bg-danger">
                                    {unreadCount > 9 ? '9+' : unreadCount}
                                </span>
                            )}
                        </span>
                        <div
                            className={`dropdown-notification-menu dropdown-menu dropdown-menu-end shadow-lg ${openDropdown === NOTIFICATION_DROPDOWN_ID ? "show" : ""}`}
                            style={openDropdown === NOTIFICATION_DROPDOWN_ID ? { position: 'absolute', inset: '0px 0px auto auto', margin: '0px', transform: 'translate(-20px, 45px)', minWidth: '320px' } : {}}
                            data-bs-popper
                        >
                            <div className="dropdown-notification-header d-flex justify-content-between align-items-center px-3 py-2 border-bottom">
                                <h6 className="dropdown-notification-title mb-0">Thông báo</h6>
                                {notifications.length > 0 && unreadCount > 0 && (
                                    <button className="btn btn-sm btn-link p-0 text-decoration-none" onClick={handleMarkAllRead} disabled={loadingNotifications || unreadCount === 0}>
                                        Đánh dấu đã đọc tất cả
                                    </button>
                                )}
                            </div>
                            <div className="dropdown-notification-body overflow-auto py-1" style={{ maxHeight: '350px' }}>
                                {loadingNotifications && notifications.length === 0 && <div className="p-3 text-center"><div className="spinner-border spinner-border-sm"></div></div>}
                                {!loadingNotifications && notificationError && <div className="p-3 text-center text-danger">{notificationError.message || "Lỗi tải thông báo."}</div>}
                                {!loadingNotifications && !notificationError && notifications.length === 0 && <p className='text-center text-muted p-3 mb-0'>Không có thông báo.</p>}


                                {notifications.map(notif => (
                                    <div
                                        key={notif.id}
                                        className={`dropdown-item notification-item ${notif.isRead ? 'read' : 'unread'}`}
                                        onClick={() => handleNotificationClick(notif)}
                                        role="button"
                                    >
                                        {/* ... Nội dung item thông báo ... */}
                                         <div className="d-flex align-items-start">
                                            {/* Icon hoặc avatar người gửi */}
                                            <div className="avatar avatar-xs rounded-circle me-2 mt-1 d-flex align-items-center justify-content-center">
                                                <i className={classNames("fas", // Default icon
                                                    notif.type === 'NEW_CONTENT_REPORT' ? 'fa-flag text-warning' :
                                                    notif.type === 'LEVEL_UP' ? 'fa-arrow-up text-success' :
                                                    notif.type === 'NEW_BADGE' ? 'fa-medal text-info' :
                                                    notif.type === 'DAILY_CHECK_IN_REWARD' ? 'fa-calendar-check text-primary' :
                                                    notif.type === 'FRIEND_REQUEST' ? 'fa-user-plus text-primary' :
                                                    notif.type === 'REQUEST_ACCEPTED' ? 'fa-user-check text-success' :
                                                    notif.type === 'NEW_EPISODE' ? 'fa-tv text-info' :
                                                    notif.type === 'REPORT_STATUS_UPDATE' ? 'fa-info-circle text-primary' :
                                                    'fa-bell'
                                                )}></i>
                                            </div>
                                            <div className="notification-item-content">
                                                <p className="mb-0" style={{fontSize: '0.875rem'}} dangerouslySetInnerHTML={{ __html: notif.message }}></p>
                                                <small className="text-muted">{new Date(notif.createdAt).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</small>
                                            </div>
                                            {!notif.isRead && <span className="notification-unread-dot ms-auto"></span>}
                                        </div>
                                    </div>
                                ))}
                                {!loadingNotifications && notificationPagination && notificationPagination.currentPage < notificationPagination.totalPages && (
                                     <div className="text-center py-2 border-top">
                                         <button className="btn btn-sm btn-link text-decoration-none" onClick={loadMoreNotifications} disabled={loadingNotifications}>Xem thêm</button>
                                     </div>
                                )}
                            </div>
                        </div>
                    </li>

                    {/* Ngăn cách */}
                    <li className="nav-item py-1 d-none d-md-block">
                        <div className="vr h-100 mx-2 text-body text-opacity-75"></div>
                    </li>

                    {/* User Dropdown */}
                    <li className="nav-item dropdown" ref={(el) => dropdownRefCallback(el, USER_DROPDOWN_ID)}>
                        <button className="btn btn-link nav-link py-2 px-2 d-flex align-items-center"
                            aria-label="User menu"
                            onClick={handleUserDropdownToggle}
                        >
                            <div className="avatar avatar-sm">
                                <img className="avatar-img" src={getAvatarUrl()} alt={currentUser?.name || "Admin"} />
                            </div>
                        </button>
                        <div className={`dropdown-menu dropdown-menu-end pt-0 shadow-lg ${openDropdown === USER_DROPDOWN_ID ? " show" : ""}`} data-bs-popper>
                            <div className="position-relative overflow-hidden" style={{ minHeight: '200px' }}>
                                {/* ----- Main User Menu (Cho Admin) ----- */}
                                <ul className="w-100 list-unstyled mb-0"
                                    style={{
                                        transform: showThemeSettingsPanel ? "translateX(-100%)" : "translateX(0%)",
                                        opacity: showThemeSettingsPanel ? 0 : 1,
                                        visibility: showThemeSettingsPanel ? "hidden" : "visible",
                                        transition: 'opacity .25s, transform .25s, visibility .25s'
                                    }}>
                                    <li role="menuitem">
                                        <div className="dropdown-header bg-body-tertiary text-body-secondary fw-semibold rounded-top py-2 px-3 mb-2">
                                            {currentUser?.name || 'Admin Account'}
                                            <small className="d-block text-muted">{currentUser?.email}</small>
                                        </div>
                                    </li>
                                    
                                    <li role="menuitem">
                                        <Link className="dropdown-item" to="/admin/profile">
                                            <i className="icon-base fa-regular fa-user me-2"></i>Hồ sơ của tôi
                                        </Link>
                                    </li>
                                    <li role="menuitem">
                                        <Link className="dropdown-item" to="/" target="_blank">
                                            <i className="icon-base fa-regular fa-link me-2"></i>Xem trang web
                                        </Link>
                                    </li>
                                    <li role="menuitem">
                                        <Link className="dropdown-item" to="/admin/settings">
                                            <i className="icon-base fa-regular fa-cog me-2"></i>Cài đặt
                                        </Link>
                                    </li>
                                    <li role="menuitem">
                                        <button className="dropdown-item w-100" onClick={handleThemeSettingToggle} aria-expanded={showThemeSettingsPanel}>
                                            <span className="d-flex align-items-center">
                                                <i className="icon-base fa-regular fa-palette me-2"></i>
                                                <span>Giao diện</span>
                                                <i className="fa-solid fa-chevron-right ms-auto text-muted small"></i>
                                            </span>
                                        </button>
                                    </li>
                                    <li><div className="dropdown-divider my-1"></div></li>
                                    <li role="menuitem">
                                        <button className="dropdown-item text-danger w-100" type="button" onClick={logOut}>
                                            <i className="icon-base fa-regular fa-power-off me-2"></i>Đăng xuất
                                        </button>
                                    </li>
                                </ul>

                                {/* ----- Theme Settings Panel ----- */}
                                <div
                                    className="settings-panel"
                                    style={{
                                        transform: showThemeSettingsPanel ? "translateX(0%)" : "translateX(100%)",
                                        opacity: showThemeSettingsPanel ? 1 : 0,
                                        visibility: showThemeSettingsPanel ? "visible" : "hidden",
                                        transition: 'opacity .25s, transform .25s, visibility .25s',
                                        position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                                        backgroundColor: 'var(--w-dropdown-bg, var(--w-paper-bg))'
                                    }}
                                >
                                    <div className="settings-panel__header">
                                        <div className="settings-panel__header-left">
                                            <button type="button" className="settings-panel__back-button btn btn-icon btn-sm" onClick={handleThemeSettingToggle} aria-label="Quay lại" >
                                                <i className="settings-panel__icon-back"></i>
                                            </button>
                                        </div>
                                        <div className="settings-panel__header-right">
                                            <span className="settings-panel__title">Tùy chỉnh Giao diện</span>
                                        </div>
                                    </div>
                                    <div className="settings-panel__wrapper">
                                        <div className="settings-panel__content">
                                            {/* Chế độ Sáng/Tối/Hệ thống */}
                                            <div className="settings-panel__option mb-2">
                                                 <div className="settings-panel__option-wrap-icon">
                                                    <div className="settings-panel__option-icon">
                                                         {/* Icon thay đổi theo theme */}
                                                        <i className={`settings-panel__icon-moon fas ${uiPreferences.theme === 'dark' ? 'fa-moon' : (uiPreferences.theme === 'light' || (uiPreferences.theme === 'system' && !(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches)) ? 'fa-sun' : 'fa-desktop' )}`}></i>
                                                    </div>
                                                </div>
                                                <div className="settings-panel__option-details">
                                                    <span className="settings-panel__option-title">Chế độ</span>
                                                </div>
                                            </div>
                                            <div className="settings-panel__mode-options">
                                                {['light', 'dark', 'system'].map((themeVal) => (
                                                    <label className="settings-panel__label" key={themeVal}>
                                                        <div className={`settings-panel__mode-option ${uiPreferences.theme === themeVal ? "active" : ""}`} onClick={() => handleThemeChange(themeVal)} >
                                                            <div>
                                                                <span className="settings-panel__mode-title">
                                                                    {themeVal === 'light' ? 'Sáng' : themeVal === 'dark' ? 'Tối' : 'Theo hệ thống'}
                                                                </span>
                                                                {themeVal === 'system' && <span className="settings-panel__mode-subtitle">Tự động theo thiết bị.</span>}
                                                            </div>
                                                            <i className="settings-panel__radio-icon"></i>
                                                        </div>
                                                    </label>
                                                ))}
                                            </div>

                                            {/* Màu chủ đạo (Accent Color) */}
                                            {AVAILABLE_ACCENT_COLORS && AVAILABLE_ACCENT_COLORS.length > 0 && (
                                                <>
                                                    <hr className='my-3'/>
                                                    <div className="settings-panel__option mb-2">
                                                         <div className="settings-panel__option-wrap-icon">
                                                            <div className="settings-panel__option-icon" style={{ backgroundColor: uiPreferences.accentColor }}>
                                                                <i className="fas fa-palette" style={{ color: 'var(--w-white)' /* Hoặc một màu tương phản */ }}></i>
                                                            </div>
                                                        </div>
                                                        <div className="settings-panel__option-details">
                                                            <span className="settings-panel__option-title">Màu Nhấn</span>
                                                        </div>
                                                    </div>
                                                    <div className="settings-panel__mode-options d-flex flex-wrap justify-content-start">
                                                        {AVAILABLE_ACCENT_COLORS.map(color => (
                                                            <button
                                                                key={color.value}
                                                                title={color.name}
                                                                className={`btn btn-sm me-2 mb-2 accent-color-swatch ${uiPreferences.accentColor === color.value ? 'active' : ''}`}
                                                                style={{ backgroundColor: color.value }}
                                                                onClick={() => handleAccentColorChange(color.value)}
                                                            >
                                                                {uiPreferences.accentColor === color.value && <i className="fas fa-check"></i>}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </li>
                </ul>
            </div>
            <div className="container-fluid px-4 d-flex flex-wrap align-items-center justify-content-between">
                <nav aria-label="breadcrumb" >
                    <ol className="breadcrumb my-0">
                        <li className="breadcrumb-item"><Link to="/admin/dashboard">Admin</Link></li>
                        {breadcrumbItems.map((item, index) => (
                            <li key={index} className={`breadcrumb-item ${index === breadcrumbItems.length - 1 ? 'active' : ''}`}>
                                {index === breadcrumbItems.length - 1 ? (
                                    convertUrlToText(item)
                                ) : (
                                    <span>{convertUrlToText(item)}</span>
                                )}
                            </li>
                        ))}
                    </ol>
                </nav>
            </div>
        </header>
    )
}

export default Header;