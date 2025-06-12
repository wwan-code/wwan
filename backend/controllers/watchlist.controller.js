import db from '../models/index.js';
import { handleServerError } from '../utils/errorUtils.js';
import { checkAndAwardBadges } from '../utils/gamificationUtils.js';

const Watchlist = db.Watchlist;
const Movie = db.Movie;
const WatchlistMovie = db.WatchlistMovie;
const Episode = db.Episode;
const User = db.User;
const Comic = db.Comic;
const WatchlistComic = db.WatchlistComic;

export const createWatchlist = async (req, res) => {
    const userId = req.userId;
    const { name, description, isPublic = false, type = 'movie' } = req.body;

    if (!name || name.trim() === '') {
        return res.status(400).json({ success: false, message: 'Tên danh sách không được để trống.' });
    }
    const validTypes = ['movie', 'comic'];
    if (!validTypes.includes(type)) {
        return res.status(400).json({ success: false, message: "Loại danh sách không hợp lệ (chỉ 'movie' hoặc 'comic')." });
    }

    const t = await db.sequelize.transaction();

    try {
        const user = await User.findByPk(userId, { transaction: t });
        if (!user) {
            await t.rollback();
            return res.status(404).json({ success: false, message: "Người dùng không tồn tại." });
        }

        const newWatchlistData = {
            userId,
            name: name.trim(),
            description: description ? description.trim() : null,
            isPublic: !!isPublic,
            type,
        };

        const newWatchlist = await Watchlist.create(newWatchlistData, { transaction: t });
        await checkAndAwardBadges(user, { eventType: 'watchlist_created', userId }, t );
        await t.commit();

        res.status(201).json({ success: true, watchlist: newWatchlist, message: "Đã tạo danh sách thành công." });
    } catch (error) {
        await t.rollback();
        handleServerError(res, error, "Tạo danh sách mới");
    }
};

export const updateWatchlist = async (req, res) => {
    const userId = req.userId;
    const { id } = req.params;
    const { name, description, isPublic, type } = req.body;

    const dataToUpdate = {};
    if (name !== undefined && name.trim() === '') {
        return res.status(400).json({ success: false, message: "Tên danh sách không được để trống." });
    }
    if (name !== undefined) dataToUpdate.name = name.trim();
    if (description !== undefined) dataToUpdate.description = description ? description.trim() : null;
    if (isPublic !== undefined) dataToUpdate.isPublic = !!isPublic;
    if (type !== undefined) {
        const validTypes = ['movie', 'comic'];
        if (validTypes.includes(type)) dataToUpdate.type = type;
        else return res.status(400).json({ success: false, message: "Loại danh sách không hợp lệ." });
    }

    const t = await db.sequelize.transaction();
    try {
        const watchlist = await Watchlist.findOne({ where: { id, userId }, transaction: t });
        if (!watchlist) {
            await t.rollback();
            return res.status(404).json({ success: false, message: 'Danh sách không tồn tại hoặc bạn không có quyền.' });
        }

        await watchlist.update(dataToUpdate, { transaction: t });
        await t.commit();

        const updatedWatchlist = await Watchlist.findByPk(id, {
            include: [{ model: User, as: 'user', attributes: ['id', 'name', 'uuid'] }]
        });
        res.status(200).json({ success: true, watchlist: updatedWatchlist, message: 'Cập nhật danh sách thành công.' });
    } catch (error) {
        await t.rollback();
        handleServerError(res, error, `Cập nhật danh sách ID ${id}`);
    }
};

export const deleteWatchlist = async (req, res) => {
    const userId = req.userId;
    const { id } = req.params;
    const t = await db.sequelize.transaction();
    try {
        const watchlist = await Watchlist.findOne({ where: { id, userId }, transaction: t });
        if (!watchlist) {
            await t.rollback();
            return res.status(404).json({ success: false, message: 'Watchlist không tồn tại hoặc bạn không có quyền xóa.' });
        }

        await watchlist.destroy({ transaction: t });
        await t.commit();

        res.status(200).json({ success: true, message: 'Đã xóa danh sách thành công.' });
    } catch (error) {
        await t.rollback();
        handleServerError(res, error, `Xóa danh sách ID ${id}`);
    }
};

