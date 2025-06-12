import { useState, useEffect } from 'react';
import axios from 'axios';
import "@assets/scss/components/_recommended-comics.scss";

const RecommendedComics = ({ title = "Đề xuất truyện tranh cho bạn" }) => {
    const [comics, setComics] = useState([]);
    const [featuredIdx, setFeaturedIdx] = useState(0);
    const [featuredOpacity, setFeaturedOpacity] = useState(1);
    const [buttonActive, setButtonActive] = useState(false);

    useEffect(() => {
        axios.get('/api/comic-recommendations?limit=7')
            .then(res => {
                if (res.data && res.data.comics && res.data.comics.length > 0) {
                    setComics(res.data.comics);
                    setFeaturedIdx(0);
                }
            })
            .catch(() => setComics([]));
    }, []);

    // Thumbnail click handler
    const handleThumbnailClick = (idx) => {
        setFeaturedOpacity(0.7);
        setTimeout(() => {
            setFeaturedIdx(idx);
            setFeaturedOpacity(1);
        }, 200);
    };

    // Button click effect
    const handleReadClick = () => {
        setButtonActive(true);
        setTimeout(() => {
            setButtonActive(false);
            if (comics[featuredIdx]?.slug) {
                window.location.href = `/truyen/${comics[featuredIdx].slug}`;
            }
        }, 150);
    };

    useEffect(() => {
        if (!comics.length) return;

        const timer = setTimeout(() => {
            setFeaturedOpacity(0.7);
            setTimeout(() => {
                setFeaturedIdx((prevIdx) => (prevIdx + 1) % comics.length);
                setFeaturedOpacity(1);
            }, 200);
        }, 7000);

        return () => clearTimeout(timer);
    }, [featuredIdx, comics]);

    if (!comics.length) return null;

    const featuredComic = comics[featuredIdx];

    return (
        <section className="recommended-comics">
            <div className="container">
                <div className="recommended-comics__header">
                    <h3>{title}</h3>
                    <p>Chọn mục yêu thích của bạn!</p>
                </div>
                <div className="recommendation">
                    {/* <div className="recommendation__background">
                        <picture>
                            <source
                                srcSet={`${process.env.REACT_APP_API_URL_IMAGE}/${featuredComic.bannerImage}`}
                                type="image/webp"
                            />
                            <img
                                src={`${process.env.REACT_APP_API_URL_IMAGE}/${featuredComic.bannerImage}`}
                                alt={featuredComic.title}
                            />
                        </picture>
                    </div> */}
                    <div className="recommendation__wrapper">
                        <section className="recommendation__content">
                            <h2 className="recommendation__title">{featuredComic.title}</h2>

                            <div className="tags">
                                {featuredComic.genres?.slice(0, 3).map(g => (
                                    <span className="tags__item" key={g.id}>{g.title}</span>
                                ))}
                            </div>

                            <p className="recommendation__description">
                                {featuredComic.description?.slice(0, 120) || "Không có mô tả."}
                            </p>

                            <div className="thumbnails">
                                {comics.map((comic, idx) => (
                                    <div
                                        className={`thumbnails__item ${idx === featuredIdx ? 'active' : ''}`}
                                        key={comic.id}
                                        onClick={() => handleThumbnailClick(idx)}
                                    >
                                        <img
                                            className="thumbnails__image"
                                            src={comic.coverImage
                                                ? (comic.coverImage.startsWith('http')
                                                    ? comic.coverImage
                                                    : `${process.env.REACT_APP_API_URL_IMAGE}/${comic.coverImage}`)
                                                : "https://via.placeholder.com/60x80?text=No+Image"}
                                            alt={comic.title}
                                        />
                                    </div>
                                ))}
                            </div>
                        </section>

                        <aside className="recommendation__media">
                            <div
                                className="featured-media"
                            >
                                <img
                                    className="featured-media__image"
                                    src={featuredComic.bannerImage
                                        ? (featuredComic.bannerImage.startsWith('http')
                                            ? featuredComic.bannerImage
                                            : `${process.env.REACT_APP_API_URL_IMAGE}/${featuredComic.bannerImage}`)
                                        : "https://via.placeholder.com/600x400?text=No+Image"}
                                    alt={featuredComic.title}
                                    style={{ opacity: featuredOpacity, transition: 'opacity 0.2s' }}
                                />
                                <button
                                    className={`featured-media__button${buttonActive ? ' featured-media__button--active' : ''}`}
                                    onClick={handleReadClick}
                                >
                                    Đi đến Đọc
                                </button>
                            </div>
                        </aside>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default RecommendedComics;