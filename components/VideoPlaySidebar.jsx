import React, { useEffect, useCallback } from "react";
import { useVideo } from "../pages/PlayMovie"; // Import context hook
import EpisodeList from "./EpisodeList"; // Import component con
import SeriesCarousel from "./SeriesCarousel"; // Import component con
import RecommendsList from "./RecommendsList"; // Import component con
import axios from "axios";
import { useSelector } from "react-redux";
import authHeader from "../services/auth-header";
import { Bounce, toast } from "react-toastify"; // Import toast nếu dùng handleApiError ở đây

const VideoPlaySideBar = React.memo(() => {
    const { user: currentUser } = useSelector((state) => state.user);
    // Lấy state và dispatch từ context
    const { state, dispatch, episodeNumber, slug } = useVideo();
    const { data } = state; // data chứa movie, episodes (của movie hiện tại), etc.

    // --- Hàm xử lý lỗi API chung (có thể import hoặc định nghĩa ở đây) ---
    const handleApiError = useCallback((error, operation = "thực hiện") => {
        console.error(`Failed to ${operation}:`, error);
        let message = `Thao tác ${operation} thất bại. Vui lòng thử lại.`;
        if (error.response?.data?.message) {
            message = error.response.data.message;
        } else if (error.message) {
            message = error.message;
        }
        // Chỉ hiển thị toast cho lỗi quan trọng, ví dụ fetch lịch sử xem có thể bỏ qua
        toast.error(message, {
            theme: document.documentElement.getAttribute("data-ww-theme") || "light",
            transition: Bounce
        });
    }, []);

    // --- Fetch và Cập nhật Lịch sử Xem ---
    useEffect(() => {
        const fetchWatchHistory = async (userId, controller) => {
            try {
                const response = await axios.get(`/api/watch-history/${userId}`, {
                    signal: controller.signal,
                    headers: authHeader()
                });
                // Dispatch action để cập nhật context
                const watchedEpisodeIds = response.data?.map((h) => h.episodeId) || [];
                dispatch({ type: 'SET_WATCHED_EPISODES', payload: watchedEpisodeIds });
            } catch (error) {
                if (!axios.isCancel(error)) {
                    // Chỉ xử lý lỗi thực sự, bỏ qua lỗi cancel
                    handleApiError(error, "tải lịch sử xem");
                }
            }
        };

        if (!currentUser?.id) {
            // Nếu người dùng logout, xóa lịch sử xem khỏi context
            dispatch({ type: 'SET_WATCHED_EPISODES', payload: [] });
            return;
        }

        const controller = new AbortController();
        fetchWatchHistory(currentUser.id, controller);

        return () => {
            controller.abort(); // Hủy request khi unmount hoặc user thay đổi
        };
    }, [currentUser, dispatch, handleApiError]); // Thêm handleApiError

    // --- Callback khi click vào tập phim (để cập nhật watched state lạc quan) ---
    const handleEpisodeClick = useCallback((episodeId) => {
        // Dispatch action mới để thêm 1 tập đã xem lạc quan
        dispatch({ type: 'ADD_WATCHED_EPISODE', payload: episodeId });
    }, [dispatch]);

    // --- Render các component con ---
    // Kiểm tra data và movie tồn tại trước khi render
    if (!data || !data.movie) {
        // Có thể hiển thị một skeleton loader hoặc null
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
                    movieSlug={slug} // Truyền slug cho Link
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