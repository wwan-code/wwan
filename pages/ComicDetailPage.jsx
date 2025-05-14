// src/pages/ComicDetailPage.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { toast, Bounce } from 'react-toastify';
import NProgress from 'nprogress';
import { useSelector } from 'react-redux';
import authHeader from '../services/auth-header'; // Nếu có các API cần xác thực (vd: theo dõi)

// Hooks

// SCSS (Tạo file mới và có thể tham khảo từ movie-single.scss)
import '../assets/scss/movie-single.scss'; // Tạm thời tái sử dụng/tham khảo
import '../assets/scss/ComicDetailPage.scss'; // File SCSS riêng
import useImageBorderShadow from '../hooks/useImageBorderShadow';

// Helper functions
const formatViewCountDCP = (number) => { // DCP: Detail Comic Page
    if (typeof number !== 'number') return '0';
    if (number >= 1e6) return (number / 1e6).toFixed(1).replace(/\.0$/, '') + 'M';
    if (number >= 1e3) return (number / 1e3).toFixed(1).replace(/\.0$/, '') + 'K';
    return number.toString();
};

const getStatusDisplayDCP = (status) => {
    const statusMap = {
        ongoing: "Đang tiến hành", completed: "Hoàn thành",
        paused: "Tạm dừng", dropped: "Đã drop",
    };
    return statusMap[status] || status;
};


