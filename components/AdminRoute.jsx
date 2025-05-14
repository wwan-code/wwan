// src/components/AdminRoute.jsx (Hoặc tên tương tự bạn dùng)
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';

const AdminRoute = ({children}) => {
    const location = useLocation();
    const { user, isLoggedIn, loading } = useSelector((state) => state.user);
    const isAdmin = (roles) => {
        return roles && roles.includes("ROLE_ADMIN");
    };
    // 1. Xử lý trạng thái đang tải thông tin xác thực
    if (loading) {
        // Quan trọng: Chờ context load xong trước khi kiểm tra quyền
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <div>Đang kiểm tra quyền truy cập...</div>
            </div>
        );
    }

    // 2. Kiểm tra đã đăng nhập VÀ có phải là admin không
    if (isLoggedIn && isAdmin(user.roles)) {
        // Nếu đúng, cho phép truy cập vào các route con
        return children; // Hoặc return children nếu bạn dùng props.children
    }

    // 3. Nếu chưa đăng nhập, chuyển về trang login
    if (!isLoggedIn) {
         console.log("AdminRoute: Chưa đăng nhập, chuyển về /login");
         // Lưu lại trang người dùng muốn vào để redirect lại sau khi login
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // 4. Nếu đã đăng nhập nhưng không phải admin, chuyển về trang chủ hoặc trang báo lỗi
     console.log("AdminRoute: Không phải admin, chuyển về /");
    // return <Navigate to="/error-not-authorized" replace />; // Chuyển đến trang lỗi riêng
     return <Navigate to="/" replace />; // Hoặc đơn giản là về trang chủ

};

export default AdminRoute;