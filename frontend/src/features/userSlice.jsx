import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import authHeader from "@services/auth-header";
import { getAuth, signOut } from "firebase/auth";

const API_URL = "/api/auth";

const setUserToLocalStorage = (userData) => {
    if (userData && userData.accessToken) {
        localStorage.setItem("user", JSON.stringify(userData));
    } else {
        const existingUserStr = localStorage.getItem("user");
        if (existingUserStr) {
            try {
                const existingUser = JSON.parse(existingUserStr);
                const updatedUser = { ...existingUser, ...userData };
                if (updatedUser.accessToken) {
                    localStorage.setItem("user", JSON.stringify(updatedUser));
                } else {
                    localStorage.removeItem("user");
                }
            } catch (e) {
                console.error("Failed to update user in localStorage", e);
            }
        }
    }
};

const parseSocialLinks = (links) => {
    const defaultLinks = { github: '', twitter: '', instagram: '', facebook: '' };
    if (typeof links === 'string') {
        try {
            const parsed = JSON.parse(links);
            return { ...defaultLinks, ...(typeof parsed === 'object' ? parsed : {}) };
        } catch (e) {
            return defaultLinks;
        }
    }
    return { ...defaultLinks, ...(typeof links === 'object' && links !== null ? links : {}) };
};

const extractAndMergeUserData = (apiResponseData, existingUserState = null) => {
    if (!apiResponseData) return existingUserState;

    const extracted = {
        id: apiResponseData.id,
        uuid: apiResponseData.uuid,
        email: apiResponseData.email,
        name: apiResponseData.name,
        phoneNumber: apiResponseData.phoneNumber,
        avatar: apiResponseData.avatar,
        accessToken: apiResponseData.accessToken,
        roles: Array.isArray(apiResponseData.roles) ? apiResponseData.roles : undefined,
        createdAt: apiResponseData.createdAt,
        status: apiResponseData.status,
        socialLinks: apiResponseData.socialLinks !== undefined ? parseSocialLinks(apiResponseData.socialLinks) : undefined,
        points: apiResponseData.points,
        level: apiResponseData.level,
        lastLoginStreakAt: apiResponseData.lastLoginStreakAt,
        activeAvatarFrame: apiResponseData.activeAvatarFrame,
        activeChatColor: apiResponseData.activeChatColor,
        activeTheme: apiResponseData.activeTheme,
        activeProfileBackground: apiResponseData.activeProfileBackground,
        privacySettings: apiResponseData.privacySettings,
    };

    Object.keys(extracted).forEach(key => extracted[key] === undefined && delete extracted[key]);

    if (existingUserState) {
        return { ...existingUserState, ...extracted };
    }
    return {
        ...initialState.user,
        ...extracted,
        socialLinks: extracted.socialLinks || { github: '', twitter: '', instagram: '', facebook: '' },
        roles: extracted.roles || [],
        points: extracted.points !== undefined ? extracted.points : 0,
        level: extracted.level !== undefined ? extracted.level : 1,
    };
};

// Async action: Đăng nhập
export const loginUser = createAsyncThunk("user/loginUser", async (userData, { rejectWithValue }) => {
    try {
        const response = await axios.post(`${API_URL}/login`, userData);
        const user = extractAndMergeUserData(response.data);
        setUserToLocalStorage(user);
        return user;
    } catch (error) {
        return rejectWithValue(error.response?.data || { message: error.message });
    }
});

// Async action: Đăng ký
export const registerUser = createAsyncThunk("user/registerUser", async (userData, { rejectWithValue }) => {
    try {
        const response = await axios.post(`${API_URL}/register`, userData);
        const user = extractAndMergeUserData(response.data);
        setUserToLocalStorage(user);
        return user;
    } catch (error) {
        return rejectWithValue(error.response?.data || { message: error.message });
    }
});

// Async action: Cập nhật thông tin người dùng
export const updateUser = createAsyncThunk("user/updateUser", async (partialUserData, { getState, rejectWithValue }) => {
    const { user: currentUser } = getState().user;
    if (!currentUser || !currentUser.uuid) {
        return rejectWithValue({ message: "User not authenticated or UUID missing." });
    }
    try {
        let response = await axios.put(`/api/auth/update-profile/${currentUser.uuid}`, partialUserData, { headers: { ...authHeader(), "Content-Type": "multipart/form-data" } });
        const updatedUserPartial = response.data;
        const mergedUser = extractAndMergeUserData(updatedUserPartial, currentUser);

        setUserToLocalStorage(mergedUser);
        return mergedUser;
    } catch (error) {
        return rejectWithValue(error.response?.data || { message: error.message });
    }
});

