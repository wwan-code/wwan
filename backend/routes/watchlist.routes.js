// backend/routes/watchlist.routes.js
import express from 'express';
import * as watchlistController from '../controllers/watchlist.controller.js';
import authJwt from '../middlewares/authJwt.js';

const router = express.Router();

router.post(
    '/',
    authJwt.verifyToken,
    watchlistController.createWatchlist
);
router.get('/', authJwt.verifyToken, watchlistController.getUserWatchlists);
router.get('/:id', authJwt.verifyTokenOrGetUser, watchlistController.getWatchlistById);
router.put(
    '/:id',
    authJwt.verifyToken,
    watchlistController.updateWatchlist
);
router.delete('/:id', authJwt.verifyToken, watchlistController.deleteWatchlist);

// Routes cho Movies trong Watchlist
router.post('/:watchlistId/movies', authJwt.verifyToken, watchlistController.addMovieToWatchlist);
router.delete('/:watchlistId/movies/:movieId', authJwt.verifyToken, watchlistController.removeMovieFromWatchlist);

// Routes cho Comics trong Watchlist
router.post('/:watchlistId/comics', authJwt.verifyToken, watchlistController.addComicToWatchlist); 
router.delete('/:watchlistId/comics/:comicId', authJwt.verifyToken, watchlistController.removeComicFromWatchlist);


export default router;