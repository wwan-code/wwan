// src/components/Comics/SingleComic.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import '../../assets/scss/components/_single-comic.scss'; // Import SCSS riêng

// Helper functions (có thể đặt trong file utils)
const formatViewCountSCCard = (number) => {
    if (typeof number !== 'number') return '0';
    if (number >= 1e6) return (number / 1e6).toFixed(1).replace(/\.0$/, '') + 'Tr';
    if (number >= 1e3) return (number / 1e3).toFixed(1).replace(/\.0$/, '') + 'N';
    return number.toString();
};

const truncateTextSCCard = (text, maxLength) => {
    if (!text || typeof text !== 'string') return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
};

const SingleComic = ({ comic }) => {
    if (!comic) return null;

    const coverImageUrl = comic.coverImage
        ? (comic.coverImage.startsWith('http') ? comic.coverImage : `/uploads/${comic.coverImage}`)
        : '/images/placeholder-comic.png'; // Đảm bảo có placeholder

    const lastChapter = comic.chapters && comic.chapters.length > 0
        ? comic.chapters[0] // Giả sử API /api/comics trả về chapters (chỉ chương mới nhất)
        : null;

    const statusMap = {
        ongoing: { text: "Đang Tiến Hành", classKey: "info" },
        completed: { text: "Hoàn Thành", classKey: "success" },
        paused: { text: "Tạm Dừng", classKey: "warning" },
        dropped: { text: "Đã Drop", classKey: "secondary" },
    };
    const statusInfo = statusMap[comic.status] || { text: comic.status, classKey: "light" };

    return (
        <div className="comic-card">
            <div className="comic-card__image-wrap">
                <Link to={`/truyen/${comic.slug}`} className="comic-card__image-link" title={comic.title}>
                    <img
                        src={coverImageUrl}
                        alt={comic.title}
                        className="comic-card__image"
                        loading="lazy"
                        onError={(e) => { e.target.onerror = null; e.target.src = '/images/placeholder-comic.png'; }}
                    />
                    <div className="comic-card__overlay">
                        <span className="comic-card__play-icon">
                            <i className="fas fa-book-reader"></i>
                        </span>
                    </div>
                </Link>
                {lastChapter && (
                    <span className="comic-card__badge comic-card__badge--chapter">
                        Ch. {lastChapter.chapterNumber}
                    </span>
                )}
                <span className={`comic-card__badge comic-card__badge--status status--${statusInfo.classKey}`}>
                    {statusInfo.text}
                </span>
            </div>
            <div className="comic-card__content">
                <h3 className="comic-card__title" title={comic.title}>
                    <Link to={`/truyen/${comic.slug}`}>
                        {truncateTextSCCard(comic.title, 40)}
                    </Link>
                </h3>
                <div className="comic-card__meta">
                    {comic.author && (
                        <span className="comic-meta__item comic-meta__author" title={`Tác giả: ${comic.author}`}>
                            <i className="fas fa-user-edit"></i> {truncateTextSCCard(comic.author, 15)}
                        </span>
                    )}
                    <span className="comic-meta__item comic-meta__views">
                        <i className="fas fa-eye"></i> {formatViewCountSCCard(comic.views)}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default SingleComic;