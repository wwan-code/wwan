import express from 'express';
import { getAlbumMovie, getAnime, getDashboard, getFilters, getGenre, getHome, getNewlyUpdatedMovies, getPlayMovie, getPrevailingMovies, getTheatricalFilms, getUserByUUID, searchMovies, setFilter } from '../controllers/index.controller.js';
import authJwt from '../middlewares/authJwt.js';
import { addFavorite, deleteFavorite, getTotalFavorites } from '../controllers/favorite.controller.js';

const router = express.Router();
router.get('/home', getHome);
router.get('/genre/:slug', getGenre);
router.get('/profile-user/:uuid', getUserByUUID)

router.get('/newly-updated-movies', getNewlyUpdatedMovies);
router.get('/theatrical-films', getTheatricalFilms);

router.post('/filter', setFilter);
router.get('/filters', getFilters);
router.get('/prevailing', getPrevailingMovies);
router.get('/anime', getAnime);
router.get('/video-play/:slug', authJwt.getUser, getPlayMovie);
router.get('/album-movie/:slug', authJwt.getUser, getAlbumMovie);
router.get('/search-movie', searchMovies);
router.get('/dashboard', authJwt.verifyToken ,authJwt.isEditorOrAdmin, getDashboard);

router.post('/favorites', authJwt.verifyToken, addFavorite);
router.get('/episodes/:episodeId/favorites', getTotalFavorites);
router.delete('/favorites', authJwt.verifyToken, deleteFavorite);

export default router;
