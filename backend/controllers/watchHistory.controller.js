import db from '../models/index.js';
import { awardPoints, checkAndAwardBadges } from '../utils/gamificationUtils.js';
const WatchHistory = db.WatchHistory;
const Episode = db.Episode;
const Movie = db.Movie;
const User = db.User;

const WATCH_HISTORY_LIMIT = 500;
const POINTS_FOR_WATCHING_EPISODE = 10;

export const addWatchHistory = async (req, res) => {
    const { userId, episodeId, watchedDuration } = req.body;

    try {
        if (!userId || !episodeId || watchedDuration === undefined) {
            return res.status(400).json({ message: 'Missing required fields (userId, episodeId, watchedDuration).' });
        }
        // Tìm user để cập nhật điểm và level
        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        // Tìm hoặc tạo lịch sử xem
        const [watchHistory, created] = await WatchHistory.findOrCreate({
            where: { userId, episodeId },
            defaults: {
                userId,
                episodeId,
                watchedDuration: Math.floor(watchedDuration), // Khởi tạo là 0 nếu tạo mới
                watchedAt: new Date(),
            }
        });

        if (!created) {
            watchHistory.watchedDuration = Math.floor(watchedDuration); // Cập nhật duration
            watchHistory.watchedAt = new Date(); // Cập nhật thời gian xem cuối
            await watchHistory.save();
        } else {
            const pointResult = await awardPoints(userId, POINTS_FOR_WATCHING_EPISODE);
             if (pointResult && pointResult.user) {
                await checkAndAwardBadges(pointResult.user, { eventType: 'episode_watched' });
             } else {
                await checkAndAwardBadges(user, { eventType: 'episode_watched' });
             }
            // Kiểm tra và xóa lịch sử cũ nếu vượt quá giới hạn KHI TẠO MỚI
            const historyCount = await WatchHistory.count({ where: { userId } });
            if (historyCount > WATCH_HISTORY_LIMIT) {
                const excessHistories = await WatchHistory.findAll({
                    where: { userId },
                    order: [['watchedAt', 'ASC']],
                    limit: historyCount - WATCH_HISTORY_LIMIT,
                    attributes: ['id']
                });

                if (excessHistories.length > 0) {
                    await WatchHistory.destroy({
                        where: { id: excessHistories.map((h) => h.id) },
                    });
                }
            }
        }

        return res.status(204).send(watchHistory);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

/**
 * Lấy tất cả lịch sử xem của người dùng
 * @param {Object} req - Đối tượng yêu cầu
 * @param {Object} res - Đối tượng phản hồi
 */
export const getAllWatchHistories = async (req, res) => {
    const { userId } = req.params;

    try {
        const watchHistories = await WatchHistory.findAll({
            where: { userId },
            order: [['watchedAt', 'DESC']],
            include: [
                { model: Episode, include: {
                    model: Movie, as: 'movie'
                }}
            ]
        });

        return res.status(200).json(watchHistories);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

/**
 * Xóa lịch sử xem của người dùng
 * @param {Object} req - Đối tượng yêu cầu
 * @param {Object} res - Đối tượng phản hồi
 */
export const deleteWatchHistory = async (req, res) => {
    const { userId, episodeId } = req.params;

    try {
        const watchHistory = await WatchHistory.findOne({
            where: { userId, episodeId },
        });

        if (!watchHistory) {
            return res.status(404).json({ message: 'Lịch sử xem không tồn tại' });
        }

        await watchHistory.destroy();

        return res.status(204).send();
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};