export const getUserWatchlists = async (req, res) => {
    const userId = req.userId;
    const includeItems = req.query.includeItems === 'true';
    const typeFilter = req.query.type;

    try {
        const options = {
            where: { userId },
            order: [['updatedAt', 'DESC']],
        };

        if (typeFilter && ['movie', 'comic'].includes(typeFilter)) {
            options.where.type = typeFilter;
        }

        if (includeItems) {
            options.include = [];
            if (typeFilter === 'movie' || !typeFilter) {
                options.include = options.include || [];
                options.include.push({
                    model: Movie, as: 'movies',
                    attributes: ['id', 'title', 'slug', 'posterURL', 'bannerURL', 'year', 'description', 'belongToCategory'],
                });
            }
            if (typeFilter === 'comic' || !typeFilter) {
                options.include = options.include || [];
                options.include.push({
                    model: Comic, as: 'comics',
                    attributes: ['id', 'title', 'slug', 'coverImage', 'status'],
                    through: { attributes: ['addedAt'], order: [['addedAt', 'DESC']] },
                    required: false
                });
            }
        }
        const watchlists = await Watchlist.findAll(options);
        res.status(200).json({ success: true, watchlists });
    } catch (error) {
        handleServerError(res, error, "Lấy danh sách của bạn");
    }
};

export const getWatchlistById = async (req, res) => {
    const userId = req.userId;
    const { id } = req.params;

    try {
        const watchlist = await Watchlist.findOne({
            where: { id, userId },
            include: [
                { model: User, as: 'user', attributes: ['id', 'name', 'uuid', 'avatar'] },
                {
                    model: Movie, as: 'movies',
                    attributes: ['id', 'title', 'slug', 'posterURL', 'bannerURL', 'year', 'description', 'belongToCategory'],
                    include: [
                        { model: Episode, as: 'Episodes', attributes: ['episodeNumber'], order: [['episodeNumber', 'DESC']], limit: 1 }
                    ],
                    through: { attributes: ['addedAt'], order: [['addedAt', 'DESC']] },
                    required: false
                }
            ]
        });

        if (!watchlist) {
            return res.status(404).json({ success: false, message: 'Danh sách không tồn tại.' });
        }

        if (!watchlist.isPublic && watchlist.userId !== userId) {
            return res.status(403).json({ success: false, message: 'Bạn không có quyền xem danh sách này.' });
        }

        const includeItems = [];
        if (watchlist.type === 'movie' || watchlist.type === 'mixed') {
            includeItems.push({
                model: Movie, as: 'movies',
                attributes: ['id', 'title', 'slug', 'posterURL', 'bannerURL', 'year', 'description', 'belongToCategory'],
                include: [{ model: Episode, as: 'Episodes', attributes: ['episodeNumber'], order: [['episodeNumber', 'DESC']], limit: 1 }],
                through: { attributes: ['addedAt'] },
                required: false
            });
        }
        if (watchlist.type === 'comic' || watchlist.type === 'mixed') {
            includeItems.push({
                model: Comic, as: 'comics',
                attributes: ['id', 'title', 'slug', 'coverImage', 'status', 'author', 'lastChapterUpdatedAt'],
                include: [{ model: Chapter, as: 'chapters', attributes: ['chapterNumber', 'title'], order: [['order', 'DESC']], limit: 1 }],
                through: { attributes: ['addedAt'] },
                required: false
            });
        }

        const watchlistWithDetails = await Watchlist.findOne({
            where: { id },
            include: [
                { model: User, as: 'user', attributes: ['id', 'name', 'uuid', 'avatar'] },
                ...includeItems
            ]
        });

        res.status(200).json({ success: true, watchlist: watchlistWithDetails });
    } catch (error) {
        handleServerError(res, error, `Lấy chi tiết danh sách ID ${id}`);
    }
};

