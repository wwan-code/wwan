import bcrypt from "bcrypt";
import User from "../models/User.js";
import Verification from "../models/Verification.js";
import multer from "multer";
import cron from 'node-cron';
import { Op } from "sequelize";
import crypto from 'crypto';
import { createToken, verifyToken } from "../utils/jwtHelpers.js";
import imageKit from "../middlewares/imagekit.js";
import Comment from "../models/Comment.js";
import WatchHistory from "../models/WatchHistory.js";
import FollowMovie from "../models/FollowMovie.js";
import Rating from "../models/Rating.js";
import Favorite from "../models/Favorite.js";
import Episode from "../models/Episode.js";
import Movie from "../models/Movie.js";
import sendEmail from '../utils/emailHelper.js';
import sequelize from "../config/database.js";
import DeviceDetector from 'node-device-detector';

const deviceDetector = new DeviceDetector;

export const upload = multer({ storage: multer.memoryStorage() }).single("avatar");
const POINTS_FOR_DAILY_LOGIN = 2;
const getUserResponse = async (user) => {
    const userRoles = await user.getRoles();
    const authorities = userRoles.map(role => `ROLE_${role.name.toUpperCase()}`);
    return {
        id: user.id,
        uuid: user.uuid,
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber,
        avatar: user.avatar,
        roles: authorities,
        accessToken: createToken(user.id),
        createdAt: user.createdAt,
        status: user.status,
        socialLinks: user.socialLinks || { github: '', twitter: '', instagram: '', facebook: '' },
        points: user.points || 0,
        level: user.level || 1,
        lastLoginStreakAt: user.lastLoginStreakAt || null,
    };
};

export const register = async (req, res) => {
    const { name, email, password, confPassword, verificationCode } = req.body;
    if (!name || !email || !password || !confPassword) {
        return res.status(400).json({ message: 'Dữ liệu nhập vào không đầy đủ' });
    }
    if (password !== confPassword) {
        return res.status(401).json({ message: 'Passwords do not match' });
    }

    try {
        const result = await sequelize.transaction(async (t) => {
            const verification = await Verification.findOne({
                where: { email, verificationCode },
                transaction: t // Thêm transaction vào query
            });

            if (!verification) {
                // Ném lỗi bên trong transaction sẽ tự động rollback
                throw new Error('Mã xác nhận email không đúng');
            }

            await Verification.destroy({ where: { email }, transaction: t });

            const hashedPassword = await bcrypt.hash(password, 10);
            const user = await User.create({
                name,
                email,
                password: hashedPassword
            }, { transaction: t }); // Thêm transaction vào query

            await user.setRoles([3], { transaction: t }); // Thêm transaction vào query

            return user; // Trả về user nếu thành công
        });

        const response = await getUserResponse(result);

        res.status(201).json({ ...response, message: `Đăng ký thành công ID: ${result.id}` });
    } catch (err) {
        console.error("Registration Error:", err); // Log lỗi đầy đủ ở server
        // Kiểm tra lỗi cụ thể từ Sequelize (ví dụ: UniqueConstraintError)
        if (err.name === 'SequelizeUniqueConstraintError') {
            return res.status(409).json({ message: 'Email đã tồn tại.' });
        }
        res.status(500).json({ message: "Đã xảy ra lỗi trong quá trình đăng ký." }); // Thông báo chung
    }
};

