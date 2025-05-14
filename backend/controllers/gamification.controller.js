// controllers/gamification.controller.js
import User from '../models/User.js';
import { awardPoints, checkAndAwardBadges } from '../utils/gamificationUtils.js'; // Import hàm cộng điểm
import { handleServerError } from '../utils/errorUtils.js';
import { getIo } from '../config/socket.js'; // Để gửi thông báo real-time
import Notification from '../models/Notification.js';

const POINTS_FOR_DAILY_CHECK_IN = 15; // Điểm thưởng cho điểm danh

export const dailyCheckIn = async (req, res) => {
    const userId = req.userId; // Lấy từ middleware authJwt.verifyToken

    try {
        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: "Người dùng không tồn tại." });
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0); // Đặt về đầu ngày hiện tại (theo múi giờ server)

        // Kiểm tra xem hôm nay đã điểm danh chưa
        if (user.lastLoginStreakAt && new Date(user.lastLoginStreakAt) >= today) {
            // Lưu ý: Cần đảm bảo so sánh ngày chính xác, không bị ảnh hưởng bởi giờ, phút, giây.
            // Hoặc có thể lưu chỉ ngày tháng năm vào lastLoginStreakAt.
            return res.status(400).json({ success: false, message: "Hôm nay bạn đã điểm danh rồi." });
        }

        // --- CẬP NHẬT CHUỖI ĐIỂM DANH (currentDailyStreak) ---
        let currentDailyStreak = 1; // Mặc định là 1 nếu hôm qua không điểm danh
        if (user.lastLoginStreakAt) {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            yesterday.setHours(0, 0, 0, 0);

            const lastCheckInDate = new Date(user.lastLoginStreakAt);
            lastCheckInDate.setHours(0, 0, 0, 0);

            if (lastCheckInDate.getTime() === yesterday.getTime()) {
                currentDailyStreak = (user.currentDailyStreak || 0) + 1;
            }
        }
        user.currentDailyStreak = currentDailyStreak;
        // ----------------------------------------------------

        const awardResult = await awardPoints(userId, POINTS_FOR_DAILY_CHECK_IN);
        if (awardResult && awardResult.user) {
            awardResult.user.lastLoginStreakAt = new Date();
            awardResult.user.currentDailyStreak = currentDailyStreak;

            await awardResult.user.save();
            await checkAndAwardBadges(awardResult.user, {
                eventType: 'daily_check_in',
                currentDailyStreak: awardResult.user.currentDailyStreak
            });
            const io = getIo();
            if (io) {
                const userRoom = `user_${userId}`;
                const unreadCount = await Notification.count({ where: { recipientId: userId, isRead: false } });
                io.to(userRoom).emit('userStatsUpdated', { 
                    userId: userId,
                    points: awardResult.user.points,
                    level: awardResult.user.level,
                    newLevelReached: awardResult.newLevel
                });
                io.to(userRoom).emit('newNotification', {
                    notification: {
                        type: 'DAILY_CHECK_IN_REWARD',
                        message: `Bạn vừa nhận được ${POINTS_FOR_DAILY_CHECK_IN} điểm thưởng điểm danh hàng ngày!`,
                        link: '#',
                        isRead: false,
                        createdAt: new Date()
                    },
                    unreadCount: unreadCount + 1
                });
            }

            return res.status(200).json({
                success: true,
                message: `Điểm danh thành công! Bạn nhận được ${POINTS_FOR_DAILY_CHECK_IN} điểm.`,
                points: awardResult.user.points,
                level: awardResult.user.level,
                lastCheckIn: awardResult.user.lastLoginStreakAt
            });
        } else {
            throw new Error("Lỗi khi cộng điểm.");
        }

    } catch (error) {
        handleServerError(res, error, "Xử lý điểm danh hàng ngày");
    }
};