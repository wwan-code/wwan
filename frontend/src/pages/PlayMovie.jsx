import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useState } from 'react';
import NProgress from 'nprogress';
import { useLocation, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Bounce, toast } from 'react-toastify';
import { Modal, Button, Form, FloatingLabel, Spinner } from 'react-bootstrap';
import axios from 'axios';
import authHeader from '@services/auth-header';
import classNames from '@utils/classNames';
import { handleApiError } from '@utils/handleApiError';
import useDeviceType from '@hooks/useDeviceType';
import VideoPlaySideBar from '@components/VideoPlaySidebar';
import VideoDetail from '@components/VideoDetail';
import VideoPlayer from '@components/VideoPlayer';
import VideoPlayComments from '@components/VideoPlayComments';
import "@assets/scss/play-movie.scss";

const VideoContext = createContext();

const initialState = {
    data: {},
    loading: true,
    error: null,
    isFavorited: false,
    isFollowed: false,
    totalFavoritesByEpisode: 0,
    totalFavorites: 0,
    favLoading: false,
    followLoading: false,
    selectedGroupIndex: 0,
    cardWidth: 0,
    isDragging: false,
    canScrollLeft: false,
    canScrollRight: true,
    visibleSeriesCount: 3,
    watchedEpisodes: [],
};

function reducer(state, action) {
    switch (action.type) {
        case 'FETCH_SUCCESS':
            return {
                ...state,
                data: action.payload,
                isFavorited: action.payload.isFavorite,
                isFollowed: action.payload.isFollow,
                totalFavorites: action.payload.totalFavorites,
                totalFavoritesByEpisode: action.payload.totalFavoritesByEpisode,
                loading: false, error: null
            };
        case 'FETCH_ERROR':
            return { ...state, error: action.payload, loading: false };
        case 'TOGGLE_FAVORITE_OPTIMISTIC': {
            const newIsFavorited = !state.isFavorited;
            const newTotalFavorites = state.totalFavoritesByEpisode + (newIsFavorited ? 1 : -1);
            return {
                ...state,
                isFavorited: newIsFavorited,
                totalFavoritesByEpisode: Math.max(0, newTotalFavorites),
                favLoading: true
            };
        }
        case 'TOGGLE_FOLLOW_OPTIMISTIC': {
            const newIsFollowed = !state.isFollowed;
            return {
                ...state,
                isFollowed: newIsFollowed,
                followLoading: true
            };
        }
        case 'ROLLBACK_FAVORITE_TOGGLE':
            return {
                ...state,
                isFavorited: action.payload.originalIsFavorited,
                totalFavoritesByEpisode: action.payload.originalTotalFavorites,
                favLoading: false
            };
        case 'ROLLBACK_FOLLOW_TOGGLE':
            return {
                ...state,
                isFollowed: action.payload.originalIsFollowed,
                followLoading: false
            };
        case 'TOGGLE_FAVORITE':
            return {
                ...state,
                isFavorited: action.payload?.isFavorited ?? state.isFavorited,
                totalFavoritesByEpisode: action.payload?.totalFavoritesByEpisode ?? state.totalFavoritesByEpisode,
                favLoading: false
            };
        case 'TOGGLE_FOLLOW':
            return { ...state, isFollowed: action.payload, followLoading: false };
        case 'SET_FAV_LOADING':
            return { ...state, favLoading: action.payload };
        case 'SET_FOLLOW_LOADING':
            return { ...state, followLoading: action.payload };
        case 'SET_SELECTED_GROUP_INDEX':
            return { ...state, selectedGroupIndex: action.payload };
        case 'SET_CARD_WIDTH':
            return { ...state, cardWidth: action.payload };
        case 'SET_IS_DRAGGING':
            return { ...state, isDragging: action.payload };
        case 'SET_CAN_SCROLL_LEFT':
            return { ...state, canScrollLeft: action.payload };
        case 'SET_CAN_SCROLL_RIGHT':
            return { ...state, canScrollRight: action.payload };
        case 'SET_VISIBLE_SERIES_COUNT':
            return { ...state, visibleSeriesCount: action.payload };
        case 'SET_WATCHED_EPISODES':
            return { ...state, watchedEpisodes: action.payload };
        default:
            return state;
    }
}

