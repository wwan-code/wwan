// frontend/src/components/Effects/InteractiveDotGrid.jsx
import React, { useRef, useEffect, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import useUIPreferences from '@hooks/useUIPreferences';

const hexToRgb = (hex) => {
    if (!hex || typeof hex !== 'string') return null;
    const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b);
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) } : null;
};


const InteractiveDotGrid = ({
    width = '100%',
    height = '100%',
    position = 'absolute',
    dotSpacing = 10,
    dotRadius = 1.5,
    baseDotColorAlpha = 0.3,
    baseColorRGB = { r: 100, g: 100, b: 100 },
    influenceRadius = 150,
    maxBrightnessFactor = 4,
    containerClassName = '',
    canvasClassName = '',
}) => {
    const canvasRef = useRef(null);
    const mousePosition = useRef({ x: null, y: null });
    const animationFrameId = useRef(null);
    const dotsArray = useRef([]);

    const { preferences: { accentColor } } = useUIPreferences();

    const targetHighlightColor = useMemo(() => {
        const colorFromAccent = hexToRgb(accentColor);
        return colorFromAccent || { r: 0, g: 200, b: 200 };
    }, [accentColor]);


    const createDotsGrid = useCallback((currentCanvas) => {
        dotsArray.current = [];
        if (!currentCanvas) return;
        for (let x = dotSpacing / 2; x < currentCanvas.width; x += dotSpacing) {
            for (let y = dotSpacing / 2; y < currentCanvas.height; y += dotSpacing) {
                dotsArray.current.push({ x, y });
            }
        }
    }, [dotSpacing]);

    const drawDot = useCallback((ctx, dot) => {
        let alpha = baseDotColorAlpha;
        let r = baseColorRGB.r, g = baseColorRGB.g, b = baseColorRGB.b;

        if (mousePosition.current.x !== null && mousePosition.current.y !== null) {
            const dx = dot.x - mousePosition.current.x;
            const dy = dot.y - mousePosition.current.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < influenceRadius) {
                const factor = Math.pow(1 - (distance / influenceRadius), 2);

                alpha = baseDotColorAlpha + factor * (1 - baseDotColorAlpha);
                const brightness = 1 + factor * (maxBrightnessFactor - 1);

                r = Math.floor(baseColorRGB.r + (targetHighlightColor.r - baseColorRGB.r) * factor);
                g = Math.floor(baseColorRGB.g + (targetHighlightColor.g - baseColorRGB.g) * factor);
                b = Math.floor(baseColorRGB.b + (targetHighlightColor.b - baseColorRGB.b) * factor);

                r = Math.min(255, Math.floor(r * brightness));
                g = Math.min(255, Math.floor(g * brightness));
                b = Math.min(255, Math.floor(b * brightness));
            }
        }

        ctx.beginPath();
        ctx.arc(dot.x, dot.y, dotRadius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
        ctx.fill();
    }, [
        baseDotColorAlpha,
        baseColorRGB,
        influenceRadius,
        maxBrightnessFactor,
        dotRadius,
        targetHighlightColor
    ]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        let parentElement = canvas.parentElement;
        if (!parentElement) return;


        const resizeCanvas = () => {
            if (!canvas || !parentElement) return;
            if (typeof width === 'string' && width.includes('%')) {
                canvas.width = parentElement.offsetWidth * (parseInt(width, 10) / 100);
            } else {
                canvas.width = parseInt(width, 10);
            }
            if (typeof height === 'string' && height.includes('%')) {
                canvas.height = parentElement.offsetHeight * (parseInt(height, 10) / 100);
            } else {
                canvas.height = parseInt(height, 10);
            }
            if (canvas.width > 0 && canvas.height > 0) {
                createDotsGrid(canvas);
            }
        };

        const animate = () => {
            if (!canvas || !ctx) return;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            dotsArray.current.forEach(dot => drawDot(ctx, dot));
            animationFrameId.current = requestAnimationFrame(animate);
        };

        const handleMouseMove = (event) => {
            if (!canvas) return;
            const rect = canvas.getBoundingClientRect();
            mousePosition.current.x = event.clientX - rect.left;
            mousePosition.current.y = event.clientY - rect.top;
        };

        const handleMouseLeave = () => {
            mousePosition.current.x = null;
            mousePosition.current.y = null;
        };
        
        resizeCanvas();
        if (canvas.width > 0 && canvas.height > 0) {
            animate();
        }


        window.addEventListener('resize', resizeCanvas);
        canvas.addEventListener('mousemove', handleMouseMove);
        canvas.addEventListener('mouseleave', handleMouseLeave);

        return () => {
            window.removeEventListener('resize', resizeCanvas);
            if (canvas) {
                canvas.removeEventListener('mousemove', handleMouseMove);
                canvas.removeEventListener('mouseleave', handleMouseLeave);
            }
            cancelAnimationFrame(animationFrameId.current);
        };
    }, [width, height, createDotsGrid, drawDot]);

    const outerContainerStyle = {
        width: width,
        height: height,
        position: position,
    };

    const canvasStyle = {
        display: 'block',
        width: '100%',
        height: '100%',
    };

    return (
        <div style={outerContainerStyle} className={containerClassName}>
            <canvas ref={canvasRef} className={canvasClassName} style={canvasStyle} />
        </div>
    );
};

InteractiveDotGrid.propTypes = {
    width: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    height: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    dotSpacing: PropTypes.number,
    dotRadius: PropTypes.number,
    baseDotColorAlpha: PropTypes.number,
    baseColorRGB: PropTypes.shape({
        r: PropTypes.number,
        g: PropTypes.number,
        b: PropTypes.number,
    }),
    influenceRadius: PropTypes.number,
    maxBrightnessFactor: PropTypes.number,
    containerClassName: PropTypes.string,
    canvasClassName: PropTypes.string,
};

export default InteractiveDotGrid;