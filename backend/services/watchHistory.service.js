// backend/services/watchHistory.service.js
import db from "../models/index.js";
import { awardPoints, checkAndAwardBadges } from "../utils/gamificationUtils.js";
import { parseDurationToMilliseconds } from '../utils/timeUtils.js';
import { checkEpisodeCompletion, checkMovieCompletion, checkSeriesCompletion } from '../utils/completionCheckUtils.js';

const WatchHistory = db.WatchHistory;
const Episode = db.Episode;
const Movie = db.Movie;
const User = db.User;
const Genre = db.Genre;

const WATCH_HISTORY_LIMIT = 500;
const POINTS_FOR_WATCHING_EPISODE = 10;

/**
 * Adds or updates a user's watch history for an episode.
 * @param {number} userId - The ID of the user.
 * @param {number} episodeId - The ID of the episode.
 * @param {number} clientWatchedDurationSeconds - Total seconds watched by the client for this episode.
 * @returns {Promise<object>} The created or updated watchHistory record with associated episode and movie.
 * @throws {Error} If required fields are missing, user/episode not found, or on other DB errors.
 */
export const processAddOrUpdateWatchHistory = async (userId, episodeId, clientWatchedDurationSeconds) => {
    if (userId === undefined || episodeId === undefined || clientWatchedDurationSeconds === undefined) {
        const error = new Error('Thiếu trường bắt buộc (userId, episodeId, clientWatchedDurationSeconds).');
        error.statusCode = 400;
        throw error;
    }

    const watchedDurationSec = Math.floor(Number(clientWatchedDurationSeconds));
    if (isNaN(watchedDurationSec) || watchedDurationSec < 0) {
        const error = new Error('Thời lượng đã xem không hợp lệ.');
        error.statusCode = 400;
        throw error;
    }

    const t = await db.sequelize.transaction();
    try {
        const user = await User.findByPk(userId, { transaction: t });
        if (!user) {
            await t.rollback();
            const error = new Error('Người dùng không tồn tại.');
            error.statusCode = 404;
            throw error;
        }

        const episode = await Episode.findByPk(episodeId, {
            include: [{
                model: Movie,
                as: 'movie',
                attributes: ['id', 'title', 'seriesId', 'type'],
                include: [{ model: Genre, as: 'genres', attributes: ['id'], through: { attributes: [] } }]
            }],
            attributes: ['id', 'movieId', 'duration', 'episodeNumber'],
            transaction: t
        });

        if (!episode || !episode.movie) {
            await t.rollback();
            const error = new Error('Tập phim hoặc thông tin phim không hợp lệ.');
            error.statusCode = 404;
            throw error;
        }

        const totalEpisodeDurationMs = parseDurationToMilliseconds(episode.duration);
        if (totalEpisodeDurationMs === null && episode.duration) {
            console.warn(`[WatchHistoryService] Invalid duration format for episode ${episodeId}: ${episode.duration}`);
        }

        const [watchHistory, created] = await WatchHistory.findOrCreate({
            where: { userId, episodeId },
            defaults: {
                userId,
                episodeId,
                watchedDuration: watchedDurationSec, // Lưu tổng số giây đã xem
                watchedAt: new Date(),
            },
            transaction: t
        });

        let durationIncrementSeconds = watchedDurationSec;

        if (!created) {
            durationIncrementSeconds = watchedDurationSec - (watchHistory.watchedDuration || 0);
            if (durationIncrementSeconds < 0) durationIncrementSeconds = 0;

            watchHistory.watchedDuration = watchedDurationSec;
            watchHistory.watchedAt = new Date();
            await watchHistory.save({ transaction: t });
        } else {
            // Gamification chỉ khi tạo mới (xem lần đầu)
            const pointResult = await awardPoints(userId, POINTS_FOR_WATCHING_EPISODE, t);
            const userForBadgeCheck = pointResult?.user || user;
            await checkAndAwardBadges(userForBadgeCheck, { eventType: 'episode_watched', episodeId: episode.id, movieId: episode.movieId }, t);

            const historyCount = await WatchHistory.count({ where: { userId }, transaction: t });
            if (historyCount > WATCH_HISTORY_LIMIT) {
                const excessHistories = await WatchHistory.findAll({
                    where: { userId },
                    order: [['watchedAt', 'ASC']],
                    limit: historyCount - WATCH_HISTORY_LIMIT,
                    attributes: ['id'],
                    transaction: t
                });
                if (excessHistories.length > 0) {
                    await WatchHistory.destroy({
                        where: { id: excessHistories.map((h) => h.id) },
                        transaction: t
                    });
                }
            }
        }

        await t.commit();

        const finalWatchHistory = await WatchHistory.findByPk(watchHistory.id, {
            include: [{
                model: Episode,
                as: 'Episode',
                attributes: ['id', 'episodeNumber', 'duration'],
                include: [{
                    model: Movie,
                    as: 'movie',
                    attributes: ['id', 'title', 'slug', 'posterURL', 'bannerURL', 'type']
                }]
            }]
        });
        return finalWatchHistory;

    } catch (error) {
        if (t.finished !== 'commit' && t.finished !== 'rollback') {
            await t.rollback();
        }
        console.error("Error in processAddOrUpdateWatchHistory service:", error);
        throw error;
    }
};

