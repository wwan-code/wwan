import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import classNames from '@utils/classNames';

const TimelineSection = React.memo(({ timeline = [], loading, isPublicView = false }) => {
    const [visibleTimelineGroups, setVisibleTimelineGroups] = useState(5);
    const timelineRef = useRef(null);

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
        const sortedTimeline = [...timelineData].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        return sortedTimeline.reduce((acc, item) => {
            const dateKey = formatDate(item.createdAt);
            if (!acc[dateKey]) {
                acc[dateKey] = [];
            }
            acc[dateKey].push(item);
            return acc;
        }, {});
    }, [formatDate]);

    const groupedTimeline = useMemo(() => groupTimelineByDate(timeline), [timeline, groupTimelineByDate]);
    const sortedDates = useMemo(() => Object.keys(groupedTimeline), [groupedTimeline]);

    const handleScroll = useCallback(() => {
        if (timelineRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = timelineRef.current;
            if (scrollHeight - scrollTop - clientHeight < 100) {
                if (visibleTimelineGroups < sortedDates.length) {
                    setVisibleTimelineGroups((prev) => Math.min(prev + 3, sortedDates.length));
                }
            }
        }
    }, [visibleTimelineGroups, sortedDates.length]);

    useEffect(() => {
        const container = timelineRef.current;
        if (container) {
            container.addEventListener('scroll', handleScroll);
            return () => container.removeEventListener('scroll', handleScroll);
        }
    }, [handleScroll]);

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
        <div className={classNames("timeline-section-wrapper", { "public-view": isPublicView })}>
            {!isPublicView && (
                <div className="profile-content-section__header">
                    <h4 className="profile-content-section__title">
                        <i className="fas fa-history icon-before"></i>Dòng Thời Gian Hoạt Động
                    </h4>
                </div>
            )}
            <div className="timeline-list-container" ref={timelineRef} style={{ maxHeight: '600px', overflowY: 'auto', overflowX: 'hidden' }}>
                {loading && timeline.length === 0 ? (
                    <div className="loading-placeholder--small text-center p-3"><span className="spinner--small"></span> Đang tải...</div>
                ) : sortedDates.length > 0 ? (
                    <div className="timeline timeline-left">
                        {sortedDates.slice(0, visibleTimelineGroups).map((date, index) => (
                            <React.Fragment key={date}>
                                <div className={classNames("timeline-breaker", { "mt-4": index > 0 })}>{date}</div>
                                {groupedTimeline[date].map((item, idx) => (
                                    <div key={item.id || `${date}-${idx}`} className="timeline-item mt-3">
                                        <div className="timeline-event">
                                            <div className="d-flex justify-content-between flex-sm-row flex-column mb-sm-0 mb-1">
                                                <small className="timeline-event-time">{formatTime(item.createdAt)}</small>
                                            </div>
                                            <p className="mb-0">{renderTimelineItemContent(item)}</p>
                                        </div>
                                    </div>
                                ))}
                            </React.Fragment>
                        ))}
                        {visibleTimelineGroups < sortedDates.length && (
                            <div className="text-center mt-3 text-muted small">Đang tải thêm...</div>
                        )}
                    </div>
                ) : (
                    <p className="no-content-message text-center">Không có hoạt động nào gần đây.</p>
                )}
            </div>
        </div>
    );
});

export default TimelineSection;