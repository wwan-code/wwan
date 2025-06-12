import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import Swiper from 'swiper';
import 'swiper/css';
import '@assets/scss/components/_movie-area.scss';
import { formatViewCount } from '@utils/formatViewCount';
import MovieAreaSkeleton from './Skeletons/MovieAreaSkeleton';

const ThumbnailPreview = ({ movieData }) => {
    const averageRating = useMemo(() => {
        if (!movieData?.ratings || movieData?.ratings.length === 0) return 0;
        const sum = movieData.ratings.reduce((acc, rating) => acc + (rating.rating || 0), 0);
        return (sum / movieData.ratings.length).toFixed(1);
    }, [movieData]);
    if (!movieData) return <div className="movie-area__slide--placeholder"></div>;

    return (
        <div className="movie-area__slide">
            <div className="movie-area__slide-content movie-area__slide-content--left">
                <div className='movie-area__slide-cover'>
                    <div className='movie-area__slide-cover-wrap'>
                        <picture className="movie-area__slide-image movie-area__slide-cover-image">
                            <source srcSet={movieData.posterURL ? `${process.env.REACT_APP_API_URL_IMAGE}/${movieData.posterURL}` : ''} type="image/webp" />
                            <img src={movieData.posterURL ? `${process.env.REACT_APP_API_URL_IMAGE}/${movieData.posterURL}` : '/placeholder.jpg'} alt={movieData.title} loading='lazy' />
                        </picture>
                    </div>
                </div>
            </div>
            <div className="movie-area__slide-content movie-area__slide-content--right">
                <h2 className="movie-area__slide-title movie-area__slide-title--thumb">{movieData.title}</h2>
                <div className="movie-area__slide-review movie-area__slide-review--thumb">
                    <div className="movie-area__slide-review-author">
                        {averageRating > 0 ? <>{averageRating} <i className="fa fa-star"></i></> : 'Chưa có'}
                    </div>
                </div>
                <p className="movie-area__slide-description movie-area__slide-description--thumb">{movieData.description}</p>
                <div className="movie-area__slide-genre movie-area__slide-genre--thumb">
                    {movieData.genres?.slice(0, 3).map((genre) => (
                        <span key={genre.id} className="movie-area__slide-genre-item">
                            <span className='movie-area__slide-genre-badge'>{genre.title}</span>
                        </span>
                    ))}
                </div>
            </div>
        </div>
    );
};


