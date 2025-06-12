// src/utils/searchHistoryUtils.jsx
const SEARCH_HISTORY_KEY = 'app_search_history';
const MAX_HISTORY_ITEMS = 3;

export const getSearchHistory = () => {
    try {
        const history = localStorage.getItem(SEARCH_HISTORY_KEY);
        return history ? JSON.parse(history) : [];
    } catch (error) {
        console.error("Error reading search history from localStorage:", error);
        return [];
    }
};

export const addSearchHistory = (term) => {
    if (!term || !term.trim()) return;
    const normalizedTerm = term.trim().toLowerCase(); // Chuẩn hóa để tránh trùng lặp khác biệt hoa thường
    try {
        let history = getSearchHistory();
        // Xóa mục cũ nếu đã tồn tại để đưa lên đầu
        history = history.filter(item => item.toLowerCase() !== normalizedTerm);
        // Thêm mục mới vào đầu danh sách
        history.unshift(normalizedTerm);
        // Giữ giới hạn số lượng
        if (history.length > MAX_HISTORY_ITEMS) {
            history = history.slice(0, MAX_HISTORY_ITEMS);
        }
        localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(history));
        return history;
    } catch (error) {
        console.error("Error adding search history to localStorage:", error);
        return getSearchHistory(); // Trả về lịch sử hiện tại nếu có lỗi
    }
};

export const removeSearchHistoryItem = (termToRemove) => {
    try {
        let history = getSearchHistory();
        history = history.filter(item => item.toLowerCase() !== termToRemove.toLowerCase());
        localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(history));
        return history;
    } catch (error) {
        console.error("Error removing search history item from localStorage:", error);
        return getSearchHistory();
    }
};

export const clearSearchHistory = () => {
    try {
        localStorage.removeItem(SEARCH_HISTORY_KEY);
        return [];
    } catch (error) {
        console.error("Error clearing search history from localStorage:", error);
        return getSearchHistory();
    }
};