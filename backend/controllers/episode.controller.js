import db from '../models/index.js';
import { handleServerError } from "../utils/errorUtils.js";
import { createAndEmitNotification } from '../utils/notificationUtils.js';

const Episode = db.Episode;
const Movie = db.Movie;
const FollowMovie = db.FollowMovie;

export const createEpisode = async (req, res) => {
    const t = await db.sequelize.transaction();
    try {
        const { episodeNumber, views, linkEpisode, duration, movieId } = req.body;

        const movie = await Movie.findByPk(movieId, {
            attributes: ['id', 'title', 'slug', 'bannerURL', 'posterURL'],
            transaction: t
        });
        if (!movie) {
            return res.status(404).json({ success: false, message: 'Phim không tồn tại' });
        }

        const existingEpisode = await Episode.findOne({ where: { movieId, episodeNumber } });
        if (existingEpisode) {
            return res.status(409).json({ success: false, message: `Tập ${episodeNumber} của phim này đã tồn tại.` });
        }

        const createdEpisode = await Episode.create({ episodeNumber, views, linkEpisode, duration, movieId }, { transaction: t });

        if (createdEpisode && movie) {
            const followers = await FollowMovie.findAll({
                where: { movieId: movie.id },
                attributes: ['userId'],
                transaction: t
            });

            if (followers.length > 0) {
                const notificationMessage = `Phim "${movie.title}" vừa có tập mới: Tập ${createdEpisode.episodeNumber}.`;
                const notificationLink = `/play/${movie.slug}?t=${createdEpisode.episodeNumber}`;
                
                for (const follower of followers) {
                    await createAndEmitNotification({
                        recipientId: follower.userId,
                        type: 'NEW_EPISODE',
                        message: notificationMessage,
                        link: notificationLink,
                        iconUrl: movie.posterURL,
                        transaction: t
                    });
                }
            }
        }

        await t.commit();
        const finalEpisode = await Episode.findByPk(createdEpisode.id, {
            include: [{ model: Movie, as: 'movie', attributes: ['id', 'title', 'slug']}]
        });
        res.status(201).json({ success: true, episode: finalEpisode });
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
        const { linkEpisode, duration } = req.body;
        const episode = await Episode.findOne({
            where: { id: req.params.id },
            include: [{ model: Movie, as: 'movie' }]
        });
        if (!episode) {
            return res.status(404).json({ error: 'Episode not found' });
        }
        await episode.update({ linkEpisode, duration });
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