// components/HeroArea.js (Đã cải tiến)
import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import Swiper from 'swiper';
import 'swiper/css'; // Import CSS cơ bản của Swiper

// Component con để render thumbnail
const ThumbnailPreview = ({ movieData }) => {
    const averageRating = useMemo(() => {
        if (!movieData?.ratings || movieData?.ratings.length === 0) return 0;
        const sum = movieData.ratings.reduce((acc, rating) => acc + (rating.rating || 0), 0);
        return (sum / movieData.ratings.length).toFixed(1);
    }, [movieData]);
    if (!movieData) return <div className="movie-area__slide--placeholder"></div>;

    return (
        <div className="row movie-area__slide">
            <div className="col-lg-6 col-5">
                <div className="movie-area__slide-content movie-area__slide-content--left">
                    <div className='movie-area__slide-cover'>
                        <div className='movie-area__slide-cover-wrap'>
                            <picture className="movie-area__slide-image movie-area__slide-cover-image">
                                <source srcSet={movieData.image ? `/${movieData.image}` : ''} type="image/webp" />
                                <img src={movieData.image ? `/${movieData.image}` : '/placeholder.jpg'} alt={movieData.title} loading='lazy' />
                            </picture>
                        </div>
                    </div>
                </div>
            </div>
            <div className="col-lg-6 col-7">
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
                            <div key={genre.id} className="movie-area__slide-genre-item">
                                <span className='movie-area__slide-genre-badge'>{genre.title}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};


function HeroArea({ data }) {
    const heroSliderRef = useRef(null);
    const swiperInstanceRef = useRef(null);

    const [thumbData, setThumbData] = useState({ prev: null, next: null });

    const updateThumbData = useCallback((swiper) => {
        if (!swiper || !swiper.slides || swiper.slides.length === 0) return;

        const current = swiper.realIndex;
        const slidesData = data.featuredMovies || [];
        const totalSlides = slidesData.length;

        if (totalSlides === 0) return;

         const prevIndex = (current - 1 + totalSlides) % totalSlides;
         const nextIndex = (current + 1) % totalSlides;


        setThumbData({
            prev: slidesData[prevIndex] || null,
            next: slidesData[nextIndex] || null,
        });
    }, [data.featuredMovies]);

    // Khởi tạo và hủy Swiper
    useEffect(() => {
        if (heroSliderRef.current && data.featuredMovies?.length) {
            swiperInstanceRef.current = new Swiper(heroSliderRef.current, {
                loop: data.featuredMovies.length > 1,
                autoplay: {
                    delay: 4500, // Tăng delay một chút
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

        // --- Cleanup function ---
        return () => {
            if (swiperInstanceRef.current) {
                swiperInstanceRef.current.destroy(true, true);
                swiperInstanceRef.current = null; // Reset ref
            }
        };
    }, [data.featuredMovies, updateThumbData]); // Dependency là data và hàm callback

    // Hàm điều khiển Swiper từ nút ngoài
    const handlePrev = () => swiperInstanceRef.current?.slidePrev();
    const handleNext = () => swiperInstanceRef.current?.slideNext();

     // Tính toán rating an toàn (chuyển ra ngoài map)
     const getAverageRating = (ratings) => {
         if (!ratings || ratings.length === 0) return "N/A";
         const sum = ratings.reduce((acc, rating) => acc + (rating.rating || 0), 0);
         return (sum / ratings.length).toFixed(1);
     };


    return (
        <section className="movie-area">
            <div className="container">
                <div className="movie-area__slider">
                    {/* Swiper Container */}
                    <div ref={heroSliderRef} className='swiper-container movie-hero-slider'>
                        <div className="swiper-wrapper">
                            {data.featuredMovies?.map((item) => {
                                // Gọi hàm tính rating
                                const averageRating = getAverageRating(item.ratings);
                                const lastEpisodeNumber = item.Episodes?.[0]?.episodeNumber || '?'; // Giả sử tập mới nhất ở đầu

                                return (
                                    <div key={item.id} className='swiper-slide'>
                                        <div className="row movie-area__slide">
                                            {/* Cột trái - Ảnh */}
                                            <div className="col-lg-6 col-5">
                                                <div className="movie-area__slide-content movie-area__slide-content--left">
                                                     <div className='movie-area__slide-cover'>
                                                        <div className='movie-area__slide-cover-wrap'>
                                                            <picture className="movie-area__slide-image movie-area__slide-cover-image">
                                                                <source srcSet={item.image ? `/${item.image}` : ''} type="image/webp" />
                                                                <img src={item.image ? `/${item.image}` : '/placeholder.jpg'} alt={item.title} loading='lazy' />
                                                            </picture>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            {/* Cột phải - Thông tin */}
                                            <div className="col-lg-6 col-7">
                                                <div className="movie-area__slide-content movie-area__slide-content--right">
                                                    <h2 className="movie-area__slide-title" title={item.title}>{item.title}</h2>
                                                    <div className="movie-area__slide-review">
                                                        <div className="movie-area__slide-review-author">
                                                            {averageRating !== "N/A" ? <>{averageRating} <i className="fa fa-star"></i></> : 'Chưa có đánh giá'}
                                                        </div>
                                                    </div>
                                                     {/* Giới hạn chiều dài description */}
                                                    <p className="movie-area__slide-description">
                                                         {item.description?.length > 150 ? item.description.substring(0, 150) + '...' : item.description}
                                                     </p>
                                                    <div className="movie-area__slide-genre">
                                                        {item.genres?.slice(0, 3).map((genre) => ( // Giới hạn 3 genre
                                                            <div key={genre.id} className="movie-area__slide-genre-item">
                                                                <span className='movie-area__slide-genre-badge'>{genre.title}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <div className="movie-area__slide-trailer">
                                                        <h3 className="movie-area__slide-trailer-title">Xem phim</h3>
                                                         {/* Sửa Link */}
                                                        <Link to={`/play/${item.slug}?t=${lastEpisodeNumber}`} className="movie-area__slide-trailer-btn">
                                                            <i className="fa fa-play"></i>
                                                        </Link>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                         {/* Có thể thêm pagination của Swiper nếu muốn */}
                         {/* <div className="swiper-pagination"></div> */}
                    </div>
                </div>
                {/* Thumbnail Previews */}
                 {data.featuredMovies && data.featuredMovies.length > 1 && ( // Chỉ hiện thumbnail nếu có nhiều hơn 1 slide
                    <div className="movie-area-thumb">
                        <div className="thumb-prev" onClick={handlePrev}>
                             {/* Render component ThumbnailPreview với dữ liệu state */}
                             <ThumbnailPreview movieData={thumbData.prev} />
                        </div>
                        <div className="thumb-next" onClick={handleNext}>
                             {/* Render component ThumbnailPreview với dữ liệu state */}
                             <ThumbnailPreview movieData={thumbData.next} />
                        </div>
                    </div>
                 )}
            </div>
        </section>
    );
}

export default HeroArea;