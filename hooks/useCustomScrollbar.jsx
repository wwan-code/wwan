import { useEffect, useRef } from "react";

const useCustomScrollbar = () => {
    const containerRef = useRef(null);
    const scrollbarRef = useRef(null);

    useEffect(() => {
        const container = containerRef.current;
        const scrollbar = scrollbarRef.current;

        if (!container || !scrollbar) return;

        const updateScrollbar = () => {
            const contentHeight = container.scrollHeight;
            const containerHeight = container.clientHeight;
            const scrollbarHeight = Math.max(
                (containerHeight / contentHeight) * containerHeight,
                20 // Minimum height for visibility
            );

            scrollbar.style.height = `${scrollbarHeight}px`;

            const scrollTop = container.scrollTop;
            const maxScrollTop = contentHeight - containerHeight;
            const scrollbarTop = (scrollTop / maxScrollTop) * (containerHeight - scrollbarHeight);

            scrollbar.style.transform = `translateY(${scrollbarTop}px)`;
        };

        const handleScroll = () => {
            updateScrollbar();
        };

        const handleDrag = (event) => {
            const startY = event.clientY;
            const startScrollTop = container.scrollTop;
            const contentHeight = container.scrollHeight;
            const containerHeight = container.clientHeight;

            const scrollRatio = contentHeight / containerHeight;

            const onMouseMove = (moveEvent) => {
                const deltaY = moveEvent.clientY - startY;
                container.scrollTop = startScrollTop + deltaY * scrollRatio;
            };

            const onMouseUp = () => {
                document.removeEventListener("mousemove", onMouseMove);
                document.removeEventListener("mouseup", onMouseUp);
            };

            document.addEventListener("mousemove", onMouseMove);
            document.addEventListener("mouseup", onMouseUp);

            event.preventDefault();
        };

        scrollbar.addEventListener("mousedown", handleDrag);
        container.addEventListener("scroll", handleScroll);
        window.addEventListener("resize", updateScrollbar);

        updateScrollbar();

        return () => {
            scrollbar.removeEventListener("mousedown", handleDrag);
            container.removeEventListener("scroll", handleScroll);
            window.removeEventListener("resize", updateScrollbar);
        };
    }, []);

    return { containerRef, scrollbarRef };
};

export default useCustomScrollbar;
