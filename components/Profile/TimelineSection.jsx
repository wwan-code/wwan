import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import classNames from '../../utils/classNames'; // Import helper

const TimelineSection = ({ timeline = [], loading }) => {
    const [visibleTimelineGroups, setVisibleTimelineGroups] = useState(5); // Số nhóm ngày hiển thị ban đầu
    const timelineRef = useRef(null); // Ref cho container cuộn

    // --- Helper Functions (Chuyển từ cha vào đây) ---
    const formatDate = useCallback((dateTime) => {
        if (!dateTime) return '';
        const date = new Date(dateTime);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);

        if (date.toDateString() === today.toDateString()) return "Hôm nay";
        if (date.toDateString() === yesterday.toDateString()) return "Hôm qua";
        return `${date.getDate()} Tháng ${date.getMonth() + 1}, ${date.getFullYear()}`;
    }, []);

    const formatTime = useCallback((dateTime) => {
        if (!dateTime) return '';
        return new Date(dateTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    }, []);

    const groupTimelineByDate = useCallback((timelineData) => {
        if (!Array.isArray(timelineData)) return {};
        // Sắp xếp timeline trước khi nhóm (mới nhất lên đầu)
        const sortedTimeline = [...timelineData].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        return sortedTimeline.reduce((acc, item) => {
            const dateKey = formatDate(item.createdAt); // Dùng formatDate làm key
            if (!acc[dateKey]) {
                acc[dateKey] = [];
            }
            acc[dateKey].push(item);
            return acc;
        }, {});
    }, [formatDate]);

    const groupedTimeline = useMemo(() => groupTimelineByDate(timeline), [timeline, groupTimelineByDate]);
    const sortedDates = useMemo(() => Object.keys(groupedTimeline), [groupedTimeline]); // Giữ thứ tự ngày sau khi nhóm

    // --- Infinite Scroll Logic (Chuyển từ cha vào đây) ---
    const handleScroll = useCallback(() => {
        if (timelineRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = timelineRef.current;
            // Load thêm khi gần cuối (ví dụ: còn 100px nữa là hết)
            if (scrollHeight - scrollTop - clientHeight < 100) {
                // Chỉ tăng nếu chưa hiển thị hết các nhóm ngày
                if (visibleTimelineGroups < sortedDates.length) {
                    // Tăng từ từ để tránh load quá nhiều
                    setVisibleTimelineGroups((prev) => Math.min(prev + 3, sortedDates.length));
                }
            }
        }
    }, [visibleTimelineGroups, sortedDates.length]); // Thêm dependency

    useEffect(() => {
        const container = timelineRef.current;
        if (container) {
            container.addEventListener('scroll', handleScroll);
            return () => container.removeEventListener('scroll', handleScroll);
        }
    }, [handleScroll]); // Chạy lại nếu handleScroll thay đổi


    // --- Render Timeline Item ---
    const renderTimelineItemContent = (item) => {
        switch (item.type) {
            case 'comment': return `Đã bình luận: "${item.content}"`;
            case 'watchHistory': return `Đã xem phim: ${item.movieTitle} - Tập ${item.episodeNumber}`;
            case 'followMovie': return `Đã theo dõi phim: ${item.movieTitle}`;
            case 'rating': return `Đã đánh giá phim: ${item.movieTitle} (${item.rating} sao)`;
            case 'favorite': return `Đã yêu thích: ${item.movieTitle} - Tập ${item.episodeNumber}`;
            default: return `Hoạt động không xác định: ${item.type}`;
        }
    };


    return (
        <div className="card mt-3"> {/* Thêm mt-3 */}
            <div className="card-header">
                <h5 className="mb-0">Dòng thời gian</h5>
            </div>
            {/* Thêm giới hạn chiều cao và scroll */}
            <div className="card-body overflow-auto" ref={timelineRef} style={{ maxHeight: '600px' }}>
                {loading ? (
                    <div className="text-center p-3"><i className="fas fa-spinner fa-spin"></i> Đang tải...</div>
                ) : sortedDates.length > 0 ? (
                    <div className="timeline timeline-left"> {/* Đảm bảo class timeline */}
                        {/* Slice theo visibleTimelineGroups */}
                        {sortedDates.slice(0, visibleTimelineGroups).map((date, index) => (
                            <React.Fragment key={date}> {/* Dùng Fragment */}
                                <div className={classNames("timeline-breaker", { "mt-4": index > 0 })}>{date}</div> {/* Thêm mt-4 cho breaker sau */}
                                {groupedTimeline[date].map((item, idx) => (
                                    <div key={item.id || `${date}-${idx}`} className="timeline-item mt-3"> {/* Ưu tiên dùng item.id làm key */}
                                        {/* Có thể thêm icon tùy theo type */}
                                        {/* <span className="timeline-point timeline-point-info"></span> */}
                                        <div className="timeline-event">
                                            <div className="d-flex justify-content-between flex-sm-row flex-column mb-sm-0 mb-1">
                                                <h6 className="mb-0">Hoạt động</h6>
                                                <span className="timeline-event-time">{formatTime(item.createdAt)}</span>
                                            </div>
                                            <p className="mb-0">{renderTimelineItemContent(item)}</p>
                                            {/* <small className="text-muted">{formatTime(item.createdAt)}</small> Hiển thị giờ */}
                                        </div>
                                    </div>
                                ))}
                            </React.Fragment>
                        ))}
                        {/* Có thể thêm loading indicator khi cuộn */}
                        {visibleTimelineGroups < sortedDates.length && (
                            <div className="text-center mt-3 text-muted small">Đang tải thêm...</div>
                        )}
                    </div>
                ) : (
                    <p className="text-center text-muted">Không có hoạt động nào gần đây.</p>
                )}
            </div>
        </div>
    );
};

export default TimelineSection;