const PlayVideoProvider = ({ children, slug, episodeNumber }) => {
    const [state, dispatch] = useReducer(reducer, initialState);
    const { user: currentUser } = useSelector((state) => state.user);

    useEffect(() => {
        const getData = async () => {
            dispatch({ type: 'SET_FAV_LOADING', payload: true });
            dispatch({ type: 'SET_FOLLOW_LOADING', payload: true });
            NProgress.start();
            try {
                const response = await axios.get(`/api/video-play/${slug}?t=${episodeNumber}`, { headers: authHeader() });
                dispatch({ type: 'FETCH_SUCCESS', payload: response.data });
            } catch (err) {
                handleApiError(err, `tải dữ liệu video ${slug} tập ${episodeNumber}`);
                dispatch({ type: 'FETCH_ERROR', payload: err.message });
            } finally {
                NProgress.done();
                dispatch({ type: 'SET_FAV_LOADING', payload: false });
                dispatch({ type: 'SET_FOLLOW_LOADING', payload: false });
            }
        };
        if (slug && episodeNumber) {
            getData();
        } else {
            console.warn("Slug or episodeNumber is missing.");
            dispatch({ type: 'FETCH_ERROR', payload: 'Missing slug or episode number' });
        }
    }, [slug, episodeNumber, handleApiError]);

    const handleFavoriteToggle = useCallback(async () => {
        if (!currentUser) {
            showToast("Vui lòng đăng nhập để yêu thích.");
            return;
        }
        if (state.favLoading || !state.data?.episode?.id || !state.data?.movie?.id) return;

        const { id: userId } = currentUser;
        const { id: episodeId } = state.data.episode;
        const { id: movieId } = state.data.movie;

        const originalIsFavorited = state.isFavorited;
        const originalTotalFavorites = state.totalFavoritesByEpisode;

        dispatch({ type: 'TOGGLE_FAVORITE_OPTIMISTIC' });

        try {
            if (originalIsFavorited) { 
                await axios.delete('/api/favorites', { data: { userId, episodeId }, headers: authHeader() });
                dispatch({ type: 'SET_FAV_LOADING', payload: false });
                toast.success("Đã xóa khỏi danh sách yêu thích", {
                    theme: document.documentElement.getAttribute("data-ww-theme") || "light",
                    transition: Bounce
                });
            } else {
                await axios.post('/api/favorites', { userId, episodeId, movieId }, { headers: authHeader() });
                dispatch({ type: 'SET_FAV_LOADING', payload: false });
                toast.success("Đã thêm vào danh sách yêu thích", {
                    theme: document.documentElement.getAttribute("data-ww-theme") || "light",
                    transition: Bounce
                });
            }
        } catch (error) {
            handleApiError(error, originalIsFavorited ? "xóa yêu thích" : "thêm yêu thích");
            dispatch({
                type: 'ROLLBACK_FAVORITE_TOGGLE',
                payload: { originalIsFavorited, originalTotalFavorites }
            });
        }
    }, [state.favLoading, currentUser, state.data.episode, state.data.movie, state.isFavorited, state.totalFavoritesByEpisode, handleApiError]);

    const handleFollowToggle = useCallback(async () => {
        if (!currentUser) {
            showToast("Vui lòng đăng nhập.");
            return;
        }
        if (state.followLoading) return;

        const { id: userId } = currentUser;
        const { id: movieId } = state.data.movie;

        const originalIsFollowed = state.isFollowed;
        dispatch({ type: 'TOGGLE_FOLLOW_OPTIMISTIC' });

        try {
            let response;
            if (originalIsFollowed) {
                response = await axios.delete('/api/follow-movie/delete', { data: { userId, movieId }, headers: authHeader() });
                dispatch({ type: 'UPDATE_FOLLOW_STATUS', payload: false });
                toast.success(response.data?.message || "Đã bỏ theo dõi phim.", {
                    theme: document.documentElement.getAttribute("data-ww-theme") || "light",
                    transition: Bounce
                });
            } else {
                response = await axios.post('/api/follow-movie', { userId, movieId }, { headers: authHeader() });
                dispatch({ type: 'UPDATE_FOLLOW_STATUS', payload: true });
                toast.success(response.data?.message || "Đã theo dõi phim.", {
                    theme: document.documentElement.getAttribute("data-ww-theme") || "light",
                    transition: Bounce
                });
            }
        } catch (error) {
            handleApiError(error, originalIsFollowed ? "bỏ theo dõi" : "theo dõi");
            dispatch({
                type: 'ROLLBACK_FOLLOW_TOGGLE',
                payload: { originalIsFollowed }
            });
        }
    }, [state.followLoading, currentUser, state.data.movie, state.isFollowed, handleApiError]);

    const showToast = (message) => {
        toast.info(message, {
            position: "top-right",
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
            theme: localStorage.getItem("theme"),
            transition: Bounce,
        });
    };
    const contextValue = useMemo(() => ({
        state,
        dispatch,
        episodeNumber,
        slug,
        handleFavoriteToggle,
        handleFollowToggle
    }), [state, dispatch, episodeNumber, slug, handleFavoriteToggle, handleFollowToggle]);

    return (
        <VideoContext.Provider value={contextValue}>
            {children}
        </VideoContext.Provider>
    );
};

export const PlayMovie = () => {
    const location = useLocation();
    const { slug } = useParams();
    const params = new URLSearchParams(location.search);
    const episodeNumber = params.get('t');

    return (
        <PlayVideoProvider slug={slug} episodeNumber={episodeNumber} >
            <VideoPlay />
        </PlayVideoProvider>
    );
};

