import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';

const AdminRoute = ({children}) => {
    const location = useLocation();
    const { user, isLoggedIn, loading } = useSelector((state) => state.user);
    const isAdmin = (roles) => {
        return roles && roles.includes("ROLE_ADMIN");
    };
    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <div>Đang kiểm tra quyền truy cập...</div>
            </div>
        );
    }

    if (isLoggedIn && isAdmin(user.roles)) {
        return children;
    }

    if (!isLoggedIn) {
         console.log("AdminRoute: Chưa đăng nhập, chuyển về /login");
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

     console.log("AdminRoute: Không phải admin, chuyển về /");
     return <Navigate to="/" replace />;

};

export default AdminRoute;