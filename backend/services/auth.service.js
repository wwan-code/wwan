// backend/services/auth.service.js
import bcrypt from "bcrypt";
import crypto from 'crypto';
import { Op } from "sequelize";
import sequelize from "../config/database.js";
import db from "../models/index.js";
import { createToken } from "../utils/jwtHelpers.js";
import sendEmail from '../utils/emailHelper.js';
import imageKit from "../middlewares/imagekit.js";

const User = db.User;
const UserInventory = db.UserInventory;
const ShopItem = db.ShopItem;
const Verification = db.Verification;
const Role = db.Role;
const Comment = db.Comment;
const WatchHistory = db.WatchHistory;
const FollowMovie = db.FollowMovie;
const Rating = db.Rating;
const Favorite = db.Favorite;
const Episode = db.Episode;
const Movie = db.Movie;

/**
 * Chuẩn bị dữ liệu người dùng để trả về API response.
 * @param {object} user - Đối tượng User từ Sequelize.
 * @returns {Promise<object>} - Đối tượng chứa thông tin người dùng đã được định dạng.
 */
export const formatUserResponse = async (user) => {
    const userRoles = await user.getRoles();
    const authorities = userRoles.map(role => `ROLE_${role.name.toUpperCase()}`);

    let activeAvatarFrame = null;
    let activeChatColor = null;
    let activeTheme = null;
    let activeProfileBackground = null;

    if (user && user.id) {
        const activeItems = await UserInventory.findAll({
            where: { userId: user.id, isActive: true },
            include: [{ model: ShopItem, as: 'itemDetails', attributes: ['type', 'value'] }]
        });

        activeItems.forEach(invItem => {
            if (invItem.itemDetails) {
                switch (invItem.itemDetails.type) {
                    case 'AVATAR_FRAME':
                        activeAvatarFrame = invItem.itemDetails.value;
                        break;
                    case 'CHAT_COLOR':
                        activeChatColor = invItem.itemDetails.value;
                        break;
                    case 'THEME_UNLOCK':
                        activeTheme = invItem.itemDetails.value;
                        break;
                    case 'PROFILE_BACKGROUND':
                        activeProfileBackground = invItem.itemDetails.value;
                        break;
                }
            }
        });
    }

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
        activeAvatarFrame,
        activeChatColor,
        activeTheme,
        activeProfileBackground,
        points: user.points || 0,
        level: user.level || 1,
        lastLoginStreakAt: user.lastLoginStreakAt || null,
        privacySettings: user.privacySettings || { showFriendsList: 'public', showTimeline: 'public' }
    };
};

/**
 * Xử lý logic đăng ký người dùng.
 * @param {object} registrationData - Dữ liệu đăng ký (name, email, password, verificationCode).
 * @returns {Promise<object>} - Đối tượng User mới được tạo.
 * @throws {Error} - Ném lỗi với statusCode nếu có vấn đề (ví dụ: mã xác thực sai, email tồn tại).
 */