export const sendVerificationCode = async (req, res) => {
    const { email } = req.body;
    try {
        const verification = await Verification.findOne({ where: { email } });

        if (verification) {
            return res.status(400).json({ message: 'Email đã được xác nhận' });
        }

        // Tạo mã xác nhận email ngẫu nhiên
        const verificationCode = Math.floor(100000 + Math.random() * 900000);

        // Lưu trữ mã xác nhận email trong database
        await Verification.create({
            email,
            verificationCode,
            expires: Date.now() + 300000 // Mã xác nhận email hết hạn sau 5 phút
        });

        const mailOptions = {
            to: email,
            from: 'contact.wwan@gmail.com',
            subject: 'Xác nhận email',
            html: `
            <div style="background-color: #f9f9f9; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                <h2 style="color: #333; font-weight: bold;">Xác nhận email</h2>
                <p style="color: #666; font-size: 16px;">Mã xác nhận email của bạn là: ${verificationCode}</p>
                <p style="color: #666; font-size: 16px;">Vui lòng nhập mã xác nhận email này vào trang đăng ký để hoàn tất quá trình đăng ký.</p>
                <button style="background-color: #4CAF50; color: #fff; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer;">Đăng ký ngay</button>
            </div>
            `,
        };

        await sendEmail(mailOptions);

        res.status(200).json({ message: 'Mã xác nhận email đã được gửi' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

cron.schedule('*/1 * * * *', async () => {
    try {
        const currentTime = Date.now();

        const expiredVerifications = await Verification.findAll({
            where: {
                expires: { [Op.lt]: currentTime }
            }
        });

        if (expiredVerifications.length > 0) {
            await Verification.destroy({
                where: {
                    expires: { [Op.lt]: currentTime }
                }
            });
        }
    } catch (error) {
        console.error('Lỗi khi xóa mã xác nhận email hết hạn:', error);
    }
});

export const login = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({
            where: { email, deletedAt: null }
        });
        if (!user) {
            return res.status(404).json({ message: "User Not found." });
        }

        const passwordIsValid = await bcrypt.compare(password, user.password);
        if (!passwordIsValid) {
            return res.status(401).json({
                accessToken: null,
                message: "Invalid Password!",
            });
        }
        const userAgent = req.headers['user-agent'];
        const deviceInfo = deviceDetector.detect(userAgent);

        req.session.deviceInfo = { // Lưu vào session của người dùng hiện tại
            os: `${deviceInfo.os.name} ${deviceInfo.os.version || ''}`.trim(),
            client: `${deviceInfo.client.name} ${deviceInfo.client.version || ''}`.trim(),
            device: `${deviceInfo.device.type || 'Unknown'} ${deviceInfo.device.brand || 'N/A'})`.trim(),
            ip: req.ip // Lấy IP của request
        };
        // Cập nhật lastActiveAt cho user
        user.lastActiveAt = new Date();
        await user.save()
        const response = await getUserResponse(user);
        res.status(200).json({ ...response, message: `Đăng nhập thành công ID: ${user.id}` });
    } catch (err) {
        console.error("Login Error:", err); // Log lỗi đầy đủ ở server
        res.status(500).json({ message: "Đã xảy ra lỗi trong quá trình đăng nhập." }); // Thông báo chung
    }
};

export const logout = (req, res) => {
    res.clearCookie("accessToken", {
        secure: true,
        sameSite: "none",
    }).status(200).json("Đăng xuất thành công!");
};

export const forgotPassword = async (req, res) => {
    const { email } = req.body;
    try {
        const user = await User.findOne({ where: { email } });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Tạo token đặt lại mật khẩu
        const resetToken = crypto.randomBytes(20).toString('hex');
        const resetTokenExpiry = Date.now() + 3600000; // Token hết hạn sau 1 giờ

        // Lưu token vào database
        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = resetTokenExpiry;
        await user.save();

        const mailOptions = {
            to: user.email,
            from: 'contact.wwan@gmail.com',
            subject: 'Password Reset',
            text: `You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n
            Please click on the following link, or paste this into your browser to complete the process:\n\n
            http://localhost:3000/reset-password/${resetToken}\n\n
            If you did not request this, please ignore this email and your password will remain unchanged.\n`,
        };

        await sendEmail(mailOptions);
        res.status(200).json({ message: 'Reset password email sent' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const resetPassword = async (req, res) => {
    const { token, newPassword } = req.body;
    try {
        const user = await User.findOne({
            where: {
                resetPasswordToken: token,
                resetPasswordExpires: { [Op.gt]: Date.now() }
            }
        });
        if (!user) {
            return res.status(400).json({ message: 'Password reset token is invalid or has expired' });
        }

        // Đặt lại mật khẩu
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        user.resetPasswordToken = null;
        user.resetPasswordExpires = null;
        await user.save();

        res.status(200).json({ message: 'Password has been reset' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const uploadAvatar = async (req, res) => {
    try {
        const uuid = req.params.uuid;
        const file = req.file;

        if (!file) {
            return res.status(400).json({ message: "File không được truyền vào" });
        }

        const user = await User.findOne({ where: { uuid } });
        if (!user) {
            return res.status(404).json({ message: "User  not found" });
        }

        if (user.avatarFileId) {
            try {
                console.log("Deleting file with ID:", user.avatarFileId);
                await imageKit.deleteFile(user.avatarFileId);
            } catch (error) {
                console.error("Lỗi khi xóa ảnh cũ:", error.message);
            }
        }

        const uploadedFile = await imageKit.upload({
            file: file.buffer.toString("base64"),
            fileName: file.originalname,
            folder: "/avatars",
        });

        user.avatar = uploadedFile.url;
        user.avatarFileId = uploadedFile.fileId;
        await user.save();

        const response = await getUserResponse(user);
        res.status(200).json({ ...response, message: "Avatar updated successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error updating avatar" + error.message });
    }
};

export const updateProfile = async (req, res) => {
    const { name, email, phoneNumber, socialLinks } = req.body;
    const uuid = req.params.uuid;

    try {
        const user = await User.findOne({
            where: { uuid, deletedAt: null }
        });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        await user.update({
            name: name || user.name,
            email: email || user.email,
            phoneNumber: phoneNumber || user.phoneNumber,
            socialLinks: typeof socialLinks === 'string' ? JSON.parse(socialLinks) : socialLinks || user.socialLinks
        });
        const response = await getUserResponse(user);

        // Trả về thông tin người dùng
        res.status(201).json({ ...response, message: `Cập nhật thành công ID: ${user.id}` });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

export const socialLogin = async (req, res) => {
    const { uuid, name, email, phoneNumber, provider, avatar } = req.body;

    try {
        let user = await User.findOne({ where: { uuid: uuid } });

        if (!user) {
            user = await User.create({
                uuid: uuid,
                name,
                email,
                phoneNumber,
                provider,
                avatar
            });
            await user.setRoles([3]);
        }
        const response = await getUserResponse(user);
        res.status(200).json({ ...response, message: `Đăng nhập thành công ID: ${user.id}` });
    } catch (error) {
        console.error("Error saving user:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const getUserTimeline = async (req, res) => {
    const { uuid } = req.params;

    try {
        const user = await User.findOne({ where: { uuid } });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const [comments, watchHistories, followMovies, ratings, favorites] = await Promise.all([
            Comment.findAll({ where: { userId: user.id } }),
            WatchHistory.findAll({ where: { userId: user.id }, include: [{ model: Episode, include: [Movie] }] }),
            FollowMovie.findAll({
                where: { userId: user.id }, include: [{
                    model: Movie,
                    as: 'movie',
                }]
            }),
            Rating.findAll({
                where: { userId: user.id }, include: [{
                    model: Movie,
                    as: 'movie',
                }]
            }),
            Favorite.findAll({
                where: { userId: user.id }, include: [Episode, {
                    model: Movie,
                    as: 'movie',
                }]
            })
        ]);

        const timeline = [
            ...comments.map(comment => ({ type: 'comment', content: comment.content, createdAt: comment.createdAt })),
            ...watchHistories.map(history => ({ type: 'watchHistory', movieTitle: history.Episode.movie.title, episodeNumber: history.Episode.episodeNumber, createdAt: history.watchedAt })),
            ...followMovies.map(follow => ({ type: 'followMovie', movieTitle: follow.movie.title, createdAt: follow.createdAt })),
            ...ratings.map(rating => ({ type: 'rating', movieTitle: rating.movie.title, rating: rating.rating, createdAt: rating.createdAt })),
            ...favorites.map(favorite => ({ type: 'favorite', movieTitle: favorite.movie.title, episodeNumber: favorite.Episode.episodeNumber, createdAt: favorite.createdAt }))
        ];

        timeline.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        res.status(200).json(timeline);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const deleteAccount = async (req, res) => {
    const userId = req.userId; // Lấy từ middleware authJwt
    const { password } = req.body; // Lấy mật khẩu xác nhận từ body

    if (!password) {
        return res.status(400).json({ message: "Password confirmation is required." });
    }

    try {
        const user = await User.findOne({
            where: {
                id: userId,
                deletedAt: null // Đảm bảo user chưa bị xóa
            }
        });

        if (!user) {
            // User không tồn tại hoặc đã bị xóa trước đó
            return res.status(404).json({ message: "User not found or already deleted." });
        }

        // Nếu user đăng nhập bằng social và không có mật khẩu
        if (!user.password) {
            return res.status(400).json({ message: "Cannot delete account created via social login using this method." });
            // Cần cơ chế xóa khác cho tài khoản social hoặc yêu cầu đặt mật khẩu trước
        }

        // So sánh mật khẩu xác nhận
        const passwordIsValid = await bcrypt.compare(password, user.password);
        if (!passwordIsValid) {
            return res.status(401).json({ message: "Invalid Password!" });
        }

        // --- Bắt đầu quá trình xóa ---

        // 1. Xóa avatar trên ImageKit (nếu có)
        if (user.avatarFileId) {
            try {
                console.log("Attempting to delete avatar:", user.avatarFileId);
                await imageKit.deleteFile(user.avatarFileId);
                console.log("Avatar deleted successfully from ImageKit.");
            } catch (error) {
                console.error("Error deleting avatar from ImageKit:", error.message);
                // Không dừng quá trình xóa tài khoản chỉ vì lỗi xóa avatar, nhưng cần log lại
            }
        }

        // 2. Đánh dấu xóa (Soft Delete)
        user.deletedAt = new Date();
        user.status = 'deleted'; // Cập nhật status (nếu có)
        // Tùy chọn: Vô hiệu hóa email để có thể đăng ký lại sau này
        user.email = `${user.email}_deleted_${Date.now()}`;
        // Tùy chọn: Xóa các thông tin nhạy cảm khác nếu cần
        user.avatar = null;
        user.avatarFileId = null;
        user.resetPasswordToken = null;
        user.resetPasswordExpires = null;
        user.socialLinks = null; // Hoặc để lại tùy yêu cầu
        // KHÔNG xóa password hash, có thể cần cho việc khôi phục hoặc kiểm tra

        await user.save(); // Lưu thay đổi

        // 3. (TODO - Nâng cao) Xử lý dữ liệu liên quan:
        // Bạn có thể muốn ẩn danh/xóa các bình luận, đánh giá, lịch sử xem... của người dùng này.
        // Ví dụ: Comment.update({ userId: null }, { where: { userId: user.id } });
        // Việc này cần xem xét cẩn thận tùy theo logic nghiệp vụ của bạn.

        // 4. Đăng xuất người dùng (xóa cookie)
        res.clearCookie("accessToken", {
            secure: true, // Nhớ đặt true nếu dùng HTTPS
            sameSite: "none", // Cần thiết cho cross-site cookies
        });

        // 5. Trả về thông báo thành công
        // Sử dụng 204 No Content thường phù hợp cho DELETE thành công không cần trả về body
        res.status(204).send();

    } catch (error) {
        console.error("Delete Account Error:", error);
        res.status(500).json({ message: "An error occurred while deleting the account." });
    }
};