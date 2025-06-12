// backend/routes/collection.routes.js
import express from 'express';
import * as collectionController from '../controllers/collection.controller.js';
// import authJwt from '../middlewares/authJwt.js'; // Có thể cần cho các action sau này (like, save)

const router = express.Router();

// Route để lấy danh sách các collections công khai
router.get('/collections', collectionController.getPublicCollections);

// Route để lấy chi tiết một collection công khai bằng slug
router.get('/collections/:slug', collectionController.getPublicCollectionBySlug);

export default router;