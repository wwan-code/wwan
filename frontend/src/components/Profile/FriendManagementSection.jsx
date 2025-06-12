// src/components/Profile/FriendManagementSection.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import UserAvatarDisplay from '@components/Common/UserAvatarDisplay';
import classNames from '@utils/classNames';

const FriendManagementSection = React.memo(({
    friends = [],
    friendRequests = [],
    sentFriendRequests = [],
    loading,
    onAcceptRequest,
    onRejectRequest,
    onCancelRequest,
    onRemoveFriend,
    isPublicView = false,
    profileUserUuid = null
}) => {

    const renderFriendItem = (user, actions) => (
        <li key={user.id} className="friend-list-item">
            <Link to={`/profile/${user.uuid}`} className="friend-info">
                <UserAvatarDisplay userToDisplay={user} size="36" />
                <span className="friend-name" title={user.email || ''}>{user.name || 'Người dùng ẩn'}</span>
            </Link>
            {actions && <div className="friend-actions">{actions}</div>}
        </li>
    );

    const renderList = (title, items, renderItemActions, listType, icon) => (
        <div className={classNames("friend-list-section", `friend-list-section--${listType}`)}>
            <div className="friend-list-section__header">
                <h5 className="friend-list-section__title">{icon}{title}</h5>
                <span className="count-badge">({items.length})</span>
            </div>
            {loading && items.length === 0 ? (
                <div className="loading-placeholder--small text-center p-3"><span className="spinner--small"></span></div>
            ) : items.length > 0 ? (
                <ul className="friend-list-ul">
                    {items.map((item) => renderFriendItem(item.user || item, renderItemActions && renderItemActions(item.user || item)))}
                </ul>
            ) : (
                <p className="no-content-message small text-center">Danh sách trống.</p>
            )}
        </div>
    );

    if (isPublicView && friends.length === 0) {
        return <p className="no-content-message text-center">Người dùng này chưa có bạn bè hoặc đã ẩn danh sách.</p>;
    }

    return (
        <div className="friend-management-wrapper">
            {renderList(isPublicView ? `Bạn bè của ${profileUserUuid ? 'người này' : ''}` : "Bạn bè", friends, (friend) => (
                !isPublicView && (
                    <>
                        <button className="btn btn-icon btn-sm btn-danger" onClick={() => onRemoveFriend(friend.id)} title="Hủy kết bạn">
                            <i className="fas fa-user-minus"></i>
                        </button>
                        <button className="btn btn-icon btn-sm btn-primary" title="Nhắn tin">
                            <i className="fas fa-comment-dots"></i>
                        </button>
                    </>
                )
            ), 'friends', <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>)}

            {!isPublicView && (
                <>
                    {renderList("Yêu cầu kết bạn", friendRequests, (request) => (
                        <>
                            <button className="btn-icon btn--sm btn--success" onClick={() => onAcceptRequest(request.user.id)} title="Chấp nhận">
                                <i className="fas fa-user-check"></i>
                            </button>
                            <button className="btn-icon btn--sm btn--warning" onClick={() => onRejectRequest(request.user.id)} title="Từ chối">
                                <i className="fas fa-user-times"></i>
                            </button>
                        </>
                    ), 'received-requests', <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><line x1="19" x2="19" y1="8" y2="14"></line><line x1="22" x2="16" y1="11" y2="11"></line></svg>)}

                    {renderList("Lời mời đã gửi", sentFriendRequests, (request) => (
                        <button className="btn-icon btn--sm btn--secondary-ghost" onClick={() => onCancelRequest(request.id)} title="Hủy lời mời">
                            <i className="fas fa-user-clock"></i><span>Hủy</span>
                        </button>
                    ), 'sent-requests', <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>)}
                </>
            )}
        </div>
    );
});

export default FriendManagementSection;