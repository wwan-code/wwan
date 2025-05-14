import db from '../models/index.js';
import { handleServerError } from '../utils/errorUtils.js';
import { checkAndAwardBadges } from '../utils/gamificationUtils.js';

const Watchlist = db.Watchlist;
const Movie = db.Movie;
const WatchlistMovie = db.WatchlistMovie;
const Episode = db.Episode;
const User = db.User;

export const createWatchlist = async (req, res) => {
    const userId = req.userId;
    const { name, description } = req.body;

    if (!name || name.trim() === '') {
        return res.status(400).json({ success: false, message: 'Tên danh sách không được để trống.' });
    }

    try {
        const user = await User.findByPk(userId);
        if (!user) return res.status(404).json({ success: false, message: "User not found" });

        const newWatchlist = await Watchlist.create({
            userId,
            name: name.trim(),
            description: description ? description.trim() : null
        });
        await checkAndAwardBadges(user, { eventType: 'watchlist_created' });
        res.status(201).json({ success: true, watchlist: newWatchlist });
    } catch (error) {
        handleServerError(res, error, "Tạo watchlist");
    }
};

// Lấy tất cả watchlist của người dùng hiện tại
export const getUserWatchlists = async (req, res) => {
    const userId = req.userId;
    const includeMovies = req.query.includeMovies === 'true'; // Check query param

    try {
        const options = {
            where: { userId },
            order: [['updatedAt', 'DESC']] // Sắp xếp theo cập nhật gần nhất
        };

        if (includeMovies) {
            options.include = [{
                model: Movie,
                as: 'movies',
                attributes: ['id', 'title', 'slug', 'poster', 'year'], // Lấy các trường cần thiết của phim
                 include: [ // Lấy thêm tập mới nhất để hiển thị
                    { model: Episode, as: 'Episodes', attributes: ['episodeNumber'], order: [['episodeNumber', 'DESC']], limit: 1 }
                 ],
                through: { attributes: ['addedAt'], order: [['addedAt', 'DESC']] } // Sắp xếp phim trong watchlist theo ngày thêm
            }];
            // Sắp xếp các phim trong từng watchlist (nếu cần - đã làm trong through)
            // options.order = [[{ model: Movie, as: 'movies' }, WatchlistMovie, 'addedAt', 'DESC']];
        }

        const watchlists = await Watchlist.findAll(options);
        res.status(200).json({ success: true, watchlists });
    } catch (error) {
        handleServerError(res, error, "Lấy danh sách watchlist");
    }
};

// Lấy chi tiết một watchlist (bao gồm phim)
export const getWatchlistById = async (req, res) => {
    const userId = req.userId;
    const { id } = req.params;

    try {
        const watchlist = await Watchlist.findOne({
            where: { id, userId }, // Đảm bảo user sở hữu watchlist này
            include: [{
                model: Movie,
                as: 'movies',
                attributes: ['id', 'title', 'slug', 'poster', 'year', 'description'], // Lấy thêm mô tả
                include: [ // Include cần thiết cho card phim
                    { model: Episode, as: 'Episodes', attributes: ['episodeNumber'], order: [['episodeNumber', 'DESC']], limit: 1 }
                ],
                through: { attributes: ['addedAt'], order: [['addedAt', 'DESC']] } // Sắp xếp phim theo ngày thêm
            }]
        });

        if (!watchlist) {
            return res.status(404).json({ success: false, message: 'Watchlist không tồn tại hoặc bạn không có quyền truy cập.' });
        }
        res.status(200).json({ success: true, watchlist });
    } catch (error) {
        handleServerError(res, error, `Lấy chi tiết watchlist ID ${id}`);
    }
};

