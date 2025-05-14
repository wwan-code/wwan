// components/SeriesCarousel.js
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import SeriesCard from './SeriesCard'; // Import component card series
import classNames from '../utils/classNames'; // Import helper classNames
import useDeviceType from '../hooks/useDeviceType'; // Import hook device type

const SeriesCarousel = ({ seriesMovies = [] }) => {
    // --- State Nội bộ cho Carousel ---
    const [cardWidth, setCardWidth] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(true); // Mặc định có thể cuộn phải
    const [visibleSeriesCount, setVisibleSeriesCount] = useState(3); // Số lượng hiển thị ban đầu

    // --- Refs ---
    const seriesRef = useRef(null);
    const firstCardRef = useRef(null); // Ref cho card đầu tiên để tính width

    // --- Hooks ---
    const deviceType = useDeviceType();
    const isMobile = useMemo(() => deviceType === "Mobile", [deviceType]);

    // --- Tính toán và Cập nhật Width Card ---
    const calculateCardWidth = useCallback(() => {
        if (firstCardRef.current) {
            const { offsetWidth } = firstCardRef.current;
             // Lấy margin (ví dụ margin-right) từ CSS nếu có
             const style = getComputedStyle(firstCardRef.current);
             const marginRight = parseFloat(style.marginRight) || 0;
             const marginLeft = parseFloat(style.marginLeft) || 0; // Có thể cần cả left nếu dùng gap
             // Cập nhật state nội bộ
            setCardWidth(offsetWidth + marginLeft + marginRight);
        }
    }, []);

     // Tính toán lại khi resize cửa sổ hoặc khi seriesMovies thay đổi (có card đầu tiên)
    useEffect(() => {
        calculateCardWidth(); // Tính lần đầu
        window.addEventListener('resize', calculateCardWidth);
        return () => {
            window.removeEventListener('resize', calculateCardWidth);
        };
    }, [calculateCardWidth, seriesMovies]); // Thêm seriesMovies vào dependency


    // --- Cập nhật trạng thái nút cuộn ---
    const updateScrollButtons = useCallback(() => {
        if (seriesRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = seriesRef.current;
             // Thêm ngưỡng nhỏ để xử lý sai số float
             const threshold = 1;
            setCanScrollLeft(scrollLeft > threshold);
            setCanScrollRight(scrollLeft + clientWidth < scrollWidth - threshold);
        }
    }, []); // useCallback không cần dependency vì chỉ đọc ref

    useEffect(() => {
        const seriesElement = seriesRef.current;
        if (seriesElement) {
            // Gọi lần đầu và khi scroll
            seriesElement.addEventListener('scroll', updateScrollButtons, { passive: true }); // Dùng passive listener
            updateScrollButtons(); // Gọi ngay khi mount hoặc seriesMovies thay đổi
            // Observer để cập nhật khi nội dung thay đổi (ví dụ: show more)
            const resizeObserver = new ResizeObserver(updateScrollButtons);
            resizeObserver.observe(seriesElement);

            return () => {
                seriesElement.removeEventListener('scroll', updateScrollButtons);
                resizeObserver.unobserve(seriesElement);
            };
        }
    }, [updateScrollButtons, seriesMovies]); // Chạy lại nếu seriesMovies thay đổi


    // --- Logic Cuộn & Kéo Thả (Giữ nguyên) ---
    const scrollAmount = useMemo(() => cardWidth * 2 || 300, [cardWidth]); // Cuộn 2 card 1 lần, fallback 300px

    const scroll = useCallback((direction) => {
        if (seriesRef.current) {
            const distance = direction === 'left' ? -scrollAmount : scrollAmount;
            seriesRef.current.scrollBy({ left: distance, behavior: 'smooth' });
        }
    }, [scrollAmount]);

    const handleMouseDown = useCallback((e) => {
        if (!seriesRef.current) return;
        setIsDragging(false); // Reset trạng thái kéo
        let isActuallyDragging = false; // Cờ kiểm tra xem có kéo đủ xa không
        const startX = e.pageX - seriesRef.current.offsetLeft;
        const initialScrollLeft = seriesRef.current.scrollLeft;
        seriesRef.current.style.cursor = 'grabbing'; // Đổi con trỏ khi nhấn
        seriesRef.current.style.scrollSnapType = 'none'; // Tắt snap khi kéo

        const handleMouseMove = (moveEvent) => {
            moveEvent.preventDefault(); // Ngăn chọn text khi kéo
            const currentX = moveEvent.pageX - seriesRef.current.offsetLeft;
            const walk = currentX - startX;
             // Chỉ set isActuallyDragging nếu kéo đủ xa (ví dụ 5px)
             if (Math.abs(walk) > 5 && !isActuallyDragging) {
                isActuallyDragging = true;
             }
             // Chỉ set state isDragging nếu thực sự kéo
             if (isActuallyDragging) {
                setIsDragging(true);
             }
            seriesRef.current.scrollLeft = initialScrollLeft - walk;
        };

        const cleanup = () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', cleanup);
             if (seriesRef.current) {
                seriesRef.current.style.cursor = 'grab'; // Trả lại con trỏ
                 seriesRef.current.style.scrollSnapType = ''; // Bật lại snap (nếu có)
             }
             // Reset isDragging sau một khoảng trễ nhỏ để đảm bảo event click được xử lý đúng
             setTimeout(() => setIsDragging(false), 50);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', cleanup);
    }, []); // useCallback dependency rỗng

    // Ngăn click khi đang kéo
    const handleClickCapture = useCallback((e) => {
        if (isDragging) {
            e.stopPropagation();
            e.preventDefault();
        }
    }, [isDragging]);

    // --- Logic Xem Thêm ---
    const handleShowMore = () => {
        setVisibleSeriesCount(seriesMovies.length); // Hiển thị tất cả
    };

    // --- Render ---
    if (!seriesMovies || seriesMovies.length === 0) {
        return null; // Không render gì nếu không có series
    }

    return (
        <section className={classNames("series", { "series--mobile": isMobile })}>
            {/* Title và Nút cuộn Mobile */}
            <div className={classNames("section-title", { "section-title--mobile": isMobile })}>
                <h3 className="section-title__text">Phim Cùng Series</h3>
                {isMobile && seriesMovies.length > visibleSeriesCount && ( // Chỉ hiện nút cuộn nếu có nhiều item hơn viewport
                    <div className="scroll-view">
                        <button className="scroll-view__button prev" onClick={() => scroll('left')} disabled={!canScrollLeft}>
                            <i className="scroll-view__button__icon"></i>
                        </button>
                        <button className="scroll-view__button next" onClick={() => scroll('right')} disabled={!canScrollRight}>
                            <i className="scroll-view__button__icon"></i>
                        </button>
                    </div>
                )}
            </div>
            {/* Danh sách Series */}
            <div
                className={classNames("series__list", { "series__list--full": visibleSeriesCount === seriesMovies.length })}
                ref={seriesRef}
                onMouseDown={handleMouseDown}
                style={{ cursor: 'grab', scrollSnapType: 'x mandatory' }} // Thêm cursor grab và scroll snap
                onClickCapture={handleClickCapture} // Sử dụng capture phase để chặn click khi kéo
            >
                {seriesMovies.slice(0, visibleSeriesCount).map((serie, index) => (
                    <SeriesCard
                        key={serie.id} // Dùng ID làm key
                        serie={serie}
                        // Gán ref cho card đầu tiên để tính toán width
                        ref={index === 0 ? firstCardRef : null}
                         // handleClick={handleClick} // Không cần prop này nữa vì đã xử lý ở cha
                    />
                ))}
            </div>
            {/* Nút Xem Thêm */}
            {visibleSeriesCount < seriesMovies.length && (
                <div className="series__more">
                    <button className="series__more-btn" onClick={handleShowMore}>Xem thêm <i className="fa-regular fa-caret-down"></i></button>
                </div>
            )}
        </section>
    );
};

export default SeriesCarousel;