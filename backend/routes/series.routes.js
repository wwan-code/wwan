// routes/seriesRoutes.js
import express from 'express';
import { createSeries, deleteSeries, getAllSeries, getSeriesById } from '../controllers/series.controller.js';
import authJwt from '../middlewares/authJwt.js';

const router = express.Router();

router.get('/series', getAllSeries);
router.get('/series/:id', getSeriesById);
router.post('/series', authJwt.verifyToken, authJwt.isEditorOrAdmin, createSeries);
router.delete('/series/:id', authJwt.verifyToken, authJwt.isEditorOrAdmin, deleteSeries);

export default router;
