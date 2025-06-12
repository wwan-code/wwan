// frontend/src/services/watchHistoryService.js
import api from './api';
import authHeader from './auth-header';

const API_URL = '/api/watch-history';

// Hàm này gửi TỔNG thời gian đã xem (khi dùng trình phát có API)
const addOrUpdateWatchHistory = (data) => {
    // data: { episodeId, watchedDuration (tổng số giây đã xem) }
    return api.post(`${API_URL}`, data, { headers: authHeader() });
};

const incrementWatchDuration = (data) => {
    return api.post(`${API_URL}/ping`, data, { headers: authHeader() });
};

const getWatchHistoryForEpisode = (episodeId) => {
    return api.get(`${API_URL}/episode/${episodeId}`, { headers: authHeader() });
};

const watchHistoryService = {
    addOrUpdateWatchHistory,
    incrementWatchDuration,
    getWatchHistoryForEpisode,
};

export default watchHistoryService;