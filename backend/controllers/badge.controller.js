// backend/controllers/badge.controller.js
import db from '../models/index.js';
import { handleServerError } from '../utils/errorUtils.js';
import { Op } from 'sequelize';
import fs from 'fs/promises';
import path from 'path';
import { generateSlug } from '../utils/slugUtils.js'; // Nếu bạn muốn slug cho badge

const Badge = db.Badge;

// Helper xóa file local
const deleteLocalFileUtil = async (relativePath) => {
    if (!relativePath) return;
    const fullPath = path.resolve('uploads', relativePath);
    try {
        await fs.access(fullPath);
        await fs.unlink(fullPath);
        console.log(`[BadgeCtrl] Đã xóa file: ${fullPath}`);
    } catch (error) {
        if (error.code !== 'ENOENT') {
            console.error(`[BadgeCtrl] Lỗi xóa file ${fullPath}:`, error);
        }
    }
};

// ADMIN: Lấy tất cả huy hiệu (có phân trang)
export const adminGetBadges = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const searchTerm = req.query.q || '';

    const whereClause = {};
    if (searchTerm) {
        whereClause.name = { [Op.iLike]: `%${searchTerm}%` }; // Hoặc Op.like cho MySQL
    }

    try {
        const { count, rows: badges } = await Badge.findAndCountAll({
            where: whereClause,
            order: [['createdAt', 'DESC']],
            limit,
            offset
        });
        const totalPages = Math.ceil(count / limit);
        res.status(200).json({
            success: true,
            badges,
            pagination: { totalItems: count, totalPages, currentPage: page, itemsPerPage: limit }
        });
    } catch (error) {
        handleServerError(res, error, "Admin lấy danh sách huy hiệu");
    }
};

// ADMIN: Lấy chi tiết một huy hiệu
export const adminGetBadgeById = async (req, res) => {
    try {
        const badge = await Badge.findByPk(req.params.id);
        if (!badge) {
            return res.status(404).json({ success: false, message: "Không tìm thấy huy hiệu." });
        }
        res.status(200).json({ success: true, badge });
    } catch (error) {
        handleServerError(res, error, "Admin lấy chi tiết huy hiệu");
    }
};

// ADMIN: Tạo huy hiệu mới
export const adminCreateBadge = async (req, res) => {
    const { name, description, criteria, type, iconUrl } = req.body; // iconUrl có thể là class FontAwesome hoặc URL
    const iconFile = req.file; // Từ multer middleware 'badgeIconFile'

    if (!name || !description || !type || !criteria) {
        if (iconFile) await deleteLocalFileUtil(iconFile.path.replace(/^uploads[\\/]/, ''));
        return res.status(400).json({ success: false, message: "Tên, mô tả, loại và điều kiện là bắt buộc." });
    }

    let finalIconUrl = iconUrl || null; // Ưu tiên iconUrl nếu được cung cấp (ví dụ: class FontAwesome)

    if (iconFile) {
        const normalizedPath = iconFile.path.replace(/\\/g, "/");
        const uploadsDir = path.resolve('uploads').replace(/\\/g, "/");
        if (normalizedPath.startsWith(uploadsDir)) {
            finalIconUrl = normalizedPath.substring(uploadsDir.length + 1);
        } else {
            finalIconUrl = normalizedPath.replace(/^uploads\//, '');
        }
    }

    try {
        const newBadge = await Badge.create({
            name: name.trim(),
            description: description.trim(),
            iconUrl: finalIconUrl,
            criteria: typeof criteria === 'string' ? JSON.parse(criteria) : criteria, // Đảm bảo criteria là JSON object
            type: type.trim()
        });
        res.status(201).json({ success: true, badge: newBadge, message: "Huy hiệu đã được tạo." });
    } catch (error) {
        if (iconFile && finalIconUrl) await deleteLocalFileUtil(finalIconUrl); // Xóa ảnh nếu lỗi tạo DB
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(409).json({ success: false, message: 'Tên huy hiệu đã tồn tại.' });
        }
        handleServerError(res, error, "Admin tạo huy hiệu mới");
    }
};

