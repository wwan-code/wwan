// components/Notification/NotificationSwipeableItem.jsx
import { useState, useRef } from 'react';
import { useSwipeable } from 'react-swipeable';
import { useDispatch } from 'react-redux';
import { Bounce, toast } from 'react-toastify';
import classNames from '@utils/classNames';
import { deleteNotification } from '@features/notificationSlice';
import { Link } from 'react-router-dom';

const SWIPE_THRESHOLD_FOR_DELETE = 80;
const MAX_SWIPE_DISTANCE = 100;

const NotificationSwipeableItem = ({ notification, onClick }) => {
    const dispatch = useDispatch();
    const itemRef = useRef(null);
    const [swipeX, setSwipeX] = useState(0);
    const [isSwiping, setIsSwiping] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isHovered, setIsHovered] = useState(false);

    const performDelete = () => {
        if (isDeleting) return;
        setIsDeleting(true);

        dispatch(deleteNotification(notification.id))
            .unwrap()
            .then(() => {
                console.warn("Deleted notification:", notification.id);
            })
            .catch((err) => {
                toast.error(err.message || "Lỗi khi xóa thông báo.", {
                    position: "top-right",
                    theme: document.documentElement.getAttribute("data-ww-theme") || "light",
                    transition: Bounce
                });
                if (itemRef.current) {
                    itemRef.current.style.transition = 'transform 0.3s ease';
                    itemRef.current.style.transform = `translateX(0px)`;
                }
                setSwipeX(0);
                setIsDeleting(false);
            });
    };

    const swipeHandlers = useSwipeable({
        onSwiping: (eventData) => {
            if (isDeleting) return;
            setIsSwiping(true);
            const deltaX = Math.max(-MAX_SWIPE_DISTANCE, Math.min(0, eventData.deltaX));
            setSwipeX(deltaX);
            if (itemRef.current) {
                itemRef.current.style.transform = `translateX(${deltaX}px)`;
                itemRef.current.style.transition = 'none';
            }
        },
        onSwipedLeft: (eventData) => {
            setIsSwiping(false);
            if (isDeleting) return;

            if (Math.abs(eventData.deltaX) > SWIPE_THRESHOLD_FOR_DELETE) {
                performDelete();
            } else {
                if (itemRef.current) {
                    itemRef.current.style.transition = 'transform 0.3s ease';
                    itemRef.current.style.transform = `translateX(0px)`;
                }
                setSwipeX(0);
            }
        },
        onSwipedRight: (eventData) => {
            setIsSwiping(false);
            if (isDeleting) return;
            if (itemRef.current) {
                itemRef.current.style.transition = 'transform 0.3s ease';
                itemRef.current.style.transform = `translateX(0px)`;
            }
            setSwipeX(0);
        },
        trackMouse: true,
        preventScrollOnSwipe: true,
        delta: 10,
    });

    const handleItemClick = (e) => {
        if (!isSwiping && swipeX === 0) {
            onClick();
        }
    };

    const getNotificationIconElement = (type, iconUrlProvided, senderAvatar = null) => {
        if (iconUrlProvided && !iconUrlProvided.startsWith('fa')) {
            return <img src={iconUrlProvided.startsWith('http') ? iconUrlProvided : `/${iconUrlProvided}`} alt="icon" className="dropdown-notification__item--avatar" width="40"
                height="40" />;
        }
        if (senderAvatar && !iconUrlProvided?.startsWith('fa')) {
            return <img src={senderAvatar.startsWith('http') ? senderAvatar : `/${senderAvatar}`} alt="sender" className="dropdown-notification__item--avatar" width="40"
                height="40" />;
        }

        const iconClassMap = {
            'NEW_CONTENT_REPORT': 'fas fa-flag text-warning',
            'LEVEL_UP': 'fas fa-arrow-up text-success',
            'NEW_BADGE': 'fas fa-medal text-info',
            'DAILY_CHECK_IN_REWARD': 'fas fa-calendar-check text-primary',
            'FRIEND_REQUEST': 'fas fa-user-plus text-primary',
            'REQUEST_ACCEPTED': 'fas fa-user-check text-success',
            'NEW_EPISODE': 'fas fa-tv text-info',
            'NEW_CHAPTER': 'fas fa-book-open text-info', // Thêm cho truyện
            'REPORT_STATUS_UPDATE': 'fas fa-info-circle text-primary',
            'REPLY_TO_COMMENT': 'fas fa-reply text-secondary',
            'FRIEND_ACTIVITY_RATED_MOVIE': 'fas fa-star text-warning',
            'SYSTEM_ANNOUNCEMENT': 'fas fa-bullhorn text-danger',
            'default': 'fas fa-bell text-secondary'
        };
        return <i className={classNames("notification-item__icon-fa", iconUrlProvided || iconClassMap[type] || iconClassMap.default)}></i>;
    };
    return (
        <>
            <div
                className={classNames('dropdown-notification__item', {
                    'read': notification.isRead,
                    'unread': !notification.isRead,
                    'deleting': isDeleting
                })}
                ref={itemRef}
                role="button"
            >
                <div className="dropdown-notification__item--wrapper" onMouseEnter={
                            (e) => {
                                e.preventDefault();
                                setIsHovered(true);
                            }
                        }
                        onMouseLeave={
                            (e) => {
                                e.preventDefault();
                                setIsHovered(false);
                            }
                        }>
                    <Link
                        to={notification.link}
                        className="dropdown-notification__item--link"
                        onClick={handleItemClick}
                        
                    >
                        <div className="dropdown-notification__item--icon-wrapper">
                            {getNotificationIconElement(notification.type, notification.iconUrl, notification.sender?.avatar)}
                        </div>
                        <div className="dropdown-notification__item--content user-select-none">
                            <p className="dropdown-notification__item--text" dangerouslySetInnerHTML={{ __html: notification.message }}></p>
                            <div className="dropdown-notification__item--meta">
                                <span className="dropdown-notification__item--time">
                                    {new Date(notification.createdAt).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        </div>
                        {!notification.isRead && <span className="dropdown-notification__item--dot"></span>}
                    </Link>
                    <div
                        className={classNames('dropdown-notification__item--delete', {
                            'hovered': isHovered
                        })}
                        onClick={(e) => {
                            e.stopPropagation();
                            performDelete();
                        }}
                    >
                        <div className="dropdown-notification__item--delete-icon" aria-label="Xóa thông báo">
                            <i className="fas fa-trash"></i>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default NotificationSwipeableItem;