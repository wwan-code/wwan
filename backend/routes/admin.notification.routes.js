// backend/routes/admin.notification.routes.js
import express from 'express';
import * as adminNotificationController from '../controllers/admin.notification.controller.js';
import authJwt from '../middlewares/authJwt.js';

const router = express.Router();

router.post(
    '/admin/system-notifications',
    authJwt.verifyToken,
    authJwt.isAdmin,
    adminNotificationController.sendSystemNotificationToAll
);

export default router;