const VideoPlay = () => {
    const deviceType = useDeviceType();
    const isMobile = useMemo(() => deviceType === "Mobile", [deviceType]);
    const { state } = useVideo();
    const { data } = state;
    const [showReportModal, setShowReportModal] = useState(false);
    const [reportType, setReportType] = useState('video_error');
    const [reportDescription, setReportDescription] = useState('');
    const [reportTimestamp, setReportTimestamp] = useState('');
    const [isSubmittingReport, setIsSubmittingReport] = useState(false);
    useEffect(() => {
        if (state.data?.movie?.title) {
            document.title = `${state.data.movie.title} - WWAN Film`;
        } else if (!state.loading) {
            document.title = 'Không tìm thấy phim - WWAN Film';
        }
    }, [state.data?.movie?.title, state.loading]);
    const handleOpenReportModal = () => {
        setReportTimestamp('');
        setShowReportModal(true);
    };
    const handleCloseReportModal = () => {
        setShowReportModal(false);
        setReportDescription('');
        setReportTimestamp('');
        setReportType('video_error');
    };
    const handleSubmitReport = async (e) => {
        e.preventDefault();
        if (!data?.movie?.id || !reportDescription.trim()) {
            toast.warn("Vui lòng mô tả chi tiết lỗi bạn gặp phải.");
            return;
        }
        setIsSubmittingReport(true);
        try {
            const payload = {
                movieId: data.movie.id,
                episodeId: data.episode?.id || null,
                reportType,
                description: reportDescription,
                timestamp: reportTimestamp ? reportTimestamp : null
            };
            await axios.post('/api/content-reports', payload, { headers: authHeader() });
            toast.success("Cảm ơn bạn đã gửi báo cáo!");
            handleCloseReportModal();
        } catch (error) {
            console.error("Lỗi gửi báo cáo:", error);
            toast.error(error.response?.data?.message || "Không thể gửi báo cáo. Vui lòng thử lại.");
        } finally {
            setIsSubmittingReport(false);
        }
    };

    if (state.loading) {
        return (
            <div className="loader-overlay">
                <div className="loader"></div>
                <p>Đang tải...</p>
            </div>
        );
    };
    return (
        <div className='container'>
            <section className={classNames("page-single video-play", { 'video-play--mobile': isMobile })}>
                <VideoPlayer />
                {!isMobile && data?.movie && (
                    <div className="interactive__actions mt-2 mb-2">
                        <button
                            type='button'
                            className='btn btn-sm btn-outline-warning'
                            onClick={handleOpenReportModal}
                        >
                            <i className="fas fa-flag me-1"></i> Báo lỗi phim/tập
                        </button>
                    </div>
                )}
                <VideoDetail />
                <VideoPlaySideBar />
                <VideoPlayComments />
            </section>
            <Modal show={showReportModal} onHide={handleCloseReportModal} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Báo lỗi nội dung</Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleSubmitReport}>
                    <Modal.Body>
                        <p className="small text-muted">
                            Phim: {data?.movie?.title}
                            {data?.episode?.episodeNumber ? ` - Tập ${data?.episode?.episodeNumber}` : ''}
                        </p>
                        <Form.Group className="mb-3" controlId="reportTypeSelect">
                            <Form.Label>Loại lỗi <span className="text-danger">*</span></Form.Label>
                            <Form.Select value={reportType} onChange={(e) => setReportType(e.target.value)}>
                                <option value="video_error">Lỗi Video (không phát, giật, chất lượng kém)</option>
                                <option value="audio_error">Lỗi Âm thanh (không khớp, rè, mất tiếng)</option>
                                <option value="subtitle_error">Lỗi Phụ đề (sai, thiếu, không khớp)</option>
                                <option value="content_issue">Nội dung (không phù hợp, sai thông tin)</option>
                                <option value="other">Khác</option>
                            </Form.Select>
                        </Form.Group>

                         <Form.Group className="mb-3" controlId="reportTimestamp">
                            <Form.Label>Thời điểm gặp lỗi (ví dụ: 02:30 hoặc 150 giây)</Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="Nhập thời gian (mm:ss) hoặc số giây"
                                value={reportTimestamp}
                                onChange={(e) => setReportTimestamp(e.target.value)}
                            />
                            <Form.Text muted>
                                Nếu lỗi xảy ra tại một thời điểm cụ thể trong video, vui lòng cho biết.
                            </Form.Text>
                        </Form.Group>

                        <Form.Group className="mb-3" controlId="reportDescription">
                             <FloatingLabel label="Mô tả chi tiết lỗi của bạn *">
                                <Form.Control
                                    as="textarea"
                                    rows={4}
                                    placeholder=" "
                                    value={reportDescription}
                                    onChange={(e) => setReportDescription(e.target.value)}
                                    required
                                    maxLength={500}
                                />
                             </FloatingLabel>
                             <Form.Text muted>{reportDescription.length}/500</Form.Text>
                        </Form.Group>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={handleCloseReportModal} disabled={isSubmittingReport}>
                            Hủy
                        </Button>
                        <Button variant="primary" type="submit" disabled={isSubmittingReport}>
                            {isSubmittingReport ? <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" /> : "Gửi Báo Cáo"}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>
        </div>
    )
};

export const useVideo = () => useContext(VideoContext);