// ADMIN: Cập nhật huy hiệu
export const adminUpdateBadge = async (req, res) => {
    const { id } = req.params;
    const { name, description, criteria, type, iconUrl: providedIconUrl, removeIcon } = req.body;
    const iconFile = req.file; // File mới từ multer

    let finalIconUrl;
    let oldIconUrl = null;

    try {
        const badge = await Badge.findByPk(id);
        if (!badge) {
            if (iconFile) await deleteLocalFileUtil(iconFile.path.replace(/^uploads[\\/]/, ''));
            return res.status(404).json({ success: false, message: "Không tìm thấy huy hiệu." });
        }
        oldIconUrl = badge.iconUrl; // Lưu lại icon cũ để có thể xóa

        if (iconFile) { // Nếu có file icon mới được upload
            const normalizedPath = iconFile.path.replace(/\\/g, "/");
            const uploadsDir = path.resolve('uploads').replace(/\\/g, "/");
            if (normalizedPath.startsWith(uploadsDir)) {
                finalIconUrl = normalizedPath.substring(uploadsDir.length + 1);
            } else {
                finalIconUrl = normalizedPath.replace(/^uploads\//, '');
            }
        } else if (removeIcon === 'true') { // Nếu user muốn xóa icon hiện tại
            finalIconUrl = null;
        } else if (providedIconUrl !== undefined) { // Nếu user cung cấp URL/class icon mới (không phải file)
            finalIconUrl = providedIconUrl.trim() || null;
        } else { // Không có file mới, không xóa, không có URL mới -> giữ nguyên icon cũ
            finalIconUrl = oldIconUrl;
        }


        await badge.update({
            name: name ? name.trim() : badge.name,
            description: description ? description.trim() : badge.description,
            iconUrl: finalIconUrl,
            criteria: criteria ? (typeof criteria === 'string' ? JSON.parse(criteria) : criteria) : badge.criteria,
            type: type ? type.trim() : badge.type,
        });

        // Xóa icon cũ nếu icon mới khác và icon cũ tồn tại (và không phải class FontAwesome)
        if (oldIconUrl && finalIconUrl !== oldIconUrl && !oldIconUrl.startsWith('fa')) {
            await deleteLocalFileUtil(oldIconUrl);
        }
        if (removeIcon === 'true' && oldIconUrl && !oldIconUrl.startsWith('fa')) {
            await deleteLocalFileUtil(oldIconUrl);
        }


        res.status(200).json({ success: true, badge, message: "Huy hiệu đã được cập nhật." });
    } catch (error) {
        // Nếu có lỗi và đã upload file mới, xóa file đó đi
        if (iconFile && finalIconUrl && finalIconUrl !== oldIconUrl) await deleteLocalFileUtil(finalIconUrl);
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(409).json({ success: false, message: 'Tên huy hiệu đã tồn tại.' });
        }
        handleServerError(res, error, `Admin cập nhật huy hiệu ID ${id}`);
    }
};

// ADMIN: Xóa huy hiệu
export const adminDeleteBadge = async (req, res) => {
    const { id } = req.params;
    try {
        const badge = await Badge.findByPk(id);
        if (!badge) {
            return res.status(404).json({ success: false, message: "Không tìm thấy huy hiệu." });
        }
        const iconToDelete = badge.iconUrl;

        // Cân nhắc: UserBadge sẽ bị xóa theo (do onDelete: 'CASCADE')
        // Hoặc bạn có thể muốn đặt badgeIdReward trong Challenge thành null
        await badge.destroy();

        // Xóa file icon nếu có và không phải là class FontAwesome
        if (iconToDelete && !iconToDelete.startsWith('fa')) {
            await deleteLocalFileUtil(iconToDelete);
        }

        res.status(200).json({ success: true, message: "Huy hiệu đã được xóa." });
    } catch (error) {
        handleServerError(res, error, `Admin xóa huy hiệu ID ${id}`);
    }
};