import multer from "multer";
import DeviceDetector from 'node-device-detector';
import * as authService from '../services/auth.service.js';

const deviceDetector = new DeviceDetector;

export const upload = multer({ storage: multer.memoryStorage() }).single("avatar");

export const register = async (req, res) => {
    const { name, email, password, confPassword, verificationCode } = req.body;

    if (!name || !email || !password || !confPassword || !verificationCode) {
        return res.status(400).json({ message: 'Dữ liệu nhập vào không đầy đủ' });
    }
    if (password !== confPassword) {
        return res.status(400).json({ message: 'Passwords do not match' });
    }

    try {
        const newUser = await authService.registerUser({ name, email, password, verificationCode });

        const response = await authService.formatUserResponse(newUser);

        res.status(201).json({ ...response, message: `Đăng ký thành công ID: ${response.id}` });
    } catch (err) {
        console.error("Registration Error in Controller:", err.message);
        const statusCode = err.statusCode || 500;
        const message = err.message || "Đã xảy ra lỗi trong quá trình đăng ký.";

        res.status(statusCode).json({ message });
    }
};

export const sendVerificationCode = async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ message: 'Email là bắt buộc' });
    }

    try {
        await authService.processSendVerificationCode(email);
        res.status(200).json({ message: 'Mã xác nhận đã được gửi đến email của bạn.' });
    } catch (err) {
        console.error("Send Verification Code Error in Controller:", err.message);
        const statusCode = err.statusCode || 500;
        const message = err.message || "Đã xảy ra lỗi trong quá trình gửi mã xác thực.";
        res.status(statusCode).json({ message });
    }
};

export const login = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: "Email và mật khẩu là bắt buộc." });
    }

    try {
        const user = await authService.loginUser(email, password);

        const userAgent = req.headers['user-agent'];
        const deviceInfoRaw = deviceDetector.detect(userAgent); //

        // Lưu thông tin thiết bị vào session (nếu bạn dùng express-session)
        // Hoặc bạn có thể lưu vào một bảng riêng nếu cần theo dõi lịch sử đăng nhập chi tiết
        if (req.session) {
            req.session.deviceInfo = {
                os: `${deviceInfoRaw.os.name || 'Unknown OS'} ${deviceInfoRaw.os.version || ''}`.trim(),
                client: `${deviceInfoRaw.client.name || 'Unknown Client'} ${deviceInfoRaw.client.version || ''}`.trim(),
                device: `${deviceInfoRaw.device.type || 'Unknown Device'} (${deviceInfoRaw.device.brand || 'N/A'})`.trim(),
                ip: req.ip
            };
            // Lưu session
            // req.session.save((err) => {
            // if (err) {
            // console.error("Session save error:", err);
            // Có thể không cần block ở đây, chỉ log lỗi
            // }
            // });
        } else {
            console.warn("Session middleware not configured. Device info not saved in session.");
        }


        const response = await authService.formatUserResponse(user);
        res.status(200).json({ ...response, message: `Đăng nhập thành công ID: ${user.id}` });

    } catch (err) {
        console.error("Login Error in Controller:", err.message);
        const statusCode = err.statusCode || 500;
        let message = err.message || "Đã xảy ra lỗi trong quá trình đăng nhập.";

        if (err.message === "Không tìm thấy người dùng với email này." || err.message === "Mật khẩu không hợp lệ!" || err.message.includes("Tài khoản này được đăng ký thông qua mạng xã hội")) {
            message = err.message;
        }
        res.status(statusCode).json({ message });
    }
};

export const logout = (req, res) => {
    res.clearCookie("accessToken", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax", // "none" cho cross-site, "lax" cho same-site
    }).status(200).json({ message: "Đăng xuất thành công!" });
};

export const forgotPassword = async (req, res) => {
    const { email } = req.body;
    if (!email) {
        return res.status(400).json({ message: "Email là bắt buộc." });
    }

    try {
        await authService.processForgotPassword(email);
        res.status(200).json({ message: 'Nếu email của bạn tồn tại trong hệ thống, bạn sẽ nhận được một liên kết đặt lại mật khẩu.' });
    } catch (err) {
        console.error("Forgot Password Error in Controller:", err.message);
        if (err.statusCode === 404) {
            return res.status(200).json({ message: 'Nếu email của bạn tồn tại trong hệ thống, bạn sẽ nhận được một liên kết đặt lại mật khẩu.' });
        }
        const statusCode = err.statusCode || 500;
        const message = err.message || 'Đã xảy ra lỗi trong quá trình xử lý yêu cầu quên mật khẩu.';
        res.status(statusCode).json({ message });
    }
};

