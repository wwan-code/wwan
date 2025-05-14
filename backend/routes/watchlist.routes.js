// routes/watchlist.routes.js
import express from 'express';
import * as watchlistController from '../controllers/watchlist.controller.js';
import authJwt from '../middlewares/authJwt.js'; // Import middleware xác thực

const router = express.Router();

// Định nghĩa các route
router.post('/', authJwt.verifyToken, watchlistController.createWatchlist);       // Tạo watchlist mới
router.get('/', authJwt.verifyToken, watchlistController.getUserWatchlists);      // Lấy tất cả watchlist của user
router.get('/:id', authJwt.verifyToken, watchlistController.getWatchlistById);    // Lấy chi tiết watchlist
router.put('/:id', authJwt.verifyToken, watchlistController.updateWatchlist);     // Cập nhật watchlist
router.delete('/:id', authJwt.verifyToken, watchlistController.deleteWatchlist);  // Xóa watchlist

router.post('/:watchlistId/movies', authJwt.verifyToken, watchlistController.addMovieToWatchlist); // Thêm phim vào watchlist
router.delete('/:watchlistId/movies/:movieId', authJwt.verifyToken, watchlistController.removeMovieFromWatchlist); // Xóa phim khỏi watchlist

export default router;