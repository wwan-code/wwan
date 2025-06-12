import express from 'express';
import { createEpisode, deleteEpisode, getEpisodesByMovieId, updateEpisode, getAllEpisodes } from '../controllers/episode.controller.js';
import authJwt from '../middlewares/authJwt.js';


const router = express.Router();

router.post('/episode', authJwt.verifyToken, authJwt.isEditorOrAdmin, createEpisode);

router.get('/episodes/:movieId', getEpisodesByMovieId);

router.get('/episodes', getAllEpisodes);

router.put('/episodes/:id', authJwt.verifyToken, authJwt.isEditorOrAdmin, updateEpisode);

router.delete('/episode/:id', authJwt.verifyToken, authJwt.isEditorOrAdmin, deleteEpisode);

export default router;