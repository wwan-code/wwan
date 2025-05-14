import express from 'express';
import {
  createMovie,
  getAllMovies,
  getMovieById,
  updateMovie,
  deleteMovie,
  upload,
  addMovieToSeries,
  getMoviesBySeriesId,
  getMoviesSortedByDate,
  getTrendingMovies,
  getMovieReviews,
  getMyReviewForMovie
} from '../controllers/movie.controller.js';
import authJwt from '../middlewares/authJwt.js';

const router = express.Router();

router.post('/', authJwt.verifyToken, authJwt.isEditorOrAdmin, upload, createMovie);

router.get('/', authJwt.verifyToken, authJwt.isEditorOrAdmin, getAllMovies);

router.get('/:id', authJwt.verifyToken, authJwt.isEditorOrAdmin, getMovieById);

router.put('/:id', authJwt.verifyToken, authJwt.isEditorOrAdmin, upload, updateMovie);

router.delete('/:id', authJwt.verifyToken, authJwt.isEditorOrAdmin, deleteMovie);

router.get('/series/:id', getMoviesBySeriesId);

router.post('/add-to-series', addMovieToSeries);

router.get('/m/sorted-by-date', authJwt.verifyToken, getMoviesSortedByDate);

router.get('/m/trending', authJwt.verifyToken, getTrendingMovies);
router.get('/:movieId/reviews', getMovieReviews);
router.get(
  '/:movieId/my-review',
  authJwt.verifyToken,
  getMyReviewForMovie
);
export default router;