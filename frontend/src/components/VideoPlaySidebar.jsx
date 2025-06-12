import React, { useEffect, useCallback } from "react";
import { useVideo } from "@pages/PlayMovie";
import EpisodeList from "./EpisodeList";
import SeriesCarousel from "./SeriesCarousel";
import RecommendsList from "./RecommendsList";
import axios from "axios";
import { useSelector } from "react-redux";
import authHeader from "@services/auth-header";
import { handleApiError } from "@utils/handleApiError";

const VideoPlaySideBar = React.memo(() => {
    const { user: currentUser } = useSelector((state) => state.user);
    const { state, dispatch, episodeNumber, slug } = useVideo();
    const { data } = state;

    // --- Fetch và Cập nhật Lịch sử Xem ---
    useEffect(() => {
        const fetchWatchHistory = async (userId, controller) => {
            try {
                const response = await axios.get(`/api/watch-history/${userId}`, {
                    signal: controller.signal,
                    headers: authHeader()
                });
                const watchedEpisodeIds = response.data?.map((h) => h.episodeId) || [];
                dispatch({ type: 'SET_WATCHED_EPISODES', payload: watchedEpisodeIds });
            } catch (error) {
                if (!axios.isCancel(error)) {
                    handleApiError(error, "tải lịch sử xem");
                }
            }
        };

        if (!currentUser?.id) {
            dispatch({ type: 'SET_WATCHED_EPISODES', payload: [] });
            return;
        }

        const controller = new AbortController();
        fetchWatchHistory(currentUser.id, controller);

        return () => {
            controller.abort();
        };
    }, [currentUser, dispatch, handleApiError]);

    // --- Callback khi click vào tập phim (để cập nhật watched state lạc quan) ---
    const handleEpisodeClick = useCallback((episodeId) => {
        dispatch({ type: 'ADD_WATCHED_EPISODE', payload: episodeId });
    }, [dispatch]);

    // --- Render các component con ---
    if (!data || !data.movie) {
        return <div className="video-play__sidebar p-3 text-muted">Đang tải dữ liệu sidebar...</div>;
    }

    return (
        <div className="video-play__sidebar">
            {/* Danh sách tập phim (chỉ hiện nếu là phim bộ) */}
            {data.movie.belongToCategory === 1 && (
                <EpisodeList
                    episodes={data.movie.Episodes || []}
                    totalEpisodes={data.movie.totalEpisodes || 0}
                    currentEpisodeNumber={episodeNumber}
                    watchedEpisodeIds={state.watchedEpisodes || []}
                    movieSlug={slug}
                    onEpisodeClick={handleEpisodeClick}
                />
            )}

            {/* Carousel Phim cùng Series */}
            {((data.movie.hasSection === 1) || (data.seriesMovie && data.seriesMovie.length > 0)) && (
                <SeriesCarousel
                    seriesMovies={data.seriesMovie || []}
                />
            )}

            {/* Phim đề xuất */}
            <RecommendsList
                recommendedMovies={data.similarMovies || []}
            />
        </div>
    );
});

export default VideoPlaySideBar;