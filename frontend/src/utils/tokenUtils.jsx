import { jwtDecode } from "jwt-decode";
import { logout } from "../features/userSlice";
import store from "../app/store";

// Hàm kiểm tra xem token có hết hạn không
export const checkTokenExpiration = () => {
    try {
        const userStr = localStorage.getItem("user");
        if (!userStr) return;

        let user;
        try {
            user = JSON.parse(userStr);
        } catch (e) {
            console.error("Cannot parse user from localStorage:", e);
            store.dispatch(logout());
            return;
        }

        if (!user.accessToken) return;

        let decodedToken;
        try {
            decodedToken = jwtDecode(user.accessToken);
        } catch (error) {
            console.error("Invalid token:", error);
            store.dispatch(logout());
            return;
        }

        const currentTime = Math.floor(Date.now() / 1000);  // Thời gian hiện tại tính bằng giây

        if (decodedToken.exp && decodedToken.exp < currentTime) {
            console.warn("Token expired. Logging out...");
            store.dispatch(logout()); // Nếu token hết hạn, thực hiện logout
        }
    } catch (error) {
        console.error("Error checking token expiration:", error);
    }
};
