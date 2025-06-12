// src/pages/ComicDetailPage.jsx
import { useState, useEffect, useMemo, useRef } from 'react';
import axios from 'axios';
import { useParams, Link, useNavigate } from 'react-router-dom';
import NProgress from 'nprogress';
import useImageBorderShadow from '@hooks/useImageBorderShadow';
import { handleApiError } from '@utils/handleApiError';
import AddToCollectionModal from '@components/Modal/AddToCollectionModal';
import { useSelector } from 'react-redux';
import InteractiveDotGrid from '@components/Effects/InteractiveDotGrid';
import ComicComments from '@components/Comics/ComicComments';
import '@assets/scss/pages/_comic-detail-page.scss';

const formatViewCountDCP = (number) => {
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
    const [comic, setComic] = useState(null);
    const [chapters, setChapters] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('chapters');
    const [followed, setFollowed] = useState(false);
    const [showAddToCollectionModal, setShowAddToCollectionModal] = useState(false);
    const { user: currentUser } = useSelector((state) => state.user);
    const { imgRef, shadowStyle, gradientBackground } = useImageBorderShadow(comic?.coverImage);

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

                    if (fetchedComic.id) {
                        const chaptersRes = await axios.get(`/api/comics/${fetchedComic.id}/chapters`, {
                            params: { limit: 1000, page: 1, sortBy: 'order', sortOrder: 'ASC' }
                        });
                        if (chaptersRes.data?.success) {
                            setChapters(chaptersRes.data.chapters || []);
                        }
                    }
                    if (fetchedComic.description) {
                        const meta = document.querySelector('meta[name="description"]');
                        if (meta) meta.setAttribute('content', fetchedComic.description.slice(0, 150));
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

    const toggleFollow = () => setFollowed(prev => !prev);

    const sortedChapters = useMemo(() => {
        return [...chapters].sort((a, b) => b.chapterNumber - a.chapterNumber);
    }, [chapters]);

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
    const coverImageUrl = comic.coverImage?.startsWith('http')
        ? comic.coverImage
        : process.env.REACT_APP_API_URL_IMAGE + `/${comic.coverImage || 'placeholder-comic.png'}`;

    return (
        <>
            <div className="comic-detail-hero">
                <InteractiveDotGrid
                    width="100%"
                    height="100%"
                    position="relative"
                    containerClassName="hero-background-canvas-container"
                />
            </div>
            
            <section className="content-detail-page comic-detail-content">
                <div className="container">
                    <div className="content-detail-layout">
                        <div className="content-detail-sidebar">
                            <div className="sidebar-sticky-block">
                                <div className="comic-cover-art-container" style={{ boxShadow: shadowStyle }}>
                                    <img
                                        ref={imgRef}
                                        src={coverImageUrl}
                                        alt={comic.title}
                                        className="comic-cover-art"
                                        onError={(e) => { e.target.onerror = null; e.target.src = '/placeholder-comic.png' }}
                                    />
                                </div>
                                <div className="comic-action-buttons">
                                    {firstChapter ? (
                                        <Link to={`/truyen/${comic.slug}/chap/${firstChapter.id}`} className="btn-main btn-primary-custom btn-read-first">
                                            <i className="fas fa-book-reader"></i> Đọc từ đầu
                                        </Link>
                                    ) : (
                                        <button className="btn-main btn-disabled-custom" disabled>Chưa có chương</button>
                                    )}
                                    <button className={`btn-main btn-secondary-custom btn-follow-comic ${followed ? 'active' : ''}`} onClick={toggleFollow}>
                                        <i className={`fas ${followed ? 'fa-heart-broken' : 'fa-heart'}`}></i>
                                        {followed ? 'Bỏ theo dõi' : 'Theo dõi'}
                                    </button>
                                    <button className="btn-main btn-secondary-custom btn-add-to-watchlist" onClick={() => setShowAddToCollectionModal(true)} title="Thêm vào bộ sưu tập">
                                        <i className="fas fa-plus-circle"></i> Thêm vào Bộ Sưu Tập
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="content-detail-main">
                            <div className="comic-header-info">
                                <h1 className="comic-title-main">{comic.title}</h1>
                                {comic.subTitle && <h3 className="comic-subtitle-alt">{comic.subTitle}</h3>}
                                <div className="comic-meta-primary">
                                    <span className='cdp-meta-item'><i className="fas fa-user-edit"></i> Tác giả: <strong>{comic.author || 'Đang cập nhật'}</strong></span>
                                    {comic.artist && <span><i className="fas fa-paint-brush"></i> Họa sĩ: <strong>{comic.artist}</strong></span>}
                                    <span className='cdp-meta-item'><i className="fas fa-calendar-alt"></i> Năm: {comic.year || 'N/A'}</span>
                                    <span className='cdp-meta-item'><i className="fas fa-clock"></i> Cập nhật: {new Date(comic.updatedAt).toLocaleDateString('vi-VN')}</span>
                                    <span className="cdp-meta-item status-tag-detail" data-status={comic.status}>
                                        <i className={`fas ${comic.status === 'completed' ? 'fa-check-circle' : 'fa-sync-alt fa-spin'} cdp-meta-icon`}></i>
                                        Trạng thái: <span className="cdp-meta-value">{getStatusDisplayDCP(comic.status || 'updating')}</span>
                                    </span>
                                </div>
                                <div className="comic-stats-bar">
                                    <span><i className="fas fa-eye"></i> {formatViewCountDCP(comic.views)} Lượt xem</span>
                                    <span><i className="fas fa-list-ol"></i> {chapters.length} Chương</span>
                                </div>
                                <div className="comic-taxonomy-tags">
                                    {comic.genres && comic.genres.map(genre => (
                                        <Link key={genre.id || genre.slug} to={`/the-loai-truyen/${genre.slug}`} className="tag-item genre-tag">
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
                                    <li className={activeTab === 'comments' ? 'active' : ''} onClick={() => setActiveTab('comments')}>
                                        <i className="fas fa-comments icon-before"></i> Bình luận
                                    </li>
                                </ul>
                                <div className="tabs-content-custom" style={activeTab === 'details' ? { background: gradientBackground } : {}}>
                                    <div className={`tab-pane-custom ${activeTab === 'details' ? 'active show' : ''}`} id="comic-info-tab">
                                        {comic.description ? (
                                            <div className="comic-description-content" dangerouslySetInnerHTML={{ __html: comic.description.replace(/\n/g, '<br />') }}></div>
                                        ) : (
                                            <p className="text-muted-custom">Chưa có mô tả cho truyện này.</p>
                                        )}
                                    </div>

                                    <div className={`tab-pane-custom ${activeTab === 'chapters' ? 'active show' : ''}`} id="comic-chapters-tab">
                                        {sortedChapters.length > 0 ? (
                                            <div className="chapter-list-wrapper">
                                                <div className="chapter-list-header">
                                                    <span className="header-col chapter-no-col">Số chương</span>
                                                    <span className="header-col chapter-date-col">Ngày cập nhật</span>
                                                </div>
                                                <ul className="chapter-list-styled">
                                                    {sortedChapters.map(chap => (
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

                                    <div className={`tab-pane-custom ${activeTab === 'comments' ? 'active show' : ''}`} id="comic-comments-tab">
                                        <ComicComments comic={comic} contentType="comic"/>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
            
            {currentUser && comic && (
                <AddToCollectionModal
                    show={showAddToCollectionModal}
                    onHide={() => setShowAddToCollectionModal(false)}
                    itemType="comic" // Quan trọng: chỉ định đúng type
                    itemId={comic.id}
                    itemTitle={comic.title}
                />
            )}
        </>
    );
};

export default ComicDetailPage;