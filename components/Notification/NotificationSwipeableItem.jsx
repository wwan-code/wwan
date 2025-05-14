// components/Notification/NotificationSwipeableItem.jsx
import React, { useState, useRef } from 'react'; // Thêm useRef
import { useSwipeable } from 'react-swipeable';
import { useDispatch } from 'react-redux';
import { Bounce, toast } from 'react-toastify';
import classNames from '../../utils/classNames';
import { deleteNotification } from '../../features/notificationSlice';

const SWIPE_THRESHOLD_FOR_DELETE = 80; // Ngưỡng kéo (px) để kích hoạt xóa
const MAX_SWIPE_DISTANCE = 100; // Khoảng cách kéo tối đa (px) mà item sẽ di chuyển

const NotificationSwipeableItem = ({ notification, onClick }) => {
    const dispatch = useDispatch();
    const itemRef = useRef(null);
    const [swipeX, setSwipeX] = useState(0);
    const [isSwiping, setIsSwiping] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false); // State để quản lý trạng thái đang xóa

    const performDelete = () => {
        if (isDeleting) return; // Tránh gọi xóa nhiều lần
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
                // Nếu xóa lỗi, đưa item về vị trí cũ
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
            if (isDeleting) return; // Không cho kéo nữa nếu đang trong quá trình xóa
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
                // Khi kéo vượt ngưỡng, thực hiện xóa trực tiếp
                performDelete();
            } else {
                // Nếu kéo không đủ ngưỡng, đưa item về vị trí cũ
                if (itemRef.current) {
                    itemRef.current.style.transition = 'transform 0.3s ease';
                    itemRef.current.style.transform = `translateX(0px)`;
                }
                setSwipeX(0);
            }
        },
        onSwipedRight: (eventData) => { // Vẫn giữ để kéo sang phải thì reset
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


    return (
        <div
            ref={itemRef}
            {...swipeHandlers}
            className={classNames('dropdown-item notification-item', {
                'read': notification.isRead,
                'unread': !notification.isRead,
                'deleting': isDeleting
            })}
            onClick={handleItemClick} // Sử dụng handler click mới
            role="button"
            style={{
                touchAction: 'pan-y', // Cho phép cuộn dọc
                position: 'relative', // Cần để nút xóa (nếu có) định vị đúng
                transform: `translateX(${swipeX}px)`, // Sẽ được set trực tiếp qua ref
                transition: (!isSwiping && !isDeleting) ? 'transform 0.3s ease, opacity 0.3s ease' : 'none',
                opacity: isDeleting ? 0.5 : 1,
            }}
        >
            <button
                className="notification-delete-action"
                style={{
                    right: `-${Math.abs(swipeX)}px`,
                    width: `${MAX_SWIPE_DISTANCE}px`,
                    opacity: Math.abs(swipeX) / MAX_SWIPE_DISTANCE,
                }}
                onClick={(e) => {
                    e.stopPropagation();
                }}>
                Xóa
            </button>


            <div className="d-flex align-items-start">
                {notification.sender?.avatar ? (
                    <img src={notification.sender.avatar.startsWith('http') ? notification.sender.avatar : `/${notification.sender.avatar}`} alt={notification.sender.name} className="avatar avatar-xs rounded-circle me-2 mt-1" />
                ) : notification.iconUrl ? (
                    <div className="avatar avatar-xs rounded-circle me-2 mt-1 d-flex align-items-center justify-content-center bg-light">
                        <i className={`${notification.iconUrl} text-primary`}></i>
                    </div>
                ) : (
                    <div className="avatar avatar-xs bg-secondary text-white rounded-circle me-2 mt-1 d-flex align-items-center justify-content-center">
                        <i className="fa-regular fa-user small"></i>
                    </div>
                )}
                <div className="notification-item-content user-select-none">
                    <p className="mb-0" style={{ fontSize: '0.9rem' }}>
                        {notification.message}
                    </p>
                    <small className="text-muted">
                        {new Date(notification.createdAt).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </small>
                </div>
                {!notification.isRead && <span className="notification-unread-dot ms-auto"></span>}
            </div>
        </div>
    );
};

export default NotificationSwipeableItem;