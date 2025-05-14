import React from 'react';

const FriendManagementSection = ({
    friends = [],
    friendRequests = [],
    sentFriendRequests = [],
    loading,
    onAcceptRequest,
    onRejectRequest,
    onCancelRequest,
    onRemoveFriend,
}) => {

    // Helper render danh sách (có thể tách thành component nhỏ hơn nữa)
    const renderList = (title, items, renderItemActions) => (
        <div className="card mt-3">
            <div className="card-header">
                <h5 className="mb-0">{title} ({items.length})</h5>
            </div>
            <div className="card-body p-0">
                {loading ? (
                    <div className="p-3 text-center"><i className="fas fa-spinner fa-spin"></i> Đang tải...</div>
                ) : items.length > 0 ? (
                    <ul className="list-group list-group-flush">
                        {items.map((item) => (
                            <li key={item.id} className="list-group-item d-flex justify-content-between align-items-center flex-wrap gap-2">
                                <span title={item.email || ''}>{item.name || 'Người dùng ẩn'}</span>
                                <div className="d-flex gap-2 flex-wrap">
                                     {renderItemActions(item)}
                                </div>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="p-3 text-muted mb-0">Danh sách trống.</p>
                )}
            </div>
        </div>
    );

    return (
        <>
            {/* Danh sách bạn bè */}
            {renderList("Bạn bè", friends, (friend) => (
                <>
                    <button className="btn btn-sm btn-icon btn-danger" onClick={() => onRemoveFriend(friend.id)}>
                        <i className="fas fa-user-times"></i>
                    </button>
                    <button className="btn btn-sm btn-icon btn-outline-primary me-1">
                        <i className="fas fa-comment-dots"></i>
                    </button>
                </>
            ))}

             {/* Yêu cầu kết bạn đã nhận */}
             {renderList("Yêu cầu kết bạn", friendRequests, (request) => (
                <>
                    <button className="btn btn-sm btn-icon btn-success" onClick={() => onAcceptRequest(request.id)}>
                        <i className="fas fa-check"></i>
                    </button>
                    <button className="btn btn-sm btn-icon btn-warning" onClick={() => onRejectRequest(request.id)}>
                        <i className="fas fa-times"></i>
                    </button>
                </>
            ))}

            {/* Lời mời kết bạn đã gửi */}
             {renderList("Lời mời đã gửi", sentFriendRequests, (request) => (
                <>
                    <button className="btn btn-sm btn-icon btn-outline-secondary" onClick={() => onCancelRequest(request.id)}>
                        <i className="fas fa-times"></i>
                    </button>
                </>
            ))}
        </>
    );
};

export default FriendManagementSection;