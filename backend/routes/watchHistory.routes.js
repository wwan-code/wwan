import express from 'express';
import * as watchHistoryController from '../controllers/watchHistory.controller.js';
import authJwt from '../middlewares/authJwt.js';

const router = express.Router();

router.post('/', authJwt.verifyToken, watchHistoryController.addWatchHistory);
router.get('/:userId', authJwt.verifyToken, watchHistoryController.getAllWatchHistories);
router.delete('/:userId/:episodeId', authJwt.verifyToken, watchHistoryController.deleteWatchHistory);
router.post(
    '/ping',
    [authJwt.verifyToken],
    watchHistoryController.pingWatchDuration
);
export default router;