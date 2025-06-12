// routes/comic.routes.js
import express from 'express';
import * as comicController from '../controllers/comic.controller.js';
import authJwt from '../middlewares/authJwt.js';
import { comicCoverUpload } from '../middlewares/uploadComicFiles.js';

const router = express.Router();

// === USER ROUTES ===
router.get('/comics', comicController.getComics);
router.get('/comics/filters', comicController.getComicFilterOptions);
router.get('/comics/:slug', comicController.getComicBySlug);
router.get("/comic-recommendations", comicController.getComicRecommendations);

// === ADMIN ROUTES ===
router.post('/admin/comics', authJwt.verifyToken, authJwt.isEditorOrAdmin, comicCoverUpload, comicController.createComic);
router.put('/admin/comics/:id', authJwt.verifyToken, authJwt.isEditorOrAdmin, comicCoverUpload, comicController.updateComic);
router.delete('/admin/comics/:id', authJwt.verifyToken, authJwt.isAdmin, comicController.deleteComic);
router.get('/admin/comics', authJwt.verifyToken, authJwt.isEditorOrAdmin, comicController.getAllComicsAdmin);
router.get('/admin/comics/:id', authJwt.verifyToken, authJwt.isEditorOrAdmin, comicController.getComicByIdAdmin);

export default router;