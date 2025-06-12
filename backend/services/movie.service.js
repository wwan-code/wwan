// backend/services/movie.service.js
import db from "../models/index.js";
import { Op } from "sequelize";
// fs/promises sẽ được dùng cho việc xóa file, chưa cần cho create
import fs from "fs/promises";
import path from "path";

const Movie = db.Movie;
const Genre = db.Genre;
const Country = db.Country;
const Category = db.Category;
const Section = db.Section;
const Series = db.Series;
const Episode = db.Episode;
const Favorite = db.Favorite;

/**
 * Helper function to set genres for a movie.
 * @param {object} movieInstance - Sequelize instance of the movie.
 * @param {Array<number>} genreIds - Array of genre IDs.
 * @param {object} [transaction] - Optional Sequelize transaction.
 */
const setMovieGenresInternal = async (movieInstance, genreIds, transaction) => {
    if (genreIds && Array.isArray(genreIds) && genreIds.length > 0) {
        const genres = await Genre.findAll({
            where: {
                id: { [Op.in]: genreIds.map(id => parseInt(id)) }, // Đảm bảo ID là số
            },
            transaction,
        });
        await movieInstance.setGenres(genres, { transaction });
    } else {
        // Nếu không có genreIds hoặc mảng rỗng, có thể xóa hết genres cũ (nếu là update)
        // Hiện tại createMovie nên không cần xóa. Nếu là update thì:
        // await movieInstance.setGenres([], { transaction });
    }
};

/**
 * Creates a new movie with the given data.
 * @param {object} movieData - Data for the new movie from req.body.
 * @param {object} files - Uploaded files (poster, banner).
 * @returns {Promise<object>} The created movie object with genres.
 * @throws {Error} If movie already exists or on other errors.
 */
