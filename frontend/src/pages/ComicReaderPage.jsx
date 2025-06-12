import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import axios from 'axios';
import { useParams, useNavigate, Link } from 'react-router-dom';
import NProgress from 'nprogress';
import { handleApiError } from '@utils/handleApiError';
import LazyImage from "@components/LazyImage";
import ComicComments from "@components/Comics/ComicComments";
import useUIPreferences from "@hooks/useUIPreferences";
import Modal from "@components/CustomModal";
import api from '@services/api';
import authHeader from '@services/auth-header';

import '@assets/scss/pages/_comic-reader-page.scss';

const ComicImage = ({ src, alt, pageNumber, totalPages, onImageLoad, onImageError }) => {
    const [imageError, setImageError] = useState(false);
    const [aspectRatio, setAspectRatio] = useState(null);
    const imgRef = useRef(null);
    const { preferences } = useUIPreferences();
    const handleImageError = () => {
        setImageError(true);
        if (onImageError) onImageError();
    };

    const handleImageLoad = (e) => {
        if (imgRef.current) {
            const { naturalWidth, naturalHeight } = imgRef.current;
            if (naturalWidth > 0 && naturalHeight > 0) {
                setAspectRatio(naturalWidth / naturalHeight);
            }
        }
        if (onImageLoad) onImageLoad();
    };

    const placeholderHeight = useMemo(() => {
        if (imageError) return '100px';
        if (aspectRatio) {
            const { naturalWidth, naturalHeight } = imgRef.current;
            const containerWidth = Math.min(800, window.innerWidth - 40);
            return `${naturalHeight}px`;
        }
        return '800px';
    }, [imageError, aspectRatio]);

    return (
        <div className="comic-page-container">
            <div className="comic-page-image-container">
                {imageError ? (
                    <div className="comic-page-error">
                        <i className="fas fa-exclamation-triangle icon-before"></i>
                        Lỗi tải trang {pageNumber}.
                        <button onClick={() => window.location.reload()} className="btn-retry-load">Thử lại</button>
                    </div>
                ) : (
                    <LazyImage
                        src={src.startsWith('http') ? src : `${process.env.REACT_APP_API_URL_IMAGE}/${src}`}
                        alt={alt}
                        className="comic-page-image"
                        onLoad={handleImageLoad}
                        onError={handleImageError}
                        style={{ minHeight: preferences.readerMode === 'scroll' && placeholderHeight }}
                        ref={imgRef}
                    />
                )}
            </div>
        </div>
    );
};

