import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Bounce, toast, ToastContainer } from 'react-toastify';
import nProgress from 'nprogress';
import { io } from 'socket.io-client';
import eventBus from '@utils/eventBus';
import { checkTokenExpiration } from '@utils/tokenUtils';
import useDeviceType from '@hooks/useDeviceType';
import useUIPreferences, { ACCENT_COLORS } from '@hooks/useUIPreferences';
import { addNotification, clearNotificationState, fetchNotifications } from '@features/notificationSlice';
import { logoutUser as logoutAction, updateUserPointsAndLevel } from '@features/userSlice';
import { clearFriendState, getFriends } from '@features/friendSlice';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
    const { user: currentUser, isLoggedIn } = useSelector((state) => state.user);
    const dispatch = useDispatch();
    const deviceType = useDeviceType();
    const { preferences, setSinglePreference } = useUIPreferences();

    const [showFriendRequests, setShowFriendRequests] = useState(false);
    const [friends, setFriends] = useState([]);
    const [friendRequests, setFriendRequests] = useState([]);
    const [sentFriendRequests, setSentFriendRequests] = useState([]);

    const logOut = useCallback(() => {
        dispatch(logoutAction());
        dispatch(clearFriendState());
        dispatch(clearNotificationState());
    }, [dispatch]);

    useEffect(() => {
        checkTokenExpiration();
    }, []);

    useEffect(() => {
        let socketInstance = null;
        if (isLoggedIn && currentUser && currentUser.accessToken) {
            const SERVER_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

            socketInstance = io(SERVER_URL, {
                auth: { token: currentUser.accessToken },
                // transports: ['websocket', 'polling'] // Thêm polling làm fallback
            });
            socketInstance.on('connect', () => {
                // console.log('Socket.IO connected:', socketInstance.id);
            });

            socketInstance.on('connect_error', (error) => {
                console.error('Socket.IO connection error:', error);
                toast.error(`Không thể kết nối máy chủ thông báo: ${error.message}`, { autoClose: 7000 });
            });

            socketInstance.on('disconnect', (reason) => {
                // console.log('Socket.IO disconnected:', reason);
            });

            socketInstance.on('newNotification', (payload) => {
                if (payload && payload.notification) {
                    toast.info(<span dangerouslySetInnerHTML={{ __html: payload.notification.message }} />, {
                        icon: () => {
                            const iconClassMap = {
                                'LEVEL_UP': "🎉",
                                'NEW_BADGE': "🏅",
                                'DAILY_CHECK_IN_REWARD': "🎁",
                                'FRIEND_REQUEST': <i className="fas fa-user-plus text-primary"></i>,
                                'REQUEST_ACCEPTED': <i className="fas fa-user-check text-success"></i>,
                                'NEW_EPISODE': <i className="fas fa-tv text-info"></i>,
                                'NEW_CHAPTER': <i className="fas fa-book-open text-info"></i>,
                                'NEW_CONTENT_REPORT': <i className="fas fa-flag text-warning"></i>,
                                'REPORT_STATUS_UPDATE': <i className="fas fa-info-circle text-primary"></i>,
                                'REPLY_TO_COMMENT': <i className="fas fa-reply text-secondary"></i>,
                                'FRIEND_ACTIVITY_RATED_MOVIE': <i className="fas fa-star text-warning"></i>,
                                'SYSTEM_ANNOUNCEMENT': <i className="fas fa-bullhorn text-danger"></i>,
                                'default': <i className="fas fa-bell"></i>
                            };
                            const iconElement = iconClassMap[payload.notification.type] || iconClassMap.default;
                            return typeof iconElement === 'string' ? iconElement : React.cloneElement(iconElement, { style: { fontSize: '1.5em' } });
                        },
                        theme: document.documentElement.getAttribute("data-ww-theme") || "light",
                        transition: Bounce,
                        onClick: () => {
                            if (payload.notification.link && payload.notification.link !== '#') {
                                navigate(payload.notification.link); // Sử dụng navigate
                            }
                        }
                    });

                    dispatch(addNotification({
                        notification: payload.notification,
                        unreadCount: payload.unreadCount
                    }));
                    if (payload.notification.type === 'FRIEND_REQUEST' || payload.notification.type === 'REQUEST_ACCEPTED') {
                        dispatch(getFriends(currentUser.id));
                    }
                } else {
                    console.warn("Received socket notification with unexpected payload:", payload);
                }
            });

            socketInstance.on('userStatsUpdated', (data) => {
                console.log('Received userStatsUpdated event:', data);
                if (data.userId === currentUser.id) {
                    dispatch(updateUserPointsAndLevel({ points: data.points, level: data.level }));
                }
            });

            return () => {
                socketInstance.off('newNotification');
                socketInstance.off('userStatsUpdated');
                socketInstance.disconnect();
            };
        } else {
            if (socketInstance) {
                socketInstance.disconnect();
                socketInstance = null;
            }
        }
    }, [isLoggedIn, currentUser, logOut, dispatch]);

    useEffect(() => {
        if (isLoggedIn && currentUser) {
            dispatch(getFriends(currentUser.id))
                .unwrap()
                .then((response) => {
                    setFriends(response?.friends || []);
                    setFriendRequests(response?.friendRequests || []);
                    setSentFriendRequests(response?.sentFriendRequests || []);
                })
                .catch((error) => console.log(error, "Lỗi tải danh sách bạn bè"))
        }
    }, [dispatch, currentUser, isLoggedIn]);

    useEffect(() => {
        const handleLogoutEvent = () => {
            dispatch(logoutAction());
            dispatch(clearFriendState());
            dispatch(clearNotificationState());
        }
        eventBus.on("logout", handleLogoutEvent);
        return () => eventBus.remove("logout", handleLogoutEvent);
    }, [dispatch]);

    nProgress.configure({ easing: 'ease', speed: 500, showSpinner: false });

    useEffect(() => {
        localStorage.setItem("deviceType", deviceType);
    }, [deviceType]);

    useEffect(() => {
        if (currentUser?.activeTheme) {
            setSinglePreference('activeCustomTheme', currentUser.activeTheme);
        } else {
            setSinglePreference('activeCustomTheme', null);
        }
    }, [currentUser?.activeTheme, setSinglePreference]);

    const isMobile = useMemo(() => deviceType === "Mobile", [deviceType]);

    const value = {
        currentUser,
        isLoggedIn,
        logOut,
        isMobile,
        friends, setFriends,
        sentFriendRequests, setSentFriendRequests,
        showFriendRequests, setShowFriendRequests,
        friendRequests: Array.isArray(friendRequests) ? friendRequests : [], setFriendRequests,
        uiPreferences: preferences,
        setUIPreference: setSinglePreference,
        AVAILABLE_ACCENT_COLORS: ACCENT_COLORS
    };

    return (
        <AppContext.Provider value={value}>
            {children}
            <ToastContainer
                position="bottom-right"
                autoClose={3000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme={value.uiPreferences.theme === 'system' ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') : value.uiPreferences.theme}

            />
        </AppContext.Provider>
    );
};

export const useAppContext = () => useContext(AppContext);