export const registerUser = async (registrationData) => {
    const { name, email, password, verificationCode } = registrationData;

    const newUser = await sequelize.transaction(async (t) => {
        const verification = await Verification.findOne({
            where: { email, verificationCode },
            transaction: t
        });

        if (!verification) {
            const error = new Error('Mã xác nhận email không đúng');
            error.statusCode = 400; // Bad Request
            throw error;
        }

        // Xóa mã xác thực sau khi đã sử dụng
        await Verification.destroy({ where: { email }, transaction: t });

        // Kiểm tra xem email đã tồn tại chưa (để tránh lỗi từ DB và trả về thông báo thân thiện hơn)
        const existingUser = await User.findOne({ where: { email }, transaction: t });
        if (existingUser) {
            const error = new Error('Email đã tồn tại.');
            error.statusCode = 409; // Conflict
            throw error;
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await User.create({
            name,
            email,
            password: hashedPassword
            // Các trường mặc định khác sẽ được Sequelize tự động thêm (ví dụ: uuid, points, level, etc.)
        }, { transaction: t });

        // Gán vai trò mặc định cho người dùng mới (ví dụ: 'user')
        // Nên tìm vai trò theo tên để tránh phụ thuộc vào ID cố định
        const userRole = await Role.findOne({ where: { name: 'user' }, transaction: t }); //
        if (!userRole) {
            // Nếu không tìm thấy vai trò 'user', đây là một lỗi hệ thống
            console.error("Default role 'user' not found.");
            const error = new Error('Lỗi cấu hình hệ thống: Không tìm thấy vai trò mặc định.');
            error.statusCode = 500;
            throw error;
        }
        await user.setRoles([userRole.id], { transaction: t });

        return user;
    });

    return newUser;
};

/**
 * Gửi mã xác thực đến email người dùng.
 * @param {string} email - Email của người dùng.
 * @returns {Promise<void>}
 * @throws {Error} - Ném lỗi với statusCode nếu có vấn đề.
 */
export const processSendVerificationCode = async (email) => {
    const existingVerification = await Verification.findOne({ where: { email } });

    // Trong controller gốc, bạn kiểm tra if (verification), có thể ý là existingVerification
    // và trả về "Email đã được xác nhận". Tuy nhiên, logic này có vẻ nên là
    // "Mã xác thực đã được gửi cho email này, vui lòng kiểm tra hòm thư" hoặc
    // cho phép gửi lại sau một khoảng thời gian.
    // Hiện tại, tôi sẽ giữ logic gần giống với gốc: nếu đã có mã (chưa hết hạn) thì không gửi lại.
    // Hoặc, có thể xóa mã cũ và tạo mã mới.
    // Để đơn giản, nếu đã có record, có thể coi là email này đang trong quá trình xác thực.
    // Nếu muốn cho phép gửi lại, cần thêm logic kiểm tra thời gian.
    // Trong file gốc, bạn trả về 400 với message 'Email đã được xác nhận'
    // Điều này có thể gây nhầm lẫn. Nếu email đã được dùng để đăng ký tài khoản thì mới là "đã được xác nhận".
    // Tôi sẽ sửa lại logic: nếu User đã tồn tại với email này thì báo lỗi.
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
        const error = new Error('Email này đã được sử dụng để đăng ký tài khoản.');
        error.statusCode = 409;
        throw error;
    }

    // Nếu đã có mã xác thực cho email này và chưa hết hạn, có thể không cho gửi lại ngay
    // hoặc cập nhật mã mới. Hiện tại controller gốc không check expires ở đây.
    // Để đơn giản, ta sẽ xóa mã cũ (nếu có) và tạo mã mới.
    await Verification.destroy({ where: { email } });

    const verificationCode = Math.floor(100000 + Math.random() * 900000);
    const expires = Date.now() + 300000;

    await Verification.create({
        email,
        verificationCode,
        expires
    });

    const mailOptions = {
        to: email,
        from: process.env.EMAIL_FROM || 'contact.wwan@gmail.com', // Nên dùng biến môi trường
        subject: 'Xác nhận email đăng ký tài khoản',
        html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 20px auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
            <h2 style="color: #007bff; text-align: center;">Xác nhận địa chỉ Email của bạn</h2>
            <p>Chào bạn,</p>
            <p>Cảm ơn bạn đã đăng ký tài khoản tại WWAN. Vui lòng sử dụng mã xác thực dưới đây để hoàn tất quá trình đăng ký:</p>
            <p style="text-align: center; font-size: 24px; font-weight: bold; color: #28a745; margin: 20px 0;">
                ${verificationCode}
            </p>
            <p>Mã xác thực này sẽ có hiệu lực trong vòng 5 phút.</p>
            <p>Nếu bạn không yêu cầu mã này, vui lòng bỏ qua email này một cách an toàn.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
            <p style="font-size: 0.9em; color: #666;">Trân trọng,<br/>Đội ngũ WWAN</p>
        </div>
        `,
    };

    try {
        await sendEmail(mailOptions);
    } catch (emailError) {
        console.error("Email sending error:", emailError);
        const error = new Error('Lỗi gửi email xác thực. Vui lòng thử lại sau.');
        error.statusCode = 500;
        throw error;
    }
};

/**
 * Xử lý logic đăng nhập người dùng.
 * @param {string} email - Email người dùng.
 * @param {string} password - Mật khẩu người dùng.
 * @returns {Promise<object>} - Đối tượng User.
 * @throws {Error} - Ném lỗi với statusCode nếu có vấn đề.
 */
export const loginUser = async (email, password) => {
    const user = await User.findOne({
        where: { email, deletedAt: null } //
    });

    if (!user) {
        const error = new Error("Không tìm thấy người dùng với email này.");
        error.statusCode = 404; // Not Found
        throw error;
    }

    // Đối với tài khoản đăng nhập bằng social, trường password có thể null
    if (!user.password) {
        const error = new Error("Tài khoản này được đăng ký thông qua mạng xã hội. Vui lòng đăng nhập bằng phương thức tương ứng.");
        error.statusCode = 401;
        throw error;
    }

    const passwordIsValid = await bcrypt.compare(password, user.password);
    if (!passwordIsValid) {
        const error = new Error("Mật khẩu không hợp lệ!");
        error.statusCode = 401;
        throw error;
    }

    user.lastActiveAt = new Date();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let lastLoginDate = null;
    if (user.lastLoginStreakAt) {
        lastLoginDate = new Date(user.lastLoginStreakAt);
        lastLoginDate.setHours(0, 0, 0, 0);
    }

    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    if (lastLoginDate && lastLoginDate.getTime() === today.getTime()) {
        // Đăng nhập lại trong cùng ngày, không thay đổi streak
    } else if (lastLoginDate && lastLoginDate.getTime() === yesterday.getTime()) {
        user.currentDailyStreak = (user.currentDailyStreak || 0) + 1;
        user.lastLoginStreakAt = new Date();
    } else {
        user.currentDailyStreak = 1;
        user.lastLoginStreakAt = new Date();
    }

    await user.save();
    return user;
};

/**
 * Xử lý logic quên mật khẩu.
 * @param {string} email - Email của người dùng.
 * @returns {Promise<void>}
 * @throws {Error} - Ném lỗi với statusCode nếu có vấn đề.
 */
export const processForgotPassword = async (email) => {
    const user = await User.findOne({ where: { email, deletedAt: null } });
    if (!user) {
        // Để tránh việc tiết lộ email nào đã đăng ký, có thể luôn trả về thông báo thành công
        // Tuy nhiên, trong code gốc bạn trả về 404. Giữ nguyên để nhất quán.
        const error = new Error("Không tìm thấy người dùng với email này.");
        error.statusCode = 404;
        throw error;
    }

    // Không cho phép reset password cho tài khoản social không có mật khẩu
    if (!user.password && user.provider) {
        const error = new Error("Tài khoản này được đăng ký thông qua mạng xã hội và không có mật khẩu để đặt lại.");
        error.statusCode = 400;
        throw error;
    }

    const resetToken = crypto.randomBytes(32).toString('hex'); // Tăng độ dài token
    const resetTokenExpiry = Date.now() + 3600000; // 1 giờ

    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = new Date(resetTokenExpiry); // Lưu dưới dạng Date
    await user.save();

    // Đảm bảo URL reset trỏ đúng tới frontend của bạn
    const resetUrl = `${process.env.CORS_ORIGIN}/reset-password/${resetToken}`;

    const mailOptions = {
        to: user.email,
        from: process.env.EMAIL_FROM || 'contact.wwan@gmail.com',
        subject: 'Yêu cầu đặt lại mật khẩu WWAN',
        html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 20px auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
            <h2 style="color: #007bff; text-align: center;">Yêu cầu đặt lại mật khẩu</h2>
            <p>Chào ${user.name || 'bạn'},</p>
            <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản WWAN của bạn. Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email này.</p>
            <p>Để đặt lại mật khẩu, vui lòng nhấp vào liên kết dưới đây (liên kết sẽ hết hạn sau 1 giờ):</p>
            <p style="text-align: center; margin: 20px 0;">
                <a href="${resetUrl}" style="background-color: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Đặt lại mật khẩu</a>
            </p>
            <p>Hoặc sao chép và dán URL sau vào trình duyệt của bạn:</p>
            <p><a href="${resetUrl}" style="color: #007bff;">${resetUrl}</a></p>
            <p style="font-size: 0.9em; color: #666;">Nếu bạn gặp bất kỳ vấn đề nào, vui lòng liên hệ với chúng tôi.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
            <p style="font-size: 0.9em; color: #666;">Trân trọng,<br/>Đội ngũ WWAN</p>
        </div>
        `,
    };

    try {
        await sendEmail(mailOptions);
    } catch (emailError) {
        console.error("Forgot password email sending error:", emailError);
        // Không nên throw lỗi chi tiết về email cho client ở đây để tránh lộ thông tin
        // Chỉ log ở server và báo lỗi chung chung.
        const error = new Error('Lỗi khi gửi email đặt lại mật khẩu. Vui lòng thử lại sau.');
        error.statusCode = 500;
        throw error; // Ném lỗi để controller xử lý
    }
};