const ComicReaderPage = () => {
    const { comicSlug, chapterId } = useParams();
    const navigate = useNavigate();

    const [comicInfo, setComicInfo] = useState(null);
    const [chapterDetails, setChapterDetails] = useState(null);
    const [allChapters, setAllChapters] = useState([]);
    const [currentPageImages, setCurrentPageImages] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const readerControlsRef = useRef(null);
    const [showControls, setShowControls] = useState(true);
    const [isUserInteractingWithControls, setIsUserInteractingWithControls] = useState(false);
    let hideControlsTimeout = useRef(null);

    const [totalImages, setTotalImages] = useState(0);
    const [loadedImagesCount, setLoadedImagesCount] = useState(0);
    const [flipPageIndex, setFlipPageIndex] = useState(0);
    const [showReaderSettings, setShowReaderSettings] = useState(false);
    const { preferences, setSinglePreference, ACCENT_COLORS } = useUIPreferences();

    useEffect(() => { setFlipPageIndex(0); }, [chapterId]);
    useEffect(() => {
        const fetchChapterData = async () => {
            if (!chapterId) { setError("Không có ID chương."); setIsLoading(false); return; }
            setIsLoading(true); setError(null); NProgress.start();
            setLoadedImagesCount(0);
            setTotalImages(0);

            try {
                const chapterRes = await api.get(`/api/chapters/${chapterId}/pages`, {
                    headers: authHeader()
                });
                if (chapterRes.data?.success && chapterRes.data.chapter) {
                    const currentChapter = chapterRes.data.chapter;
                    setChapterDetails(currentChapter);
                    const sortedPages = (currentChapter.pages || []).sort((a, b) => a.pageNumber - b.pageNumber);
                    setCurrentPageImages(sortedPages);
                    setTotalImages(sortedPages.length);
                    setComicInfo(currentChapter.comic);

                    if (currentChapter.comic?.id) {
                        const allChaptersRes = await api.get(`/api/comics/${currentChapter.comic.id}/chapters`, {
                            params: { limit: 1000, sortBy: 'order', sortOrder: 'ASC' }
                        });
                        if (allChaptersRes.data?.success) {
                            setAllChapters((allChaptersRes.data.chapters || []).sort((a, b) => a.order - b.order));
                        }
                    }
                    window.scrollTo({ top: 0, behavior: 'auto' });

                } else {
                    throw new Error(chapterRes.data?.message || "Không thể tải dữ liệu chương.");
                }
            } catch (err) {
                handleApiError(err, `tải chương ID ${chapterId}`);
                if (err.response?.status === 404) navigate("/404", { replace: true });
            } finally {
                setIsLoading(false); NProgress.done();
            }
        };
        fetchChapterData();
    }, [chapterId, navigate]);

    const handleImageLoaded = useCallback(() => {
        setLoadedImagesCount(prev => prev + 1);
    }, []);

    const handleImageLoadError = useCallback(() => { }, []);

    const loadingProgress = totalImages > 0 ? (loadedImagesCount / totalImages) * 100 : 0;

    // Ẩn/hiện controls
    const resetHideControlsTimeout = useCallback(() => {
        setShowControls(true);
        clearTimeout(hideControlsTimeout.current);
        hideControlsTimeout.current = setTimeout(() => {
            if (!isUserInteractingWithControls && readerControlsRef.current && !readerControlsRef.current.matches(':hover')) {
                setShowControls(false);
            }
        }, 3000);
    }, [isUserInteractingWithControls]);

    useEffect(() => {
        window.addEventListener('mousemove', resetHideControlsTimeout);
        window.addEventListener('scroll', resetHideControlsTimeout);
        window.addEventListener('click', resetHideControlsTimeout);

        const controlsElement = readerControlsRef.current;
        const enterControls = () => setIsUserInteractingWithControls(true);
        const leaveControls = () => {
            setIsUserInteractingWithControls(false);
            resetHideControlsTimeout();
        };

        if (controlsElement) {
            controlsElement.addEventListener('mouseenter', enterControls);
            controlsElement.addEventListener('mouseleave', leaveControls);
        }

        return () => {
            window.removeEventListener('mousemove', resetHideControlsTimeout);
            window.removeEventListener('scroll', resetHideControlsTimeout);
            window.removeEventListener('click', resetHideControlsTimeout);
            if (controlsElement) {
                controlsElement.removeEventListener('mouseenter', enterControls);
                controlsElement.removeEventListener('mouseleave', leaveControls);
            }
            clearTimeout(hideControlsTimeout.current);
        };
    }, [resetHideControlsTimeout]);

    const navigateChapter = (targetChapterId) => {
        if (targetChapterId && comicInfo?.slug) {
            NProgress.start();
            navigate(`/truyen/${comicInfo.slug}/chap/${targetChapterId}`);
        }
    };

    const currentChapterIndex = useMemo(() => {
        return allChapters.findIndex(chap => String(chap.id) === String(chapterId));
    }, [allChapters, chapterId]);

    const prevChapter = useMemo(() => (currentChapterIndex > 0 ? allChapters[currentChapterIndex - 1] : null), [allChapters, currentChapterIndex]);
    const nextChapter = useMemo(() => (currentChapterIndex < allChapters.length - 1 ? allChapters[currentChapterIndex + 1] : null), [allChapters, currentChapterIndex]);

    useEffect(() => {
        if (comicInfo && chapterDetails) {
            document.title = `${comicInfo.title} - Chương ${chapterDetails.chapterNumber} | WWAN Film`;
        } else if (!isLoading) {
            document.title = 'Đọc truyện | WWAN Film';
        }
    }, [comicInfo, chapterDetails, isLoading]);

    if (isLoading && currentPageImages.length === 0) {
        return <div className="page-loader"><div className="spinner-eff"></div><p>Đang tải chương truyện...</p></div>;
    }
    if (error && !chapterDetails) {
        return (
            <div className="container text-center py-5">
                <div className="alert-custom alert-danger">{error}</div>
                <Link to={comicInfo?.slug ? `/truyen/${comicInfo.slug}` : "/truyen-tranh"} className="btn-custom btn-primary-custom mt-3">
                    {comicInfo ? "Quay lại trang truyện" : "Về danh sách truyện"}
                </Link>
            </div>
        );
    }
    if (!chapterDetails || (currentPageImages.length === 0 && !isLoading)) {
        return (
            <div className="container text-center py-5">
                <div className="alert-custom alert-info">Không có dữ liệu trang cho chương này hoặc chương không tồn tại.</div>
                <Link to={comicInfo?.slug ? `/truyen/${comicInfo.slug}` : "/truyen-tranh"} className="btn-custom btn-primary-custom mt-3">
                    {comicInfo ? "Quay lại trang truyện" : "Về danh sách truyện"}
                </Link>
            </div>
        );
    }

    return (
        <>
            <div className="comic-reader-page" onMouseMove={resetHideControlsTimeout} onClick={(e) => {
                if (readerControlsRef.current && !readerControlsRef.current.contains(e.target)) {
                    setShowControls(prev => !prev);
                }
            }}>
                {/* Thanh điều hướng nổi */}
                <nav className={`reader-controls`}>
                    <div className="controls-breadcrumb">
                        <ol className="breadcrumb">
                            <li className="breadcrumb-item">
                                <Link to="/truyen-tranh" className="breadcrumb-link">Truyện tranh</Link>
                            </li>
                            <li className="breadcrumb-item">
                                <Link to={`/truyen/${comicInfo.slug}`} className="breadcrumb-link comic-title-breadcrumb" title={comicInfo.title}>
                                    {comicInfo.title}
                                </Link>
                            </li>
                            <li className="breadcrumb-item active" aria-current="page">
                                <span className="breadcrumb-link">Chương {chapterDetails.chapterNumber}</span>
                            </li>
                        </ol>
                    </div>
                    <div className="controls-navigation">
                        <button onClick={() => prevChapter && navigateChapter(prevChapter.id)} disabled={!prevChapter || isLoading} className="btn-nav prev" title={prevChapter ? `Chương ${prevChapter.chapterNumber}` : "Đầu truyện"}>
                            <i className="fas fa-chevron-left"></i> <span className="btn-nav-text">Trước</span>
                        </button>
                        <select className="chapter-select" value={chapterId} onChange={(e) => navigateChapter(e.target.value)} disabled={isLoading || allChapters.length <= 1} title="Chọn chương">
                            {allChapters.map(chap => (
                                <option key={chap.id} value={chap.id}>Chap {chap.chapterNumber}</option>
                            ))}
                        </select>
                        <button onClick={() => nextChapter && navigateChapter(nextChapter.id)} disabled={!nextChapter || isLoading} className="btn-nav next" title={nextChapter ? `Chương ${nextChapter.chapterNumber}` : "Cuối truyện"}>
                            <span className="btn-nav-text">Sau</span> <i className="fas fa-chevron-right"></i>
                        </button>
                    </div>
                </nav>

                {/* Progress bar tải trang truyện */}
                {isLoading && (
                    <div className="reader-loading-progress-bar">
                        <div className="progress-bar-inner" style={{ width: `${loadingProgress}%` }}>
                            {Math.round(loadingProgress)}%
                        </div>
                    </div>
                )}

                {/* Vùng đọc truyện */}
                <main className={`comic-content-area ${preferences.readerMode === 'flip' ? 'reader-flip-mode' : 'reader-scroll-mode'}`} tabIndex={0}>
                    {preferences.readerMode === 'flip' ? (
                        // Kiểu lật trang: chỉ hiển thị 1 trang, có nút lật trái/phải
                        <section className="comic-page-section" aria-label={`Trang ${currentPageImages[flipPageIndex]?.pageNumber || 1}`}>
                            <ComicImage
                                src={currentPageImages[flipPageIndex]?.imageUrl}
                                alt={`Trang ${currentPageImages[flipPageIndex]?.pageNumber}`}
                                pageNumber={currentPageImages[flipPageIndex]?.pageNumber}
                                totalPages={totalImages}
                                onImageLoad={handleImageLoaded}
                                onImageError={handleImageLoadError}
                            />
                            <div className="flip-controls">
                                <button
                                    className="btn-flip"
                                    onClick={() => setFlipPageIndex(i => Math.max(i - 1, 0))}
                                    disabled={flipPageIndex === 0}
                                >
                                    <i className="fas fa-chevron-left"></i>
                                </button>
                                <span className="flip-page-info">
                                    Trang {currentPageImages[flipPageIndex]?.pageNumber || 1}/{totalImages}
                                </span>
                                <button
                                    className="btn-flip"
                                    onClick={() => setFlipPageIndex(i => Math.min(i + 1, totalImages - 1))}
                                    disabled={flipPageIndex === totalImages - 1}
                                >
                                    <i className="fas fa-chevron-right"></i>
                                </button>
                            </div>
                        </section>
                    ) : (
                        // Kiểu cuộn: như cũ
                        currentPageImages.map((page, index) => (
                            <section
                                key={page.id || `page-image-${index}`}
                                className="comic-page-section"
                                aria-label={`Trang ${page.pageNumber}`}
                            >
                                <ComicImage
                                    src={page.imageUrl}
                                    alt={`Trang ${page.pageNumber}`}
                                    pageNumber={page.pageNumber}
                                    totalPages={totalImages}
                                    onImageLoad={handleImageLoaded}
                                    onImageError={handleImageLoadError}
                                />
                            </section>
                        ))
                    )}
                </main>

                {/* Thanh điều hướng dưới */}
                {currentPageImages.length > 0 && !isLoading && (
                    <footer className={`reader-bottom-navigation ${showControls ? 'controls-visible' : ''}`}>
                        <div className="bottom-nav-controls">
                            <button onClick={() => prevChapter && navigateChapter(prevChapter.id)} disabled={!prevChapter} className="btn-nav-bottom">
                                <i className="fas fa-arrow-left me-1"></i> Chương trước
                            </button>
                            <select className="chapter-select" value={chapterId} onChange={(e) => navigateChapter(e.target.value)} disabled={isLoading || allChapters.length <= 1} title="Chọn chương">
                                {allChapters.map(chap => (
                                    <option key={chap.id} value={chap.id}>Chap {chap.chapterNumber}</option>
                                ))}
                            </select>
                            <button onClick={() => nextChapter && navigateChapter(nextChapter.id)} disabled={!nextChapter} className="btn-nav-bottom">
                                Chương sau <i className="fas fa-arrow-right ms-1"></i>
                            </button>
                            <Link to={`/truyen/${comicInfo.slug}`} className="btn-nav-bottom" title="Danh sách chương">
                                <i className="fas fa-list-ul"></i>
                            </Link>
                            <button
                                className="btn-nav-bottom"
                                title="Tùy chỉnh đọc truyện"
                                onClick={() => setShowReaderSettings(true)}
                            >
                                <i className="fas fa-cog"></i>
                            </button>
                            <button onClick={() => { window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="btn-nav-bottom" title="Lên đầu trang">
                                <i className="fas fa-arrow-up"></i>
                            </button>
                        </div>
                    </footer>
                )}

                {/* Khu vực bình luận hiện đại */}
                <aside className="comic-comments-area" aria-label="Bình luận chương truyện">
                    <ComicComments comic={chapterDetails} contentType="chapter" />
                </aside>
            </div>
            <Modal
                show={showReaderSettings}
                onHide={() => setShowReaderSettings(false)}
                title="Tùy chỉnh đọc truyện"
                modalId="reader-settings-modal"
                footer={
                    <button className="btn btn-primary" onClick={() => setShowReaderSettings(false)}>Đóng</button>
                }
            >
                <div className="reader-settings-panel">
                    <div className="mb-3">
                        <label className="form-label">Kiểu đọc</label>
                        <select
                            className="form-select"
                            value={preferences.readerMode || 'scroll'}
                            onChange={e => setSinglePreference('readerMode', e.target.value)}
                        >
                            <option value="scroll">Cuộn xuống</option>
                            <option value="flip">Lật trang</option>
                        </select>
                    </div>
                    <div className="mb-3">
                        <label className="form-label">Chế độ nền</label>
                        <select
                            className="form-select"
                            value={preferences.theme}
                            onChange={e => setSinglePreference('theme', e.target.value)}
                        >
                            <option value="light">Sáng</option>
                            <option value="dark">Tối</option>
                            <option value="system">Theo hệ thống</option>
                        </select>
                    </div>
                    <div className="mb-3">
                        <label className="form-label">Màu nhấn</label>
                        <div className="d-flex flex-wrap gap-2">
                            {ACCENT_COLORS.map(color => (
                                <button
                                    key={color.value}
                                    type="button"
                                    className={`color-dot ${preferences.accentColor === color.value ? 'active' : ''}`}
                                    style={{ background: color.value, width: 28, height: 28, borderRadius: '6px' }}
                                    onClick={() => setSinglePreference('accentColor', color.value)}
                                    title={color.name}
                                />
                            ))}
                        </div>
                    </div>
                    <div className="mb-3">
                        <label className="form-label">Cỡ chữ</label>
                        <select
                            className="form-select"
                            value={preferences.fontSize}
                            onChange={e => setSinglePreference('fontSize', e.target.value)}
                        >
                            <option value="small">Nhỏ</option>
                            <option value="medium">Trung bình</option>
                            <option value="large">Lớn</option>
                        </select>
                    </div>
                    <div className="mb-3">
                        <label className="form-label">Bo góc</label>
                        <select
                            className="form-select"
                            value={preferences.borderRadius}
                            onChange={e => setSinglePreference('borderRadius', e.target.value)}
                        >
                            <option value="none">Không bo</option>
                            <option value="small">Nhỏ</option>
                            <option value="medium">Trung bình</option>
                            <option value="large">Lớn</option>
                        </select>
                    </div>
                </div>
            </Modal>
        </>

    );
};

export default ComicReaderPage;