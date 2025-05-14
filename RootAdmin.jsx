// RootAdmin.jsx
import { Outlet, useLocation } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import React, { useState, useEffect, useCallback, useMemo } from "react"; // Thêm useEffect, useCallback
import Sidebar from "./components/Admin/layout/Sidebar";
import Header from "./components/Admin/layout/Header";
import Footer from "./components/Admin/layout/Footer";
import useDeviceType from "./hooks/useDeviceType";
import classNames from "./utils/classNames"; // Import classNames
import { useAppContext } from "./AppContext";

const RootAdmin = () => {
    const deviceType = useDeviceType();
    const isMobile = useMemo(() => deviceType === "Mobile", [deviceType]);
    const location = useLocation();
    const { uiPreferences } = useAppContext();
    const [isCollapsed, setIsCollapsed] = useState(false); // Sidebar thu gọn trên desktop
    const [isMobileOpen, setIsMobileOpen] = useState(false); // Sidebar mở dạng overlay trên mobile

    // Hàm toggle chính, Header và Sidebar sẽ gọi hàm này
    const handleToggleSidebar = useCallback(() => {
        if (isMobile) {
            setIsMobileOpen(prev => !prev);
        } else {
            setIsCollapsed(prev => !prev);
        }
    }, [isMobile]);

    useEffect(() => {
        if (isMobile) {
            setIsMobileOpen(false);
        }
    }, [location, isMobile]);

    // Xử lý khi kích thước màn hình thay đổi
    useEffect(() => {
        const body = document.body;
        if (isMobile) {
            // Nếu đang ở mobile, đảm bảo không có class của desktop
            body.classList.remove('sidebar-desktop-collapsed', 'sidebar-desktop-expanded');
            if (isMobileOpen) {
                body.classList.add('sidebar-mobile-open');
            } else {
                body.classList.remove('sidebar-mobile-open');
            }
        } else {
            // Nếu đang ở desktop
            body.classList.remove('sidebar-mobile-open');
            if (isCollapsed) {
                body.classList.add('sidebar-desktop-collapsed');
                body.classList.remove('sidebar-desktop-expanded');
            } else {
                body.classList.add('sidebar-desktop-expanded');
                body.classList.remove('sidebar-desktop-collapsed');
            }
        }
    }, [isMobile, isMobileOpen, isCollapsed]);



    return (
        <>
            <Sidebar
                isCollapsed={isCollapsed} // Cho desktop
                isMobileOpen={isMobileOpen} // Cho mobile
                handleToggleSidebar={handleToggleSidebar}
                isMobile={isMobile}
            />
            {/* Thêm class vào wrapper để đẩy nội dung khi sidebar desktop không collapsed */}
            <div className={classNames("wrapper d-flex flex-column min-vh-100", {
                "wrapper-sidebar-collapsed": !isMobile && isCollapsed,
                "wrapper-sidebar-expanded": !isMobile && !isCollapsed
            })}>
                <Header handleToggleSidebar={handleToggleSidebar} />
                <div className="body flex-grow-1 px-3">
                    <Outlet />
                </div>
                <Footer />
            </div>
            {isMobile && isMobileOpen && (
                <div
                    className="sidebar-backdrop fade show"
                    onClick={handleToggleSidebar}
                ></div>
            )}
            <ToastContainer
                position="top-right"
                autoClose={3000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme={uiPreferences.theme === 'system' ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') : uiPreferences.theme}

            />
        </>
    );
};
export default RootAdmin;