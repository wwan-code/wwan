// components/SeriesCarousel.js
import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import SeriesCard from '@components/SeriesCard';
import classNames from '@utils/classNames';
import useDeviceType from '@hooks/useDeviceType';

const SeriesCarousel = ({ seriesMovies = [] }) => {
    const [cardWidth, setCardWidth] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(true);
    const [visibleSeriesCount, setVisibleSeriesCount] = useState(3);
    const seriesRef = useRef(null);
    const firstCardRef = useRef(null);
    const deviceType = useDeviceType();
    const isMobile = useMemo(() => deviceType === "Mobile", [deviceType]);
    const calculateCardWidth = useCallback(() => {
        if (firstCardRef.current) {
            const { offsetWidth } = firstCardRef.current;
            const style = getComputedStyle(firstCardRef.current);
            const marginRight = parseFloat(style.marginRight) || 0;
            const marginLeft = parseFloat(style.marginLeft) || 0;
            setCardWidth(offsetWidth + marginLeft + marginRight);
        }
    }, []);

    useEffect(() => {
        calculateCardWidth();
        window.addEventListener('resize', calculateCardWidth);
        return () => {
            window.removeEventListener('resize', calculateCardWidth);
        };
    }, [calculateCardWidth, seriesMovies]);

    const updateScrollButtons = useCallback(() => {
        if (seriesRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = seriesRef.current;
            const threshold = 1;
            setCanScrollLeft(scrollLeft > threshold);
            setCanScrollRight(scrollLeft + clientWidth < scrollWidth - threshold);
        }
    }, []);

    useEffect(() => {
        const seriesElement = seriesRef.current;
        if (seriesElement) {
            seriesElement.addEventListener('scroll', updateScrollButtons, { passive: true });
            updateScrollButtons();
            const resizeObserver = new ResizeObserver(updateScrollButtons);
            resizeObserver.observe(seriesElement);

            return () => {
                seriesElement.removeEventListener('scroll', updateScrollButtons);
                resizeObserver.unobserve(seriesElement);
            };
        }
    }, [updateScrollButtons, seriesMovies]);

    const scrollAmount = useMemo(() => cardWidth * 2 || 300, [cardWidth]);

    const scroll = useCallback((direction) => {
        if (seriesRef.current) {
            const distance = direction === 'left' ? -scrollAmount : scrollAmount;
            seriesRef.current.scrollBy({ left: distance, behavior: 'smooth' });
        }
    }, [scrollAmount]);

    const handleMouseDown = useCallback((e) => {
        if (!seriesRef.current) return;
        setIsDragging(false);
        let isActuallyDragging = false;
        const startX = e.pageX - seriesRef.current.offsetLeft;
        const initialScrollLeft = seriesRef.current.scrollLeft;
        seriesRef.current.style.cursor = 'grabbing';
        seriesRef.current.style.scrollSnapType = 'none';

        const handleMouseMove = (moveEvent) => {
            moveEvent.preventDefault(); // Ngăn chọn text khi kéo
            const currentX = moveEvent.pageX - seriesRef.current.offsetLeft;
            const walk = currentX - startX;
            if (Math.abs(walk) > 5 && !isActuallyDragging) {
                isActuallyDragging = true;
            }
            if (isActuallyDragging) {
                setIsDragging(true);
            }
            seriesRef.current.scrollLeft = initialScrollLeft - walk;
        };

        const cleanup = () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', cleanup);
            if (seriesRef.current) {
                seriesRef.current.style.cursor = 'grab';
                seriesRef.current.style.scrollSnapType = '';
            }
            setTimeout(() => setIsDragging(false), 50);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', cleanup);
    }, []);

    const handleClickCapture = useCallback((e) => {
        if (isDragging) {
            e.stopPropagation();
            e.preventDefault();
        }
    }, [isDragging]);

    const handleShowMore = () => {
        setVisibleSeriesCount(seriesMovies.length);
    };

    if (!seriesMovies || seriesMovies.length === 0) {
        return null;
    }

    return (
        <section className={classNames("series", { "series--mobile": isMobile })}>
            <div className={classNames("section-title", { "section-title--mobile": isMobile })}>
                <h3 className="section-title__text">Phim Cùng Series</h3>
                {isMobile && seriesMovies.length > visibleSeriesCount && (
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
            <div
                className={classNames("series__list", { "series__list--full": visibleSeriesCount === seriesMovies.length })}
                ref={seriesRef}
                onMouseDown={handleMouseDown}
                style={{ cursor: 'grab', scrollSnapType: 'x mandatory' }}
                onClickCapture={handleClickCapture}
            >
                {seriesMovies.slice(0, visibleSeriesCount).map((serie, index) => (
                    <SeriesCard
                        key={serie.id}
                        serie={serie}
                        ref={index === 0 ? firstCardRef : null}
                    />
                ))}
            </div>
            {visibleSeriesCount < seriesMovies.length && (
                <div className="series__more">
                    <button className="series__more-btn" onClick={handleShowMore}>Xem thêm <i className="fa-regular fa-caret-down"></i></button>
                </div>
            )}
        </section>
    );
};

export default SeriesCarousel;