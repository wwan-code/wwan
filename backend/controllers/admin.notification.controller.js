// backend/controllers/admin.notification.controller.js
import db from '../models/index.js';
import { handleServerError } from '../utils/errorUtils.js';
import { createAndEmitNotification } from '../utils/notificationUtils.js';
import { Op } from 'sequelize';

const User = db.User;
const Role = db.Role;

export const sendSystemNotificationToAll = async (req, res) => {
    const adminUserId = req.userId;
    const { message, link, iconUrl, targetRoles } = req.body;

    if (!message) {
        return res.status(400).json({ success: false, message: "Nội dung thông báo là bắt buộc." });
    }

    const t = await db.sequelize.transaction();
    try {
        const whereClause = {};
        if (Array.isArray(targetRoles) && targetRoles.length > 0) {
            const usersToNotify = await User.findAll({
                attributes: ['id'],
                include: [{
                    model: Role,
                    as: 'roles',
                    attributes: [],
                    where: { name: { [Op.in]: targetRoles } },
                    required: true
                }],
                transaction: t
            });
            if (usersToNotify.length === 0) {
                 await t.commit();
                return res.status(200).json({ success: true, message: "Không có người dùng nào thuộc vai trò mục tiêu để gửi thông báo." });
            }
            whereClause.id = { [Op.in]: usersToNotify.map(u => u.id) };
        }
        // Nếu không có targetRoles, whereClause rỗng, sẽ gửi cho tất cả (cẩn thận!)
        // Hoặc bạn có thể thêm một điều kiện mặc định, ví dụ không gửi cho 'banned' users.

        const allUsers = await User.findAll({ where: whereClause, attributes: ['id'], transaction: t });

        if (allUsers.length === 0 && !(Array.isArray(targetRoles) && targetRoles.length > 0) ) {
             await t.commit();
             return res.status(200).json({ success: true, message: "Không có người dùng nào để gửi thông báo." });
        }


        for (const user of allUsers) {
            await createAndEmitNotification({
                recipientId: user.id,
                senderId: adminUserId, // Hoặc null nếu là hệ thống thuần túy
                type: 'SYSTEM_ANNOUNCEMENT',
                message,
                link: link || '#',
                iconUrl: iconUrl || '/assets/icons/system_notification.png', // Icon mặc định
                transaction: t
            });
        }

        await t.commit();
        res.status(200).json({ success: true, message: `Đã gửi thông báo hệ thống đến ${allUsers.length} người dùng.` });
    } catch (error) {
        await t.rollback();
        handleServerError(res, error, "Gửi thông báo hệ thống");
    }
};