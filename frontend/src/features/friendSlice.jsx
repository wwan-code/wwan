import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import authHeader from "../services/auth-header";

const API_URL = "/api/friends";

export const sendFriendRequest = createAsyncThunk("friends/sendFriendRequest", async (friendId, { rejectWithValue }) => {
    try {
        const response = await axios.post(`${API_URL}/request`, { friendId }, { headers: authHeader() });
        return { friendId, ...response.data };
    } catch (error) {
        return rejectWithValue(error.response.data);
    }
});

export const acceptFriendRequest = createAsyncThunk("friends/acceptFriendRequest", async (friendId, { rejectWithValue }) => {
    try {
        const response = await axios.post(`${API_URL}/accept`, { friendId }, { headers: authHeader() });
        return { friendId, ...response.data };
    } catch (error) {
        return rejectWithValue(error.response.data);
    }
});

export const rejectFriendRequest = createAsyncThunk("friends/rejectFriendRequest", async (friendId, { rejectWithValue }) => {
    try {
        const response = await axios.post(`${API_URL}/reject`, { friendId }, { headers: authHeader() });
        return { friendId, ...response.data };
    } catch (error) {
        return rejectWithValue(error.response.data);
    }
});

export const cancelFriendRequest = createAsyncThunk("friends/cancelFriendRequest", async (friendId, { rejectWithValue }) => {
    try {
        const response = await axios.post(`${API_URL}/cancel`, { friendId }, { headers: authHeader() });
        return { friendId, ...response.data };
    } catch (error) {
        return rejectWithValue(error.response.data);
    }
});

export const removeFriend = createAsyncThunk("friends/removeFriend", async (friendId, { rejectWithValue }) => {
    try {
        const response = await axios.post(`${API_URL}/remove`, { friendId }, { headers: authHeader() });
        return { friendId, ...response.data };
    } catch (error) {
        return rejectWithValue(error.response.data);
    }
});

export const getFriends = createAsyncThunk("friends/getFriends", async (userId, { rejectWithValue }) => {
    try {
        const response = await axios.get(`/api/users/${userId}/friends`, { headers: authHeader() });
        if (response.data?.success) {
            return response.data.data;
        } else {
            throw new Error(response.data?.message || 'Failed to get friends data');
        }
    } catch (error) {
        return rejectWithValue(error.response?.data || { message: error.message });
    }
});

const friendSlice = createSlice({
    name: "friends",
    initialState: {
        friends: [], // Sẽ lưu trữ [{ id, name, avatar,... }]
        friendRequests: [], // Sẽ lưu trữ [{ id, name, avatar,... }] (người gửi)
        sentFriendRequests: [], // Sẽ lưu trữ [{ id, name, avatar,... }] (người nhận)
        loading: false,
        error: null
    },
    reducers: {
        // Có thể thêm reducer để clear error thủ công nếu cần
        clearFriendError: (state) => {
            state.error = null;
        },
        clearFriendState: (state) => {
            state.friends = []; // Reset friends state to empty
            state.friendRequests = []; // Reset friendRequests state to empty
            state.sentFriendRequests = []; // Reset sentFriendRequests state to empty
            state.loading = false; // Reset loading state to false
            state.error = null; // Reset error state to null
        }
    },
    extraReducers: (builder) => {
        builder
            // --- Get Friends ---
            .addCase(getFriends.pending, (state) => {
                state.loading = true;
                state.error = null; // Reset lỗi
            })
            .addCase(getFriends.fulfilled, (state, action) => {
                state.loading = false;
                 // Đảm bảo payload có cấu trúc đúng và là mảng
                state.friends = Array.isArray(action.payload?.friends) ? action.payload.friends : [];
                state.friendRequests = Array.isArray(action.payload?.friendRequests) ? action.payload.friendRequests : [];
                state.sentFriendRequests = Array.isArray(action.payload?.sentFriendRequests) ? action.payload.sentFriendRequests : [];
                state.error = null;
            })
            .addCase(getFriends.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
                 // Reset state về rỗng khi lỗi fetch
                 state.friends = [];
                 state.friendRequests = [];
                 state.sentFriendRequests = [];
            })

            // --- Send Friend Request ---
            .addCase(sendFriendRequest.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(sendFriendRequest.fulfilled, (state, action) => {
                state.loading = false;
                 // Tạm thời chưa cập nhật state sentFriendRequests ở đây
                 // vì không có đủ thông tin user nhận từ payload.
                 // Cách tốt nhất là gọi lại getFriends sau khi thành công ở component,
                 // hoặc sửa API để trả về thông tin user nhận.
                 // Nếu chỉ muốn thêm ID (ít hữu ích):
                 // state.sentFriendRequests.push({ id: action.payload.friendId }); // Chỉ thêm ID, thiếu thông tin khác
            })
            .addCase(sendFriendRequest.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // --- Accept Friend Request ---
            .addCase(acceptFriendRequest.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(acceptFriendRequest.fulfilled, (state, action) => {
                state.loading = false;
                // Thêm object user mới vào danh sách bạn bè (nếu API trả về friend object)
                if (action.payload?.friend) {
                    // Kiểm tra xem bạn bè đã tồn tại chưa (tránh trùng lặp)
                    if (!state.friends.some(f => f.id === action.payload.friend.id)) {
                         state.friends.push(action.payload.friend);
                    }
                }
                // Xóa lời mời khỏi danh sách friendRequests dựa trên ID người gửi
                state.friendRequests = state.friendRequests.filter(req => req.id !== action.payload.friendId);
            })
            .addCase(acceptFriendRequest.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // --- Reject Friend Request ---
            .addCase(rejectFriendRequest.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(rejectFriendRequest.fulfilled, (state, action) => {
                state.loading = false;
                // Xóa lời mời khỏi friendRequests dựa trên ID người gửi
                state.friendRequests = state.friendRequests.filter(req => req.id !== action.payload.friendId);
            })
            .addCase(rejectFriendRequest.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // --- Cancel Friend Request ---
            .addCase(cancelFriendRequest.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(cancelFriendRequest.fulfilled, (state, action) => {
                state.loading = false;
                // Xóa lời mời đã gửi khỏi sentFriendRequests dựa trên ID người nhận
                state.sentFriendRequests = state.sentFriendRequests.filter(req => req.id !== action.payload.friendId);
            })
            .addCase(cancelFriendRequest.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // --- Remove Friend ---
            .addCase(removeFriend.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(removeFriend.fulfilled, (state, action) => {
                state.loading = false;
                // Xóa bạn khỏi danh sách friends dựa trên ID
                state.friends = state.friends.filter(friend => friend.id !== action.payload.friendId);
            })
            .addCase(removeFriend.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

    },
});

export const { clearFriendError, clearFriendState } = friendSlice.actions;
export default friendSlice.reducer;
