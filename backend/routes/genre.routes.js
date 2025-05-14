import express from 'express';
import GenreController from '../controllers/genre.controller.js';
import authJwt from '../middlewares/authJwt.js';

const router = express.Router();
const genreController = new GenreController();

router.post('/', authJwt.verifyToken, genreController.createGenre);

router.get('/', genreController.getAllGenres);

router.get('/:id', genreController.getGenreById);

router.put('/:id', authJwt.verifyToken, genreController.updateGenre);

router.delete('/:id', authJwt.verifyToken, genreController.deleteGenre);

export default router;