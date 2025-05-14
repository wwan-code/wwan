import express from 'express';
import { addWatchHistory, getAllWatchHistories, deleteWatchHistory } from '../controllers/watchHistory.controller.js';
import authJwt from '../middlewares/authJwt.js';

const router = express.Router();

router.post('/', authJwt.verifyToken, addWatchHistory);
router.get('/:userId', authJwt.verifyToken, getAllWatchHistories);
router.delete('/:userId/:episodeId', authJwt.verifyToken, deleteWatchHistory);

export default router;