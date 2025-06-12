// src/components/Comics/SingleComic.jsx
import { Link } from 'react-router-dom';
import '@assets/scss/components/_single-comic.scss';
import { formatViewCount } from '@utils/formatViewCount';

const truncateTextSCCard = (text, maxLength) => {
    if (!text || typeof text !== 'string') return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
};

const SingleComic = ({ comic }) => {
    if (!comic) return null;

    const coverImageUrl = comic.coverImage
        ? (comic.coverImage.startsWith('http') ? comic.coverImage : `${process.env.REACT_APP_API_URL_IMAGE}/${comic.coverImage}`)
        : '';

    const lastChapter = comic.chapters && comic.chapters.length > 0
        ? comic.chapters[0]
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
                <span className={`comic-card__badge comic-card__badge--views`}>
                    <i className="fas fa-eye"></i> {formatViewCount(comic.views)}
                </span>
            </div>
            <div className="comic-card__content">
                <h3 className="comic-card__title" title={comic.title}>
                    <Link to={`/truyen/${comic.slug}`}>
                        {truncateTextSCCard(comic.title, 40)}
                    </Link>
                </h3>
            </div>
        </div>
    );
};

export default SingleComic;