// frontend/src/components/Skeletons/MovieAreaSkeleton.jsx
import React from 'react';
import '@assets/scss/components/_movie-area.scss';
import '@assets/scss/components/_skeleton-loader.scss';

const ThumbnailPreviewSkeleton = () => (
    <div className="movie-area__slide movie-area__slide--placeholder skeleton-item">
        <div className="movie-area__slide-content movie-area__slide-content--left">
            <div className='movie-area__slide-cover'>
                <div className='movie-area__slide-cover-wrap'>
                    <div className="skeleton-image movie-area__slide-image movie-area__slide-cover-image shimmer-bg"></div>
                </div>
            </div>
        </div>
        <div className="movie-area__slide-content movie-area__slide-content--right">
            <div className="skeleton-text shimmer-bg" style={{ width: '70%', height: '28px', marginBottom: '15px' }}></div>
            <div className="skeleton-text shimmer-bg" style={{ width: '30%', height: '20px', marginBottom: '10px' }}></div>
            <div className="skeleton-text shimmer-bg" style={{ width: '90%', height: '16px' }}></div>
            <div className="skeleton-text shimmer-bg" style={{ width: '80%', height: '16px', marginTop: '8px' }}></div>
            <div className="skeleton-text shimmer-bg" style={{ width: '85%', height: '16px', marginTop: '8px', marginBottom: '15px' }}></div>
            <div className="movie-area__slide-genre movie-area__slide-genre--thumb">
                <span className="skeleton-badge shimmer-bg"></span>
                <span className="skeleton-badge shimmer-bg"></span>
                <span className="skeleton-badge shimmer-bg"></span>
            </div>
        </div>
    </div>
);

const MovieAreaSkeleton = ({ heroItemCount = 1, showThumbs = true }) => {
    return (
        <section className="movie-area is-loading">
            <div className="container">
                <div className="movie-area__slider">
                    <div className='swiper-container movie-hero-slider'>
                        <div className="swiper-wrapper">
                            {Array.from({ length: heroItemCount }).map((_, index) => (
                                <div key={`hero-skel-${index}`} className='swiper-slide skeleton-item'>
                                    <div className="movie-area__slide">
                                        <div className="movie-area__slide-content movie-area__slide-content--left">
                                            <div className='movie-area__slide-cover'>
                                                <div className='movie-area__slide-cover-wrap'>
                                                    <div className="skeleton-image movie-area__slide-image movie-area__slide-cover-image shimmer-bg"></div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="movie-area__slide-content movie-area__slide-content--right">
                                            <div className="skeleton-text shimmer-bg" style={{ width: '80%', height: '36px', marginBottom: '20px' }}></div>
                                            <div className="skeleton-text shimmer-bg" style={{ width: '40%', height: '24px', marginBottom: '15px' }}></div>
                                            <div className="skeleton-text shimmer-bg" style={{ width: '50%', height: '20px', marginBottom: '20px' }}></div>
                                            <div className="skeleton-text shimmer-bg" style={{ width: '95%', height: '16px' }}></div>
                                            <div className="skeleton-text shimmer-bg" style={{ width: '90%', height: '16px', marginTop: '8px' }}></div>
                                            <div className="skeleton-text shimmer-bg" style={{ width: '80%', height: '16px', marginTop: '8px', marginBottom: '25px' }}></div>
                                            <div className="movie-area__slide-genre">
                                                <span className="skeleton-badge shimmer-bg"></span>
                                                <span className="skeleton-badge shimmer-bg"></span>
                                                <span className="skeleton-badge shimmer-bg"></span>
                                            </div>
                                            <div className="movie-area__slide-trailer mt-4">
                                                <div className="skeleton-text shimmer-bg" style={{ width: '30%', height: '20px', display: 'inline-block', verticalAlign: 'middle' }}></div>
                                                <div className="skeleton-button shimmer-bg"></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                {showThumbs && (
                     <div className="movie-area-thumb">
                        <div className="thumb-prev">
                            <ThumbnailPreviewSkeleton />
                        </div>
                        <div className="thumb-next">
                            <ThumbnailPreviewSkeleton />
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
};

export default MovieAreaSkeleton;