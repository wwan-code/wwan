// src/components/Common/SingleComicHorizontal.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import '@assets/scss/components/_single-item-horizontal.scss';

const SingleComicHorizontal = ({ comic, onRemove, showRemoveButton = false }) => {
    if (!comic) return null;
    const coverImageUrl = comic.coverImage ? (comic.coverImage.startsWith('http') ? comic.coverImage : `${process.env.REACT_APP_API_URL_IMAGE}/${comic.coverImage}`) : '/placeholder-comic.png';
    const lastChapter = comic.chapters && comic.chapters.length > 0 ? comic.chapters[0] : null;

    const statusMap = {
        ongoing: { text: "Đang Tiến Hành", classKey: "info" },
        completed: { text: "Hoàn Thành", classKey: "success" },
        paused: { text: "Tạm Dừng", classKey: "warning" },
        dropped: { text: "Đã Drop", classKey: "secondary" },
    };

    const statusInfo = statusMap[comic.status] || { text: comic.status || 'N/A', classKey: "secondary" };

    return (
        <div className="single-item-horizontal comic-item-horizontal">
            <Link to={`/truyen/${comic.slug}`} className="single-item-horizontal__main-link">
                <img
                    src={coverImageUrl}
                    alt={comic.title}
                    className="single-item-horizontal__poster"
                    onError={(e) => {e.target.onerror = null; e.target.src='/placeholder-comic.png'}}
                />
                <div className="single-item-horizontal__info">
                    <h6 className="single-item-horizontal__title" title={comic.title}>{comic.title}</h6>
                     <div className="single-item-horizontal__meta">
                        {lastChapter && <span className="meta-chapter">Ch. {lastChapter.chapterNumber}</span>}
                        <span className={`meta-status status--${statusInfo.classKey}`}>{statusInfo.text}</span>
                    </div>
                    {comic.author && <small className="text-muted d-block meta-author">Tác giả: {comic.author}</small>}
                </div>
            </Link>
            {showRemoveButton && onRemove && (
                <button className="btn-icon btn-remove-item" onClick={onRemove} title="Xóa khỏi bộ sưu tập">
                    <i className="fas fa-times-circle"></i>
                </button>
            )}
        </div>
    );
};
export default SingleComicHorizontal;