export const addMovieToWatchlist = async (req, res) => {
    const userId = req.userId;
    const { watchlistId } = req.params;
    const { movieId } = req.body;

    if (!movieId) {
        return res.status(400).json({ success: false, message: 'Thiếu movieId.' });
    }

    try {
        const watchlist = await Watchlist.findOne({ where: { id: watchlistId, userId } });
        if (!watchlist) {
            return res.status(404).json({ success: false, message: 'Watchlist không tồn tại hoặc bạn không có quyền.' });
        }

        const movie = await Movie.findByPk(movieId);
        if (!movie) {
            return res.status(404).json({ success: false, message: 'Phim không tồn tại.' });
        }

        const [entry, created] = await WatchlistMovie.findOrCreate({
            where: { watchlistId, movieId },
            defaults: { watchlistId, movieId }
        });

        if (!created) {
            return res.status(409).json({ success: false, message: 'Phim đã có trong danh sách này.' });
        }

        watchlist.changed('updatedAt', true);
        await watchlist.save({ silent: true });

        res.status(201).json({ success: true, message: `Đã thêm phim "${movie.title}" vào "${watchlist.name}".`, entry });

    } catch (error) {
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(409).json({ success: false, message: 'Phim đã có trong danh sách này.' });
        }
        handleServerError(res, error, `Thêm phim vào watchlist ID ${watchlistId}`);
    }
};

export const addComicToWatchlist = async (req, res) => {
    const userId = req.userId;
    const { watchlistId } = req.params;
    const { comicId } = req.body;

    if (!watchlistId || !comicId) {
        return res.status(400).json({ success: false, message: "Thiếu ID danh sách hoặc ID truyện." });
    }

    try {
        const watchlist = await Watchlist.findOne({ where: { id: watchlistId, userId } });
        if (!watchlist) {
            return res.status(404).json({ success: false, message: "Danh sách không tồn tại hoặc bạn không có quyền." });
        }
        if (watchlist.type !== 'comic') {
            return res.status(400).json({ success: false, message: `Danh sách này thuộc loại '${watchlist.type}', không thể thêm truyện.` });
        }

        const comic = await Comic.findByPk(comicId);
        if (!comic) {
            return res.status(404).json({ success: false, message: "Truyện không tồn tại." });
        }

        const [item, created] = await WatchlistComic.findOrCreate({
            where: { watchlistId, comicId },
            defaults: { watchlistId, comicId }
        });

        if (!created) {
            return res.status(409).json({ success: false, message: "Truyện này đã có trong danh sách." });
        }
        watchlist.changed('updatedAt', true);
        await watchlist.save();
        res.status(201).json({ success: true, message: "Đã thêm truyện vào danh sách.", item });
    } catch (error) {
        handleServerError(res, error, "Thêm truyện vào danh sách");
    }
};

export const removeComicFromWatchlist = async (req, res) => {
    const userId = req.userId;
    const { watchlistId, comicId } = req.params;

    if (!watchlistId || !comicId) {
        return res.status(400).json({ success: false, message: "Thiếu ID danh sách hoặc ID truyện." });
    }
    try {
        const watchlist = await Watchlist.findOne({ where: { id: watchlistId, userId } });
        if (!watchlist) {
            return res.status(404).json({ success: false, message: "Danh sách không tồn tại hoặc bạn không có quyền." });
        }

        const result = await WatchlistComic.destroy({ where: { watchlistId, comicId } });
        if (result === 0) {
            return res.status(404).json({ success: false, message: "Truyện không có trong danh sách này." });
        }
        watchlist.changed('updatedAt', true);
        await watchlist.save();
        res.status(200).json({ success: true, message: "Đã xóa truyện khỏi danh sách." });
    } catch (error) {
        handleServerError(res, error, "Xóa truyện khỏi danh sách");
    }
};

export const removeMovieFromWatchlist = async (req, res) => {
    const userId = req.userId;
    const { watchlistId, movieId } = req.params;

    try {
        const watchlist = await Watchlist.findOne({ where: { id: watchlistId, userId } });
        if (!watchlist) {
            return res.status(403).json({ success: false, message: 'Bạn không có quyền xóa phim khỏi danh sách này.' });
        }

        const deletedCount = await WatchlistMovie.destroy({
            where: {
                watchlistId: watchlistId,
                movieId: movieId
            }
        });

        if (deletedCount > 0) {
            res.status(200).json({ success: true, message: 'Đã xóa phim khỏi danh sách.' });
        } else {
            res.status(404).json({ success: false, message: 'Không tìm thấy phim trong danh sách này để xóa.' });
        }
    } catch (error) {
        handleServerError(res, error, `Xóa phim ID ${movieId} khỏi watchlist ID ${watchlistId}`);
    }
};