// Async action: Đăng nhập bằng ứng dụng bên thứ 3
export const loginWithThirdParty = createAsyncThunk("user/loginWithThirdParty", async (userData, { rejectWithValue }) => {
    try {
        const response = await axios.post(`${API_URL}/social-login`, userData);
        const user = extractAndMergeUserData(response.data);
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

export const logoutUser = () => async (dispatch) => {
    try {
        const auth = getAuth();
        await signOut(auth);
    } catch (e) {}
    dispatch(logout());
};

let initialUserState = null;
const storedUser = localStorage.getItem("user");
if (storedUser) {
    try {
        const parsedUser = JSON.parse(storedUser);
        if (parsedUser && parsedUser.accessToken) {
            initialUserState = extractAndMergeUserData(parsedUser, {
                privacySettings: { showFriendsList: 'public', showTimeline: 'public' },
                activeAvatarFrame: null, activeChatColor: null, activeTheme: null, activeProfileBackground: null,
                points: 0, level: 1
            });
        }
    } catch (e) {
        console.error("Failed to parse user from localStorage", e);
        localStorage.removeItem("user");
    }
}

const initialState = {
    loading: false,
    error: null,
    isLoggedIn: !!initialUserState,
    user: initialUserState,
    timeline: null,
};

const userSlice = createSlice({
    name: "user",
    initialState,
    reducers: {
        logout: (state) => {
            state.isLoggedIn = false;
            state.user = null;
            state.timeline = null;
            state.error = null;
            state.loading = false;
            localStorage.removeItem("user");
        },
        clearError: (state) => {
            state.error = null;
        },
        updateUserPointsAndLevel: (state, action) => {
            if (state.user && action.payload) {
                state.user = { ...state.user, ...action.payload };
                if (state.user.accessToken) {
                    localStorage.setItem("user", JSON.stringify(state.user));
                }
            }
        },
        setActiveItem: (state, action) => {
            if (state.user && action.payload) {
                const { itemType, itemValue } = action.payload;
                state.user = { ...state.user };
                switch (itemType) {
                    case 'AVATAR_FRAME': state.user.activeAvatarFrame = itemValue; break;
                    case 'CHAT_COLOR': state.user.activeChatColor = itemValue; break;
                    case 'THEME_UNLOCK': state.user.activeTheme = itemValue; break;
                    case 'PROFILE_BACKGROUND': state.user.activeProfileBackground = itemValue; break;
                    default: break;
                }
                if (state.user.accessToken) {
                    setUserToLocalStorage(state.user);
                }
            }
        },
        clearActiveItem: (state, action) => {
            if (state.user && action.payload) {
                const { itemType } = action.payload;
                state.user = { ...state.user };
                switch (itemType) {
                    case 'AVATAR_FRAME': state.user.activeAvatarFrame = null; break;
                    case 'CHAT_COLOR': state.user.activeChatColor = null; break;
                    case 'THEME_UNLOCK': state.user.activeTheme = null; break;
                    case 'PROFILE_BACKGROUND': state.user.activeProfileBackground = null; break;
                    default: break;
                }
                if (state.user.accessToken) {
                    setUserToLocalStorage(state.user);
                }
            }
        },
        updateUserPrivacySettings: (state, action) => {
            if (state.user && action.payload) {
                state.user.privacySettings = { ...state.user.privacySettings, ...action.payload };
                if (state.user.accessToken) {
                    setUserToLocalStorage(state.user);
                }
            }
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(loginUser.pending, (state) => {
                state.loading = true;
                state.error = null;
                state.isLoggedIn = false;
                state.user = null;
            })
            .addCase(loginUser.fulfilled, (state, action) => {
                state.loading = false;
                state.isLoggedIn = true;
                state.user = action.payload;
                state.error = null;
            })
            .addCase(loginUser.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
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
                state.error = action.payload;
                state.timeline = null;
            });
    },
});

export const {
    logout,
    clearError,
    updateUserPointsAndLevel,
    setActiveItem,
    clearActiveItem,
    updateUserPrivacySettings
} = userSlice.actions;

export default userSlice.reducer;
