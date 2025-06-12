// controllers/report.controller.js
import db from '../models/index.js';
import { handleServerError } from '../utils/errorUtils.js';
import { getIo } from '../config/socket.js'; 
import { Op } from 'sequelize';

const ContentReport = db.ContentReport;
const Movie = db.Movie;
const Episode = db.Episode;
const User = db.User;
const Notification = db.Notification;
const Role = db.Role;

// Tạo báo cáo mới
export const createContentReport = async (req, res) => {
    const userId = req.userId;
    const { movieId, episodeId, reportType, description, timestamp } = req.body;

    if (!movieId || !reportType || !description) {
        return res.status(400).json({ success: false, message: "Thiếu thông tin bắt buộc (phim, loại lỗi, mô tả)." });
    }
    const validReportTypes = ['video_error', 'audio_error', 'subtitle_error', 'content_issue', 'other'];
    if (!validReportTypes.includes(reportType)) {
        return res.status(400).json({ success: false, message: "Loại báo cáo không hợp lệ." });
    }

    try {
        const movie = await Movie.findByPk(movieId, { attributes: ['id', 'title', 'slug'] });
        if (!movie) {
            return res.status(404).json({ success: false, message: "Phim không tồn tại." });
        }
        let episode;
        if (episodeId) {
            episode = await Episode.findOne({ where: { id: episodeId, movieId: movieId }, attributes: ['id', 'episodeNumber'] });
            if (!episode) {
                return res.status(404).json({ success: false, message: "Tập phim không tồn tại hoặc không thuộc phim này." });
            }
        }

        const newReport = await ContentReport.create({
            userId,
            movieId,
            episodeId: episodeId || null,
            reportType,
            description,
            timestamp: timestamp,
            status: 'pending'
        });

        const reporter = await User.findByPk(userId, { attributes: ['name'] });
        const movieTitle = movie.title;
        const episodeNumber = episode ? ` tập ${episode.episodeNumber}` : '';

        const admins = await User.findAll({
            include: [{
                model: Role,
                as: 'roles',
                where: { name: { [Op.in]: ['admin', 'editor'] } }, // Thông báo cho cả admin và editor
                attributes: []
            }],
            attributes: ['id']
        });

        if (admins.length > 0) {
            const io = getIo();
            const adminNotificationMessage = `${reporter?.name || 'Một người dùng'} vừa báo lỗi cho phim "${movieTitle}"${episodeNumber}.`;
            const adminNotificationLink = `/admin/reports`; // Link đến trang quản lý báo cáo của admin

            for (const admin of admins) {
                const adminNotification = await Notification.create({
                    recipientId: admin.id,
                    type: 'NEW_CONTENT_REPORT',
                    message: adminNotificationMessage,
                    link: adminNotificationLink,
                    isRead: false,
                    senderId: userId // Người báo cáo là sender
                });
                if (io) {
                    const adminRoom = `user_${admin.id}`;
                    const unreadCount = await Notification.count({ where: { recipientId: admin.id, isRead: false } });
                    io.to(adminRoom).emit('newNotification', {
                        notification: adminNotification.toJSON(),
                        unreadCount: unreadCount
                    });
                }
            }
        }
        // --- KẾT THÚC THÔNG BÁO ADMIN ---

        res.status(201).json({ success: true, message: "Báo cáo của bạn đã được gửi. Cảm ơn bạn!", report: newReport });
    } catch (error) {
        handleServerError(res, error, "Tạo báo cáo lỗi nội dung");
    }
};

// --- Dành cho Admin ---
// Lấy danh sách báo cáo (có phân trang, lọc theo status)
export const getAllContentReports = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const status = req.query.status; // 'pending', 'resolved', 'ignored'
    const sortBy = req.query.sortBy || 'createdAt'; // 'createdAt', 'updatedAt'
    const sortOrder = req.query.sortOrder || 'DESC'; // 'ASC', 'DESC'
    const offset = (page - 1) * limit;

    try {
        const whereClause = {};
        if (status && ['pending', 'resolved', 'ignored', 'acknowledged'].includes(status)) {
            whereClause.status = status;
        }

        const { count, rows: reports } = await ContentReport.findAndCountAll({
            where: whereClause,
            include: [
                { model: User, as: 'reporter', attributes: ['id', 'name', 'email'] },
                { model: Movie, as: 'reportedMovie', attributes: ['id', 'title', 'slug'] },
                { model: Episode, as: 'reportedEpisode', attributes: ['id', 'episodeNumber'] }
            ],
            order: [[sortBy, sortOrder]],
            limit,
            offset,
            distinct: true
        });

        const totalPages = Math.ceil(count / limit);
        res.status(200).json({
            success: true,
            reports,
            pagination: { totalItems: count, totalPages, currentPage: page, itemsPerPage: limit }
        });
    } catch (error) {
        handleServerError(res, error, "Lấy danh sách báo cáo lỗi");
    }
};

