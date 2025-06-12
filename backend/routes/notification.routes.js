import express from 'express';
import NotificationController from '../controllers/notification.controller.js';
import authJwt from '../middlewares/authJwt.js';

const router = express.Router();
const notificationController = new NotificationController();

router.get('/', authJwt.verifyToken, notificationController.getNotifications);
router.put('/:id/read', authJwt.verifyToken, notificationController.markNotificationAsRead);
router.put('/read-all', authJwt.verifyToken, notificationController.markAllNotificationsAsRead);
router.delete('/:id', authJwt.verifyToken, notificationController.deleteNotification);

export default router;