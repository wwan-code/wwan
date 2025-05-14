import db from '../models/index.js';
const Rating = db.Rating;
const User = db.User;
const Movie = db.Movie;
const Genre = db.Genre;
const Country = db.Country;
const Category = db.Category;
const Section = db.Section;
const Series = db.Series;
const Episode = db.Episode;
const Favorite = db.Favorite;
import { handleServerError } from "../utils/errorUtils.js";
import fs from "fs";
import multer from 'multer';
import { Op } from "sequelize";

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, `${req.body.slug}-${Date.now()}-${file.fieldname}`);
  }
});

// Khởi tạo multer
export const upload = multer({ storage }).fields([
    { name: 'image', maxCount: 1 },
    { name: 'poster', maxCount: 1 }
]);

const setMovieGenres = async (movie, genreIds) => {
    if (genreIds && Array.isArray(genreIds) && genreIds.length > 0) {
        const genres = await Genre.findAll({
            where: {
                id: {
                    [Op.in]: genreIds,
                },
            },
        });
        await movie.setGenres(genres);
    }
};

// Create a new movie
export const createMovie = async (req, res) => {
    try {
        const {
            title,
            subTitle,
            slug,
            duration,
            quality,
            subtitles,
            status,
            totalEpisodes,
            views,
            description,
            genreIds,
            countryId,
            categoryId,
            hasSection,
            year,
            belongToCategory,
            premiere,
            classification,
            trailer
        } = req.body;

        // Check if the movie already exists
        const movieExists = await Movie.findOne({ where: { slug } });
        if (movieExists) {
            return res.status(400).json({ error: 'Movie already exists' });
        }

        const imagePath = req.files['image'] ? req.files['image'][0].path : null;
        const posterPath = req.files['poster'] ? req.files['poster'][0].path : null;

        // Create a new movie
        const newMovie = await Movie.create({
            title,
            subTitle,
            slug,
            duration,
            quality,
            subtitles,
            status,
            totalEpisodes,
            views,
            description,
            image: imagePath,
            poster: posterPath,
            countryId,
            categoryId,
            hasSection,
            year,
            belongToCategory,
            premiere,
            classification,
            trailer
        });

        await setMovieGenres(newMovie, genreIds);

        res.status(201).json({ movie: newMovie });
    } catch (error) {
        res.status(500).json({ error: 'Error creating movie' });
    }
};
// Get all movies with genres, country, category
export const getAllMovies = async (req, res) => {
    try {
        const movies = await Movie.findAll({
            include: [
                { model: Genre, attributes: ['id', 'title'] },
                { model: Country, as: 'countries' },
                { model: Category, as: 'categories' },
                { model: Section, as: 'sections' },
                { model: Series, as: 'series' },
                { model: Episode },
                { model: Favorite },
            ],
            order: [['createdAt', 'DESC']]
        });
        res.status(200).json({ movies });
    } catch (error) {
        res.status(500).json({ error: 'Error fetching movies' });
    }
};
// Get a single movie by ID
export const getMovieById = async (req, res) => {
    const movieId = req.params.id;

    try {
        const movie = await Movie.findByPk(movieId, {
            include: [
                { model: Genre, attributes: ['id', 'title'] },
                { model: Country, as: 'countries' },
                { model: Category, as: 'categories' },
                { model: Section, as: 'sections' },
                { model: Series, as: 'series' },
                { model: Episode },
                { model: Favorite },
            ],
        });

        if (!movie) {
            return res.status(404).json({ error: 'Movie not found' });
        }

        const genres = await movie.getGenres();
        const genreIds = genres.map(genre => genre.id);

        res.status(200).json({ movie, genreIds });
    } catch (error) {
        res.status(500).json({ error: 'Error fetching movie' });
    }
};
// Update a movie by ID
export const updateMovie = async (req, res) => {
    try {
        const movieId = req.params.id;
        const {
            title,
            subTitle,
            slug,
            duration,
            quality,
            subtitles,
            status,
            totalEpisodes,
            views,
            description,
            genreIds,
            countryId,
            categoryId,
            hasSection,
            year,
            belongToCategory,
            premiere,
            classification,
            trailer
        } = req.body;

        const movie = await Movie.findByPk(movieId);
        if (!movie) {
            return res.status(404).json({ error: 'Movie not found' });
        }

        const image = req.files?.image?.[0]?.path ?? movie.image;
        const poster = req.files?.poster?.[0]?.path ?? movie.poster;

        if (req.files?.image) {
            if (movie.image) {
                await fs.promises.unlink(movie.image);
            }
        }

        if (req.files?.poster) {
            if (movie.poster) {
                await fs.promises.unlink(movie.poster);
            }
        }

        await movie.update({
            title,
            subTitle,
            slug,
            duration,
            quality,
            subtitles,
            status,
            totalEpisodes,
            views,
            description,
            image,
            poster,
            countryId,
            categoryId,
            hasSection,
            year,
            belongToCategory,
            premiere,
            classification,
            trailer
        });

        await setMovieGenres(movie, genreIds);

        res.status(200).json({ movie });
    } catch (error) {
        if (error.name === 'SequelizeValidationError') {
            return res.status(400).json({ error: 'Dữ liệu không hợp lệ' });
        } else if (error.name === 'SequelizeForeignKeyConstraintError') {
            return res.status(400).json({ error: 'Ràng buộc khóa ngoại không hợp lệ' });
        } else {
            return res.status(500).json({ error: 'Lỗi cập nhật phim' });
        }
    }
};
// Delete a movie by ID
export const deleteMovie = async (req, res) => {
    try {
        const movie = await Movie.findByPk(req.params.id);
        if (!movie) {
            return res.status(404).json({ error: 'Movie not found' });
        }
        
        if (movie.image) {
            fs.unlinkSync(movie.image);
        }
        if (movie.poster) {
            fs.unlinkSync(movie.poster);
        }

        await movie.destroy();
        res.status(200).json({ message: 'Movie deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error });
    }
};
// Lấy Movie theo Series
export const getMoviesBySeriesId = async (req, res) => {
    try {
        const seriesId = req.params.id;
        if(!seriesId){
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

export const getMovieReviews = async (req, res) => {
    const { movieId } = req.params;
    const page = parseInt(req.query.page || '1', 10);
    const limit = parseInt(req.query.limit || '10', 10); // Giới hạn số review mỗi trang
    const sort = req.query.sort || 'newest'; // Mặc định sắp xếp mới nhất
    const offset = (page - 1) * limit;

    const orderOptions = [];
    switch (sort) {
        case 'rating_desc':
            orderOptions.push(['rating', 'DESC']);
            break;
        case 'rating_asc':
            orderOptions.push(['rating', 'ASC']);
            break;
        // Thêm case 'likes_desc' nếu có trường likes
        case 'likes_desc':
             // Sắp xếp theo độ dài mảng likes (cần kiểm tra cú pháp DB cụ thể)
             // Ví dụ cho PostgreSQL: orderOptions.push([sequelize.fn('jsonb_array_length', sequelize.col('likes')), 'DESC']);
             // Ví dụ chung (có thể không hiệu quả): orderOptions.push([sequelize.literal('JSON_LENGTH(likes)'), 'DESC']);
             // Tạm thời sắp xếp theo ngày tạo nếu chưa có likes
             orderOptions.push(['createdAt', 'DESC']);
            break;
        case 'newest':
        default:
            orderOptions.push(['createdAt', 'DESC']);
            break;
    }
     // Thêm order phụ để đảm bảo ổn định
     if (!orderOptions.some(o => o[0] === 'createdAt')) {
        orderOptions.push(['createdAt', 'DESC']);
    }

    try {
        const { count, rows } = await Rating.findAndCountAll({
            where: {
                movieId: movieId,
                reviewContent: { [Op.ne]: null, [Op.ne]: '' }, // Chỉ lấy những record có reviewContent
                isApproved: true // Chỉ lấy những review đã được duyệt
            },
            include: [{
                model: User,
                as: 'user',
                attributes: ['id', 'name', 'avatar'] // Chỉ lấy thông tin cần thiết của user
            }],
            order: orderOptions,
            limit: limit,
            offset: offset,
            distinct: true // Có thể cần nếu include phức tạp hơn
        });

        const totalPages = Math.ceil(count / limit);

        res.status(200).json({
            success: true,
            reviews: rows,
            pagination: {
                totalItems: count,
                totalPages: totalPages,
                currentPage: page,
                itemsPerPage: limit,
                currentSort: sort
            }
        });

    } catch (error) {
        handleServerError(res, error, `Lấy reviews cho phim ID ${movieId}`);
    }
};

export const getMyReviewForMovie = async (req, res) => {
    const userId = req.userId; // Lấy từ middleware verifyToken
    const { movieId } = req.params;

    // Không cần kiểm tra userId ở đây vì verifyToken đã làm

    if (!movieId) {
        return res.status(400).json({ success: false, message: 'Thiếu thông tin movieId.' });
    }

    try {
        const rating = await Rating.findOne({
            where: {
                userId: userId,
                movieId: movieId
            },
            // Không cần include User ở đây vì đây là review của chính họ
        });

        if (rating) {
            // Tìm thấy đánh giá/review của người dùng
            res.status(200).json({
                success: true,
                rating: rating // Trả về toàn bộ object rating/review
            });
        } else {
            // Người dùng chưa đánh giá/review phim này
            res.status(200).json({ // Trả về 200 nhưng rating là null
                success: true,
                rating: null
            });
        }

    } catch (error) {
        handleServerError(res, error, `Lấy đánh giá của bạn cho phim ID ${movieId}`);
    }
};