/**
 * Fetches all watch history for a user.
 * @param {number} userId - The ID of the user.
 * @returns {Promise<Array<object>>} An array of watch history records.
 */
export const fetchAllUserWatchHistories = async (userId) => {
    if (userId === undefined) {
        const error = new Error('Thiếu userId.');
        error.statusCode = 400;
        throw error;
    }
    const histories = await WatchHistory.findAll({
        where: { userId },
        order: [['watchedAt', 'DESC']],
        include: [
            {
                model: Episode,
                as: 'Episode',
                attributes: ['id', 'episodeNumber', 'duration', 'movieId'],
                include: {
                    model: Movie,
                    as: 'movie',
                    attributes: ['id', 'title', 'slug', 'posterURL', 'bannerURL', 'type', 'seriesId']
                }
            }
        ]
    });
    return histories;
};

/**
 * Deletes a specific watch history entry for a user.
 * @param {number} userId - The ID of the user.
 * @param {number} episodeId - The ID of the episode for the history to be deleted.
 * @returns {Promise<void>}
 * @throws {Error} If history not found.
 */
export const removeWatchHistory = async (userId, episodeId) => {
    if (userId === undefined || episodeId === undefined) {
        const error = new Error('Thiếu userId hoặc episodeId.');
        error.statusCode = 400;
        throw error;
    }
    const watchHistory = await WatchHistory.findOne({
        where: { userId, episodeId },
    });

    if (!watchHistory) {
        const error = new Error('Lịch sử xem không tồn tại.');
        error.statusCode = 404;
        throw error;
    }
    await watchHistory.destroy();
};

/**
 * Increments the watched duration for an episode based on ping.
 * @param {number} userId
 * @param {number} episodeId
 * @param {number} incrementSeconds - Seconds to add to watchedDuration.
 * @returns {Promise<void>}
 */
export const processIncrementWatchDuration = async (userId, episodeId, incrementSeconds) => {
    if (incrementSeconds <= 0) return;

    const t = await db.sequelize.transaction();
    try {
        const user = await User.findByPk(userId, { transaction: t });
        if (!user) { 
            await t.rollback();
            const error = new Error('Người dùng không tồn tại.');
            error.statusCode = 404;
            throw error;
        }
        const episode = await Episode.findByPk(episodeId, {
            include: [{
                model: Movie,
                as: 'movie',
                attributes: ['id', 'title', 'seriesId', 'type'],
                include: [{ model: Genre, as: 'genres', attributes: ['id'], through: { attributes: [] } }]
            }],
            attributes: ['id', 'movieId', 'duration', 'episodeNumber'],
            transaction: t
        });

        if (!episode || !episode.movie) {
            await t.rollback();
            const error = new Error('Tập phim hoặc thông tin phim không hợp lệ.');
            error.statusCode = 404;
            throw error;
        }

        const [watchHistory, created] = await WatchHistory.findOrCreate({
            where: { userId, episodeId },
            defaults: {
                userId,
                episodeId,
                watchedDuration: incrementSeconds,
                watchedAt: new Date(),
            },
            transaction: t
        });

        if (!created) {
            watchHistory.watchedDuration = (watchHistory.watchedDuration || 0) + incrementSeconds;
            watchHistory.watchedAt = new Date();
            await watchHistory.save({ transaction: t });
        } else {
            const pointResult = await awardPoints(userId, POINTS_FOR_WATCHING_EPISODE, t);
            const userForBadgeCheck = pointResult?.user || user;
            await checkAndAwardBadges(userForBadgeCheck, { eventType: 'episode_watched', episodeId: episode.id, movieId: episode.movieId }, t);
            const historyCount = await WatchHistory.count({ where: { userId }, transaction: t });
            if (historyCount > WATCH_HISTORY_LIMIT) {
                const excessHistories = await WatchHistory.findAll({
                    where: { userId },
                    order: [['watchedAt', 'ASC']],
                    limit: historyCount - WATCH_HISTORY_LIMIT,
                    attributes: ['id'],
                    transaction: t
                });
                if (excessHistories.length > 0) {
                    await WatchHistory.destroy({
                        where: { id: excessHistories.map((h) => h.id) },
                        transaction: t
                    });
                }
            }
        }

        await t.commit();

    } catch (error) {
        if (t.finished !== 'commit' && t.finished !== 'rollback') {
            await t.rollback();
        }
        console.error("Error in processIncrementWatchDuration service:", error);
        throw error;
    }
};