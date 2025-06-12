import React from 'react';
import { Link } from 'react-router-dom';

const SocialLinksCard = React.memo(({ socialLinks, isEditing, onSocialLinkChange }) => {
    const links = socialLinks || {};
    // Helper để render từng dòng link
    const renderLinkItem = (key, label, iconClass, colorClass = '') => {
        const value = links[key] || '';
        if (!isEditing && !value) return null;

        return (
            <li key={key} className="list-group-item d-flex justify-content-between align-items-center flex-wrap px-0 py-2">
                <h6 className={`mb-0 d-flex align-items-center ${colorClass}`}>
                    <i className={`feather feather-${key} me-2 icon-inline ${iconClass}`}></i>{label}
                </h6>
                {isEditing ? (
                    <input
                        type="text"
                        name={key}
                        className="form-control form-control-sm w-auto flex-grow-1 ms-2"
                        value={value}
                        onChange={onSocialLinkChange}
                        placeholder={`Nhập link ${label}`}
                    />
                ) : (
                    <Link to={value} target="_blank" rel="noopener noreferrer" className="text-secondary text-decoration-none text-truncate ms-2" style={{ maxWidth: '60%' }}>
                        {value || 'Chưa cập nhật'}
                    </Link>
                )}
            </li>
        );
    };

    return (
        <div className="profile-section-card card-profile">
            <ul className="list-group list-group-flush">
                {renderLinkItem('github', 'Github', 'fa-brands fa-github')}
                {renderLinkItem('twitter', 'Twitter', 'fa-brands fa-twitter', 'text-info')}
                {renderLinkItem('instagram', 'Instagram', 'fa-brands fa-instagram', 'text-danger')}
                {renderLinkItem('facebook', 'Facebook', 'fa-brands fa-facebook', 'text-primary')}
            </ul>
        </div>
    );
});

export default SocialLinksCard;