const ComicDetailPage = () => {
    const { comicSlug } = useParams();
    const navigate = useNavigate();
    const { user: currentUser, isLoggedIn } = useSelector((state) => state.user);

    const [comic, setComic] = useState(null);
    const [chapters, setChapters] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('chapters'); // 'chapters', 'details'
    const [backgroundImage, setBackgroundImage] = useState('');

    // Sử dụng hook cho hiệu ứng ảnh bìa (nếu bạn muốn)
    const { imgRef, shadowStyle, gradientBackground } = useImageBorderShadow(
        comic?.coverImage
    );

    const handleApiError = useCallback((err, operation = "tải dữ liệu") => {
        console.error(`Lỗi ${operation}:`, err);
        const message = err.response?.data?.message || err.message || `Không thể ${operation}.`;
        toast.error(message, { theme: document.documentElement.getAttribute("data-ww-theme") || "light", transition: Bounce });
        setError(message);
    }, []);

    useEffect(() => {
        const fetchComicDetails = async () => {
            if (!comicSlug) return;
            setLoading(true); setError(null); NProgress.start();
            try {
                const comicRes = await axios.get(`/api/comics/${comicSlug}`);
                if (comicRes.data?.success && comicRes.data.comic) {
                    const fetchedComic = comicRes.data.comic;
                    setComic(fetchedComic);
                    document.title = `${fetchedComic.title} - Đọc truyện tranh Online | WWAN Film`;

                    if (fetchedComic.coverImage) {
                        const coverUrl = fetchedComic.coverImage.startsWith('http') ? fetchedComic.coverImage : `/uploads/${fetchedComic.coverImage}`;
                        setBackgroundImage(coverUrl);
                    }

                    if (fetchedComic.id) {
                        const chaptersRes = await axios.get(`/api/comics/${fetchedComic.id}/chapters`, {
                            params: { limit: 1000, page: 1, sortBy: 'order', sortOrder: 'ASC' }
                        });
                        if (chaptersRes.data?.success) {
                            setChapters(chaptersRes.data.chapters || []);
                        }
                    }
                } else {
                    throw new Error(comicRes.data?.message || "Không tìm thấy truyện.");
                }
            } catch (err) {
                handleApiError(err, `tải chi tiết truyện "${comicSlug}"`);
                if (err.response?.status === 404) navigate("/404", { replace: true });
            } finally {
                setLoading(false); NProgress.done();
            }
        };
        fetchComicDetails();
    }, [comicSlug, navigate, handleApiError]);

    // TODO: Thêm các hàm xử lý theo dõi truyện, thêm vào watchlist (nếu có)

    if (loading) {
        return <div className="loader-overlay">
                <div id="container-loader">
                    <div className="loader-box" id="loader1"></div>
                    <div className="loader-box" id="loader2"></div>
                    <div className="loader-box" id="loader3"></div>
                    <div className="loader-box" id="loader4"></div>
                    <div className="loader-box" id="loader5"></div>
                </div>
            </div>;
    }
    if (error && !comic) {
        return <div className="container text-center py-5"><div className="alert-custom alert-danger">{error}</div></div>;
    }
    if (!comic) {
        return <div className="container text-center py-5"><div className="alert-custom alert-info">Không tìm thấy truyện này.</div></div>;
    }

    const firstChapter = chapters.length > 0 ? chapters[0] : null;
    const coverImageUrl = comic.coverImage ? `/uploads/${comic.coverImage}` : '/placeholder-comic.png';

    return (
        <>
            <div className="hero-section comic-detail-hero" style={{ backgroundImage: backgroundImage ? `url(${backgroundImage})` : 'var(--w-secondary-bg-subtle)' }}>
                <div className="hero-overlay-gradient"></div> {/* Lớp phủ gradient */}
            </div>

            <section className="content-detail-page comic-detail-content">
                <div className="container">
                    <div className="content-detail-layout">
                        {/* ----- Cột Trái: Ảnh bìa & Nút Hành động ----- */}
                        <div className="content-detail-sidebar">
                            <div className="sidebar-sticky-block"> {/* Tương tự sticky-sb */}
                                <div className="comic-cover-art-container" style={{ boxShadow: shadowStyle }}>
                                    <img
                                        ref={imgRef}
                                        src={coverImageUrl}
                                        alt={comic.title}
                                        className="comic-cover-art"
                                        onError={(e) => {e.target.onerror = null; e.target.src='/placeholder-comic.png'}}
                                    />
                                </div>
                                <div className="comic-action-buttons">
                                    {firstChapter ? (
                                        <Link to={`/truyen/${comic.slug}/chap/${firstChapter.id}`} className="btn-main btn-primary-custom btn-read-first">
                                            <i className="fas fa-book-reader icon-before"></i> Đọc từ đầu
                                        </Link>
                                    ) : (
                                        <button className="btn-main btn-disabled-custom" disabled>Chưa có chương</button>
                                    )}
                                    {/*
                                    <button className="btn-main btn-secondary-custom btn-follow-comic">
                                        <i className="fas fa-heart icon-before"></i> Theo dõi
                                    </button>
                                    <button className="btn-main btn-secondary-custom btn-add-to-watchlist">
                                        <i className="fas fa-plus-circle icon-before"></i> Thêm vào DS xem
                                    </button>
                                    */}
                                </div>
                            </div>
                        </div>

                        {/* ----- Cột Phải: Thông tin & Tabs ----- */}
                        <div className="content-detail-main">
                            <div className="comic-header-info">
                                <h1 className="comic-title-main">{comic.title}</h1>
                                {comic.subTitle && <h3 className="comic-subtitle-alt">{comic.subTitle}</h3>}
                                <div className="comic-meta-primary">
                                    <span><i className="fas fa-user-edit"></i> Tác giả: <strong>{comic.author || 'Đang cập nhật'}</strong></span>
                                    {comic.artist && <span><i className="fas fa-paint-brush"></i> Họa sĩ: <strong>{comic.artist}</strong></span>}
                                    <span><i className="fas fa-calendar-alt"></i> Năm: {comic.year || 'N/A'}</span>
                                    <span className="status-tag-detail" data-status={comic.status}>
                                        <i className={`fas ${comic.status === 'completed' ? 'fa-check-circle' : 'fa-spinner fa-spin'}`}></i>
                                        {getStatusDisplayDCP(comic.status)}
                                    </span>
                                </div>
                                <div className="comic-stats-bar">
                                    <span><i className="fas fa-eye"></i> {formatViewCountDCP(comic.views)} Lượt xem</span>
                                    <span><i className="fas fa-list-ol"></i> {chapters.length} Chương</span>
                                </div>
                                <div className="comic-taxonomy-tags">
                                    {comic.genres && comic.genres.map(genre => (
                                        <Link key={genre.id} to={`/the-loai-truyen/${genre.slug}`} className="tag-item genre-tag">
                                            {genre.title}
                                        </Link>
                                    ))}
                                    {comic.country && <Link to={`/quoc-gia-truyen/${comic.country.slug}`} className="tag-item country-tag">{comic.country.title}</Link>}
                                    {comic.category && <Link to={`/phan-loai-truyen/${comic.category.slug}`} className="tag-item category-tag">{comic.category.title}</Link>}
                                </div>
                            </div>

                            <div className="content-tabs-section">
                                <ul className="tabs-navigation-custom">
                                    <li className={activeTab === 'chapters' ? 'active' : ''} onClick={() => setActiveTab('chapters')}>
                                        <i className="fas fa-list-ul icon-before"></i> Danh sách chương
                                    </li>
                                    <li className={activeTab === 'details' ? 'active' : ''} onClick={() => setActiveTab('details')}>
                                        <i className="fas fa-info-circle icon-before"></i> Giới thiệu
                                    </li>
                                    {/* Thêm tab Đánh giá/Bình luận nếu có */}
                                </ul>
                                <div className="tabs-content-custom" style={activeTab === 'details' ? gradientBackground : {}}>
                                    <div className={`tab-pane-custom ${activeTab === 'details' ? 'active show' : ''}`} id="comic-info-tab">
                                        {comic.description ? (
                                            <div className="comic-description-content" dangerouslySetInnerHTML={{ __html: comic.description.replace(/\n/g, '<br />') }}></div>
                                        ) : (
                                            <p className="text-muted-custom">Chưa có mô tả cho truyện này.</p>
                                        )}
                                    </div>

                                    <div className={`tab-pane-custom ${activeTab === 'chapters' ? 'active show' : ''}`} id="comic-chapters-tab">
                                        {chapters.length > 0 ? (
                                            <div className="chapter-list-wrapper">
                                                <div className="chapter-list-header">
                                                    <span className="header-col chapter-no-col">Số chương</span>
                                                    <span className="header-col chapter-date-col">Ngày cập nhật</span>
                                                </div>
                                                <ul className="chapter-list-styled">
                                                    {chapters.map(chap => (
                                                        <li key={chap.id} className="chapter-list-item-styled">
                                                            <Link to={`/truyen/${comic.slug}/chap/${chap.id}`} className="chapter-item-link">
                                                                <span className="chapter-item-number">Chương {chap.chapterNumber}</span>
                                                                {chap.title && <span className="chapter-item-title">{chap.title}</span>}
                                                            </Link>
                                                            <span className="chapter-item-date">
                                                                {new Date(chap.createdAt).toLocaleDateString('vi-VN')}
                                                            </span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        ) : (
                                            <p className="text-muted-custom mt-3">Truyện này hiện chưa có chương nào.</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
};

export default ComicDetailPage;