export const resetPassword = async (req, res) => {
    const { token, newPassword } = req.body;

    try {
        await authService.processResetPassword(token, newPassword);
        res.status(200).json({ message: 'Mật khẩu đã được đặt lại thành công.' });
    } catch (err) {
        console.error("Reset Password Error in Controller:", err.message);
        const statusCode = err.statusCode || 500;
        const message = err.message || 'Đã xảy ra lỗi trong quá trình đặt lại mật khẩu.';
        res.status(statusCode).json({ message });
    }
};

export const uploadAvatar = async (req, res) => {
    const uuid = req.params.uuid;
    const file = req.file;

    try {
        const updatedUser = await authService.processUploadAvatar(uuid, file);
        const response = await authService.formatUserResponse(updatedUser);

        res.status(200).json({ ...response, message: "Cập nhật avatar thành công!" });
    } catch (err) {
        console.error("Upload Avatar Error in Controller:", err.message);
        const statusCode = err.statusCode || 500;
        const message = err.message || "Lỗi khi cập nhật avatar.";
        res.status(statusCode).json({ message });
    }
};

export const updateProfile = async (req, res) => {
    const { name, email, phoneNumber, socialLinks, removeAvatar } = req.body;
    const uuid = req.params.uuid;
    const file = req.file;

    try {
        const updatedUser = await authService.processUpdateProfile(
            uuid,
            { name, email, phoneNumber, socialLinks, removeAvatar },
            file
        );
        const response = await authService.formatUserResponse(updatedUser);

        res.status(200).json({ ...response, message: `Cập nhật hồ sơ thành công ID: ${updatedUser.id}` });
    } catch (err) {
        console.error("Update Profile Error in Controller:", err.message);
        const statusCode = err.statusCode || 500;
        const message = err.message || "Đã xảy ra lỗi trong quá trình cập nhật hồ sơ.";
        res.status(statusCode).json({ message });
    }
};

export const socialLogin = async (req, res) => {
    const { uuid, name, email, phoneNumber, provider, avatar } = req.body;

    try {
        const user = await authService.processSocialLogin({ uuid, name, email, phoneNumber, provider, avatar });
        const response = await authService.formatUserResponse(user);

        const userAgent = req.headers['user-agent'];
        const deviceInfoRaw = deviceDetector.detect(userAgent);

        if (req.session) {
            req.session.deviceInfo = {
                os: `${deviceInfoRaw.os.name || 'Unknown OS'} ${deviceInfoRaw.os.version || ''}`.trim(),
                client: `${deviceInfoRaw.client.name || 'Unknown Client'} ${deviceInfoRaw.client.version || ''}`.trim(),
                device: `${deviceInfoRaw.device.type || 'Unknown Device'} (${deviceInfoRaw.device.brand || 'N/A'})`.trim(),
                ip: req.ip
            };
        } else {
            console.warn("Session middleware not configured for socialLogin. Device info not saved.");
        }


        res.status(200).json({ ...response, message: `Đăng nhập/Đăng ký qua ${provider} thành công ID: ${user.id}` });
    } catch (err) {
        console.error("Social Login Error in Controller:", err.message);
        const statusCode = err.statusCode || 500;
        const message = err.message || "Đã xảy ra lỗi trong quá trình đăng nhập bằng mạng xã hội.";
        res.status(statusCode).json({ message });
    }
};

export const getUserTimeline = async (req, res) => {
    const { uuid } = req.params;
    // const requestingUserId = req.userId; // Lấy từ middleware authJwt nếu cần check quyền riêng tư

    try {
        // Truyền thêm requestingUserId nếu service cần để check privacy
        // const timeline = await authService.fetchUserTimeline(uuid, requestingUserId);
        const timeline = await authService.fetchUserTimeline(uuid);
        res.status(200).json(timeline);
    } catch (err) {
        console.error("Get User Timeline Error in Controller:", err.message);
        const statusCode = err.statusCode || 500;
        const message = err.message || "Đã xảy ra lỗi khi lấy dòng thời gian của người dùng.";
        res.status(statusCode).json({ message });
    }
};

export const deleteAccount = async (req, res) => {
    const userId = req.userId;
    const { password } = req.body;

    if (!password) {
        return res.status(400).json({ message: "Cần xác nhận mật khẩu để xóa tài khoản." });
    }

    try {
        await authService.processDeleteAccount(userId, password);

        res.clearCookie("accessToken", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        });

        res.status(204).send();

    } catch (err) {
        console.error("Delete Account Error in Controller:", err.message);
        const statusCode = err.statusCode || 500;
        const message = err.message || "Đã xảy ra lỗi khi xóa tài khoản.";
        res.status(statusCode).json({ message });
    }
};