// Thêm phim vào watchlist
export const addMovieToWatchlist = async (req, res) => {
    const userId = req.userId;
    const { watchlistId } = req.params; // Lấy từ URL param
    const { movieId } = req.body; // Lấy từ body

    if (!movieId) {
        return res.status(400).json({ success: false, message: 'Thiếu movieId.' });
    }

    try {
        // Kiểm tra xem watchlist có tồn tại và thuộc về user không
        const watchlist = await Watchlist.findOne({ where: { id: watchlistId, userId } });
        if (!watchlist) {
            return res.status(404).json({ success: false, message: 'Watchlist không tồn tại hoặc bạn không có quyền.' });
        }

        // Kiểm tra xem phim có tồn tại không (tùy chọn)
        const movie = await Movie.findByPk(movieId);
        if (!movie) {
            return res.status(404).json({ success: false, message: 'Phim không tồn tại.' });
        }

        // Thêm liên kết vào bảng trung gian (findOrCreate để tránh lỗi trùng lặp)
        const [entry, created] = await WatchlistMovie.findOrCreate({
            where: { watchlistId, movieId },
            defaults: { watchlistId, movieId } // findOrCreate sẽ dùng defaults nếu tạo mới
        });

        if (!created) {
            return res.status(409).json({ success: false, message: 'Phim đã có trong danh sách này.' });
        }

        // Cập nhật updatedAt của watchlist để nó nổi lên đầu danh sách
        watchlist.changed('updatedAt', true); // Đánh dấu trường updatedAt đã thay đổi
        await watchlist.save({ silent: true }); // Lưu mà không cập nhật updatedAt tự động của Sequelize lần nữa

        res.status(201).json({ success: true, message: `Đã thêm phim "${movie.title}" vào "${watchlist.name}".`, entry });

    } catch (error) {
         if (error.name === 'SequelizeUniqueConstraintError') {
             return res.status(409).json({ success: false, message: 'Phim đã có trong danh sách này.' });
         }
        handleServerError(res, error, `Thêm phim vào watchlist ID ${watchlistId}`);
    }
};

 // Xóa phim khỏi watchlist
export const removeMovieFromWatchlist = async (req, res) => {
    const userId = req.userId;
    const { watchlistId, movieId } = req.params; // Lấy từ URL params

    try {
         // Kiểm tra quyền sở hữu watchlist trước khi xóa phim khỏi nó
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
            res.status(200).json({ success: true, message: 'Đã xóa phim khỏi danh sách.' }); // Hoặc 204 No Content
        } else {
            res.status(404).json({ success: false, message: 'Không tìm thấy phim trong danh sách này để xóa.' });
        }
    } catch (error) {
        handleServerError(res, error, `Xóa phim ID ${movieId} khỏi watchlist ID ${watchlistId}`);
    }
};

// Cập nhật thông tin watchlist (tên, mô tả)
export const updateWatchlist = async (req, res) => {
    const userId = req.userId;
    const { id } = req.params;
    const { name, description } = req.body;

     // Chỉ cập nhật nếu có name hoặc description được gửi lên
     const dataToUpdate = {};
     if (name !== undefined && name.trim() !== '') dataToUpdate.name = name.trim();
     if (description !== undefined) dataToUpdate.description = description.trim() || null; // Lưu null nếu rỗng

     if (Object.keys(dataToUpdate).length === 0) {
         return res.status(400).json({ success: false, message: 'Không có thông tin hợp lệ để cập nhật.' });
     }

    try {
        const watchlist = await Watchlist.findOne({ where: { id, userId } });
        if (!watchlist) {
            return res.status(404).json({ success: false, message: 'Watchlist không tồn tại hoặc bạn không có quyền.' });
        }

        await watchlist.update(dataToUpdate);

        res.status(200).json({ success: true, watchlist, message: 'Cập nhật watchlist thành công.' });
    } catch (error) {
        handleServerError(res, error, `Cập nhật watchlist ID ${id}`);
    }
};

// Xóa watchlist
export const deleteWatchlist = async (req, res) => {
    const userId = req.userId;
    const { id } = req.params;

    try {
         // WatchlistMovie sẽ tự động bị xóa do `onDelete: 'CASCADE'`
        const deletedCount = await Watchlist.destroy({ where: { id, userId } });

        if (deletedCount > 0) {
            res.status(200).json({ success: true, message: 'Đã xóa watchlist thành công.' }); // Hoặc 204 No Content
        } else {
            res.status(404).json({ success: false, message: 'Watchlist không tồn tại hoặc bạn không có quyền xóa.' });
        }
    } catch (error) {
        handleServerError(res, error, `Xóa watchlist ID ${id}`);
    }
};