function MovieArea({ data, loading = false }) {
    const heroSliderRef = useRef(null);
    const swiperInstanceRef = useRef(null);
    const [thumbData, setThumbData] = useState({ prev: null, next: null });

    const updateThumbData = useCallback((swiper) => {
        if (!swiper || !swiper.slides || swiper.slides.length === 0) return;

        const current = swiper.realIndex;
        const slidesData = data?.featuredMovies || [];
        const totalSlides = slidesData.length;

        if (totalSlides === 0) return;

        const prevIndex = (current - 1 + totalSlides) % totalSlides;
        const nextIndex = (current + 1) % totalSlides;


        setThumbData({
            prev: slidesData[prevIndex] || null,
            next: slidesData[nextIndex] || null,
        });
    }, [data.featuredMovies]);

    useEffect(() => {
        if (!loading && heroSliderRef.current && data.featuredMovies?.length) {
            if (swiperInstanceRef.current) {
                swiperInstanceRef.current.destroy(true, true);
            }
            swiperInstanceRef.current = new Swiper(heroSliderRef.current, {
                loop: data.featuredMovies.length > 1,
                autoplay: {
                    delay: 4500,
                    disableOnInteraction: false,
                },
                slidesPerView: 1,
                on: {
                    init: function () {
                        updateThumbData(this);
                    },
                    slideChange: function () {
                        updateThumbData(this);
                    },
                },
            });
        }

        return () => {
            if (swiperInstanceRef.current) {
                swiperInstanceRef.current.destroy(true, true);
                swiperInstanceRef.current = null;
            }
        };
    }, [data.featuredMovies, updateThumbData, loading]);

    const handlePrev = () => swiperInstanceRef.current?.slidePrev();
    const handleNext = () => swiperInstanceRef.current?.slideNext();

    const getAverageRating = (ratings) => {
        if (!ratings || ratings.length === 0) return "N/A";
        const sum = ratings.reduce((acc, rating) => acc + (rating.rating || 0), 0);
        return (sum / ratings.length).toFixed(1);
    };
    if (loading || !data || !data.featuredMovies || data.featuredMovies.length === 0) {
        return <MovieAreaSkeleton heroItemCount={1} showThumbs={true} />;
    }
    return (
        <section className="movie-area">
            <div className="container">
                <div className="movie-area__slider">
                    <div ref={heroSliderRef} className='swiper-container movie-hero-slider'>
                        <div className="swiper-wrapper">
                            {data.featuredMovies?.map((item) => {
                                const averageRating = getAverageRating(item.ratings);
                                const lastEpisodeNumber = item.Episodes?.[0]?.episodeNumber || '?';

                                return (
                                    <div key={item.id} className='swiper-slide'>
                                        <div className="movie-area__slide">
                                            <div className="movie-area__slide-content movie-area__slide-content--left">
                                                <div className='movie-area__slide-cover'>
                                                    <div className='movie-area__slide-cover-wrap'>
                                                        <picture className="movie-area__slide-image movie-area__slide-cover-image">
                                                            <source srcSet={item.posterURL ? `${process.env.REACT_APP_API_URL_IMAGE}/${item.posterURL}` : ''} type="image/webp" />
                                                            <img src={item.posterURL ? `${process.env.REACT_APP_API_URL_IMAGE}/${item.posterURL}` : '/placeholder.jpg'} alt={item.title} loading='lazy' />
                                                        </picture>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="movie-area__slide-content movie-area__slide-content--right">
                                                <h2 className="movie-area__slide-title" title={item.title}>{item.title}</h2>
                                                <div className="movie-area__slide-review">
                                                    <div className="movie-area__slide-review-author">
                                                        {averageRating !== "N/A" ? <>{averageRating} <i className="fa fa-star"></i></> : 'Chưa có đánh giá'}
                                                    </div>
                                                    <h6 className="movie-area__slide-review-count">
                                                        {item.ratings?.length} đánh giá
                                                    </h6>
                                                </div>
                                                <div className='movie-area__slide-meta'>
                                                    <span className='movie-area__slide-meta-item'>
                                                        <span className='movie-area__slide-meta-item--classification'>{item.classification}</span>
                                                    </span>
                                                    <span className='movie-area__slide-meta-item'>
                                                        <span className='movie-area__slide-meta-item--views'>{formatViewCount(item.views)} <i className="fa fa-eye"></i></span>
                                                    </span>
                                                </div>
                                                <p className="movie-area__slide-description">
                                                    {item.description?.length > 150 ? item.description.substring(0, 150) + '...' : item.description}
                                                </p>
                                                <div className="movie-area__slide-genre">
                                                    {item.genres?.slice(0, 3).map((genre) => (
                                                        <span key={genre.id} className="movie-area__slide-genre-item">
                                                            <span className='movie-area__slide-genre-badge'>{genre.title}</span>
                                                        </span>
                                                    ))}
                                                </div>
                                                <div className="movie-area__slide-trailer">
                                                    <span className="movie-area__slide-trailer-title">Xem ngay</span>
                                                    <Link to={`/play/${item.slug}?t=${lastEpisodeNumber}`} className="movie-area__slide-trailer-btn">
                                                        <i className="fa fa-play"></i>
                                                    </Link>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
                {data.featuredMovies && data.featuredMovies.length > 1 && (
                    <div className="movie-area-thumb">
                        <div className="thumb-prev" onClick={handlePrev}>
                            <ThumbnailPreview movieData={thumbData.prev} />
                        </div>
                        <div className="thumb-next" onClick={handleNext}>
                            <ThumbnailPreview movieData={thumbData.next} />
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
}

export default MovieArea;