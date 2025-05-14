import Movie from "../models/Movie.js";
import Section from "../models/Section.js";
import Series from "../models/Series.js";

// Tạo một Series mới
export const createSeries = async (req, res) => {
    try {
        const series = await Series.create(req.body);
        res.status(201).json(series);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Lấy tất cả Series
export const getAllSeries = async (req, res) => {
    try {
        const series = await Series.findAll({
            include: [
                { model: Movie, as: 'movies', include: [{ model: Section, as: 'sections' }] },
            ],
            order: [['createdAt', 'DESC']]
        });
        res.status(200).json(series);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Lấy một Series theo ID
export const getSeriesById = async (req, res) => {
    try {
        const series = await Series.findByPk(req.params.id, {
            include: [
                { model: Movie, as: 'movies' },
                { model: Section, as: 'sections' },
            ],
        });
        if (series) {
            res.status(200).json(series);
        } else {
            res.status(404).json({ message: 'Series not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Cập nhật Series
export const updateSeries = async (req, res) => {
    try {
        const series = await Series.findByPk(req.params.id);
        if (series) {
            await series.update(req.body);
            res.status(200).json(series);
        } else {
            res.status(404).json({ message: 'Series not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Xóa Series
export const deleteSeries = async (req, res) => {
    try {
        const series = await Series.findByPk(req.params.id);
        if (series) {
            await series.destroy();
            res.status(200).json({ message: 'Series deleted' });
        } else {
            res.status(404).json({ message: 'Series not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};