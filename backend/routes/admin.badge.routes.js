// backend/routes/admin.badge.routes.js
import express from 'express';
import * as badgeController from '../controllers/badge.controller.js';
import authJwt from '../middlewares/authJwt.js';
import uploadBadgeIcon from '../middlewares/uploadBadgeIcon.js'; // Import middleware

const router = express.Router();

// Tất cả các route này đều cần quyền admin hoặc editor
router.get('/admin/badges', authJwt.verifyToken, authJwt.isEditorOrAdmin, badgeController.adminGetBadges);
router.post(
    '/admin/badges',
    authJwt.verifyToken,
    authJwt.isEditorOrAdmin,
    uploadBadgeIcon, // Middleware xử lý upload file
    badgeController.adminCreateBadge
);
router.get('/admin/badges/:id', authJwt.verifyToken, authJwt.isEditorOrAdmin, badgeController.adminGetBadgeById);
router.put(
    '/admin/badges/:id',
    authJwt.verifyToken,
    authJwt.isEditorOrAdmin,
    uploadBadgeIcon, // Middleware xử lý upload file
    badgeController.adminUpdateBadge
);
router.delete('/admin/badges/:id', authJwt.verifyToken, authJwt.isAdmin, badgeController.adminDeleteBadge); // Chỉ admin được xóa

export default router;