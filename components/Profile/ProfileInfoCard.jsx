// components/Profile/ProfileInfoCard.js
import React from 'react';

const ProfileInfoCard = ({
    currentUser,
    profileData, // Dùng cái này cho input khi edit
    isEditing,
    onEditToggle,
    onProfileChange,
    onSaveChanges,
    isLoading
}) => {
    // Hàm lấy vai trò (có thể chuyển ra ngoài)
    const getRoleName = (role) => {

        switch (role) {

            case 'ROLE_USER':

                return 'Người dùng';

            case 'ROLE_ADMIN':

                return 'Người quản trị';

            case 'ROLE_EDITOR':

                return 'Người chỉnh sửa';

            default:

                return role;

        }
    };

    return (
        <div className="card mb-3">
            <div className="card-header d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Thông tin cá nhân</h5>
                {!isEditing ? (
                    <button className="btn btn-primary btn-sm" onClick={onEditToggle}>Chỉnh sửa</button>
                ) : (
                    <button className="btn btn-secondary btn-sm" onClick={onEditToggle}>Hủy</button> // Nút Hủy
                )}
            </div>
            <div className="card-body">
                {isEditing && profileData ? ( // Đảm bảo profileData tồn tại khi edit
                    <form onSubmit={onSaveChanges}> {/* Dùng onSubmit cho form */}
                        {/* --- Các Input Fields --- */}
                        <div className="row mb-3 align-items-center">
                            <div className="col-sm-3"><h6 className="mb-0">Tên</h6></div>
                            <div className="col-sm-9">
                                <input type="text" name="name" className="form-control" value={profileData.name} onChange={onProfileChange} />
                            </div>
                        </div>
                        <hr />
                        <div className="row mb-3 align-items-center">
                            <div className="col-sm-3"><h6 className="mb-0">Email</h6></div>
                            <div className="col-sm-9">
                                <input type="email" name="email" className="form-control" value={profileData.email} onChange={onProfileChange} />
                            </div>
                        </div>
                        <hr />
                        <div className="row mb-3 align-items-center">
                            <div className="col-sm-3"><h6 className="mb-0">Số điện thoại</h6></div>
                            <div className="col-sm-9">
                                <input type="tel" name="phoneNumber" className="form-control" value={profileData.phoneNumber || ''} onChange={onProfileChange} />
                            </div>
                        </div>
                        <hr />
                        {/* UUID và Vai trò không cho sửa */}
                        <div className="row mb-3 align-items-center">
                            <div className="col-sm-3"><h6 className="mb-0">UUID</h6></div>
                            <div className="col-sm-9 text-secondary">{currentUser.uuid}</div>
                        </div>
                        <hr />
                        <div className="row mb-3 align-items-center">
                            <div className="col-sm-3"><h6 className="mb-0">Vai trò</h6></div>
                            <div className="col-sm-9 text-secondary">{currentUser.roles?.map(getRoleName).join(', ') || 'N/A'}</div>
                        </div>
                        <hr />
                        <div className="row">
                            <div className="col-sm-12">
                                <button type="submit" className="btn btn-success btn-sm" disabled={isLoading}>
                                    {isLoading && <span className="spinner-border spinner-border-sm me-1"></span>}
                                    Lưu thay đổi
                                </button>
                                {/* Nút hủy có thể đặt ở đây hoặc header */}
                                {/* <button type="button" className="btn btn-secondary btn-sm ms-2" onClick={onEditToggle}>Hủy</button> */}
                            </div>
                        </div>
                    </form>
                ) : (
                    <>
                        {/* --- Hiển thị thông tin --- */}
                        <div className="row">
                            <div className="col-sm-3"><h6 className="mb-0">Tên</h6></div>
                            <div className="col-sm-9 text-secondary">{currentUser?.name || 'N/A'}</div>
                        </div>
                        <hr />
                        {/* ... các dòng hiển thị khác ... */}
                        <div className="row">
                            <div className="col-sm-3"><h6 className="mb-0">Vai trò</h6></div>
                            <div className="col-sm-9 text-secondary">{currentUser?.roles?.map(getRoleName).join(', ') || 'N/A'}</div>
                        </div>
                        <hr />
                        <div className="row">
                            <div className="col-sm-3"><h6 className="mb-0">UUID</h6></div>
                            <div className="col-sm-9 text-secondary">{currentUser?.uuid || 'N/A'}</div>
                        </div>
                        {/* Không có nút Edit ở đây nữa, nó đã ở header card */}
                    </>
                )}
            </div>
        </div>
    );
};

export default ProfileInfoCard;