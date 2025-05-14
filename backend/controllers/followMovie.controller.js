import Episode from "../models/Episode.js";
import FollowMovie from "../models/FollowMovie.js";
import Movie from "../models/Movie.js";

export const addFollowMovie = async (req, res) => {
    const { userId, movieId } = req.body;

    try {
        const followMovie = await FollowMovie.create({ userId, movieId });
        res.status(201).json(followMovie);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getFollowMovies = async (req, res) => {
    const { userId } = req.params;

    try {
        const followMovies = await FollowMovie.findAll({
            where: { userId },
            include: [
                { model: Movie, as: 'movie', include: [{ model: Episode }] }
            ]
        });
        res.status(200).json(followMovies);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const removeFollowMovie = async (req, res) => {
    const { userId, movieId } = req.body;

    try {
        await FollowMovie.destroy({ where: { userId, movieId } });
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};