export const createNewMovie = async (movieData, files) => {
    const {
        title, subTitle, slug, duration, quality, subtitles, status,
        totalEpisodes, views, description, genreIds, countryId, categoryId,
        hasSection, year, belongToCategory, releaseDate, classification, trailerUrl,
        type,
        tags,
    } = movieData;

    const t = await db.sequelize.transaction();

    try {
        const movieExists = await Movie.findOne({ where: { slug }, transaction: t });
        if (movieExists) {
            const error = new Error('Phim với slug này đã tồn tại.');
            error.statusCode = 409;
            throw error;
        }
        const posterFile = files?.poster?.[0];
        const bannerFile = files?.banner?.[0];

        let posterPath = null;
        if (posterFile) {
            const normalizedPath = posterFile.path.replace(/\\/g, "/");
            const uploadsDir = path.resolve("uploads").replace(/\\/g, "/");
            posterPath = normalizedPath.startsWith(uploadsDir)
                ? normalizedPath.substring(uploadsDir.length + 1)
                : normalizedPath.replace(/^uploads\//, "");
        }

        let bannerPath = null;
        if (bannerFile) {
            const normalizedPath = bannerFile.path.replace(/\\/g, "/");
            const uploadsDir = path.resolve("uploads").replace(/\\/g, "/");
            bannerPath = normalizedPath.startsWith(uploadsDir)
                ? normalizedPath.substring(uploadsDir.length + 1)
                : normalizedPath.replace(/^uploads\//, "");
        }

        const newMovie = await Movie.create({
            title, subTitle, slug, duration, quality, subtitles, status,
            totalEpisodes, views, description,
            posterURL: posterPath,
            bannerURL: bannerPath,
            countryId, categoryId, hasSection, year, belongToCategory,
            releaseDate, classification, trailerUrl,
            type,
            tags: (typeof tags === 'string' && tags.trim() !== '') ? JSON.parse(tags) : tags || null,
        }, { transaction: t });

        await setMovieGenresInternal(newMovie, genreIds, t);

        await t.commit();

        const resultMovie = await Movie.findByPk(newMovie.id, {
            include: [{ model: Genre, as: 'genres', through: { attributes: [] } }]
        });
        return resultMovie;

    } catch (error) {
        await t.rollback();
        // Xóa file đã upload nếu có lỗi xảy ra sau khi upload
        if (files?.poster?.[0].path) await fs.unlink(files?.poster?.[0].path).catch(err => console.error("Lỗi xóa image khi rollback:", err));
        if (files?.banner?.[0].path) await fs.unlink(files?.banner?.[0].path).catch(err => console.error("Lỗi xóa poster khi rollback:", err));
        throw error; // Ném lỗi để controller xử lý
    }
};

/**
 * Fetches all movies with associated data.
 * @param {object} queryParams - Query parameters for pagination, sorting, filtering.
 * @returns {Promise<{count: number, rows: Array<object>}>} Object containing count and rows of movies.
 */
export const fetchAllMovies = async (queryParams = {}) => {
    // Thêm logic phân trang, sắp xếp, lọc ở đây nếu cần
    const page = parseInt(queryParams.page) || 1;
    const limit = parseInt(queryParams.limit) || 20; // Mặc định 20 phim/trang
    const offset = (page - 1) * limit;

    // Ví dụ về order: có thể truyền vào từ queryParams
    // const order = queryParams.sortBy && queryParams.sortOrder ? [[queryParams.sortBy, queryParams.sortOrder]] : [['createdAt', 'DESC']];

    try {
        const { count, rows: movies } = await Movie.findAndCountAll({
            include: [ // Giữ nguyên các include như trong controller gốc
                { model: Genre, as: 'genres', attributes: ['id', 'title', 'slug'], through: { attributes: [] }, required: false },
                { model: Country, as: 'countries', attributes: ['id', 'title', 'slug'], required: false },
                { model: Category, as: 'categories', attributes: ['id', 'title', 'slug'], required: false },
                { model: Section, as: 'sections', required: false },
                { model: Series, as: 'series', required: false },
                { model: Episode, required: false },
                { model: Favorite, required: false },
            ],
            order: [['createdAt', 'DESC']], // Sắp xếp mặc định
            limit: limit,
            offset: offset,
            distinct: true, // Quan trọng khi dùng limit với include N-M
        });
        return { count, rows: movies };
    } catch (error) {
        // Ném lỗi để controller xử lý
        console.error("Error in fetchAllMovies service:", error);
        throw new Error('Lỗi khi truy vấn danh sách phim từ service.');
    }
};

/**
 * Fetches a single movie by its ID along with associated data and genreIds.
 * @param {number|string} movieId - The ID of the movie.
 * @returns {Promise<{movie: object, genreIds: Array<number>}>} The movie object and an array of its genre IDs.
 * @throws {Error} If the movie is not found or on other errors.
 */
export const fetchMovieById = async (movieId) => {
    const id = parseInt(movieId);
    if (isNaN(id)) {
        const error = new Error('Movie ID không hợp lệ.');
        error.statusCode = 400;
        throw error;
    }

    const movie = await Movie.findByPk(id, {
        include: [
            { model: Genre, attributes: ['id', 'title', 'slug'], through: { attributes: [] }, required: false },
            { model: Country, as: 'countries', attributes: ['id', 'title', 'slug'], required: false },
            { model: Category, as: 'categories', attributes: ['id', 'title', 'slug'], required: false },
            { model: Section, as: 'sections', required: false },
            { model: Series, as: 'series', required: false },
            { model: Episode, required: false },
            { model: Favorite, required: false },
        ],
    });

    if (!movie) {
        const error = new Error('Phim không tồn tại.');
        error.statusCode = 404; // Not Found
        throw error;
    }
    const genres = await movie.getGenres(); // Controller gốc dùng cách này
    const genreIds = genres.map(genre => genre.id);

    // Trả về movie và genreIds. Loại bỏ mảng genres thừa nếu đã có genreIds.
    // const moviePlainObject = movie.get({ plain: true });
    // delete moviePlainObject.genres; // Nếu không muốn trả về mảng genres đầy đủ

    return { movie, genreIds }; // Trả về movie instance và genreIds
};

/**
 * Updates an existing movie.
 * @param {number|string} movieId - The ID of the movie to update.
 * @param {object} updateData - Data to update the movie with (from req.body).
 * @param {object} files - Uploaded files (poster, banner).
 * @returns {Promise<object>} The updated movie object.
 * @throws {Error} If movie not found or on other errors.
 */
export const updateExistingMovie = async (movieId, updateData, files) => {
    const id = parseInt(movieId);
    if (isNaN(id)) {
        const error = new Error('Movie ID không hợp lệ.');
        error.statusCode = 400;
        throw error;
    }

    const t = await db.sequelize.transaction();

    const movie = await Movie.findByPk(id, { transaction: t });
    if (!movie) {
        const error = new Error('Phim không được tìm thấy.');
        error.statusCode = 404;
        throw error;
    }

    try {

        const {
            title, subTitle, slug, duration, quality, subtitles, status,
            totalEpisodes, views, description, genreIds, countryId, categoryId,
            hasSection, year, belongToCategory, releaseDate, classification, trailerUrl,
            type,
            tags,
        } = updateData;

        let newPosterPath = movie.posterURL;
        let newBannerPath = movie.bannerURL;
        const posterFile = files?.poster?.[0];
        const bannerFile = files?.banner?.[0];

        if (posterFile) {
            const normalizedPath = posterFile.path.replace(/\\/g, "/");
            const uploadsDir = path.resolve("uploads").replace(/\\/g, "/");
            newPosterPath = normalizedPath.startsWith(uploadsDir)
                ? normalizedPath.substring(uploadsDir.length + 1)
                : normalizedPath.replace(/^uploads\//, "");
            if (movie.posterURL && movie.posterURL !== newPosterPath) {
                await fs.unlink(movie.posterURL).catch(err => console.error(`Lỗi xóa poster cũ (${movie.posterURL}):`, err));
            }
        }
        if (bannerFile) {
            const normalizedPath = bannerFile.path.replace(/\\/g, "/");
            const uploadsDir = path.resolve("uploads").replace(/\\/g, "/");
            newBannerPath = normalizedPath.startsWith(uploadsDir)
                ? normalizedPath.substring(uploadsDir.length + 1)
                : normalizedPath.replace(/^uploads\//, "");
            if (movie.bannerURL && movie.bannerURL !== newBannerPath) {
                await fs.unlink(movie.bannerURL).catch(err => console.error(`Lỗi xóa banner cũ (${movie.bannerURL}):`, err));
            }
        }
        
        const movieUpdatePayload = {
            title, subTitle, slug, duration, quality, subtitles, status,
            totalEpisodes, views, description, countryId, categoryId,
            hasSection, year, belongToCategory, releaseDate, classification, trailerUrl,
            posterURL: newPosterPath,
            bannerURL: newBannerPath,
            type,
            tags: (typeof tags === 'string' && tags.trim() !== '') ? JSON.parse(tags) : tags || movie.tags,
        };

        Object.keys(movieUpdatePayload).forEach(key => {
            if (movieUpdatePayload[key] === undefined) {
                delete movieUpdatePayload[key];
            }
        });

        await movie.update(movieUpdatePayload, { transaction: t });

        if (genreIds !== undefined) {
            await setMovieGenresInternal(movie, genreIds, t);
        }

        await t.commit();

        const updatedMovieWithAssociations = await Movie.findByPk(movie.id, {
            include: [
                { model: Genre, as: 'genres', attributes: ['id', 'title', 'slug'], through: { attributes: [] }, required: false },
                { model: Country, as: 'countries', attributes: ['id', 'title', 'slug'], required: false },
                { model: Category, as: 'categories', attributes: ['id', 'title', 'slug'], required: false },
            ]
        });
        return updatedMovieWithAssociations;

    } catch (error) {
        await t.rollback();
        if (files?.poster?.[0] && files.poster[0].path !== movie?.posterURL) {
            await fs.unlink(files.poster[0].path).catch(err => console.error("Lỗi xóa poster mới khi rollback update:", err));
        }
        if (files?.banner?.[0] && files.banner[0].path !== movie?.bannerURL) {
            await fs.unlink(files.banner[0].path).catch(err => console.error("Lỗi xóa banner mới khi rollback update:", err));
        }

        if (error.name === 'SequelizeUniqueConstraintError') {
            const customError = new Error('Slug đã tồn tại. Vui lòng chọn slug khác.');
            customError.statusCode = 409;
            throw customError;
        }
        throw error;
    }
};