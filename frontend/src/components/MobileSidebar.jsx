// src/components/MobileSidebar.jsx
import { NavLink, Link } from 'react-router-dom';
import classNames from '@utils/classNames';
import logoW from '@assets/images/wwan-logo-text.png';
import { useAppContext } from '@contexts/AppContext';

const MobileSidebar = ({ show, onClose, navLinks }) => {
    const { isMobile } = useAppContext();

    return (
        <>
         {
            isMobile && <div
                className={classNames("mobile-sidebar-overlay", { "active": show })}
                onClick={onClose}
            ></div>
         }
            

            <div className={classNames("mobile-sidebar", { "open": show })}>
                <div className="mobile-sidebar-header">
                    <Link to="/" onClick={onClose} className="sidebar-logo">
                        <img src={logoW} alt="Logo" />
                    </Link>
                    <button className="mobile-sidebar-close-btn" onClick={onClose} aria-label="Đóng menu">
                        <i className="fas fa-times"></i>
                    </button>
                </div>
                <nav className="mobile-sidebar-nav">
                    <ul>
                        {navLinks.map(link => (
                            <li key={link.to}>
                                <NavLink
                                    to={link.to}
                                    className={({ isActive }) => classNames("sidebar-nav-link", isActive && "active")}
                                    onClick={onClose} // Đóng sidebar khi nhấn link
                                    end={link.exact}
                                >
                                    {link.label}
                                </NavLink>
                            </li>
                        ))}
                        {/* Bạn có thể thêm các link hoặc thông tin khác ở đây */}
                    </ul>
                </nav>
                {/* Optional: Footer trong sidebar */}
                <div className="mobile-sidebar-footer">
                    <p>&copy; {new Date().getFullYear()} {process.env.REACT_APP_NAME}</p>
                </div>
            </div>
        </>
    );
};

export default MobileSidebar;