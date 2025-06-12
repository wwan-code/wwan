import React, { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';
import classNames from '@utils/classNames';
import UserAvatarDisplay from '@components/Common/UserAvatarDisplay';
import { useDispatch, useSelector } from 'react-redux';
import authHeader from '@services/auth-header';
import { sendFriendRequest, cancelFriendRequest, removeFriend, acceptFriendRequest, rejectFriendRequest, getFriends } from '@features/friendSlice';
import { updateUserPointsAndLevel } from '@features/userSlice';
import useDropdown from '@hooks/useDropdown';
import axios from 'axios';


const ProfileHeader = React.memo(({ profileUser }) => {
    const { openDropdown, toggleDropdown, dropdownRefCallback } = useDropdown()
    const dispatch = useDispatch();
    const { user: currentUser, isLoggedIn } = useSelector((state) => state.user);
    const { friends, friendRequests: friendRequestsReceived, sentFriendRequests: friendRequestsSent } = useSelector((state) => state.friends);
    const [friendshipStatus, setFriendshipStatus] = useState('none');
    const [actionLoading, setActionLoading] = useState(false);

    const [isCheckingIn, setIsCheckingIn] = useState(false);
    const [canCheckInToday, setCanCheckInToday] = useState(false);

    useEffect(() => {
        if (isLoggedIn && currentUser && profileUser) {
            if (currentUser.id === profileUser.id) setFriendshipStatus('self');
            else if (friends && friends.some(friend => friend.id === profileUser.id)) setFriendshipStatus('friends');
            else if (friendRequestsSent && friendRequestsSent.some(req => req.id === profileUser.id)) setFriendshipStatus('request_sent');
            else if (friendRequestsReceived && friendRequestsReceived.some(req => req.id === profileUser.id)) setFriendshipStatus('request_received');
            else setFriendshipStatus('none');
        } else { setFriendshipStatus('none'); }
    }, [currentUser, profileUser, friends, friendRequestsReceived, friendRequestsSent, isLoggedIn]);

    const profilePageStyle = profileUser?.activeProfileBackground
        ? {
            backgroundImage: `url(${process.env.REACT_APP_API_URL}/${profileUser.activeProfileBackground})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center center',
            backgroundRepeat: 'no-repeat',
        }
        : {};
    const handleDailyCheckIn = async () => {
        if (!isLoggedIn) {
            toast.info("Vui lòng đăng nhập để điểm danh.");
            return;
        }
        if (!canCheckInToday) {
            toast.info("Hôm nay bạn đã điểm danh rồi!");
            return;
        }

        setIsCheckingIn(true);
        try {
            const response = await axios.post('/api/gamification/daily-check-in', {}, { headers: authHeader() });
            if (response.data?.success) {
                toast.success(response.data.message);
                dispatch(updateUserPointsAndLevel({
                    points: response.data.points,
                    level: response.data.level,
                    lastLoginStreakAt: response.data.lastCheckIn
                }));
                setCanCheckInToday(false);

                dispatch({
                    type: 'user/updateUser',
                    payload: { ...currentUser, lastLoginStreakAt: response.data.lastCheckIn }
                });

            } else {
                toast.error(response.data?.message || "Điểm danh thất bại.");
            }
        } catch (error) {
            console.error("Lỗi điểm danh:", error);
            toast.error(error.response?.data?.message || "Lỗi khi điểm danh.");
        } finally {
            setIsCheckingIn(false);
        }
    };
    const checkIfCanCheckIn = useCallback(() => {
        if (!currentUser || !currentUser.lastLoginStreakAt) {
            setCanCheckInToday(true);
            return;
        }
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const lastCheckInDate = new Date(currentUser.lastLoginStreakAt);
        lastCheckInDate.setHours(0, 0, 0, 0);

        setCanCheckInToday(lastCheckInDate < today);
    }, [currentUser]);

    useEffect(() => {
        if (isLoggedIn) {
            checkIfCanCheckIn();
        } else {
            setCanCheckInToday(false);
        }
    }, [isLoggedIn, currentUser, checkIfCanCheckIn]);
    const handleFriendAction = async (actionThunk, successMessage, errorMessage) => {
        if (!isLoggedIn || !profileUser || actionLoading) return;
        setActionLoading(true);
        try {
            await dispatch(actionThunk(profileUser.id)).unwrap();
            toast.success(successMessage);
            if (currentUser) dispatch(getFriends(currentUser.id));
        } catch (error) {
            toast.error(error?.message || errorMessage);
        } finally {
            setActionLoading(false);
        }
    };
    const renderFriendActionButton = () => {
        if (!isLoggedIn || friendshipStatus === 'self' || !profileUser) return null;

        switch (friendshipStatus) {
            case 'none':
                return <div className="mt-2"><button className="btn btn-primary btn-sm" onClick={() => handleFriendAction(sendFriendRequest, `Đã gửi lời mời đến ${profileUser.name}.`, "Gửi lời mời thất bại.")} disabled={actionLoading}>
                    {actionLoading ? <span className="spinner--small"></span> : <><i className="fas fa-user-plus me-2"></i> Kết bạn</>}
                </button></div>;
            case 'request_sent':
                return <div className="mt-2"><button className="btn btn-secondary btn-sm" onClick={() => handleFriendAction(cancelFriendRequest, "Đã hủy lời mời kết bạn.", "Hủy lời mời thất bại.")} disabled={actionLoading}>
                    {actionLoading ? <span className="spinner--small"></span> : <><i className="fas fa-user-clock me-2"></i> Đã gửi lời mời</>}
                </button></div>;
            case 'request_received':
                return (
                    <div className="mt-2 d-flex g-2">
                        <button className="btn btn-success btn-sm me-2" onClick={() => handleFriendAction(acceptFriendRequest, `Đã chấp nhận lời mời từ ${profileUser.name}.`, "Chấp nhận thất bại.")} disabled={actionLoading}>
                            {actionLoading ? <span className="spinner--small"></span> : <><i className="fas fa-user-check me-2"></i> Chấp nhận</>}
                        </button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleFriendAction(rejectFriendRequest, "Đã từ chối lời mời.", "Từ chối thất bại.")} disabled={actionLoading}>
                            {actionLoading ? <span className="spinner--small"></span> : <><i className="fas fa-user-times me-2"></i> Từ chối</>}
                        </button>
                    </div>
                );
            case 'friends':
                return <button className="btn btn-warning btn-sm" onClick={() => handleFriendAction(removeFriend, `Đã hủy kết bạn với ${profileUser.name}.`, "Hủy bạn thất bại.")} disabled={actionLoading}>
                    {actionLoading ? <span className="spinner--small"></span> : <><i className="fas fa-user-minus me-2"></i> Hủy bạn</>}
                </button>;
            default: return null;
        }
    };
    return (
        <div className="profile-section-card card-profile" style={profilePageStyle}>
            <div className="profile-section-card__content">
                <div className="d-flex flex-column">
                    <div className="d-flex justify-content-between align-items-start">
                        <div className="d-flex align-items-center">
                            <div className={classNames("flex-shrink-0 me-2")}>
                                <UserAvatarDisplay userToDisplay={profileUser} size={"70"} />
                            </div>
                            <div className="flex-grow-1">
                                <div className="d-flex flex-column">
                                    <h5 className={classNames("mb-1", profileUser.activeChatColor)}>{profileUser?.name || 'Người dùng'}</h5>
                                    <small className="text-light text-shadow">
                                        <i className="fas fa-calendar-alt me-2"></i>
                                        Tham gia từ: {new Date(profileUser.createdAt).toLocaleDateString('vi-VN')}
                                    </small>
                                </div>
                                {renderFriendActionButton()}
                            </div>
                        </div>
                        {
                            currentUser && profileUser?.id === currentUser?.id && (
                                <div className="dropdown" ref={(el) => dropdownRefCallback(el, 321)}>
                            <button
                                className="btn btn-link text-light text-shadow dropdown-toggle hide-arrow p-0"
                                type="button"
                                aria-expanded={openDropdown === 321}
                                onClick={(e) => toggleDropdown(321, e)}
                            >
                                <i className="fas fa-ellipsis-v icon-base"></i>
                            </button>
                            <div className={`dropdown-menu dropdown-menu-end ${openDropdown === 321 ? "show" : ""}`} data-bs-popper>
                                <Link className="dropdown-item" to="/settings">
                                    <i className="fas fa-user-cog me-2 icon-base"></i>
                                    Cài đặt
                                </Link>
                                {profileUser?.roles?.includes('ROLE_ADMIN') && (
                                    <Link className="dropdown-item" to={'/admin/dashboard'} target='_blank'>
                                        <i className="fas fa-dashboard me-2 icon-base"></i>
                                        Trang quản trị
                                    </Link>
                                )}
                                {isLoggedIn && (
                                    <button
                                        className={`dropdown-item`}
                                        onClick={handleDailyCheckIn}
                                        disabled={!canCheckInToday || isCheckingIn}
                                        aria-label="Điểm danh"
                                    >
                                        {isCheckingIn ? (
                                            <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                                        ) : canCheckInToday ? (
                                            <>
                                                <i className="fas fa-check-circle me-2 icon-base"></i>
                                                Điểm danh
                                            </>
                                        ) : (
                                            <>
                                                <i className="fas fa-check-circle me-2 icon-base"></i>
                                                Đã điểm danh
                                            </>
                                        )}
                                    </button>
                                )}
                                <hr className="dropdown-divider" />
                                <Link className="dropdown-item text-danger" to="/logout">Đăng xuất</Link>
                            </div>
                        </div>
                            )
                        }
                        
                    </div>
                </div>
            </div>
        </div>
    );
});

export default ProfileHeader;