/**
 * Xử lý logic đặt lại mật khẩu.
 * @param {string} token - Token đặt lại mật khẩu.
 * @param {string} newPassword - Mật khẩu mới.
 * @returns {Promise<void>}
 * @throws {Error} - Ném lỗi với statusCode nếu có vấn đề.
 */
export const processResetPassword = async (token, newPassword) => {
    if (!token || !newPassword) {
        const error = new Error('Token và mật khẩu mới là bắt buộc.');
        error.statusCode = 400;
        throw error;
    }
    // Có thể thêm validation độ dài/độ phức tạp mật khẩu ở đây

    const user = await User.findOne({
        where: {
            resetPasswordToken: token,
            resetPasswordExpires: { [Op.gt]: Date.now() } //
        }
    });

    if (!user) {
        const error = new Error('Token đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.');
        error.statusCode = 400;
        throw error;
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();
};

/**
 * Xử lý logic upload avatar cho người dùng.
 * @param {string} userUuid - UUID của người dùng.
 * @param {object} file - File avatar được upload (từ multer).
 * @returns {Promise<object>} - Đối tượng User đã được cập nhật.
 * @throws {Error} - Ném lỗi với statusCode nếu có vấn đề.
 */
export const processUploadAvatar = async (userUuid, file) => {
    if (!file) {
        const error = new Error("File không được truyền vào.");
        error.statusCode = 400;
        throw error;
    }

    const user = await User.findOne({ where: { uuid: userUuid, deletedAt: null } });
    if (!user) {
        const error = new Error("Không tìm thấy người dùng.");
        error.statusCode = 404;
        throw error;
    }

    // Xóa avatar cũ trên ImageKit nếu có
    if (user.avatarFileId) { //
        try {
            console.log("Deleting old avatar file from ImageKit:", user.avatarFileId);
            await imageKit.deleteFile(user.avatarFileId); //
        } catch (deleteError) {
            // Log lỗi nhưng vẫn tiếp tục upload avatar mới
            console.error("Lỗi khi xóa ảnh cũ trên ImageKit:", deleteError.message);
        }
    }

    // Upload avatar mới lên ImageKit
    let uploadedFile;
    try {
        uploadedFile = await imageKit.upload({
            file: file.buffer.toString("base64"), //
            fileName: file.originalname, //
            folder: "/avatars", //
        });
    } catch (uploadError) {
        console.error("Lỗi khi upload avatar mới lên ImageKit:", uploadError.message);
        const error = new Error("Lỗi khi upload avatar: " + uploadError.message);
        error.statusCode = 500; // Internal Server Error
        throw error;
    }

    user.avatar = uploadedFile.url; //
    user.avatarFileId = uploadedFile.fileId; //
    await user.save();

    return user;
};

/**
 * Xử lý logic cập nhật thông tin hồ sơ người dùng.
 * @param {string} userUuid - UUID của người dùng.
 * @param {object} profileData - Dữ liệu hồ sơ (name, email, phoneNumber, socialLinks, removeAvatar).
 * @param {object} [file] - File avatar mới (tùy chọn, từ multer).
 * @returns {Promise<object>} - Đối tượng User đã được cập nhật.
 * @throws {Error} - Ném lỗi với statusCode nếu có vấn đề.
 */
export const processUpdateProfile = async (userUuid, profileData, file) => {
    const { name, email, phoneNumber, socialLinks: socialLinksRaw, removeAvatar } = profileData;

    const user = await User.findOne({
        where: { uuid: userUuid, deletedAt: null } //
    });

    if (!user) {
        const error = new Error("Không tìm thấy người dùng.");
        error.statusCode = 404;
        throw error;
    }

    // Cập nhật thông tin cơ bản
    const updateData = {};
    if (name) updateData.name = name;
    if (email) {
        // Kiểm tra email mới có trùng với người dùng khác không (trừ chính user hiện tại)
        if (email.toLowerCase() !== user.email.toLowerCase()) {
            const existingUserWithNewEmail = await User.findOne({
                where: {
                    email: email,
                    id: { [Op.ne]: user.id }
                }
            });
            if (existingUserWithNewEmail) {
                const error = new Error('Email đã được sử dụng bởi tài khoản khác.');
                error.statusCode = 409;
                throw error;
            }
            updateData.email = email;
        }
    }
    if (phoneNumber) updateData.phoneNumber = phoneNumber;
    if (socialLinksRaw) {
        try {
            updateData.socialLinks = typeof socialLinksRaw === 'string' ? JSON.parse(socialLinksRaw) : socialLinksRaw; //
        } catch (parseError) {
            console.error("Lỗi parsing socialLinks JSON:", parseError);
            const error = new Error("Định dạng socialLinks không hợp lệ.");
            error.statusCode = 400;
            throw error;
        }
    }

    await user.update(updateData);

    // Xử lý xóa avatar nếu được yêu cầu
    const shouldRemoveAvatar = removeAvatar === 'true' || removeAvatar === true;
    if (shouldRemoveAvatar) {
        if (user.avatarFileId) {
            try {
                await imageKit.deleteFile(user.avatarFileId);
            } catch (deleteError) {
                console.error("Lỗi khi xóa ảnh cũ (updateProfile):", deleteError.message);
            }
        }
        user.avatar = null;
        user.avatarFileId = null;
        await user.save();
    }

    // Xử lý upload avatar mới nếu có file và không yêu cầu xóa avatar
    if (file && !shouldRemoveAvatar) {
        if (user.avatarFileId) {
            try {
                await imageKit.deleteFile(user.avatarFileId);
            } catch (deleteError) {
                console.error("Lỗi khi xóa ảnh cũ (updateProfile with new file):", deleteError.message);
            }
        }

        let uploadedFile;
        try {
            uploadedFile = await imageKit.upload({
                file: file.buffer.toString("base64"),
                fileName: file.originalname,
                folder: "/avatars",
            });
        } catch (uploadError) {
            console.error("Lỗi khi upload avatar mới (updateProfile):", uploadError.message);
            const error = new Error("Lỗi khi upload avatar: " + uploadError.message);
            error.statusCode = 500;
            throw error;
        }
        user.avatar = uploadedFile.url;
        user.avatarFileId = uploadedFile.fileId;
        await user.save();
    }
    // Tải lại thông tin user để đảm bảo dữ liệu mới nhất
    await user.reload();
    return user;
};

/**
 * Xử lý logic đăng nhập hoặc đăng ký bằng tài khoản mạng xã hội.
 * @param {object} socialUserData - Dữ liệu người dùng từ nhà cung cấp mạng xã hội (uuid, name, email, phoneNumber, provider, avatar).
 * @returns {Promise<object>} - Đối tượng User.
 * @throws {Error} - Ném lỗi với statusCode nếu có vấn đề.
 */
export const processSocialLogin = async (socialUserData) => {
    const { uuid, name, email, phoneNumber, provider, avatar } = socialUserData;

    if (!uuid || !email || !provider || !name) {
        const error = new Error("Thông tin đăng nhập mạng xã hội không đầy đủ (yêu cầu: uuid, name, email, provider).");
        error.statusCode = 400;
        throw error;
    }

    let user = await User.findOne({ where: { email: email, deletedAt: null } });

    if (user) {
        if (user.provider && user.provider !== provider) {
            const error = new Error(`Email này đã được liên kết với tài khoản ${user.provider}. Vui lòng đăng nhập bằng ${user.provider} hoặc sử dụng email khác.`);
            error.statusCode = 409;
            throw error;
        }
        if (!user.provider && user.password) {
            user.provider = provider;
            user.uuid = user.uuid || uuid;
            if (avatar && !user.avatar) user.avatar = avatar;
        }
        // Nếu user.provider === provider, chỉ cần đăng nhập
    } else {
        // Người dùng chưa tồn tại, tạo mới
        user = await User.create({
            uuid: uuid,
            name,
            email,
            phoneNumber,
            provider,
            avatar
            // Mật khẩu sẽ là null cho tài khoản social
        });
        const userRole = await Role.findOne({ where: { name: 'user' } });
        if (!userRole) {
            console.error("Default role 'user' not found for social login.");
            const error = new Error('Lỗi cấu hình hệ thống.');
            error.statusCode = 500;
            throw error;
        }
        await user.setRoles([userRole.id]);
    }

    // Cập nhật lastActiveAt cho user
    user.lastActiveAt = new Date();
    // Xử lý daily streak tương tự như login thường
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let lastLoginDate = null;
    if (user.lastLoginStreakAt) {
        lastLoginDate = new Date(user.lastLoginStreakAt);
        lastLoginDate.setHours(0, 0, 0, 0);
    }

    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    if (lastLoginDate && lastLoginDate.getTime() === today.getTime()) {
        // Đăng nhập lại trong cùng ngày
    } else if (lastLoginDate && lastLoginDate.getTime() === yesterday.getTime()) {
        user.currentDailyStreak = (user.currentDailyStreak || 0) + 1;
        user.lastLoginStreakAt = new Date();
    } else {
        user.currentDailyStreak = 1;
        user.lastLoginStreakAt = new Date();
    }
    await user.save();

    return user;
};

/**
 * Lấy dòng thời gian hoạt động của người dùng.
 * @param {string} userUuid - UUID của người dùng.
 * @returns {Promise<Array<object>>} - Mảng các hoạt động trên dòng thời gian.
 * @throws {Error} - Ném lỗi với statusCode nếu người dùng không tồn tại.
 */
export const fetchUserTimeline = async (userUuid) => {
    const user = await User.findOne({ where: { uuid: userUuid, deletedAt: null } }); //
    if (!user) {
        const error = new Error("Không tìm thấy người dùng.");
        error.statusCode = 404;
        throw error;
    }

    // Kiểm tra cài đặt quyền riêng tư của người dùng
    // Giả sử bạn muốn chỉ hiển thị timeline nếu `user.privacySettings.showTimeline` là 'public'
    // hoặc nếu người yêu cầu là chính chủ hoặc bạn bè (logic này cần được thêm nếu có hệ thống bạn bè)
    // Hiện tại, file gốc không có check này, sẽ lấy timeline nếu user tồn tại
    // Nếu có req.userId (người dùng đang đăng nhập) thì có thể so sánh với user.id để cho phép xem timeline của chính mình
    // regardless of privacy settings, hoặc thêm logic bạn bè.
    // Ví dụ: if (user.privacySettings.showTimeline !== 'public' && (!req.userId || req.userId !== user.id)) {
    // const error = new Error("Dòng thời gian của người dùng này là riêng tư.");
    // error.statusCode = 403; // Forbidden
    // throw error;
    // }

    const [comments, watchHistories, followMovies, ratings, favorites] = await Promise.all([
        Comment.findAll({
            where: { userId: user.id }
        }),
        WatchHistory.findAll({
            where: { userId: user.id },
            include: [{ model: Episode, as: 'Episode', include: [{ model: Movie, as: 'movie', attributes: ['title', 'slug', 'type'] }] }]
        }),
        FollowMovie.findAll({
            where: { userId: user.id },
            include: [{ model: Movie, as: 'movie', attributes: ['title', 'slug', 'type'] }]
        }),
        Rating.findAll({
            where: { userId: user.id },
            include: [{ model: Movie, as: 'movie', attributes: ['title', 'slug', 'type'] }]
        }),
        Favorite.findAll({
            where: { userId: user.id },
            include: [
                { model: Episode, as: 'Episode', include: [{ model: Movie, as: 'movie', attributes: ['title', 'slug', 'type'] }] },
                { model: Movie, as: 'movie', required: false, attributes: ['title', 'slug', 'type'] }
            ]
        })
    ]);

    const timeline = [];
    comments.forEach(comment => timeline.push({
        type: 'comment',
        content: comment.content,
        createdAt: comment.createdAt,
        id: `comment-${comment.id}`
    }));

    watchHistories.forEach(history => {
        if (history.Episode && history.Episode.movie) {
            timeline.push({
                type: 'watchHistory',
                movieTitle: history.Episode.movie.title,
                episodeNumber: history.Episode.episodeNumber,
                createdAt: history.watchedAt,
                duration: history.Episode.duration,
                id: `watchHistory-${history.id}`
            });
        }
    });

    followMovies.forEach(follow => {
        if (follow.movie) {
            timeline.push({
                type: 'followMovie',
                movieTitle: follow.movie.title,
                createdAt: follow.createdAt,
                id: `followMovie-${follow.id}`
            });
        }
    });

    ratings.forEach(rating => {
        if (rating.movie) {
            timeline.push({
                type: 'rating',
                movieTitle: rating.movie.title,
                rating: rating.rating,
                createdAt: rating.createdAt,
                id: `rating-${rating.id}`
            });
        }
    });

    favorites.forEach(favorite => {
        timeline.push({
            type: 'favorite',
            movieTitle: favorite.movie.title,
            episodeNumber: favorite.Episode ? favorite.Episode.episodeNumber : null,
            createdAt: favorite.createdAt,
            id: `favorite-${favorite.id}`
        });
    });

    timeline.sort((a, b) => new Date(b.createdAt || b.watchedAt) - new Date(a.createdAt || a.watchedAt));

    return timeline;
};

/**
 * Xử lý logic xóa (soft delete) tài khoản người dùng.
 * @param {number} userId - ID của người dùng cần xóa.
 * @param {string} password - Mật khẩu xác nhận của người dùng.
 * @returns {Promise<void>}
 * @throws {Error} - Ném lỗi với statusCode nếu có vấn đề.
 */
export const processDeleteAccount = async (userId, password) => {
    const user = await User.findOne({
        where: {
            id: userId,
            deletedAt: null //
        }
    });

    if (!user) {
        const error = new Error("Không tìm thấy người dùng hoặc tài khoản đã bị xóa.");
        error.statusCode = 404;
        throw error;
    }

    // Đối với tài khoản social không có mật khẩu, không cho xóa bằng cách này
    // Cần một cơ chế khác hoặc xác nhận qua email/social provider
    if (!user.password) { //
        const error = new Error("Không thể xóa tài khoản được tạo thông qua đăng nhập mạng xã hội bằng phương pháp này. Vui lòng liên hệ hỗ trợ.");
        error.statusCode = 400;
        throw error;
    }

    const passwordIsValid = await bcrypt.compare(password, user.password);
    if (!passwordIsValid) {
        const error = new Error("Mật khẩu xác nhận không hợp lệ!");
        error.statusCode = 401; // Unauthorized
        throw error;
    }

    // 1. Xóa avatar trên ImageKit (nếu có)
    if (user.avatarFileId) { //
        try {
            console.log("Attempting to delete avatar before account deletion:", user.avatarFileId);
            await imageKit.deleteFile(user.avatarFileId); //
            console.log("Avatar deleted successfully from ImageKit for user:", user.id);
        } catch (deleteError) {
            console.error("Error deleting avatar from ImageKit during account deletion for user " + user.id + ":", deleteError.message);
            // Không ném lỗi, vẫn tiếp tục quá trình xóa tài khoản
        }
    }

    // 2. Đánh dấu xóa (Soft Delete) và cập nhật thông tin
    user.deletedAt = new Date(); //
    user.status = 0; // Hoặc 'deleted' nếu status là string (trong model User, status là INTEGER, 0 có thể là deleted)
    // Vô hiệu hóa email để có thể đăng ký lại sau này (nếu chính sách cho phép)
    user.email = `${user.email}_deleted_${Date.now()}`; //
    user.avatar = null; //
    user.avatarFileId = null; //
    user.resetPasswordToken = null; //
    user.resetPasswordExpires = null; //
    // user.socialLinks = null; // Tùy theo yêu cầu có muốn xóa social links không
    // user.name = "Người dùng đã xoá"; // Cân nhắc ẩn danh tên

    await user.save();

    // 3. Xử lý dữ liệu liên quan (TODO - Nâng cao)
    // Ví dụ: ẩn danh bình luận, xóa lịch sử xem, ratings,...
    // Comment.update({ content: '[Bình luận đã bị ẩn]', userId: null }, { where: { userId: user.id } });
    // WatchHistory.destroy({ where: { userId: user.id } });
    // Việc này cần được xem xét kỹ lưỡng và thực hiện trong transaction nếu cần.
    // Hiện tại, chỉ soft delete user.
    console.log(`User account ${userId} soft deleted successfully.`);
};