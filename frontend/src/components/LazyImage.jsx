import React, { useEffect, useRef, useState } from "react";

const LazyImage = ({ src, alt, className, onLoad, onError, style, ...props }) => {
    const [isVisible, setIsVisible] = useState(false);
    const containerRef = useRef();

    useEffect(() => {
        const observer = new window.IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.disconnect();
                }
            },
            { rootMargin: "200px" }
        );
        if (containerRef.current) observer.observe(containerRef.current);
        return () => observer.disconnect();
    }, []);

    return (
        <div ref={containerRef} style={style}>
            {isVisible ? (
                <img
                    src={src}
                    alt={alt}
                    className={className}
                    onLoad={onLoad}
                    onError={onError}
                    loading="lazy"
                    {...props}
                />
            ) : (
                <div className="comic-page-placeholder" style={{ minHeight: style?.minHeight || 80 }}>
                    <div className="spinner-eff-small"></div>
                </div>
            )}
        </div>
    );
};

export default LazyImage;