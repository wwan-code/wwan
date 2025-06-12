// src/features/notificationSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import authHeader from '@services/auth-header';

const API_URL = '/api/notifications';

// Thunk lấy thông báo (có phân trang và lọc trạng thái)
export const fetchNotifications = createAsyncThunk(
    "notifications/fetchNotifications",
    async ({ page = 1, limit = 10, status = 'all' } = {}, { rejectWithValue, getState }) => {
        try {
            const response = await axios.get(API_URL, {
                params: { page, limit, status },
                headers: authHeader()
            });
            if (response.data?.success) {
                return {
                    data: response.data,
                    requestParams: { page, limit, status }
                };
            }
            return rejectWithValue(response.data?.message || "Lỗi không xác định từ API");
        } catch (error) {
            return rejectWithValue(error.response?.data || { message: error.message });
        }
    }
);

// Thunk đánh dấu một thông báo đã đọc
export const markAsRead = createAsyncThunk(
    "notifications/markAsRead",
    async (notificationId, { dispatch, rejectWithValue }) => {
        try {
            const response = await axios.put(`${API_URL}/${notificationId}/read`, {}, { headers: authHeader() });
            if (response.data?.success) {
                dispatch(notificationMarkedRead({ notificationId, unreadCount: response.data.updatedUnreadCount }));
                return { notificationId, ...response.data };
            }
            return rejectWithValue(response.data?.message);
        } catch (error) {
            return rejectWithValue(error.response?.data || { message: error.message });
        }
    }
);

// Thunk đánh dấu tất cả thông báo đã đọc
export const markAllAsRead = createAsyncThunk(
    "notifications/markAllAsRead",
    async (_, { dispatch, rejectWithValue }) => {
        try {
            const response = await axios.put(`${API_URL}/read-all`, {}, { headers: authHeader() });
            if (response.data?.success) {
                dispatch(allNotificationsMarkedRead({ unreadCount: response.data.updatedUnreadCount }));
                return response.data;
            }
            return rejectWithValue(response.data?.message);
        } catch (error) {
            return rejectWithValue(error.response?.data || { message: error.message });
        }
    }
);

// Thunk xóa một thông báo
export const deleteNotification = createAsyncThunk(
    "notifications/deleteNotification",
    async (notificationId, { dispatch, rejectWithValue }) => {
        try {
            const response = await axios.delete(`${API_URL}/${notificationId}`, { headers: authHeader() });
            if (response.data?.success) {
                dispatch(notificationDeleted({
                    deletedNotificationId: notificationId,
                    unreadCount: response.data.unreadCount
                }));
                return response.data;
            }
            return rejectWithValue(response.data?.message);
        } catch (error) {
            return rejectWithValue(error.response?.data || { message: error.message });
        }
    }
);

const initialState = {
    items: [],
    pagination: { totalItems: 0, totalPages: 1, currentPage: 1, itemsPerPage: 10 },
    unreadCount: 0,
    loading: 'idle',
    loadingMore: false,
    error: null,
};

const notificationSlice = createSlice({
    name: "notifications",
    initialState,
    reducers: {
        addNotification: (state, action) => {
            const newNotification = action.payload.notification;
            const serverUnreadCount = action.payload.unreadCount;

            if (newNotification && (!newNotification.id || !state.items.some(n => n.id === newNotification.id))) {
                state.items.unshift(newNotification);
                if (state.items.length > 50) {
                    state.items.pop();
                }
            }
            if (typeof serverUnreadCount === 'number') {
                state.unreadCount = serverUnreadCount;
            } else {
                state.unreadCount = Math.min(state.unreadCount + 1, 99);
            }
             state.pagination.totalItems = (state.pagination.totalItems || 0) + 1;
        },
        setUnreadCount: (state, action) => {
            state.unreadCount = action.payload;
        },
        notificationMarkedRead: (state, action) => {
            const { notificationId, unreadCount } = action.payload;
            const index = state.items.findIndex(n => n.id === notificationId);
            if (index !== -1) {
                state.items[index].isRead = true;
            }
            if (typeof unreadCount === 'number') {
                state.unreadCount = unreadCount;
            } else if (state.unreadCount > 0) { // Giảm nếu server không trả về count mới
                state.unreadCount--;
            }
        },
        allNotificationsMarkedRead: (state, action) => {
            state.items.forEach(n => { if (!n.isRead) n.isRead = true; });
            state.unreadCount = action.payload.unreadCount !== undefined ? action.payload.unreadCount : 0;
        },
        notificationDeleted: (state, action) => {
            const { deletedNotificationId, unreadCount } = action.payload;
            state.items = state.items.filter(n => n.id !== deletedNotificationId);
            state.unreadCount = unreadCount;
            state.pagination.totalItems = Math.max(0, (state.pagination.totalItems || 0) - 1);
            if (state.pagination.totalItems > 0 && state.pagination.itemsPerPage > 0) {
                 state.pagination.totalPages = Math.ceil(state.pagination.totalItems / state.pagination.itemsPerPage);
                 if (state.pagination.currentPage > state.pagination.totalPages) {
                     state.pagination.currentPage = Math.max(1, state.pagination.totalPages);
                 }
            } else {
                 state.pagination.totalPages = 1;
                 state.pagination.currentPage = 1;
            }
        },
        clearNotificationState: () => initialState,
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchNotifications.pending, (state, action) => {
                if (action.meta.arg?.page > 1) {
                    state.loadingMore = true;
                } else {
                    state.loading = 'pending';
                }
                state.error = null;
            })
            .addCase(fetchNotifications.fulfilled, (state, action) => {
                state.loading = 'succeeded';
                state.loadingMore = false;
                const { data, requestParams } = action.payload;
                const { notifications, pagination, unreadCount } = data;

                if (pagination && Array.isArray(notifications)) {
                    if (requestParams.page === 1 || !requestParams.page) {
                        state.items = notifications;
                    } else {
                        const existingIds = new Set(state.items.map(n => n.id));
                        const newNotifs = notifications.filter(n => !existingIds.has(n.id));
                        state.items.push(...newNotifs);
                    }
                    state.pagination = pagination;
                    state.unreadCount = unreadCount !== undefined ? unreadCount : state.unreadCount;
                } else {
                    state.items = [];
                    state.pagination = initialState.pagination;
                    state.unreadCount = 0;
                }
            })
            .addCase(fetchNotifications.rejected, (state, action) => {
                state.loading = 'failed';
                state.loadingMore = false;
                state.error = action.payload?.message || 'Lỗi tải thông báo.';
            })
            .addCase(markAsRead.rejected, (state, action) => {
                state.error = action.payload?.message || 'Lỗi đánh dấu đã đọc.';
            })
            .addCase(markAllAsRead.rejected, (state, action) => {
                state.error = action.payload?.message || 'Lỗi đánh dấu tất cả đã đọc.';
            })
            .addCase(deleteNotification.rejected, (state, action) => {
                state.error = action.payload?.message || 'Lỗi xóa thông báo.';
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