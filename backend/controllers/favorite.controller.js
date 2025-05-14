import Episode from "../models/Episode.js";
import Favorite from "../models/Favorite.js";

// Thêm yêu thích cho một episode
export const addFavorite = async (req, res) => {
    const { userId, episodeId, movieId } = req.body;

    if (!userId || !episodeId || !movieId) {
        return res.status(400).json({ message: 'Missing required fields' });
    }

    try {
        const favorite = await Favorite.create({ userId, episodeId, movieId });
        return res.status(201).json({ message: 'Favorite added successfully', favorite });
    } catch (error) {
        console.error('Error adding favorite:', error);
        return res.status(500).json({ message: 'Error adding favorite', error: error.message });
    }
};
// Xóa yêu thích cho một episode
export const deleteFavorite = async (req, res) => {
    const { userId, episodeId } = req.body;
    try {
        
        await Favorite.destroy({ where: { userId, episodeId } });;
        return res.status(200).json({ message: 'Favorite deleted successfully' });
    } catch (error) {
        return res.status(500).json({ message: 'Error deleting favorite', error });
    }
};
// Lấy tổng số lượt yêu thích của một episode
export const getTotalFavorites = async (req, res) => {
    const { episodeId } = req.params;

    try {
        const totalFavorites = await Episode.getTotalFavorites(episodeId);
        return res.status(200).json({ episodeId, totalFavorites });
    } catch (error) {
        return res.status(500).json({ message: 'Error fetching total favorites', error });
    }
};