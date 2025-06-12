// src/components/Profile/ProfileInfoCard.jsx
import React from 'react';
import classNames from '@utils/classNames';
import UserAvatarDisplay from '@components/Common/UserAvatarDisplay';

const ProfileInfoCard = React.memo(({
    currentUser,
    profileEditData,
    isEditing,
    onEditToggle,
    onProfileDataChange,
    onAvatarChange,
    onRemoveAvatar,
    onSaveChanges,
    isLoading
}) => {
    const getRoleName = (roleName) => {
        switch (roleName) {
            case 'user': return 'Thành viên';
            case 'admin': return 'Quản trị viên';
            case 'editor': return 'Biên tập viên';
            default: return roleName.charAt(0).toUpperCase() + roleName.slice(1);
        }
    };

    const renderInfoRow = (label, value, isLink = false, linkHref = "#") => (
        <>
            <div className="profile-info-row">
                <span className="profile-info-label">{label}</span>
                {isLink && value ? (
                    <a href={linkHref} target="_blank" rel="noopener noreferrer" className="profile-info-value link">
                        {value}
                    </a>
                ) : (
                    <span className="profile-info-value">{value || 'Chưa cập nhật'}</span>
                )}
            </div>
            <hr className="profile-info-divider" />
        </>
    );

    return (
        <div className="profile-content-section" id="profile-info-section">
            <div className="profile-content-section__header">
                <h4 className="profile-content-section__title">
                    <i className="fas fa-id-card icon-before"></i>Thông tin cá nhân
                </h4>
                {!isEditing ? (
                    <button className="btn btn-outline-primary btn-sm" onClick={onEditToggle}>
                        <i className="fas fa-pencil-alt me-2"></i>Chỉnh sửa
                    </button>
                ) : (
                    <button className="btn btn-secondary btn-sm" onClick={onEditToggle} disabled={isLoading}>
                        Hủy
                    </button>
                )}
            </div>

            {isEditing && profileEditData ? (
                <form onSubmit={onSaveChanges} className="custom-form profile-edit-form">
                    <div className="profile-edit-avatar-section">
                        <label htmlFor="profileAvatarFile" className="profile-edit-avatar-label">
                            <UserAvatarDisplay
                                userToDisplay={{ avatar: profileEditData.avatarPreview || currentUser?.avatar }}
                                size="100"
                                className="profile-edit-avatar-preview"
                            />
                            <div className="profile-edit-avatar-overlay">
                                <i className="fas fa-camera"></i>
                                <span>Đổi ảnh</span>
                            </div>
                        </label>
                        <input
                            type="file"
                            id="profileAvatarFile"
                            accept="image/*"
                            onChange={onAvatarChange}
                            style={{ display: 'none' }}
                            disabled={isLoading}
                        />
                        {profileEditData.avatarPreview && (
                             <button type="button" className="btn btn-text-danger btn-sm mt-2" onClick={onRemoveAvatar} disabled={isLoading}>
                                Xóa ảnh đã chọn
                            </button>
                        )}
                    </div>

                    <div className="form-grid">
                        <div className="form-group">
                            <label htmlFor="profileName" className="form-label">Tên hiển thị</label>
                            <input type="text" id="profileName" name="name" className="form-control"
                                value={profileEditData.name} onChange={onProfileDataChange} disabled={isLoading} />
                        </div>
                        <div className="form-group">
                            <label htmlFor="profileEmail" className="form-label">Email (không thể đổi)</label>
                            <input type="email" id="profileEmail" className="form-control" value={currentUser?.email || ''} readOnly disabled />
                        </div>
                        <div className="form-group">
                            <label htmlFor="profilePhoneNumber" className="form-label">Số điện thoại</label>
                            <input type="tel" id="profilePhoneNumber" name="phoneNumber" className="form-control"
                                value={profileEditData.phoneNumber || ''} onChange={onProfileDataChange} disabled={isLoading} />
                        </div>
                        {/* UUID và Vai trò không cho sửa */}
                        <div className="form-group">
                            <label className="form-label">UUID</label>
                            <p className="form-control-static">{currentUser?.uuid}</p>
                        </div>
                         <div className="form-group">
                            <label className="form-label">Vai trò</label>
                            <p className="form-control-static">
                                {currentUser?.roles?.map(role => getRoleName(role.replace('ROLE_', '').toLowerCase())).join(', ') || 'N/A'}
                            </p>
                        </div>
                    </div>
                    <div className="form-actions mt-3">
                        <button type="submit" className="btn-custom btn--primary" disabled={isLoading}>
                            {isLoading ? <span className="spinner--small"></span> : "Lưu Thay Đổi"}
                        </button>
                    </div>
                </form>
            ) : (
                <div className="profile-info-display">
                    {renderInfoRow("Tên hiển thị", currentUser?.name)}
                    {renderInfoRow("Email", currentUser?.email)}
                    {renderInfoRow("Số điện thoại", currentUser?.phoneNumber)}
                    {renderInfoRow("UUID", currentUser?.uuid)}
                    {renderInfoRow("Vai trò", currentUser?.roles?.map(role => getRoleName(role.replace('ROLE_', '').toLowerCase())).join(', '))}
                    {renderInfoRow("Ngày tham gia", currentUser?.createdAt ? new Date(currentUser.createdAt).toLocaleDateString('vi-VN') : 'N/A')}
                </div>
            )}
        </div>
    );
});

export default ProfileInfoCard;