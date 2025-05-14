import express from 'express';
import { addFollowMovie, getFollowMovies, removeFollowMovie } from '../controllers/followMovie.controller.js';
import authJwt from '../middlewares/authJwt.js';

const router = express.Router();

router.post('/', authJwt.verifyToken, addFollowMovie); // Thêm phim vào danh sách yêu thích
router.get('/:userId', authJwt.verifyToken, getFollowMovies); // Lấy danh sách phim yêu thích của người dùng
router.delete('/delete', authJwt.verifyToken, removeFollowMovie); // Xóa phim khỏi danh sách yêu thích

export default router;