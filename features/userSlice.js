import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import authHeader from "../services/auth-header";

const API_URL = "/api/auth";

const setUserToLocalStorage = (userData) => {
    if (userData && userData.accessToken) {
        localStorage.setItem("user", JSON.stringify(userData));
    } else {
        localStorage.removeItem("user");
        console.warn("Attempted to save user data without accessToken.");
    }
};

const parseSocialLinks = (links) => {
    const defaultLinks = { github: '', twitter: '', instagram: '', facebook: '' };
    if (typeof links === 'string') {
        try {
            const parsed = JSON.parse(links);
            // Merge với default để đảm bảo đủ key
            return { ...defaultLinks, ...(typeof parsed === 'object' ? parsed : {}) };
        } catch (e) {
            return defaultLinks; // Trả về default nếu parse lỗi
        }
    }
    // Merge với default nếu là object nhưng có thể thiếu key
    return { ...defaultLinks, ...(typeof links === 'object' && links !== null ? links : {}) };
};

const extractUserData = (data) => {
    if (!data) return null; // Trả về null nếu data không hợp lệ
    return {
        id: data.id,
        uuid: data.uuid,
        email: data.email || null,
        name: data.name || 'Người dùng',
        phoneNumber: data.phoneNumber || null,
        avatar: data.avatar || null,
        accessToken: data.accessToken,
        roles: Array.isArray(data.roles) ? data.roles : [],
        createdAt: data.createdAt,
        status: data.status,
        socialLinks: parseSocialLinks(data.socialLinks),
        points: data.points !== undefined ? data.points : 0,
        level: data.level !== undefined ? data.level : 1,
        lastLoginStreakAt: data.lastLoginStreakAt || null,
    };
};

// Async action: Đăng nhập
export const loginUser = createAsyncThunk("user/loginUser", async (userData, { rejectWithValue }) => {
    try {
        const response = await axios.post(`${API_URL}/login`, userData);
        const user = extractUserData(response.data);
        setUserToLocalStorage(user);
        return user;
    } catch (error) {
        return rejectWithValue(error.response.data);
    }
});

// Async action: Đăng ký
export const registerUser = createAsyncThunk("user/registerUser", async (userData, { rejectWithValue }) => {
    try {
        const response = await axios.post(`${API_URL}/register`, userData);
        const user = extractUserData(response.data);
        setUserToLocalStorage(user);
        return user;
    } catch (error) {
        return rejectWithValue(error.response.data);
    }
});

// Async action: Cập nhật thông tin người dùng
export const updateUser = createAsyncThunk("user/updateUser", async (userData, { rejectWithValue }) => {
    try {
        const response = await axios.put(`${API_URL}/update-profile/${userData.uuid}`, userData, { headers: authHeader() });
        const user = extractUserData(response.data);
        setUserToLocalStorage(user);
        return user;
    } catch (error) {
        return rejectWithValue(error.response.data);
    }
});

// Async action: Đăng nhập bằng ứng dụng bên thứ 3
export const loginWithThirdParty = createAsyncThunk("user/loginWithThirdParty", async (userData, { rejectWithValue }) => {
    try {
        const response = await axios.post(`${API_URL}/social-login`, userData);
        const user = extractUserData(response.data);
        setUserToLocalStorage(user);
        return user;
    } catch (error) {
        return rejectWithValue(error.response.data);
    }
});

// Async action: Lấy dòng thời gian của người dùng
export const getUserTimeline = createAsyncThunk("user/getUserTimeline", async (uuid, { rejectWithValue }) => {
    try {
        const response = await axios.get(`${API_URL}/timeline/${uuid}`, { headers: authHeader() });
        return response.data;
    } catch (error) {
        return rejectWithValue(error.response.data);
    }
});

// --- Initial State (Đã sửa) ---
let initialUserState = null;
const storedUser = localStorage.getItem("user");
if (storedUser) {
    try {
        // Parse và validate dữ liệu từ localStorage
        const parsedUser = JSON.parse(storedUser);
        // Kiểm tra có accessToken không để xác định đăng nhập
        if (parsedUser && parsedUser.accessToken) {
            initialUserState = extractUserData(parsedUser); // Dùng lại extract để đảm bảo cấu trúc
        }
    } catch (e) {
        console.error("Failed to parse user from localStorage", e);
        localStorage.removeItem("user"); // Xóa nếu dữ liệu lỗi
    }
}

const initialState = {
    loading: false,
    error: null,
    isLoggedIn: !!initialUserState, // True nếu có user hợp lệ từ localStorage
    user: initialUserState, // User data hoặc null
    timeline: null, // <-- THÊM timeline VÀO INITIAL STATE
};

// Slice quản lý trạng thái user
const userSlice = createSlice({
    name: "user",
    initialState,
    reducers: {
        logout: (state) => {
            state.isLoggedIn = false;
            state.user = null;
            state.timeline = null; // Reset cả timeline khi logout
            state.error = null;
            state.loading = false;
            localStorage.removeItem("user");
        },
        // Có thể thêm action để clear error thủ công nếu cần
        clearError: (state) => {
            state.error = null;
        },
        updateUserPointsAndLevel: (state, action) => {
            if (state.user && action.payload) {
                if (action.payload.points !== undefined) {
                    state.user.points = action.payload.points;
                }
                if (action.payload.level !== undefined) {
                    state.user.level = action.payload.level;
                }
                if (action.payload.lastLoginStreakAt !== undefined) {
                    state.user.lastLoginStreakAt = action.payload.lastLoginStreakAt;
                }
                if (state.user.accessToken) {
                    localStorage.setItem("user", JSON.stringify(state.user));
                }
            }
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(loginUser.pending, (state) => {
                state.loading = true;
                state.error = null;
                state.isLoggedIn = false; // Đảm bảo reset khi đang login
                state.user = null;      // Đảm bảo reset khi đang login
            })
            .addCase(loginUser.fulfilled, (state, action) => {
                state.loading = false;
                state.isLoggedIn = true;
                state.user = action.payload; // payload đã được extractUserData xử lý
                state.error = null;
            })
            .addCase(loginUser.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload; // Lỗi từ rejectWithValue
                state.isLoggedIn = false;
                state.user = null;
            })
            .addCase(registerUser.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(registerUser.fulfilled, (state, action) => {
                state.loading = false;
                state.isLoggedIn = true;
                state.user = action.payload;
                state.error = null;
            })
            .addCase(registerUser.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
                state.isLoggedIn = false;
                state.user = null;
            })
            .addCase(loginWithThirdParty.pending, (state) => {
                state.loading = true;
                state.error = null;
                state.isLoggedIn = false;
                state.user = null;
            })
            .addCase(loginWithThirdParty.fulfilled, (state, action) => {
                state.loading = false;
                state.isLoggedIn = true;
                state.user = action.payload;
                state.error = null;
            })
            .addCase(loginWithThirdParty.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
                state.isLoggedIn = false;
                state.user = null;
            })
            .addCase(updateUser.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(updateUser.fulfilled, (state, action) => {
                state.loading = false;
                state.user = action.payload;
                state.error = null;
            })
            .addCase(updateUser.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            .addCase(getUserTimeline.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(getUserTimeline.fulfilled, (state, action) => {
                state.loading = false;
                state.timeline = action.payload;
                state.error = null;
            })
            .addCase(getUserTimeline.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload; // Lưu lỗi
                state.timeline = null;
            });
    },
});

// Export action logout
export const { logout, clearError, updateUserPointsAndLevel } = userSlice.actions;

// Export reducer
export default userSlice.reducer;
