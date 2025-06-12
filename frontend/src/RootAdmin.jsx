// RootAdmin.jsx
import { Outlet, useLocation } from "react-router-dom";
import React, { useState, useEffect, useCallback, useMemo } from "react";
import Sidebar from "@components/Admin/layout/Sidebar";
import Header from "@components/Admin/layout/Header";
import Footer from "@components/Admin/layout/Footer";
import useDeviceType from "@hooks/useDeviceType";
import classNames from "@utils/classNames";

const RootAdmin = () => {
    const deviceType = useDeviceType();
    const isMobile = useMemo(() => deviceType === "Mobile", [deviceType]);
    const location = useLocation();
    
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isMobileOpen, setIsMobileOpen] = useState(false);

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
            body.classList.remove('sidebar-desktop-collapsed', 'sidebar-desktop-expanded');
            if (isMobileOpen) {
                body.classList.add('sidebar-mobile-open');
            } else {
                body.classList.remove('sidebar-mobile-open');
            }
        } else {
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
                isCollapsed={isCollapsed}
                isMobileOpen={isMobileOpen}
                handleToggleSidebar={handleToggleSidebar}
                isMobile={isMobile}
            />
            <div className={classNames("wrapper d-flex flex-column min-vh-100", {
                "wrapper-sidebar-collapsed": !isMobile && isCollapsed,
                "wrapper-sidebar-expanded": !isMobile && !isCollapsed
            })}>
                <Header handleToggleSidebar={handleToggleSidebar} />
                <div className="body flex-grow-1 px-3 position-relative">
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
            
        </>
    );
};
export default RootAdmin;