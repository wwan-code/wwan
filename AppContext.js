import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Bounce, toast } from 'react-toastify';
import nProgress from 'nprogress';
import { io } from 'socket.io-client';
import eventBus from './utils/eventBus';
import { checkTokenExpiration } from './utils/tokenUtils';
import useDeviceType from './hooks/useDeviceType';
import useUIPreferences, { ACCENT_COLORS } from './hooks/useUIPreferences';
import { addNotification } from './features/notificationSlice';
import { logout as logoutAction, updateUserPointsAndLevel } from './features/userSlice';
import { clearFriendState } from './features/friendSlice';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
    const { user: currentUser, isLoggedIn } = useSelector((state) => state.user);
    const { friendRequests } = useSelector((state) => state.friends);
    const dispatch = useDispatch();
    const deviceType = useDeviceType();
    const { preferences, setSinglePreference } = useUIPreferences();

    const [showFriendRequests, setShowFriendRequests] = useState(false);

    // LogOut function
    const logOut = useCallback(() => {
        dispatch(logoutAction());
        dispatch(clearFriendState());
    }, [dispatch]);
    // Kiểm tra token khi ứng dụng khởi động
    useEffect(() => {
        checkTokenExpiration();
    }, []);

    useEffect(() => {
        if (isLoggedIn && currentUser) {
            const SERVER_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

            const socket = io(SERVER_URL, {
                auth: { token: currentUser.accessToken }
            });

            socket.on('newNotification', (payload) => {
                if (payload && payload.notification) {
                    toast.info(payload.notification.message, {
                        icon: payload.notification.iconUrl ? <i className={payload.notification.iconUrl}></i> :
                          (payload.notification.type === 'LEVEL_UP' || payload.notification.type === 'NEW_BADGE' || payload.notification.type === 'DAILY_CHECK_IN_REWARD' ? "🎉" : // Icon mặc định cho gamification
                          (payload.notification.type === 'FRIEND_REQUEST' ? <i className="fas fa-user-plus"></i> :
                          (payload.notification.type === 'REQUEST_ACCEPTED' ? <i className="fas fa-user-check"></i> :
                          (payload.notification.type === 'NEW_EPISODE' ? <i className="fas fa-tv"></i> :
                          (payload.notification.type === 'NEW_CONTENT_REPORT' ? <i className="fas fa-flag text-warning"></i> :
                          (payload.notification.type === 'REPORT_STATUS_UPDATE' ? <i className="fas fa-info-circle text-info"></i> :
                          <i className="fas fa-bell"></i>)))))), 
                        theme: document.documentElement.getAttribute("data-ww-theme") || "light",
                        transition: Bounce,
                        onClick: () => {
                            if (payload.notification.link && payload.notification.link !== '#') {
                                window.location.href = payload.notification.link;
                            }
                        }
                    });

                    // Dispatch action để thêm thông báo và cập nhật unreadCount
                    dispatch(addNotification({
                        notification: payload.notification,
                        unreadCount: payload.unreadCount
                    }));
                } else {
                    console.warn("Received socket notification with unexpected payload:", payload);
                }
            });

            socket.on('userStatsUpdated', (data) => {
                if (data.userId === currentUser.id) {
                    dispatch(updateUserPointsAndLevel({ points: data.points, level: data.level }));
                }
            });

            return () => {
                socket.off('newNotification');
                socket.off('userStatsUpdated');
                socket.disconnect();
            };
        }
    }, [isLoggedIn, currentUser, logOut, dispatch]);

    // Xử lý logout khi token hết hạn
    useEffect(() => {
        const handleLogout = () => {
            dispatch(logoutAction());
            dispatch(clearFriendState());
        }
        eventBus.on("logout", handleLogout);
        return () => eventBus.remove("logout", handleLogout);
    }, [dispatch]);

    nProgress.configure({ easing: 'ease', speed: 500, showSpinner: false });

    useEffect(() => {
        localStorage.setItem("deviceType", deviceType);
    }, [deviceType]);

    const value = {
        currentUser,
        isLoggedIn,
        logOut,
        showFriendRequests,
        setShowFriendRequests,
        friendRequests: Array.isArray(friendRequests) ? friendRequests : [],
        uiPreferences: preferences,
        setUIPreference: setSinglePreference,
        AVAILABLE_ACCENT_COLORS: ACCENT_COLORS
    };

    return (
        <AppContext.Provider value={value}>
            {children}
        </AppContext.Provider>
    );
};

export const useAppContext = () => useContext(AppContext);