import db from '../models/index.js';
import { handleServerError } from "../utils/errorUtils.js";

const User = db.User;
const Notification = db.Notification;


export default class NotificationController {
    // Lấy tất cả thông báo
    async getNotifications(req, res) {
        const recipientId = req.userId;
        const page = parseInt(req.query.page || '1', 10);
        const limit = parseInt(req.query.limit || '10', 10);
        const status = req.query.status || 'all';
        const offset = (page - 1) * limit;

        try {
            const whereClause = { recipientId };
            if (status === 'unread') {
                whereClause.isRead = false;
            } else if (status === 'read') {
                whereClause.isRead = true;
            }
            const { count, rows: notifications } = await Notification.findAndCountAll({
                where: whereClause, // Áp dụng điều kiện lọc theo status
                include: [{
                    model: User,
                    as: 'sender',
                    attributes: ['id', 'name', 'avatar']
                }],
                order: [['createdAt', 'DESC']],
                limit,
                offset
            });

            const totalPages = Math.ceil(count / limit);
            const unreadCount = await Notification.count({ where: { recipientId, isRead: false } }); // Vẫn cần unreadCount riêng

            res.status(200).json({
                success: true,
                notifications,
                pagination: { totalItems: count, totalPages, currentPage: page, itemsPerPage: limit },
                unreadCount: unreadCount // Gửi kèm unreadCount
            });
        } catch (error) {
            handleServerError(res, error, "Lấy thông báo chưa đọc");
        }
    }

    // Đánh dấu một thông báo là đã đọc
    async markNotificationAsRead(req, res) {
        const recipientId = req.userId;
        const notificationId = req.params.id;
        try {
            const notification = await Notification.findOne({ where: { id: notificationId, recipientId } });
            if (!notification) {
                return res.status(404).json({ success: false, message: "Thông báo không tồn tại hoặc bạn không có quyền." });
            }
            if (notification.isRead) {
                return res.status(200).json({ success: true, message: "Thông báo đã được đọc trước đó." });
            }
            notification.isRead = true;
            await notification.save();
            res.status(200).json({ success: true, message: "Đã đánh dấu thông báo là đã đọc." });
        } catch (error) {
            handleServerError(res, error, "Đánh dấu đã đọc thông báo");
        }
    }

    // Đánh dấu tất cả thông báo là đã đọc
    async markAllNotificationsAsRead(req, res) {
        const recipientId = req.userId;
        try {
            await Notification.update({ isRead: true }, {
                where: { recipientId, isRead: false }
            });
            res.status(200).json({ success: true, message: "Đã đánh dấu tất cả thông báo là đã đọc." });
        } catch (error) {
            handleServerError(res, error, "Đánh dấu tất cả đã đọc");
        }
    }

    // Xóa một thông báo
    async deleteNotification(req, res) {
        const recipientId = req.userId;
        const notificationId = req.params.id;

        try {
            const notification = await Notification.findOne({ where: { id: notificationId, recipientId } });
            if (!notification) {
                return res.status(404).json({ success: false, message: "Thông báo không tồn tại hoặc bạn không có quyền." });
            }

            await notification.destroy(); // Xóa thông báo

            // Lấy lại unreadCount sau khi xóa
            const unreadCount = await Notification.count({ where: { recipientId, isRead: false } });

            res.status(200).json({
                success: true,
                message: "Đã xóa thông báo.",
                deletedNotificationId: notificationId, // Trả về ID đã xóa để client cập nhật UI
                unreadCount: unreadCount // Trả về unreadCount mới
            });

        } catch (error) {
            handleServerError(res, error, "Xóa thông báo");
        }
    }
}
