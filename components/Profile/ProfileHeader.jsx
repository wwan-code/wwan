import React from 'react';
import { Link } from 'react-router-dom';
import classNames from '../../utils/classNames'; // Đảm bảo import đúng

const ProfileHeader = ({ currentUser, dropdownProps }) => {
    const { openDropdownId, toggleDropdown, dropdownRefCallback } = dropdownProps || {}; // Destructure an toàn

    // Hàm lấy URL avatar (chuyển từ component cha)
    const getAvatarUrl = () => {
        if (!currentUser) return ''; // Trả về rỗng nếu chưa có user
        if (!currentUser.avatar) {
            const namePart = currentUser.name || 'User'; // Lấy tên hoặc default
            const initials = namePart.split(' ').map(word => word[0]).join('').toUpperCase();
            return `https://ui-avatars.com/api/?name=${initials}&background=random&color=fff&size=128`; // Thêm size
        }
        // Giả sử avatar là đường dẫn tương đối
        return currentUser.avatar.startsWith('http') ? currentUser.avatar : `/${currentUser.avatar}`;
    };

    // Hàm lấy text trạng thái
    const getStatusBadge = () => {
        if (!currentUser) return null;
        switch (currentUser.status) {
            case 1: // Active (ví dụ)
                return <span className="badge bg-success">Hoạt động</span>;
            case 0: // Inactive
                return <span className="badge bg-secondary">Không hoạt động</span>;
            // Thêm các trạng thái khác nếu có
            default:
                return <span className="badge bg-light text-dark">Không rõ</span>;
        }
    };

    return (
        <div className="card">
            <div className="card-body">
                <div className="d-flex flex-column">
                    <div className="d-flex justify-content-between align-items-start mb-3">
                        <div className="d-flex align-items-center">
                            {/* Avatar với trạng thái online/offline */}
                            <div className={classNames("flex-shrink-0 avatar avatar-xl me-3", { // Thêm me-3
                                "avatar-online": currentUser?.status === 1, // Giả sử 1 là online
                                "avatar-offline": currentUser?.status === 0,
                                // Thêm các class trạng thái khác nếu cần
                            })}>
                                <img src={getAvatarUrl()} alt={currentUser?.name} className="rounded-circle" />
                            </div>
                            {/* Tên và trạng thái */}
                            <div className="flex-grow-1">
                                <h5 className="mb-1">{currentUser?.name || 'Người dùng'}</h5>
                                {getStatusBadge()}
                            </div>
                        </div>
                        {/* Dropdown Actions */}
                            <div className="dropdown" ref={(el) => dropdownRefCallback(el, 321)}>
                                <button
                                    className="btn btn-link text-secondary dropdown-toggle hide-arrow p-0" // Style lại nút
                                    type="button"
                                    aria-expanded={openDropdownId === 321}
                                    onClick={(e) => toggleDropdown(321, e)}
                                >
                                    <i className="fas fa-ellipsis-v"></i>
                                </button>
                                <div className={`dropdown-menu dropdown-menu-end ${openDropdownId === 321 ? "show" : ""}`}>
                                    <Link className="dropdown-item" to="/settings">Cài đặt tài khoản</Link>
                                    {currentUser?.roles?.includes('ROLE_ADMIN') && <Link className="dropdown-item" to={'/admin/dashboard'} target='_blank'>Trang quản trị</Link>}
                                    <li><hr className="dropdown-divider" /></li>
                                    <Link className="dropdown-item text-danger" to="/logout">Đăng xuất</Link>
                                </div>
                            </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfileHeader;