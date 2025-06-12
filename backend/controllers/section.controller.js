import Movie from "../models/Movie.js";
import Section from "../models/Section.js";
import Series from "../models/Series.js";

// Tạo một Section mới
export const createSection = async (req, res) => {
    try {
        const section = await Section.create(req.body);
        res.status(201).json(section);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Lấy tất cả Sections
export const getAllSections = async (req, res) => {
    try {
        const sections = await Section.findAll({
            include: [
                { model: Movie, as: 'movie' },
                { model: Series, as: 'series' },
            ],
        });
        res.status(200).json(sections);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Lấy Section theo ID
export const getSectionById = async (req, res) => {
    try {
        const section = await Section.findByPk(req.params.id, {
            include: [
                { model: Movie, as: 'movie' },
                { model: Series, as: 'series' },
            ],
        });
        if (section) {
            res.status(200).json(section);
        } else {
            res.status(404).json({ message: 'Section not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Cập nhật Section
export const updateSection = async (req, res) => {
    try {
        const section = await Section.findByPk(req.params.id);
        if (section) {
            await section.update(req.body);
            res.status(200).json({ message: 'Section updated successfully' });
        } else {
            res.status(404).json({ message: 'Section not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Xóa Section
export const deleteSection = async (req, res) => {
    try {
        const section = await Section.findByPk(req.params.id);
        if (section) {
            await section.destroy();
            res.status(200).json({ message: 'Section deleted successfully' });
        } else {
            res.status(404).json({ message: 'Section not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get sections by series ID
export const getSectionsBySeriesId = async (req, res) => {
    try {
        const { seriesId } = req.params;
        const sections = await Section.findAll({
            where: { seriesId },
            include: [{ 
                model: Movie, 
                as: 'movie'
            }],
        });
        res.status(200).json(sections);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get Sections by Movie ID
export const getSectionsByMovie = async (req, res) => {
    try {
        const { movieId } = req.params;
        const sections = await Section.findAll({
            where: { movieId },
            include: [
                { model: Series, as: 'series' },
            ],
        });
        res.status(200).json(sections);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
