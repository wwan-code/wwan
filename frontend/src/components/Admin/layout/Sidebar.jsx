// src/components/Admin/layout/Sidebar.jsx
import { Link, NavLink, useLocation } from "react-router-dom";
import "@assets/scss/_sidebar.scss";
import useRipple from "@hooks/useRipple";
import classNames from "@utils/classNames";
import logoMini from "@assets/images/wwan-icon.png";
import { useSelector } from "react-redux";
import React, { useRef } from "react";
import { useEffect } from "react";
import { getAvatarUrl } from "@utils/getAvatarUrl";

const Sidebar = React.memo(({ isCollapsed, isMobileOpen, handleToggleSidebar, isMobile }) => {
    const { user: currentUser } = useSelector((state) => state.user);
    const { createRipple } = useRipple();
    const location = useLocation();
    const sidebarRef = useRef(null);

    const handleToggleGroupClick = (e) => {
        if (!isMobile && isCollapsed && !sidebarRef.current?.classList.contains('sidebar-hover-unfold')) {
            e.preventDefault();
            return;
        }
        const toggleLink = e.target.closest('.nav-group-toggle');
        if (toggleLink) {
            const item = toggleLink.closest('.nav-group');
            if (item.classList.contains('show')) {
                close(item);
            } else {
                closeOthers(item);
                open(item);
            }
        }
    };

    const open = (item) => {
        if (!item || item.classList.contains('show')) return;
        const navGroupItems = item.querySelector('.nav-group-items');
        navGroupItems.style.height = `${navGroupItems.scrollHeight}px`;
        item.classList.add('show', 'active');
    };

    const close = (item) => {
        if (!item || !item.classList.contains('show')) return;
        const navGroupItems = item.querySelector('.nav-group-items');
        navGroupItems.style.height = '0';
        item.classList.remove('show', 'active');
    };

    const closeOthers = (item) => {
        const siblings = Array.from(item.parentNode.children).filter(
            (sibling) => sibling !== item && sibling.classList.contains('nav-group')
        );
        siblings.forEach((sibling) => close(sibling));
    };


    const handleMouseEnter = () => {
        if (!isMobile && isCollapsed) {
            sidebarRef.current?.classList.add('sidebar-hover-unfold');
        }
    };

    const handleMouseLeave = () => {
        if (!isMobile && isCollapsed) {
            sidebarRef.current?.classList.remove('sidebar-hover-unfold');
            // Đóng tất cả group con khi chuột rời khỏi nếu đang ở trạng thái collapsed
            const openGroups = sidebarRef.current?.querySelectorAll('.nav-group.show');
            openGroups?.forEach(group => close(group));
        }
    };

    useEffect(() => {
        if (!isMobile && isCollapsed) {
            const openGroups = sidebarRef.current?.querySelectorAll('.nav-group.show');
            openGroups?.forEach(group => close(group));
        }
    }, [isMobile, isCollapsed]);

    return (
        <div
            ref={sidebarRef}
            className={classNames(
                "sidebar sidebar-dark sidebar-fixed border-end",
                {
                    "sidebar-collapsed": !isMobile && isCollapsed,
                    "sidebar-unfoldable": !isMobile,
                    "sidebar-mobile-open": isMobile && isMobileOpen,
                }
            )}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            <div className="sidebar-header">
                <div className="sidebar-brand">
                    <img src={logoMini} alt="" className="sidebar-brand-img" />
                    <h4 className="sidebar-brand-text">
                        Admin
                    </h4>
                </div>

                {(isMobile || isCollapsed) && (
                    <button
                        className="btn-close"
                        type="button"
                        onClick={handleToggleSidebar}
                        aria-label="Close sidebar"
                    ></button>
                )}
            </div>
            <ul className="sidebar-nav simplebar-scrollable-y" >
                <div className="simplebar-wrapper">
                    <div className="simplebar-mask">
                        <div className="simplebar-offset">
                            <div className="simplebar-content-wrapper" tabIndex="0" role="region" aria-label="scrollable content">
                                <div className="simplebar-content">
                                    <li className="nav-item">
                                        <NavLink
                                            className={({ isActive }) => classNames("nav-link ripple-link", { "active": isActive })}
                                            to="/admin/dashboard"
                                            onClick={createRipple}
                                        >
                                            <i className="nav-icon fas fa-tachometer-alt"></i>
                                            <span className="nav-link-text">Dashboard</span>
                                        </NavLink>
                                    </li>

                                    <li className="nav-title"><span className="nav-link-text">Phân loại dữ liệu</span></li>
                                    <li className="nav-item">
                                        <NavLink className={({ isActive }) => classNames("nav-link ripple-link", { "active": isActive })} to="/admin/genre" onClick={createRipple}>
                                            <i className="fas fa-icons nav-icon"></i> <span className="nav-link-text">Thể Loại</span>
                                        </NavLink>
                                    </li>
                                    <li className="nav-item">
                                        <NavLink className={({ isActive }) => classNames("nav-link ripple-link", { "active": isActive })} to="/admin/category" onClick={createRipple}>
                                            <i className="fas fa-layer-group nav-icon"></i> <span className="nav-link-text">Danh mục</span>
                                        </NavLink>
                                    </li>
                                    <li className="nav-item">
                                        <NavLink className={({ isActive }) => classNames("nav-link ripple-link", { "active": isActive })} to="/admin/country" onClick={createRipple}>
                                            <i className="fas fa-globe nav-icon"></i> <span className="nav-link-text">Quốc gia</span>
                                        </NavLink>
                                    </li>

                                    <li className="nav-title"><span className="nav-link-text">Quản lý Nội dung</span></li>
                                    <li className={`nav-group ${location.pathname.startsWith('/admin/movie') ? 'show active' : ''}`}>
                                        <span role="button" className="nav-link nav-group-toggle" onClick={handleToggleGroupClick}>
                                            <i className="fas fa-film nav-icon"></i>
                                            <span className="nav-link-text">Phim</span>
                                        </span>
                                        <ul className="nav-group-items compact">
                                            <li className="nav-item">
                                                <Link
                                                    className={classNames('nav-link', { 'active': location.pathname === '/admin/movie/add' })} to="/admin/movie/add"
                                                    title="Add Movie"
                                                >
                                                    <span className="nav-icon nav-icon-bullet"></span><span className="nav-link-text">Thêm Phim Mới</span>
                                                </Link>
                                            </li>
                                            <li className="nav-item">
                                                <Link
                                                    className={classNames('nav-link', { 'active': location.pathname === '/admin/movie/list' })} to="/admin/movie/list"
                                                    title="List Movie"
                                                >
                                                    <span className="nav-icon nav-icon-bullet"></span><span className="nav-link-text">Danh sách Phim</span>
                                                </Link>
                                            </li>
                                        </ul>
                                    </li>
                                    <li className="nav-item">
                                        <NavLink className={({ isActive }) => classNames("nav-link ripple-link", { "active": isActive })} to="/admin/series" onClick={createRipple}>
                                            <i className="fas fa-photo-film nav-icon"></i><span className="nav-link-text">Series</span> {/* Đổi icon */}
                                        </NavLink>
                                    </li>
                                    <li className="nav-item">
                                        <NavLink className={({ isActive }) => classNames("nav-link ripple-link", { "active": isActive })} to="/admin/episode/list" onClick={createRipple}>
                                            <i className="fas fa-list-ul nav-icon"></i><span className="nav-link-text">List Episode</span>
                                        </NavLink>
                                    </li>
                                    <li className={`nav-group ${location.pathname.startsWith('/admin/comics') ? 'show active' : ''}`}>
                                        <span role="button" className="nav-link nav-group-toggle" onClick={handleToggleGroupClick}>
                                            <i className="fas fa-book-open nav-icon"></i>
                                            <span className="nav-link-text">Truyện tranh</span>
                                        </span>
                                        <ul className="nav-group-items compact">
                                            <li className="nav-item">
                                                <Link
                                                    className={classNames('nav-link', { 'active': location.pathname === '/admin/comics/add' })} to="/admin/comics/add"
                                                    title="Thêm Truyện tranh"
                                                >
                                                    <span className="nav-icon nav-icon-bullet"></span><span className="nav-link-text">Thêm Truyện Mới</span>
                                                </Link>
                                            </li>
                                            <li className="nav-item">
                                                <Link
                                                    className={classNames('nav-link', { 'active': location.pathname === '/admin/comics' })} to="/admin/comics"
                                                    title="Danh sách Truyện tranh"
                                                >
                                                    <span className="nav-icon nav-icon-bullet"></span><span className="nav-link-text">Danh sách Truyện</span>
                                                </Link>
                                            </li>
                                        </ul>
                                    </li>
                                    <li className="nav-title"><span className="nav-link-text">Tương tác Người dùng</span></li>
                                    <li className="nav-item">
                                        <NavLink className={({ isActive }) => classNames("nav-link ripple-link", { "active": isActive })} to="/admin/comments" onClick={createRipple}>
                                            <i className="fas fa-comments nav-icon"></i><span className="nav-link-text">Bình luận</span>
                                        </NavLink>
                                    </li>
                                    <li className="nav-item">
                                        <NavLink
                                            className={({ isActive, isPending }) =>
                                                classNames("nav-link ripple-link", { "pending": isPending, "active": isActive })
                                            }
                                            to="/admin/reports"
                                            onClick={createRipple}
                                        >
                                            <i className="fa-regular fa-flag nav-icon"></i>
                                            <span className="nav-link-text">Báo cáo Nội dung</span>
                                        </NavLink>
                                    </li>
                                    <li className="nav-item">
                                        <NavLink className={({ isActive }) => classNames("nav-link ripple-link", { "active": isActive })} to="/admin/users" onClick={createRipple}>
                                            <i className="fas fa-users-cog nav-icon"></i><span className="nav-link-text">Người dùng</span>
                                        </NavLink>
                                    </li>
                                    <li className="nav-title"><span className="nav-link-text">Gamification</span></li>
                                    <li className="nav-item">
                                        <NavLink
                                            className={({ isActive }) => classNames("nav-link ripple-link", { "active": isActive })}
                                            to="/admin/shop-items" // Link đến trang quản lý shop
                                            onClick={createRipple}
                                        >
                                            <i className="fas fa-store nav-icon"></i> {/* Icon cửa hàng */}
                                            <span className="nav-link-text">Quản lý Cửa hàng</span>
                                        </NavLink>
                                    </li>
                                    <li className="nav-item">
                                        <NavLink
                                            className={({ isActive }) => classNames("nav-link ripple-link", { "active": isActive })}
                                            to="/admin/badges"
                                            onClick={createRipple}
                                        >
                                            <i className="fas fa-medal nav-icon"></i>
                                            <span className="nav-link-text">Quản lý Huy hiệu</span>
                                        </NavLink>
                                    </li>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="simplebar-placeholder">
                    </div>
                </div>
            </ul>
            {!isMobile && (
                <div className="sidebar-footer border-top">
                    <div className="sidebar-footer-content">
                        {currentUser && (
                            <div className="sidebar-user">
                                <div className="avatar avatar-sm sidebar-user-avatar">
                                    <img className="avatar-img" src={getAvatarUrl(currentUser)} alt={currentUser.name} />
                                </div>
                                <div className="sidebar-user-details">
                                    <div className="sidebar-user-name">
                                        {currentUser.name || "Admin"}
                                    </div>
                                    <div className="sidebar-user-role">
                                        {currentUser.roles?.map((role, index) => {
                                            let label = "";
                                            switch (role) {
                                                case "ROLE_ADMIN":
                                                    label = "Admin";
                                                    break;
                                                case "ROLE_EDITOR":
                                                    label = "Editor";
                                                    break;
                                                case "ROLE_USER":
                                                    label = "User";
                                                    break;
                                                default:
                                                    label = role.replace(/^ROLE_/, "");
                                            }
                                            return (
                                                <span key={index} className="badge bg-secondary me-1">{label}</span>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="sidebar-footer-end d-flex align-items-center justify-content-center">
                        <button className="sidebar-toggler" type="button" data-coreui-toggle="unfoldable"
                            onClick={handleToggleSidebar}
                            aria-label={isCollapsed ? "Mở rộng sidebar" : "Thu gọn sidebar"}></button>
                    </div>
                </div>
            )}
        </div>
    )
});

export default Sidebar;