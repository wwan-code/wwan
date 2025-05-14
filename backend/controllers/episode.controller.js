import db from '../models/index.js';

import { getIo } from '../config/socket.js';
import { handleServerError } from "../utils/errorUtils.js";

const Notification = db.Notification;
const Episode = db.Episode;
const Movie = db.Movie;
const FollowMovie = db.FollowMovie;
const User = db.User;

export const createEpisode = async (req, res) => {
    try {
        const { episodeNumber, views, linkEpisode, movieId } = req.body;

        const movie = await Movie.findByPk(movieId, {
            attributes: ['id', 'title', 'slug'] // Lấy thêm title, slug để tạo link và message
        });
        if (!movie) {
            return res.status(404).json({ success: false, message: 'Phim không tồn tại' });
        }

        // Kiểm tra xem tập phim đã tồn tại cho phim này chưa
        const existingEpisode = await Episode.findOne({ where: { movieId, episodeNumber } });
        if (existingEpisode) {
            return res.status(409).json({ success: false, message: `Tập ${episodeNumber} của phim này đã tồn tại.` });
        }

        const rps = await Episode.create({ episodeNumber, views, linkEpisode, movieId });
        const createdEpisode = await Episode.findOne({
            include: [{ model: Movie, as: 'movie', attributes: ['id', 'title', 'slug'] }],
            where: { id: rps.id }
        });
        // --- TẠO VÀ GỬI THÔNG BÁO CHO NGƯỜI THEO DÕI ---
        if (createdEpisode && movie) {
            const followers = await FollowMovie.findAll({
                where: { movieId: movie.id },
                attributes: ['userId']
            });

            if (followers.length > 0) {
                const notificationMessage = `Phim "${movie.title}" vừa có tập mới: Tập ${createdEpisode.episodeNumber}.`;
                const notificationLink = `/play/${movie.slug}?t=${createdEpisode.episodeNumber}`;
                const notificationsToCreate = followers.map(follower => ({
                    recipientId: follower.userId,
                    senderId: null, // Thông báo từ hệ thống/sự kiện
                    type: 'NEW_EPISODE',
                    message: notificationMessage,
                    link: notificationLink,
                    isRead: false
                }));

                // Tạo nhiều thông báo cùng lúc
                const createdNotifications = await Notification.bulkCreate(notificationsToCreate);

                // Emit qua Socket.IO
                try {
                    const io = getIo();
                    createdNotifications.forEach(async (notification) => {
                        const recipientRoom = `user_${notification.recipientId}`;
                        // Lấy tổng số thông báo chưa đọc của người nhận
                        const unreadCount = await Notification.count({
                            where: { recipientId: notification.recipientId, isRead: false }
                        });
                        io.to(recipientRoom).emit('newNotification', {
                            notification,
                            unreadCount
                        });
                        console.log(`Emitted 'newNotification' (new episode) to room: ${recipientRoom}`);
                    });
                } catch (socketError) {
                    console.error("Socket emit error for new episode notification:", socketError);
                }
            }
        }
        res.status(201).json({ success: true, episode: createdEpisode });
    } catch (error) {
        handleServerError(res, error, "Tạo tập phim");
    }
};

export const getEpisodesByMovieId = async (req, res) => {
    try {
        const { movieId } = req.params;
        const episodes = await Episode.findAll({ where: { movieId } });
        res.status(200).json({ episodes });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error fetching episodes' });
    }
};
export const getAllEpisodes = async (req, res) => {
    try {
        const episodes = await Episode.findAll({
            include: [
                { model: Movie, as: 'movie' }
            ],
            order: [['createdAt', 'DESC']]
        });
        res.status(200).send({ episodes });
    } catch (error) {
        res.status(500).send({ message: "Error getting episodes" });
    }
};
export const updateEpisode = async (req, res) => {
    try {
        const { linkEpisode } = req.body;
        const episode = await Episode.findOne({
            where: { id: req.params.id },
            include: [{ model: Movie, as: 'movie' }]
        });
        if (!episode) {
            return res.status(404).json({ error: 'Episode not found' });
        }
        await episode.update({ linkEpisode });
        res.status(200).json(episode);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error updating episode' });
    }
};

export const deleteEpisode = async (req, res) => {
    try {
        const episode = await Episode.findByPk(req.params.id);
        if (!episode) {
            return res.status(404).json({ error: 'Episode not found' });
        }

        await episode.destroy();
        res.status(200).json({ message: 'Episode deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error deleting episode' });
    }
};