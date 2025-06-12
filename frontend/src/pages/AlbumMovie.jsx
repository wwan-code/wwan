import axios from "axios";
import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";

import useLastEpisode from "@hooks/useLastEpisode";
import useImageBorderShadow from "@hooks/useImageBorderShadow";
import authHeader from "@services/auth-header";
import classNames from "@utils/classNames";

import ReviewForm from '@components/Review/ReviewForm';
import ReviewList from '@components/Review/ReviewList';
import AddToCollectionModal from '@components/Modal/AddToCollectionModal';
import { handleApiError } from "@utils/handleApiError";
import "@assets/scss/movie-single.scss";

const AlbumMovie = () => {
    const { slug } = useParams();
    const { user: currentUser, isLoggedIn } = useSelector((state) => state.user);

    const [data, setData] = useState(null);
    const [backgroundImage, setBackgroundImage] = useState('');
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('tongquan');
    const [isFollowing, setIsFollowing] = useState(false);
    const [isAddingToWatchlist, setIsAddingToWatchlist] = useState(false);

    const [reviews, setReviews] = useState([]);
    const [reviewLikeLoading, setReviewLikeLoading] = useState({});
    const [reviewsLoading, setReviewsLoading] = useState(true);
    const [reviewsError, setReviewsError] = useState(null);
    const [reviewPagination, setReviewPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
        itemsPerPage: 10,
    });
    const [currentSort, setCurrentSort] = useState('newest');
    const [userRating, setUserRating] = useState(0);
    const [userReviewContent, setUserReviewContent] = useState('');
    const [isSubmittingReview, setIsSubmittingReview] = useState(false);
    const [userExistingReview, setUserExistingReview] = useState(null);
    const [loadingExistingReview, setLoadingExistingReview] = useState(false);

    const [showAddToCollectionModal, setShowAddToCollectionModal] = useState(false);
    const lastEpisode = useLastEpisode(data?.movie?.Episodes);

    const fetchAlbumData = useCallback(async () => {
        setLoading(true);
        setLoadingExistingReview(true);
        try {
            const response = await axios.get(`/api/album-movie/${slug}`, { headers: authHeader() });
            const fetchedData = response.data;

            if (!fetchedData || !fetchedData.movie) {
                throw new Error("Không tìm thấy dữ liệu phim.");
            }
            setData(fetchedData);
            setIsFollowing(fetchedData.isFollowed);

            if (isLoggedIn && fetchedData.movie?.id) {
                try {
                    const reviewRes = await axios.get(`/api/movies/${fetchedData.movie.id}/my-review`, { headers: authHeader() });
                    if (reviewRes.data.success && reviewRes.data.rating) {
                        setUserExistingReview(reviewRes.data.rating);
                        setUserRating(reviewRes.data.rating.rating || 0);
                        setUserReviewContent(reviewRes.data.rating.reviewContent || '');
                    } else {
                        setUserExistingReview(null);
                        setUserRating(0);
                        setUserReviewContent('');
                    }
                } catch (reviewError) {
                    console.error("Error fetching user's existing review:", reviewError);
                    setUserExistingReview(null);
                    setUserRating(0);
                    setUserReviewContent('');
                }
            } else {
                setUserExistingReview(null);
                setUserRating(0);
                setUserReviewContent('');
            }

        } catch (error) {
            handleApiError(error, `tải dữ liệu phim "${slug}"`);
            setData(null);
        } finally {
            setLoading(false);
            setLoadingExistingReview(false);
        }
    }, [slug, isLoggedIn, handleApiError]);

    useEffect(() => {
        fetchAlbumData();
    }, [fetchAlbumData]);

    const fetchReviews = useCallback(async (page = 1, sort = 'newest') => {
        if (!data?.movie?.id) return;

        setReviewsLoading(true);
        setReviewsError(null);
        try {
            const response = await axios.get(`/api/movies/${data.movie.id}/reviews`, {
                params: {
                    page: page,
                    limit: reviewPagination.itemsPerPage,
                    sort: sort
                }
            });

            if (response.data.success) {
                const reviews = (response.data.reviews || []).map(r => ({
                    ...r,
                    likes: typeof r.likes === 'string' ? (() => {
                        try { return JSON.parse(r.likes); } catch { return []; }
                    })() : (Array.isArray(r.likes) ? r.likes : [])
                }));
                setReviews(reviews);
                setReviewPagination(response.data.pagination || { currentPage: 1, totalPages: 1, totalItems: 0, itemsPerPage: 10 });
            } else {
                throw new Error(response.data.message || "Lỗi tải đánh giá phim.");
            }
        } catch (error) {
            console.error("Error fetching reviews:", error);
            setReviewsError("Không thể tải danh sách đánh giá.");
        } finally {
            setReviewsLoading(false);
        }
    }, [data?.movie?.id, reviewPagination.itemsPerPage]);

    useEffect(() => {
        if (data?.movie?.id) {
            fetchReviews(reviewPagination.currentPage, currentSort);
        }
    }, [data?.movie?.id, reviewPagination.currentPage, currentSort, fetchReviews]);

    // --- Xử lý Ảnh Nền ---
    useEffect(() => {
        if (data?.movie?.bannerURL) {
            const url = '/' + data.movie?.bannerURL;
            setBackgroundImage(url);
        } else {
            setBackgroundImage('');
        }
    }, [data?.movie?.bannerURL]);

    // --- Logic Follow/Unfollow ---
    const handleFollowClick = async () => {
        if (!currentUser || !data?.movie) {
            toast.error("Vui lòng đăng nhập để theo dõi phim.");
            return;
        }

        const originalIsFollowed = isFollowing;
        const originalFollowCount = data.totalFollows;

        // Cập nhật UI lạc quan
        const newFollowState = !originalIsFollowed;
        setIsFollowing(newFollowState);
        setData(prevData => ({
            ...prevData,
            isFollowed: newFollowState,
            totalFollows: prevData.totalFollows + (newFollowState ? 1 : -1)
        }));


        try {
            let response;
            const payload = { userId: currentUser.id, movieId: data.movie.id };

            if (originalIsFollowed) { // Nếu trước đó đã follow -> unfollow
                response = await axios.delete('/api/follow-movie/delete', {
                    data: payload,
                    headers: authHeader()
                });
                if (response.data.success && typeof response.data.newTotalFollows === 'number') {
                    setData(prev => ({ ...prev, totalFollows: response.data.newTotalFollows }));
                }
            } else { // Nếu trước đó chưa follow -> follow
                response = await axios.post('/api/follow-movie', payload, { headers: authHeader() });
                if (response.data.success && typeof response.data.newTotalFollows === 'number') {
                    setData(prev => ({ ...prev, totalFollows: response.data.newTotalFollows }));
                }
            }

            toast.success(response.data.message || (newFollowState ? 'Theo dõi thành công!' : 'Bỏ theo dõi thành công!'));

        } catch (error) {
            handleApiError(error, newFollowState ? "theo dõi" : "bỏ theo dõi");
            setIsFollowing(originalIsFollowed);
            setData(prevData => ({
                ...prevData,
                isFollowed: originalIsFollowed,
                totalFollows: originalFollowCount
            }));
        }
    };

    const handleSortChange = (newSort) => {
        if (newSort !== currentSort) {
            setCurrentSort(newSort);
            setReviewPagination(prev => ({ ...prev, currentPage: 1 }));
        }
    };

    const handlePageChange = (newPage) => {
        if (newPage !== reviewPagination.currentPage) {
            setReviewPagination(prev => ({ ...prev, currentPage: newPage }));
        }
    };

    const handleReviewSubmit = async ({ rating, reviewContent }) => {
        if (!isLoggedIn) {
            toast.info("Vui lòng đăng nhập để gửi đánh giá.");
            return;
        }
        if (rating === 0) {
            toast.warn("Vui lòng chọn số sao đánh giá.");
            return;
        }
        if (!data?.movie?.id) return;

        setIsSubmittingReview(true);
        try {
            const payload = {
                movieId: data.movie.id,
                rating: rating,
                reviewContent: reviewContent.trim()
            };
            const response = await axios.post('/api/ratings', payload, { headers: authHeader() });

            if (response.data.success) {
                toast.success(response.data.message || "Gửi đánh giá thành công!");
                setUserExistingReview(response.data.rating);
                fetchReviews(1, 'newest');
                setCurrentSort('newest');
            } else {
                throw new Error(response.data.message || "Gửi đánh giá thất bại.");
            }
        } catch (error) {
            handleApiError(error, "gửi đánh giá");
        } finally {
            setIsSubmittingReview(false);
        }
    };

    const handleLikeReview = useCallback(async (reviewId) => {
        if (!isLoggedIn) {
            toast.info("Vui lòng đăng nhập để thích đánh giá.");
            return;
        }
        if (reviewLikeLoading[reviewId]) {
            return;
        }

        let originalLikes = [];
        let optimisticLikes = [];
        let isCurrentlyLiked = false;

        setReviewLikeLoading(prev => ({ ...prev, [reviewId]: true }));

        setReviews(prevReviews => {
            return prevReviews.map(r => {
                if (r.id === reviewId) {
                    let likesArray = [];
                    if (typeof r.likes === 'string') {
                        try {
                            likesArray = JSON.parse(r.likes);
                        } catch {
                            likesArray = [];
                        }
                    } else if (Array.isArray(r.likes)) {
                        likesArray = r.likes;
                    } else {
                        likesArray = [];
                    }
                    originalLikes = Array.isArray(likesArray) ? [...likesArray] : [];
                    const userIndex = originalLikes.indexOf(currentUser.id);
                    isCurrentlyLiked = userIndex > -1;

                    if (isCurrentlyLiked) {
                        optimisticLikes = originalLikes.filter(userId => userId !== currentUser.id);
                    } else {
                        optimisticLikes = [...originalLikes, currentUser.id];
                    }
                    return { ...r, likes: optimisticLikes };
                }
                return r;
            });
        });

        try {
            const response = await axios.post(`/api/ratings/${reviewId}/like`, {}, { headers: authHeader() });

            if (!response.data.success) {
                throw new Error(response.data.message || "Thao tác like/unlike thất bại.");
            }

        } catch (error) {
            handleApiError(error, isCurrentlyLiked ? "Bỏ thích" : "Thích");
            setReviews(prevReviews => prevReviews.map(r => {
                if (r.id === reviewId) {
                    return { ...r, likes: originalLikes };
                }
                return r;
            }));
        } finally {
            setReviewLikeLoading(prev => ({ ...prev, [reviewId]: false }));
        }
    }, [isLoggedIn, currentUser?.id, handleApiError, reviewLikeLoading]);

    const handleDeleteReview = useCallback(async (reviewId) => {
        if (!isLoggedIn) {
            toast.info("Vui lòng đăng nhập.");
            return;
        }
        try {
            const response = await axios.delete(`/api/ratings/${reviewId}`, { headers: authHeader() });

            if (response.data.success) {
                toast.success(response.data.message || "Đã xóa đánh giá.");
                setReviews(prevReviews => prevReviews.filter(r => r.id !== reviewId));
                setReviewPagination(prev => ({
                    ...prev,
                    totalItems: Math.max(0, prev.totalItems - 1)
                }));
                if (userExistingReview?.id === reviewId) {
                    setUserExistingReview(null);
                    setUserRating(0);
                    setUserReviewContent('');
                }
            } else {
                throw new Error(response.data.message || "Xóa đánh giá thất bại.");
            }
        } catch (error) {
            handleApiError(error, "Xóa đánh giá");
        }
    }, [isLoggedIn, handleApiError, userExistingReview?.id]);

    const { imgRef, shadowStyle } = useImageBorderShadow(data?.movie?.posterURL);

    useEffect(() => {
        if (data?.movie?.title) {
            document.title = `${data.movie.title} - WWAN Film`;
        } else if (!loading) {
            document.title = 'Không tìm thấy phim - WWAN Film';
        }
    }, [data?.movie?.title, loading]);

    if (loading) {
        return (
            <div className="loader-overlay">
                <div id="container-loader">
                    <div className="loader-box" id="loader1"></div>
                    <div className="loader-box" id="loader2"></div>
                    <div className="loader-box" id="loader3"></div>
                    <div className="loader-box" id="loader4"></div>
                    <div className="loader-box" id="loader5"></div>
                </div>
            </div>
        );
    }

    if (!data || !data.movie) {
        return (
            <div className="container text-center py-5">
                <h2>Oops!</h2>
                <p>Không tìm thấy thông tin cho bộ phim này.</p>
                <Link to="/" className="btn btn-primary">Về Trang Chủ</Link>
            </div>
        );
    }

    const { movie } = data;

    return (
        <>
            <div className="hero mv-single-hero" style={{
                backgroundImage: backgroundImage ? `url(${process.env.REACT_APP_API_URL_IMAGE}${backgroundImage})` : 'none',
                backgroundColor: !backgroundImage ? '#222' : 'transparent',
                backgroundRepeat: "no-repeat",
                backgroundSize: "cover",
                backgroundPosition: "center",
            }}>
            </div>
            <section className="page-single movie-single">
                <div className="container">
                    <div className="row">
                        <div className="col-xl-2 col-md-3 col-sm-12 col-xs-12">
                            <div className="movie-img sticky-sb">
                                <div className="d-flex align-items-center justify-content-center">
                                    <div
                                        style={{
                                            display: "inline-block",
                                            borderRadius: "5px",
                                            boxShadow: shadowStyle,
                                            position: "relative",
                                            overflow: "hidden",
                                            transition: "box-shadow 0.5s ease-in-out",
                                            width: "100%",
                                            maxWidth: "300px",
                                        }}
                                    >
                                        <div className='movie-img__cover'>
                                            <div className='movie-img__cover-wrap'>
                                                <picture className="movie-img__image movie-img__image-cover-image">
                                                    <source srcSet={movie.posterURL ? `${process.env.REACT_APP_API_URL_IMAGE}/${movie.posterURL}` : ''} type="image/webp" />
                                                    <img ref={imgRef} src={movie.posterURL ? `${process.env.REACT_APP_API_URL_IMAGE}/${movie.posterURL}` : '/placeholder.jpg'} alt={movie.title} loading='lazy' />
                                                </picture>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="movie-btn">
                                    {lastEpisode?.episodeNumber && (
                                        <Link to={`/play/${movie.slug}?t=${lastEpisode.episodeNumber}`} className="btn-item playbtn">
                                            <i className="fa-solid fa-play"></i> <span>Xem ngay</span>
                                        </Link>
                                    )}
                                    <button className="btn-item followbtn" onClick={handleFollowClick}>
                                        {isFollowing ? <><i className="fa-solid fa-bookmark"></i> Bỏ theo dõi</> : <><i className="fa-regular fa-bookmark"></i> Theo dõi</>}
                                    </button>
                                    {isLoggedIn && (
                                        <button
                                            className="btn-item add-watchlist"
                                            onClick={() => setShowAddToCollectionModal(true)}
                                        >
                                            <i className="fa-regular fa-plus"></i> Lưu vào bộ sưu tập
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="col-xl-10 col-md-9 col-sm-12 col-xs-12">
                            <div className="movie-single__content">
                                <h1 className="movie-single__title">{movie.title} <span>{movie.year}</span></h1>
                                <h3 className="movie-single__sub-title">{movie.subTitle}</h3>
                                <div className="movie-single__social">
                                    <div className="movie-single__social-item"> <span className="movie-single__social-item-count">
                                        Lượt xem: {
                                            movie.views ? movie.views.toLocaleString('vi-VN') : 'N/A'
                                                || 0} </span> </div>
                                    <span className="mx-1 text-muted"> | </span>
                                    <div className="movie-single__social-item"> <span className="movie-single__social-item-count"> Theo dõi: {data.totalFollows || 0} </span> </div>
                                    <span className="mx-1 text-muted"> | </span>
                                    <div className="movie-single__social-item"> <span className="movie-single__social-item-count"> Số tập: {lastEpisode?.episodeNumber || 'N/A'}/{movie.totalEpisodes || '?'} </span> </div>
                                </div>
                                <div className="movie-single__rate">
                                    <div className="movie-single__rate-rate">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="32px" height="32px" viewBox="0 0 24 24" fill="none">
                                            <path d="M11.2691 4.41115C11.5006 3.89177 11.6164 3.63208 11.7776 3.55211C11.9176 3.48263 12.082 3.48263 12.222 3.55211C12.3832 3.63208 12.499 3.89177 12.7305 4.41115L14.5745 8.54808C14.643 8.70162 14.6772 8.77839 14.7302 8.83718C14.777 8.8892 14.8343 8.93081 14.8982 8.95929C14.9705 8.99149 15.0541 9.00031 15.2213 9.01795L19.7256 9.49336C20.2911 9.55304 20.5738 9.58288 20.6997 9.71147C20.809 9.82316 20.8598 9.97956 20.837 10.1342C20.8108 10.3122 20.5996 10.5025 20.1772 10.8832L16.8125 13.9154C16.6877 14.0279 16.6252 14.0842 16.5857 14.1527C16.5507 14.2134 16.5288 14.2807 16.5215 14.3503C16.5132 14.429 16.5306 14.5112 16.5655 14.6757L17.5053 19.1064C17.6233 19.6627 17.6823 19.9408 17.5989 20.1002C17.5264 20.2388 17.3934 20.3354 17.2393 20.3615C17.0619 20.3915 16.8156 20.2495 16.323 19.9654L12.3995 17.7024C12.2539 17.6184 12.1811 17.5765 12.1037 17.56C12.0352 17.5455 11.9644 17.5455 11.8959 17.56C11.8185 17.5765 11.7457 17.6184 11.6001 17.7024L7.67662 19.9654C7.18404 20.2495 6.93775 20.3915 6.76034 20.3615C6.60623 20.3354 6.47319 20.2388 6.40075 20.1002C6.31736 19.9408 6.37635 19.6627 6.49434 19.1064L7.4341 14.6757C7.46898 14.5112 7.48642 14.429 7.47814 14.3503C7.47081 14.2807 7.44894 14.2134 7.41394 14.1527C7.37439 14.0842 7.31195 14.0279 7.18708 13.9154L3.82246 10.8832C3.40005 10.5025 3.18884 10.3122 3.16258 10.1342C3.13978 9.97956 3.19059 9.82316 3.29993 9.71147C3.42581 9.58288 3.70856 9.55304 4.27406 9.49336L8.77835 9.01795C8.94553 9.00031 9.02911 8.99149 9.10139 8.95929C9.16534 8.93081 9.2226 8.8892 9.26946 8.83718C9.32241 8.77839 9.35663 8.70162 9.42508 8.54808L11.2691 4.41115Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                        <p>
                                            <span>{data.averageRating?.toFixed(1) || 'N/A'}</span> /10
                                            <br />
                                            <span className="rv">{reviewPagination.totalItems || 0} Đánh giá</span>
                                        </p>
                                    </div>
                                    {isLoggedIn && (
                                        <div className="movie-single__user-rating">
                                            <h6>Đánh giá của bạn:</h6>
                                            {loadingExistingReview ? (
                                                <div className="text-center p-2"><i className="fas fa-spinner fa-spin"></i></div>
                                            ) : (
                                                <ReviewForm
                                                    movieId={movie.id}
                                                    initialRating={userRating}
                                                    initialContent={userReviewContent}
                                                    onSubmit={handleReviewSubmit}
                                                    isSubmitting={isSubmittingReview}
                                                    existingReviewId={userExistingReview?.id}
                                                />
                                            )}
                                        </div>
                                    )}
                                    {!isLoggedIn && (
                                        <p className="text-muted small mt-2">Vui lòng <Link to="/login">đăng nhập</Link> để gửi đánh giá.</p>
                                    )}
                                </div>

                                <div className="movie-single__tabs">
                                    <div className="tabs">
                                        <ul className="tabs-mv">
                                            <li className={activeTab === 'tongquan' ? 'active' : ''} onClick={() => setActiveTab('tongquan')}>
                                                <span>Tổng quan</span>
                                            </li>
                                            <li className={activeTab === 'trailer' ? 'active' : ''} onClick={() => setActiveTab('trailer')}>
                                                <span>Trailer</span>
                                            </li>
                                            <li className={activeTab === 'danhgia' ? 'active' : ''} onClick={() => setActiveTab('danhgia')}>
                                                <span>Đánh giá</span>
                                            </li>
                                        </ul>
                                        <div className="tab-content">
                                            <div className={classNames("tab", { active: activeTab === 'tongquan' })} id="tongquan">
                                                <div className="row">
                                                    <div className="col-md-8 col-sm-12 col-xs-12">
                                                        <p>{movie.description || 'Chưa có mô tả.'}</p>
                                                    </div>
                                                    <div className="col-md-4 col-xs-12 col-sm-12">
                                                        <div className="sb-it"><h6 className="text-muted">Thời lượng:</h6> <p>{movie.duration || 'N/A'}</p></div>
                                                        <div className="sb-it"><h6 className="text-muted">Thể loại:</h6> <p>{movie.genres?.map((g, i) => (<Link key={g.id} to={`/the-loai/${g.slug}`}>{g.title}{i < movie.genres.length - 1 ? ', ' : ''}</Link>)) || 'N/A'}</p></div>
                                                        <div className="sb-it"><h6 className="text-muted">Quốc gia:</h6> <p><Link to={`/country/${movie.countries?.slug}`}>{movie.countries?.title || 'N/A'}</Link></p></div>
                                                        <div className="sb-it"><h6 className="text-muted">Khởi chiếu:</h6> <p>{movie.releaseDate ? new Date(movie.releaseDate).toLocaleDateString('vi-VN') : 'N/A'}</p></div>
                                                        <div className="sb-it"><h6 className="text-muted">Phân loại:</h6> <p>{movie.classification || 'N/A'}</p></div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className={classNames("tab", { active: activeTab === 'trailer' })} id="trailer">
                                                <div className="row">
                                                    <div className="col-md-12 col-sm-12 col-xs-12">
                                                        {movie.trailerUrl ? (
                                                            <iframe
                                                                style={{ width: '100%', height: '500px' }}
                                                                src={`https://www.youtube.com/embed/${movie.trailerUrl}`} title="YouTube video player" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen></iframe>
                                                        ) : (
                                                            <p className="text-center">Chưa có trailer.</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className={classNames("tab", { active: activeTab === 'danhgia' })} id="danhgia">
                                                <ReviewList
                                                    reviews={reviews}
                                                    loading={reviewsLoading}
                                                    error={reviewsError}
                                                    pagination={reviewPagination}
                                                    currentSort={currentSort}
                                                    onSortChange={handleSortChange}
                                                    onPageChange={handlePageChange}
                                                    currentUser={currentUser}
                                                    onLikeReview={handleLikeReview}
                                                    onDeleteReview={handleDeleteReview}
                                                    reviewLikeLoading={reviewLikeLoading}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
            {isLoggedIn && movie && (
                <AddToCollectionModal
                    show={showAddToCollectionModal}
                    onHide={() => setShowAddToCollectionModal(false)}
                    itemType={'movie'}
                    itemId={movie.id}
                    itemTitle={movie.title}
                />
            )}
        </>

    );
};

export default AlbumMovie;