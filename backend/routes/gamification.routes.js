// routes/gamification.routes.js
import express from 'express';
import * as gamificationController from '../controllers/gamification.controller.js';
import authJwt from '../middlewares/authJwt.js';

const router = express.Router();

// Endpoint cho điểm danh hàng ngày
router.post('/daily-check-in', authJwt.verifyToken, gamificationController.dailyCheckIn);

export default router;