// Cập nhật trạng thái báo cáo (Admin)
export const updateContentReportStatus = async (req, res) => {
    const { reportId } = req.params;
    const { status, adminNotes } = req.body;
    const adminUserId = req.userId; // Admin đang thực hiện

    if (!status || !['pending', 'resolved', 'ignored', 'acknowledged'].includes(status)) {
        return res.status(400).json({ success: false, message: "Trạng thái không hợp lệ." });
    }

    try {
        const report = await ContentReport.findByPk(reportId, {
            include: [
                { model: Movie, as: 'reportedMovie', attributes: ['id', 'title', 'slug'] },
                { model: Episode, as: 'reportedEpisode', attributes: ['id', 'episodeNumber'] }
            ]
        });
        if (!report) {
            return res.status(404).json({ success: false, message: "Không tìm thấy báo cáo." });
        }

        const oldStatus = report.status;
        report.status = status;
        if (adminNotes !== undefined) {
            report.adminNotes = adminNotes;
        }
        report.processedBy = adminUserId; // Có thể thêm trường này
        await report.save();

        // --- THÔNG BÁO CHO USER ĐÃ BÁO CÁO ---
        if (report.userId && oldStatus !== status && (status === 'resolved' || status === 'ignored' || status === 'acknowledged')) {
            const movieTitle = report.reportedMovie?.title || 'phim';
            const episodeNumber = report.reportedEpisode ? ` tập ${report.reportedEpisode.episodeNumber}` : '';
            let userMessage = '';
            if (status === 'resolved') {
                userMessage = `Báo cáo của bạn về lỗi phim "${movieTitle}" ${episodeNumber} đã được giải quyết. Cảm ơn sự đóng góp của bạn!`;
            } else if (status === 'ignored') {
                userMessage = `Báo cáo của bạn về lỗi phim "${movieTitle}" ${episodeNumber} đã được xem xét. Hiện tại chúng tôi không tìm thấy vấn đề hoặc sẽ theo dõi thêm.`;
            } else if (status === 'acknowledged') {
                userMessage = `Báo cáo của bạn về lỗi phim "${movieTitle}" ${episodeNumber} đã được ghi nhận và đang được xử lý.`;
            }

            if (userMessage) {
                const userNotification = await Notification.create({
                    recipientId: report.userId,
                    type: 'REPORT_STATUS_UPDATE',
                    message: userMessage,
                    link: report.reportedMovie ? `/album/${report.reportedMovie.slug}` : '#',
                    isRead: false,
                    senderId: adminUserId // Admin xử lý
                });

                const io = getIo();
                if (io) {
                    const userRoom = `user_${report.userId}`;
                    const unreadCount = await Notification.count({ where: { recipientId: report.userId, isRead: false } });
                    io.to(userRoom).emit('newNotification', {
                        notification: userNotification.toJSON(),
                        unreadCount: unreadCount
                    });
                }
            }
        }
        // --- KẾT THÚC THÔNG BÁO USER ---

        res.status(200).json({ success: true, message: "Cập nhật trạng thái báo cáo thành công.", report });
    } catch (error) {
        handleServerError(res, error, `Cập nhật báo cáo ID ${reportId}`);
    }
};

// Xóa báo cáo (Admin)
export const deleteContentReport = async (req, res) => {
    const { reportId } = req.params;
    try {
        const report = await ContentReport.findByPk(reportId);
        if (!report) {
            return res.status(404).json({ success: false, message: "Không tìm thấy báo cáo." });
        }
        await report.destroy();
        res.status(200).json({ success: true, message: "Đã xóa báo cáo." });
    } catch (error) {
        handleServerError(res, error, `Xóa báo cáo ID ${reportId}`);
    }
};