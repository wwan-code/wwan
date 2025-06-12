
import fs from "fs";
import path from "path";
import multer from 'multer';
import { Op } from "sequelize";
import * as movieService from '../services/movie.service.js';
import { handleServerError } from "../utils/errorUtils.js";
import db from '../models/index.js';

const Movie = db.Movie;
const Genre = db.Genre;
const Section = db.Section;
const Series = db.Series;

const ensureDirectoryExistence = (dirPath) => {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
};
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const destPath = path.join('uploads', 'movies', req.body.slug);
        ensureDirectoryExistence(destPath);
        cb(null, destPath);
    },
    filename: (req, file, cb) => {
        const slug = req.body.slug || `movie-${Date.now()}`;
        cb(null, `${slug}-${Date.now()}-${file.fieldname}${path.extname(file.originalname)}`);
    }
});

export const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } }).fields([
    { name: 'poster', maxCount: 1 },
    { name: 'banner', maxCount: 1 }
]);

export const createMovie = async (req, res) => {
    try {
        const movieData = req.body;
        const files = req.files;

        const newMovie = await movieService.createNewMovie(movieData, files);
        res.status(201).json({ movie: newMovie, message: "Phim đã được tạo thành công" });
    } catch (error) {
        console.error("Create Movie Error in Controller:", error);
        const statusCode = error.statusCode || 500;
        const message = error.message || 'Lỗi khi tạo phim.';
        if (message === 'Phim với slug này đã tồn tại.') {
            return res.status(statusCode).json({ success: false, message });
        }
        res.status(statusCode).json({ success: false, message });
    }
};

export const getAllMovies = async (req, res) => {
    try {
        const { count, rows: movies } = await movieService.fetchAllMovies(req.query);
        const totalPages = Math.ceil(count / (parseInt(req.query.limit) || 20));

        res.status(200).json({
            success: true,
            movies,
            pagination: {
                totalItems: count,
                totalPages,
                currentPage: parseInt(req.query.page) || 1,
                itemsPerPage: parseInt(req.query.limit) || 20
            }
        });
    } catch (error) {
        handleServerError(res, error, 'Lấy danh sách phim');
    }
};

export const getMovieById = async (req, res) => {
    try {
        const movieId = req.params.id;
        const { movie, genreIds } = await movieService.fetchMovieById(movieId);
        res.status(200).json({ movie, genreIds });
    } catch (error) {
        console.error(`Get Movie By ID Error in Controller (ID: ${req.params.id}):`, error);
        const statusCode = error.statusCode || 500;
        const message = error.message || 'Lỗi khi lấy thông tin phim.';
        res.status(statusCode).json({ success: false, message });
    }
};

export const updateMovie = async (req, res) => {
    try {
        const movieId = req.params.id;
        const updateData = req.body;
        const files = req.files;

        const updatedMovie = await movieService.updateExistingMovie(movieId, updateData, files);
        res.status(200).json({ movie: updatedMovie, message: "Phim đã được cập nhật thành công" });
    } catch (error) {
        console.error(`Update Movie Error in Controller (ID: ${req.params.id}):`, error);
        const statusCode = error.statusCode || 500;
        let message = error.message || 'Lỗi khi cập nhật phim.';

        if (error.name === 'SequelizeValidationError') {
            message = 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại các trường.';
        } else if (error.name === 'SequelizeForeignKeyConstraintError') {
            message = 'Ràng buộc khóa ngoại không hợp lệ (ví dụ: countryId, categoryId không tồn tại).';
        }

        res.status(statusCode).json({ success: false, message });
    }
};

export const deleteMovie = async (req, res) => {
    try {
        const movie = await Movie.findByPk(req.params.id);
        if (!movie) {
            return res.status(404).json({ error: 'Movie not found' });
        }

        if (movie.posterURL) {
            fs.unlinkSync(movie.posterURL);
        }
        if (movie.bannerURL) {
            fs.unlinkSync(movie.bannerURL);
        }

        await movie.destroy();
        res.status(200).json({ message: 'Movie deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error });
    }
};

export const getMoviesBySeriesId = async (req, res) => {
    try {
        const seriesId = req.params.id;
        if (!seriesId) {
            return res.status(404).json({ message: 'seriesId not found' })
        }
        const movies = await Movie.findAll({
            where: { seriesId: seriesId },
            include: [
                { model: Section, as: 'sections' }
            ]
        });
        res.status(200).json(movies);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const addMovieToSeries = async (req, res) => {
    const { movieId, seriesId } = req.body;

    try {
        // Tìm movie và series
        const movie = await Movie.findByPk(movieId);
        const series = await Series.findByPk(seriesId);

        if (!movie || !series) {
            return res.status(404).json({ message: 'Movie or Series not found' });
        }

        // Gán seriesId cho movie
        movie.seriesId = seriesId;
        await movie.save();

        res.status(200).json({ message: 'Movie added to series successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getMoviesSortedByDate = async (req, res) => {
    try {
        const movies = await Movie.findAll({
            order: [['createdAt', 'ASC']]
        });
        res.status(200).json(movies);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getTrendingMovies = async (req, res) => {
    try {
        const trendingMovies = await Movie.findAll({
            order: [['views', 'DESC']],
            limit: 10
        });
        res.status(200).json(trendingMovies);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};