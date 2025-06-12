import { useEffect, useState, useCallback, useRef } from 'react';
import { Link, NavLink, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
    fetchNotifications,
    markAsRead,
    markAllAsRead,
} from '@features/notificationSlice';
import useDropdown from '@hooks/useDropdown';
import classNames from '@utils/classNames';
import { useAppContext } from '@contexts/AppContext';

import NotificationSwipeableItem from '@components/Notification/NotificationSwipeableItem';
import Search from '@components/Search';
import MobileSidebar from '@components/MobileSidebar';
import '@assets/scss/header.scss';
import '@assets/scss/search.scss';
import '@assets/scss/settings-panel.scss';
import '@assets/scss/components/_search-popup.scss';

import logoW from '@assets/images/wwan-logo-text.png';
import SearchPopup from '@components/SearchPopup';
import CustomOverlayTrigger from '@components/CustomTooltip/CustomOverlayTrigger';
import UserAvatarDisplay from '@components/Common/UserAvatarDisplay';
import { toast } from 'react-toastify';

const USER_DROPDOWN_ID = 3242;
const NOTIFICATION_DROPDOWN_ID = 1234;

const Header = () => {
    const { currentUser, isLoggedIn, logOut, setShowFriendRequests, friendRequests, uiPreferences, setUIPreference, AVAILABLE_ACCENT_COLORS } = useAppContext();
    const dispatch = useDispatch();
    const location = useLocation();
    const navigate = useNavigate();

    const {
        items: notifications,
        unreadCount,
        loading: loadingNotificationsInitial,
        loadingMore,
        pagination: notificationPagination,
        error: notificationError
    } = useSelector(state => state.notifications);
    const [searchParams, setSearchParams] = useSearchParams();

    const { openDropdown, toggleDropdown, dropdownRefCallback } = useDropdown();
    const [showThemeSettingsPanel, setShowThemeSettingsPanel] = useState(false);
    const [isHeaderFixed, setIsHeaderFixed] = useState(false);
    const [showSearchPopup, setShowSearchPopup] = useState(false);
    const [isMobileSearchVisible, setIsMobileSearchVisible] = useState(window.innerWidth < 992);
    const [showMobileMenu, setShowMobileMenu] = useState(false);
    const notificationBodyRef = useRef(null);

    const currentStatusFilter = searchParams.get('status') || 'all';

    const navLinks = [
        { to: "/", label: "Trang chủ", exact: true },
        { to: "/muc-luc", label: "Mục Lục" },
        { to: "/anime", label: "Anime" },
        { to: "/truyen-tranh", label: "Truyện Tranh" },
        { to: "/bang-xep-hang", label: "BXH" },
        { to: "/minigame/ne-chuong-ngai-vat", label: "MiniGame" }
    ];

    const handleResize = useCallback(() => {
        setIsMobileSearchVisible(window.innerWidth < 992);
    }, []);

    useEffect(() => {
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [handleResize]);

    useEffect(() => {
        if (openDropdown !== USER_DROPDOWN_ID) {
            setShowThemeSettingsPanel(false);
        }
    }, [openDropdown]);

    const handleUserDropdownToggle = (e) => {
        toggleDropdown(USER_DROPDOWN_ID, e);
        if (openDropdown === USER_DROPDOWN_ID) {
            setShowThemeSettingsPanel(false);
        }
    };

    const handleThemeSettingToggle = (e) => {
        e.stopPropagation();
        setShowThemeSettingsPanel(prev => !prev);
    };

    const handleAccentColorChange = (colorValue) => {
        setUIPreference('accentColor', colorValue);
    };

    useEffect(() => {
        const handleScroll = () => {
            setIsHeaderFixed(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        handleScroll();
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const isOnComicReaderPage = location.pathname.includes('/truyen/');

    const formatRoles = (roles = []) => {
        return roles.map(role => role.replace('ROLE_', '')).join(', ') || 'User';
    };

    useEffect(() => {
        if (currentUser) {
            dispatch(fetchNotifications({
                page: 1, limit: 10,
                status: currentStatusFilter === 'all' ? undefined : currentStatusFilter
            })).unwrap()
                .catch(err => {
                    console.error("Lỗi fetchNotifications trên NotificationsPage:", err);
                    toast.error(err.message || "Lỗi tải danh sách thông báo.");
                });
        }
    }, [currentUser, dispatch, currentStatusFilter]);

    const handleFilterChange = (newStatus) => {
        if (newStatus !== currentStatusFilter) {
            setSearchParams({ status: newStatus })
        }
    };

    const handleToggleNotificationDropdown = useCallback((e) => {
        const newDropdownState = openDropdown !== NOTIFICATION_DROPDOWN_ID;
        toggleDropdown(NOTIFICATION_DROPDOWN_ID, e);
        if (newDropdownState && currentUser && (notifications.length === 0 || unreadCount > 0 || notificationError)) {
            dispatch(fetchNotifications({ page: 1, limit: 10, status: currentStatusFilter === 'all' ? undefined : currentStatusFilter }));
        }
    }, [dispatch, currentUser, notifications.length, unreadCount, notificationError, openDropdown, toggleDropdown, currentStatusFilter]);

    const handleNotificationClick = useCallback((notification) => {
        if (!notification.isRead) {
            dispatch(markAsRead(notification.id))
                .unwrap()
                .catch(err => toast.error(err.message || "Lỗi đánh dấu đã đọc."));
        }
        if (notification.link && notification.link !== '#') {
            navigate(notification.link);
        }
    }, [dispatch, navigate]);

    const handleMarkAllRead = useCallback(() => {
        if (unreadCount > 0) {
            dispatch(markAllAsRead())
                .unwrap()
                .catch(err => toast.error(err.message || "Lỗi đánh dấu tất cả đã đọc."));
        }
    }, [dispatch, unreadCount]);

    const loadMoreNotifications = useCallback(() => {
        if (notificationPagination && notificationPagination.currentPage < notificationPagination.totalPages && !loadingMore) {
            dispatch(fetchNotifications({
                page: notificationPagination.currentPage + 1,
                limit: notificationPagination.itemsPerPage,
                status: currentStatusFilter === 'all' ? undefined : currentStatusFilter
            }));
        }
    }, [dispatch, loadingMore, notificationPagination, currentStatusFilter]);
    useEffect(() => {
        const bodyEl = notificationBodyRef.current;
        if (bodyEl && openDropdown === NOTIFICATION_DROPDOWN_ID) {
            const scrollHandler = () => {
                if (bodyEl.scrollHeight - bodyEl.scrollTop - bodyEl.clientHeight < 100) {
                    loadMoreNotifications();
                }
            };
            bodyEl.addEventListener('scroll', scrollHandler, { passive: true });
            return () => bodyEl.removeEventListener('scroll', scrollHandler);
        }
    }, [openDropdown, loadMoreNotifications]);

    return (
        <>
            <header className={classNames("header", { "header-fixed": isHeaderFixed && !isOnComicReaderPage })}>
                <div className="header-container">
                    <div className="header-area">
                        <div className="header-left">
                            <div className="header-logo">
                                <Link to={'/'}>
                                    <img src={logoW} alt="logo" />
                                </Link>
                            </div>
                            <div className='header-toggle-mobile ms-2'>
                                <button
                                    className="navbar-toggler-custom"
                                    type="button"
                                    onClick={() => setShowMobileMenu(true)}
                                    aria-label="Mở menu"
                                    aria-expanded={showMobileMenu}
                                >
                                    <i className="fas fa-bars"></i>
                                </button>
                            </div>
                        </div>

                        <div className="header-menu">
                            <nav className="navbar navbar-expand">
                                <ul className='navbar-nav'>
                                    <li className='nav-item'>
                                        <CustomOverlayTrigger
                                            placement="bottom"
                                            tooltipId="tooltip-home"
                                            tooltip={<>Trang chủ</>}
                                        >
                                            <NavLink className={({ isActive, isPending }) =>
                                                classNames("nav-link", { "active": isActive, "pending": isPending })
                                            } to={'/'}>
                                                <svg className='nav-icon-svg' xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none">
                                                    <path d="M2 12.2039C2 9.91549 2 8.77128 2.5192 7.82274C3.0384 6.87421 3.98695 6.28551 5.88403 5.10813L7.88403 3.86687C9.88939 2.62229 10.8921 2 12 2C13.1079 2 14.1106 2.62229 16.116 3.86687L18.116 5.10812C20.0131 6.28551 20.9616 6.87421 21.4808 7.82274C22 8.77128 22 9.91549 22 12.2039V13.725C22 17.6258 22 19.5763 20.8284 20.7881C19.6569 22 17.7712 22 14 22H10C6.22876 22 4.34315 22 3.17157 20.7881C2 19.5763 2 17.6258 2 13.725V12.2039Z" stroke="currentColor" strokeWidth="1.5" />
                                                    <path d="M15 18H9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                                </svg>
                                            </NavLink>
                                        </CustomOverlayTrigger>
                                    </li>
                                    <li className='nav-item'>
                                        <CustomOverlayTrigger
                                            placement="bottom"
                                            tooltipId="tooltip-anime"
                                            tooltip={<>Danh sách anime</>}
                                        >
                                            <NavLink className={({ isActive, isPending }) =>
                                                classNames("nav-link", { "active": isActive, "pending": isPending })
                                            } to={'/anime'}>
                                                <svg className='nav-icon-svg' xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none">
                                                    <path d="M20 12C20 16.4183 16.4183 20 12 20C7.58172 20 4 16.4183 4 12C4 7.58172 7.58172 4 12 4C16.4183 4 20 7.58172 20 12Z" fill="none" stroke="currentColor" strokeWidth="1.5" />
                                                    <path d="M17.8486 6.19085C19.8605 5.81929 21.3391 5.98001 21.8291 6.76327C22.8403 8.37947 19.2594 12.0342 13.8309 14.9264C8.40242 17.8185 3.18203 18.8529 2.17085 17.2367C1.63758 16.3844 2.38148 14.9651 4 13.3897" fill="none" stroke="currentColor" strokeWidth="1.5" />
                                                </svg>
                                            </NavLink>
                                        </CustomOverlayTrigger>
                                    </li>
                                    <li className='nav-item'>
                                        <CustomOverlayTrigger
                                            placement="bottom"
                                            tooltipId='tooltip-thinh-hanh'
                                            tooltip={<>Thịnh hành</>}
                                        >
                                            <NavLink className={({ isActive, isPending }) =>
                                                classNames("nav-link", { "active": isActive, "pending": isPending })
                                            } to={'/thinh-hanh'}>
                                                <svg className='nav-icon-svg' xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none">
                                                    <path d="M12 21C16.4183 21 20 17.6439 20 13.504C20 9.76257 17.9654 6.83811 16.562 5.44436C16.3017 5.18584 15.8683 5.30006 15.7212 5.63288C14.9742 7.3229 13.4178 9.75607 11.4286 9.75607C10.1975 9.92086 8.31688 8.86844 9.83483 3.64868C9.97151 3.17868 9.46972 2.80113 9.08645 3.11539C6.9046 4.90436 4 8.51143 4 13.504C4 17.6439 7.58172 21 12 21Z" fill="none" stroke="currentColor" strokeWidth="1.5" />
                                                </svg>
                                            </NavLink>
                                        </CustomOverlayTrigger>
                                    </li>
                                    <li className='nav-item'>
                                        <CustomOverlayTrigger
                                            placement="bottom"
                                            tooltipId='tooltip-muc-luc'
                                            tooltip={<>Mục lục</>}
                                        >
                                            <NavLink className={({ isActive, isPending }) =>
                                                classNames("nav-link", { "active": isActive, "pending": isPending })
                                            } to={'/muc-luc'}>
                                                <svg className='nav-icon-svg' xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none">
                                                    <path d="M19 3H5C3.58579 3 2.87868 3 2.43934 3.4122C2 3.8244 2 4.48782 2 5.81466V6.50448C2 7.54232 2 8.06124 2.2596 8.49142C2.5192 8.9216 2.99347 9.18858 3.94202 9.72255L6.85504 11.3624C7.49146 11.7206 7.80967 11.8998 8.03751 12.0976C8.51199 12.5095 8.80408 12.9935 8.93644 13.5872C9 13.8722 9 14.2058 9 14.8729L9 17.5424C9 18.452 9 18.9067 9.25192 19.2613C9.50385 19.6158 9.95128 19.7907 10.8462 20.1406C12.7248 20.875 13.6641 21.2422 14.3321 20.8244C15 20.4066 15 19.4519 15 17.5424V14.8729C15 14.2058 15 13.8722 15.0636 13.5872C15.1959 12.9935 15.488 12.5095 15.9625 12.0976C16.1903 11.8998 16.5085 11.7206 17.145 11.3624L20.058 9.72255C21.0065 9.18858 21.4808 8.9216 21.7404 8.49142C22 8.06124 22 7.54232 22 6.50448V5.81466C22 4.48782 22 3.8244 21.5607 3.4122C21.1213 3 20.4142 3 19 3Z" fill="none" stroke="currentColor" strokeWidth="1.5" />
                                                </svg>
                                            </NavLink>
                                        </CustomOverlayTrigger>
                                    </li>
                                    <li className='nav-item'>
                                        <CustomOverlayTrigger placement="bottom" tooltipId="tooltip-truyen-tranh" tooltip={<>Truyện tranh</>}>
                                            <NavLink className={({ isActive, isPending }) =>
                                                classNames("nav-link", { "active": isActive, "pending": isPending })
                                            } to={'/truyen-tranh'}>
                                                <svg className='nav-icon-svg' xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192" fill="none"><path d="M104.1 65.7v88.5c6.1-6.3 18.3-17.2 37-23.4 11.5-3.8 21.6-4.6 28.9-4.5V37.8c-8 .5-18.7 2.1-30.7 6.5-16.5 6.2-28.2 15.1-35.2 21.4zm-16.2 0v88.5c-6.1-6.3-18.3-17.2-37-23.4-11.5-3.8-21.6-4.6-28.9-4.5V37.8c8 .5 18.7 2.1 30.7 6.5 16.5 6.2 28.2 15.1 35.2 21.4z" fill="none" stroke="currentColor" strokeWidth="12" /></svg>
                                            </NavLink>
                                        </CustomOverlayTrigger>
                                    </li>
                                    <span>|</span>
                                    <li className='nav-item'>
                                        <NavLink className={({ isActive, isPending }) =>
                                            classNames("nav-link", { "active": isActive, "pending": isPending })
                                        } to={'/comic-ratings'}>
                                            Xếp hạng truyện
                                        </NavLink>
                                    </li>
                                    <li className='nav-item'>
                                        <NavLink className={({ isActive, isPending }) =>
                                            classNames("nav-link", { "active": isActive, "pending": isPending })
                                        } to={'/games'}>
                                            Trò chơi
                                        </NavLink>
                                    </li>
                                </ul>
                            </nav>
                        </div>
                        <div className="header-right">
                            {!isMobileSearchVisible && (
                                <div className='header-search me-3'>
                                    <Search />
                                </div>
                            )}
                            {isMobileSearchVisible && (
                                <button
                                    className="mobile-search-toggle-btn"
                                    onClick={() => setShowSearchPopup(true)}
                                    aria-label="Mở tìm kiếm"
                                >
                                    <i className="fa-regular fa-magnifying-glass"></i>
                                </button>
                            )}
                            {isLoggedIn && currentUser ? (
                                <>
                                    <div className="dropdown-notification dropdown" ref={(el) => dropdownRefCallback(el, NOTIFICATION_DROPDOWN_ID)}>
                                        <button
                                            role='button'
                                            className="dropdown-notification-icon dropdown-toggle"
                                            onClick={handleToggleNotificationDropdown}
                                            aria-label="Thông báo"
                                            aria-haspopup="true"
                                            aria-expanded={openDropdown === NOTIFICATION_DROPDOWN_ID}
                                        >
                                            <i className="fa-regular fa-bell"></i>
                                            {unreadCount > 0 && (
                                                <span className="dropdown-notification-badge">
                                                    {unreadCount > 99 ? '99+' : unreadCount}
                                                </span>
                                            )}
                                        </button>
                                        <div
                                            className={classNames("dropdown-notification-menu", "dropdown-menu", "dropdown-menu-end", { "show": openDropdown === NOTIFICATION_DROPDOWN_ID })}
                                            data-bs-popper
                                        >
                                            <div className="dropdown-notification__header">
                                                <h6 className="dropdown-notification__header--title mb-0">Thông báo</h6>
                                                {notifications.length > 0 && unreadCount > 0 && (
                                                    <span type="button" className="dropdown-notification__header--link" onClick={handleMarkAllRead} disabled={loadingNotificationsInitial === 'pending' || loadingMore}>
                                                        Đọc tất cả
                                                    </span>
                                                )}
                                            </div>
                                            <div className="dropdown-notification__tabs">
                                                <button type="button" className={classNames("dropdown-notification__tabs--tab", { 'tab-active': currentStatusFilter === 'all' })} onClick={() => handleFilterChange('all')}>Tất cả</button>
                                                <button type="button" className={classNames("dropdown-notification__tabs--tab", { 'tab-active': currentStatusFilter === 'unread' })} onClick={() => handleFilterChange('unread')}>Chưa đọc</button>
                                            </div>

                                            <div className="dropdown-notification__list" ref={notificationBodyRef}>
                                                {loadingNotificationsInitial === 'pending' && notifications.length === 0 && <div className="notification-loader"><span className="spinner--small"></span></div>}
                                                {loadingNotificationsInitial === 'failed' && notificationError && <p className='notification-error-message'>{notificationError}</p>}
                                                {loadingNotificationsInitial === 'succeeded' && notifications.length === 0 && <p className='notification-empty-message'>Bạn chưa có thông báo nào.</p>}
                                                {notifications.map(notif => {
                                                    return (
                                                        <NotificationSwipeableItem
                                                            key={notif.id}
                                                            notification={notif}
                                                            onClick={() => handleNotificationClick(notif)}
                                                        />
                                                    )
                                                })}
                                                {loadingMore && (
                                                    <div className="notification-loader text-center p-2">
                                                        <span className="spinner--small"></span>
                                                    </div>
                                                )}
                                            </div>
                                            {notifications.length > 0 && (
                                                <div className="dropdown-notification-footer">
                                                    <Link to="/notifications" className="btn-view-all-notifications" onClick={() => toggleDropdown(NOTIFICATION_DROPDOWN_ID)}>
                                                        Xem tất cả thông báo
                                                    </Link>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="dropdown-user dropdown" ref={(el) => dropdownRefCallback(el, USER_DROPDOWN_ID)}>
                                        <button
                                            role='button'
                                            className="header-user-icon dropdown-toggle"
                                            onClick={handleUserDropdownToggle}
                                            aria-haspopup="true"
                                            aria-expanded={openDropdown === USER_DROPDOWN_ID}
                                        >
                                            <UserAvatarDisplay userToDisplay={currentUser} size={"38"} />
                                        </button>
                                        <div
                                            className={`dropdown-menu dropdown-menu-end ${openDropdown === USER_DROPDOWN_ID ? "show" : ""}`}
                                            data-bs-popper
                                        >
                                            <div className="position-relative overflow-hidden">
                                                <ul className="list-menu-items" style={{
                                                    transform: showThemeSettingsPanel ? "translateX(-100%)" : "translateX(0%)",
                                                    opacity: showThemeSettingsPanel ? 0 : 1,
                                                    visibility: showThemeSettingsPanel ? "hidden" : "visible",
                                                    transition: 'opacity .25s, transform .25s, visibility .25s'
                                                }}>
                                                    <li role="menuitem">
                                                        <Link className="dropdown-item" to="/profile">
                                                            <div className="d-flex">
                                                                <div className="flex-shrink-0 me-3">
                                                                    <UserAvatarDisplay userToDisplay={currentUser} size={"32"} />
                                                                </div>
                                                                <div className="flex-grow-1">
                                                                    <h6 className="mb-0 dropdown-item-title">{currentUser.name}</h6>
                                                                    <small className="text-body-secondary d-block">{formatRoles(currentUser.roles)}</small>
                                                                </div>
                                                            </div>
                                                        </Link>
                                                    </li>
                                                    <li><div className="dropdown-divider my-1"></div></li>
                                                    <li role="menuitem">
                                                        <Link className="dropdown-item" to="/profile">
                                                            <span className="d-flex align-items-center align-middle">
                                                                <i className="icon-base flex-shrink-0 fa-regular fa-user me-3"></i>
                                                                <span className="flex-grow-1 align-middle">Hồ sơ của tôi</span>
                                                            </span>
                                                        </Link>
                                                    </li>
                                                    <li role="menuitem">
                                                        <button className="dropdown-item" onClick={() => setShowFriendRequests?.(prev => !prev)}>
                                                            <span className="d-flex align-items-center align-middle w-100">
                                                                <i className="icon-base flex-shrink-0 fa-regular fa-user-plus me-3"></i>
                                                                <span className="flex-grow-1 align-middle">Lời mời kết bạn</span>
                                                                {Array.isArray(friendRequests) && friendRequests.length > 0 && (<span className="flex-shrink-0 badge rounded-pill bg-danger">{friendRequests.length}</span>)}
                                                            </span>
                                                        </button>
                                                    </li>
                                                    <li role="menuitem">
                                                        <button className="dropdown-item" onClick={handleThemeSettingToggle} aria-expanded={showThemeSettingsPanel}>
                                                            <span className="d-flex align-items-center align-middle">
                                                                <i className="icon-base flex-shrink-0 fa-regular fa-palette me-3"></i>
                                                                <span className="flex-grow-1 align-middle">Giao diện</span>
                                                            </span>
                                                            <i className="fa-solid fa-chevron-right ms-auto text-muted small"></i>
                                                        </button>
                                                    </li>
                                                    <li role="menuitem">
                                                        <Link className="dropdown-item" to={'/bang-xep-hang'}>
                                                            <span className="d-flex align-items-center align-middle">
                                                                <i className="icon-base flex-shrink-0 fa-regular fa-trophy me-3"></i>
                                                                <span className="flex-grow-1 align-middle">Bảng xếp hạng người dùng</span>
                                                            </span>
                                                        </Link>
                                                    </li>
                                                    <li role="menuitem">
                                                        <Link className="dropdown-item" to="/faq">
                                                            <span className="d-flex align-items-center align-middle">
                                                                <i className="icon-base flex-shrink-0 fa-regular fa-circle-question me-3"></i>
                                                                <span className="flex-grow-1 align-middle">FAQ</span>
                                                            </span>
                                                        </Link>
                                                    </li>
                                                    <li><div className="dropdown-divider my-1"></div></li>
                                                    <li role="menuitem">
                                                        <button className="dropdown-item text-danger" onClick={logOut}>
                                                            <span className="d-flex align-items-center align-middle">
                                                                <i className="icon-base flex-shrink-0 fa-regular fa-power-off me-3"></i>
                                                                <span className="flex-grow-1 align-middle">Đăng xuất</span>
                                                            </span>
                                                        </button>
                                                    </li>
                                                </ul>

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
                                                            <div role="button" className="settings-panel__back-button" onClick={handleThemeSettingToggle} aria-label="Quay lại" >
                                                                <i className="settings-panel__icon-back"></i>
                                                            </div>
                                                        </div>
                                                        <div className="settings-panel__header-right">
                                                            <span className="settings-panel__title">Tùy chỉnh Giao diện</span>
                                                        </div>
                                                    </div>
                                                    <div className="settings-panel__wrapper">
                                                        <div className="settings-panel__content">
                                                            <div className="settings-panel__option mb-2">
                                                                <div className="settings-panel__option-wrap-icon">
                                                                    <div className="settings-panel__option-icon">
                                                                        <i className={`settings-panel__icon-moon ${uiPreferences.theme === 'dark' ? 'fa-solid' : uiPreferences.theme === 'light' ? 'fa-sun far' : 'fa-desktop-arrow-down fas'}`}></i>
                                                                    </div>
                                                                </div>
                                                                <div className="settings-panel__option-details">
                                                                    <span className="settings-panel__option-title">Chế độ tối</span>
                                                                </div>
                                                            </div>

                                                            <div className="settings-panel__mode-options">
                                                                {["light", "dark", "system"].map((themeOptionValue) => (
                                                                    <label className="settings-panel__label" key={themeOptionValue}>
                                                                        <div className="settings-panel__mode-option-wrap">
                                                                            <div
                                                                                className={`settings-panel__mode-option ${uiPreferences.theme === themeOptionValue ? "active" : ""}`}
                                                                                onClick={() => setUIPreference('theme', themeOptionValue)}
                                                                                role="button"
                                                                                tabIndex={0}
                                                                                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setUIPreference('theme', themeOptionValue); }}
                                                                            >
                                                                                <div>
                                                                                    <span className="settings-panel__mode-title">
                                                                                        {themeOptionValue === 'light' ? 'Đang tắt' : themeOptionValue === 'dark' ? 'Đang bật' : 'Theo thiết bị'}
                                                                                    </span>
                                                                                    {themeOptionValue === 'system' && (
                                                                                        <p className="settings-panel__mode-subtitle">
                                                                                            Chúng tôi sẽ tự động điều chỉnh theo cài đặt trên thiết bị của bạn.
                                                                                        </p>
                                                                                    )}
                                                                                </div>
                                                                                <i className="settings-panel__radio-icon"></i>
                                                                            </div>
                                                                        </div>
                                                                    </label>
                                                                ))}
                                                            </div>
                                                            {AVAILABLE_ACCENT_COLORS && AVAILABLE_ACCENT_COLORS.length > 0 && (
                                                                <>
                                                                    <hr className='my-3' />
                                                                    <div className="settings-panel__option mb-2">
                                                                        <div className="settings-panel__option-wrap-icon">
                                                                            <div className="settings-panel__option-icon" style={{ backgroundColor: uiPreferences.accentColor }}>
                                                                                <i className="fas fa-palette" style={{ color: 'white' }}></i>
                                                                            </div>
                                                                        </div>
                                                                        <div className="settings-panel__option-details">
                                                                            <span className="settings-panel__option-title">Màu nhấn</span>
                                                                        </div>
                                                                    </div>
                                                                    <div className="settings-panel__mode-options d-flex flex-wrap justify-content-start">
                                                                        {AVAILABLE_ACCENT_COLORS.map(color => (
                                                                            <button
                                                                                key={color.value}
                                                                                title={color.name}
                                                                                className={`btn btn-sm me-2 mb-2 ${uiPreferences.accentColor === color.value ? 'active border-2 shadow-sm' : 'border'}`}
                                                                                style={{ backgroundColor: color.value, width: '28px', height: '28px', padding: 0, borderColor: uiPreferences.accentColor === color.value ? 'var(--w-primary)' : 'var(--w-border-color)' }}
                                                                                onClick={() => handleAccentColorChange(color.value)}
                                                                            >
                                                                                {uiPreferences.accentColor === color.value && <i className="fas fa-check" style={{ color: '#fff', fontSize: '0.7rem' }}></i>}
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
                                    </div>
                                </>
                            ) : (
                                <div className="nav-item">
                                    <Link to={'/login'} className="btn btn-sm btn-primary">Đăng nhập</Link>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </header>
            <MobileSidebar
                show={showMobileMenu}
                onClose={() => setShowMobileMenu(false)}
                navLinks={navLinks} // Truyền danh sách link
            />
            {isMobileSearchVisible && (
                <SearchPopup
                    show={showSearchPopup}
                    onClose={() => setShowSearchPopup(false)}
                />
            )}
        </>
    );
}

export default Header;