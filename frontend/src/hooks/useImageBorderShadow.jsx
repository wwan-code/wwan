// hooks/useImageBorderShadow.jsx
import { useEffect, useRef, useState, useCallback } from "react";

const MAX_CANVAS_DIMENSION = 100;
const SAMPLE_AREA_SIZE = 5;

const useImageBorderShadow = (imageUrl) => {
    const imgRef = useRef(null);
    const [shadowStyle, setShadowStyle] = useState("");

    const getAverageColorFromContext = useCallback((ctx, xStart, yStart, width, height) => {
        try {
            const imageData = ctx.getImageData(xStart, yStart, Math.max(1, width), Math.max(1, height));
            const data = imageData.data;
            let r = 0, g = 0, b = 0, count = 0;

            for (let i = 0; i < data.length; i += 4) { // Lấy mẫu thưa hơn nếu cần (ví dụ: i += 16)
                r += data[i];
                g += data[i + 1];
                b += data[i + 2];
                count++;
            }
            if (count === 0) return 'rgba(0,0,0,0)'; // Tránh chia cho 0
            return `rgba(${Math.floor(r / count)}, ${Math.floor(g / count)}, ${Math.floor(b / count)}, 0.6)`;
        } catch (e) {
            console.error("Error getting image data from context:", e);
            return 'rgba(0,0,0,0)';
        }
    }, []);

    useEffect(() => {
        if (!imageUrl) {
            setShadowStyle(""); // Reset nếu không có imageUrl
            return;
        }

        const img = new Image();
        img.crossOrigin = "Anonymous";

        let finalImageUrl = imageUrl;
        if (
            !imageUrl.startsWith('http') &&
            !imageUrl.startsWith('/uploads')&&
            !imageUrl.includes('uploads')
        ) {
            finalImageUrl = `${process.env.REACT_APP_API_URL}/uploads/${imageUrl.replace(/^\/+/, '')}`;
        }
        img.src = finalImageUrl.startsWith('http') ? finalImageUrl : `${process.env.REACT_APP_API_URL}/${finalImageUrl}`;

        const calculateShadow = () => {
            try {
                const canvas = document.createElement("canvas");
                const ctx = canvas.getContext("2d", { willReadFrequently: true });

                // Scale ảnh xuống kích thước nhỏ hơn để xử lý nhanh
                let scaledWidth = img.naturalWidth;
                let scaledHeight = img.naturalHeight;

                if (scaledWidth === 0 || scaledHeight === 0) {
                    console.warn("Image naturalWidth or naturalHeight is 0, cannot calculate shadow.");
                    setShadowStyle("");
                    return;
                }


                if (scaledWidth > MAX_CANVAS_DIMENSION || scaledHeight > MAX_CANVAS_DIMENSION) {
                    if (scaledWidth > scaledHeight) {
                        scaledHeight = Math.round((MAX_CANVAS_DIMENSION / scaledWidth) * scaledHeight);
                        scaledWidth = MAX_CANVAS_DIMENSION;
                    } else {
                        scaledWidth = Math.round((MAX_CANVAS_DIMENSION / scaledHeight) * scaledWidth);
                        scaledHeight = MAX_CANVAS_DIMENSION;
                    }
                }

                canvas.width = scaledWidth;
                canvas.height = scaledHeight;
                ctx.drawImage(img, 0, 0, scaledWidth, scaledHeight);

                const sampleSize = Math.min(SAMPLE_AREA_SIZE, Math.floor(Math.min(scaledWidth, scaledHeight) / 4));
                if (sampleSize < 1) {
                    setShadowStyle(""); // Không thể lấy mẫu nếu ảnh quá nhỏ
                    return;
                }


                // Lấy mẫu ở 4 góc và 4 điểm giữa cạnh
                const colors = {
                    topLeft: getAverageColorFromContext(ctx, 0, 0, sampleSize, sampleSize),
                    topRight: getAverageColorFromContext(ctx, scaledWidth - sampleSize, 0, sampleSize, sampleSize),
                    bottomLeft: getAverageColorFromContext(ctx, 0, scaledHeight - sampleSize, sampleSize, sampleSize),
                    bottomRight: getAverageColorFromContext(ctx, scaledWidth - sampleSize, scaledHeight - sampleSize, sampleSize, sampleSize),
                    midTop: getAverageColorFromContext(ctx, Math.floor(scaledWidth / 2) - Math.floor(sampleSize / 2), 0, sampleSize, sampleSize),
                    midBottom: getAverageColorFromContext(ctx, Math.floor(scaledWidth / 2) - Math.floor(sampleSize / 2), scaledHeight - sampleSize, sampleSize, sampleSize),
                    midLeft: getAverageColorFromContext(ctx, 0, Math.floor(scaledHeight / 2) - Math.floor(sampleSize / 2), sampleSize, sampleSize),
                    midRight: getAverageColorFromContext(ctx, scaledWidth - sampleSize, Math.floor(scaledHeight / 2) - Math.floor(sampleSize / 2), sampleSize, sampleSize),
                };

                // Tạo nhiều lớp shadow để có hiệu ứng "glow" mượt hơn
                setShadowStyle(`
                    0 -8px 12px -4px ${colors.midTop}, 0 8px 12px -4px ${colors.midBottom},
                    -8px 0 12px -4px ${colors.midLeft}, 8px 0 12px -4px ${colors.midRight},
                    -7px -7px 10px -5px ${colors.topLeft}, 7px -7px 10px -5px ${colors.topRight},
                    -7px 7px 10px -5px ${colors.bottomLeft}, 7px 7px 10px -5px ${colors.bottomRight}
                `);

            } catch (error) {
                console.error("Lỗi khi trích xuất màu sắc viền:", error);
                setShadowStyle(""); // Reset nếu có lỗi
            }
        };

        img.onload = () => {
            if (img.naturalWidth > 0 && img.naturalHeight > 0) { // Đảm bảo ảnh đã tải xong và có kích thước
                calculateShadow();
            } else {
                // Xử lý trường hợp ảnh không tải được hoặc không có kích thước
                console.warn("Ảnh không thể tải hoặc không có kích thước, không tạo bóng viền.");
                setShadowStyle("");
            }
        };

        img.onerror = () => {
            console.error("Lỗi tải ảnh để tạo bóng viền:", imageUrl);
            setShadowStyle(""); // Reset nếu ảnh lỗi
        };

    }, [imageUrl, getAverageColorFromContext]);

    return { imgRef, shadowStyle };
};

export default useImageBorderShadow;