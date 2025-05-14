import axios from "axios";

const API_URL = "/api/auth/";

const setUserToLocalStorage = (userData) => {
    if (userData.accessToken) {
        localStorage.setItem("user", JSON.stringify(userData));
    }
};

const extractUserData = (data) => ({
    id: data.id,
    uuid: data.uuid,
    email: data.email,
    name: data.name,
    phoneNumber: data.phoneNumber,
    avatar: data.avatar,
    accessToken: data.accessToken,
    roles: data.roles,
    createdAt: data.createdAt,
    status: data.status,
});

const register = async (name, email, password, confPassword, verificationCode) => {
    try {
        const { data } = await axios.post(`${API_URL}register`, {
            name,
            email,
            password,
            confPassword,
            verificationCode
        });
        const userData = extractUserData(data);
        setUserToLocalStorage(userData);
        return userData;
    } catch (error) {
        console.error("Registration error:", error);
        throw error.response ? error.response.data : error;
    }
};

const login = async (email, password) => {
    try {
        const { data } = await axios.post(`${API_URL}login`, { email, password });
        const userData = extractUserData(data);
        setUserToLocalStorage(userData);
        return userData;
    } catch (error) {
        console.error("Login error:", error);
        throw error.response ? error.response.data : error;
    }
};

const uploadAvatar = async (uuid, formData) => {
    if (!uuid) {
        console.log("UUID is required to upload avatar");
        throw new Error("UUID is required to upload avatar");
    }
    try {
        const { data } = await axios.post(`${API_URL}upload-avatar/${uuid}`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        const userData = extractUserData(data);
        setUserToLocalStorage(userData);
        return userData;
    } catch (error) {
        console.error("Login error:", error);
        throw error.response ? error.response.data : error;
    }
};

const updateProfile = async (uuid, name, email, phoneNumber) => {
    try {
        const { data } = await axios.post(`${API_URL}update-profile/${uuid}`, {
            name,
            email,
            phoneNumber
        });
        const userData = extractUserData(data);
        setUserToLocalStorage(userData);
        return userData;
    } catch (error) {
        console.error("Registration error:", error);
        throw error.response ? error.response.data : error;
    }
};
const updatePasswordUser = async (uuid, oldPassword, newPassword, confirmPassword) => {
    try {
        const { data } = await axios.post(`${API_URL}update-password/${uuid}`, {
            oldPassword, newPassword, confirmPassword
        });
        const userData = extractUserData(data);
        setUserToLocalStorage(userData);
        return userData;
    } catch (error) {
        console.error("Registration error:", error);
        throw error.response ? error.response.data : error;
    }
};
const logout = async () => {
    localStorage.removeItem("user");
};

const loginWithGoogle = async (token) => {
    try {
        const { data } = await axios.post(`${API_URL}google/login`, { token });
        const userData = extractUserData(data);
        setUserToLocalStorage(userData);
        return userData;
    } catch (error) {
        console.error("Login error:", error);
        throw error.response ? error.response.data : error;
    }
};
const authService = {
    register,
    login,
    logout,
    uploadAvatar,
    updateProfile,
    updatePasswordUser,
    loginWithGoogle
};

export default authService;