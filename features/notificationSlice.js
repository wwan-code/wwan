// src/features/notificationSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import authHeader from '../services/auth-header';

const API_URL = '/api/notifications';

// Thunk lấy thông báo chưa đọc (có phân trang)
export const fetchNotifications = createAsyncThunk(
    "notifications/fetchNotifications",
    async ({ page = 1, limit = 10, status = 'all' } = {}, { rejectWithValue }) => {
        try {
            const response = await axios.get(API_URL, {
                params: { page, limit, status },
                headers: authHeader()
            });
            if (response.data?.success) return response.data;
            return rejectWithValue(response.data?.message || "Lỗi không xác định từ API");
        } catch (error) {
            return rejectWithValue(error.response?.data || { message: error.message });
        }
    }
);

// Thunk đánh dấu đã đọc
export const markAsRead = createAsyncThunk(
    "notifications/markAsRead",
    async (notificationId, { dispatch, rejectWithValue }) => {
        try {
            const response = await axios.put(`${API_URL}/${notificationId}/read`, {}, { headers: authHeader() });
            if (response.data?.success) {
                dispatch(notificationMarkedRead(notificationId));
                return { notificationId, ...response.data };
            }
            return rejectWithValue(response.data?.message);
        } catch (error) {
            return rejectWithValue(error.response?.data || { message: error.message });
        }
    }
);

// Thunk đánh dấu tất cả đã đọc
export const markAllAsRead = createAsyncThunk(
    "notifications/markAllAsRead",
    async (_, { dispatch, rejectWithValue }) => {
        try {
            const response = await axios.put(`${API_URL}/read-all`, {}, { headers: authHeader() });
            if (response.data?.success) {
                dispatch(allNotificationsMarkedRead());
                return response.data;
            }
            return rejectWithValue(response.data?.message);
        } catch (error) {
            return rejectWithValue(error.response?.data || { message: error.message });
        }
    }
);

export const deleteNotification = createAsyncThunk(
    "notifications/deleteNotification",
    async (notificationId, { dispatch, rejectWithValue }) => {
        try {
            const response = await axios.delete(`${API_URL}/${notificationId}`, { headers: authHeader() });
            if (response.data?.success) {
                // Dispatch action đồng bộ để xóa khỏi state và cập nhật unreadCount
                dispatch(notificationDeleted({
                    deletedNotificationId: notificationId,
                    unreadCount: response.data.unreadCount // Lấy unreadCount từ response
                }));
                return response.data; // Trả về response để xử lý thêm nếu cần
            }
            return rejectWithValue(response.data?.message);
        } catch (error) {
            return rejectWithValue(error.response?.data || { message: error.message });
        }
    }
);

const initialState = {
    notifications: [], // Danh sách thông báo hiển thị trong dropdown
    pagination: { totalItems: 0, totalPages: 1, currentPage: 1, itemsPerPage: 10 },
    unreadCount: 0, // Số thông báo chưa đọc (chỉ để hiển thị badge)
    loading: false,
    error: null,
};

const notificationSlice = createSlice({
    name: "notifications",
    initialState,
    reducers: {
        addNotification: (state, action) => {
            const newNotification = action.payload;
            const unreadCountFromServer = action.payload.unreadCount;
            if (newNotification && (!newNotification.id || !state.notifications.some(n => n.id === newNotification.id))) {
                state.notifications.unshift(newNotification);
                if (state.notifications.length > 50) {
                    state.notifications.pop();
                }
            }
            if (typeof unreadCountFromServer === 'number') {
                state.unreadCount = unreadCountFromServer;
            } else {
                state.unreadCount += 1;
            }
        },
        setUnreadCount: (state, action) => {
            state.unreadCount = action.payload;
        },
        notificationMarkedRead: (state, action) => {
            const notificationId = action.payload;
            const index = state.notifications.findIndex(n => n.id === notificationId);
            if (index !== -1) {
                state.notifications[index].isRead = true;
            }
            if (state.unreadCount > 0) state.unreadCount--;
        },
        allNotificationsMarkedRead: (state) => {
            state.notifications.forEach(n => n.isRead = true);
            state.unreadCount = 0;
        },
        clearNotificationState: () => initialState,
        notificationDeleted: (state, action) => {
            const { deletedNotificationId, unreadCount } = action.payload;
            state.notifications = state.notifications.filter(n => n.id !== deletedNotificationId);
            state.unreadCount = unreadCount; // Cập nhật unreadCount từ payload
            if (state.notifications.length === 0 && state.pagination.currentPage > 1) {
                state.pagination.currentPage -=1;
            }
            state.pagination.totalItems = Math.max(0, state.pagination.totalItems -1);
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchNotifications.pending, (state, action) => { // Sửa tên action
                if (action.meta.arg?.page > 1) { // Kiểm tra nếu là load more
                    state.loadingMore = true;
                } else {
                    state.loading = true;
                }
                state.error = null;
            })
            .addCase(fetchNotifications.fulfilled, (state, action) => {
                state.loading = false;
                state.loadingMore = false;
                const { notifications, pagination, unreadCount } = action.payload;

                if (pagination && notifications) {
                    if (pagination.currentPage === 1) {
                        state.notifications = notifications || [];
                    } else {
                        const existingIds = new Set(state.notifications.map(n => n.id));
                        const newNotifs = (notifications || []).filter(n => !existingIds.has(n.id));
                        state.notifications.push(...newNotifs);
                    }
                    state.pagination = pagination || initialState.pagination;
                    state.unreadCount = unreadCount !== undefined ? unreadCount : state.unreadCount;
                } else {
                    console.warn("fetchUnreadNotifications.fulfilled: Payload không đúng định dạng hoặc thiếu dữ liệu.");
                    state.notifications = [];
                    state.pagination = initialState.pagination;
                    state.unreadCount = 0;
                }
            })
            .addCase(fetchNotifications.rejected, (state, action) => {
                state.loading = false;
                state.loadingMore = false;
                state.error = action.payload;
            })
            .addCase(markAsRead.rejected, (state, action) => {
                console.error("Failed to mark notification as read:", action.payload);
                state.error = action.payload;
            })
            .addCase(markAsRead.fulfilled, (state, action) => {
                if (action.payload?.updatedUnreadCount !== undefined) {
                    state.unreadCount = action.payload.updatedUnreadCount;
                }
            })
            .addCase(markAllAsRead.rejected, (state, action) => {
                console.error("Failed to mark all notifications as read:", action.payload);
                state.error = action.payload;
            })
            .addCase(markAllAsRead.fulfilled, (state, action) => {
                if (action.payload?.updatedUnreadCount !== undefined) {
                    state.unreadCount = action.payload.updatedUnreadCount;
                }
            })
            .addCase(deleteNotification.rejected, (state, action) => {
                console.error("Failed to delete notification:", action.payload);
                state.error = action.payload;
            });
    }
});

export const {
    addNotification,
    setUnreadCount,
    notificationMarkedRead,
    allNotificationsMarkedRead,
    clearNotificationState,
    notificationDeleted
} = notificationSlice.actions;
export default notificationSlice.reducer;