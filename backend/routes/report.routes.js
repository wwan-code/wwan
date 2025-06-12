// routes/report.routes.js
import express from 'express';
import * as reportController from '../controllers/report.controller.js';
import authJwt from '../middlewares/authJwt.js';

const router = express.Router();

// User gửi báo cáo
router.post('/content-reports', authJwt.verifyToken, reportController.createContentReport);

// Admin quản lý báo cáo
router.get('/admin/content-reports', authJwt.verifyToken, authJwt.isEditorOrAdmin, reportController.getAllContentReports);
router.put('/admin/content-reports/:reportId/status', authJwt.verifyToken, authJwt.isEditorOrAdmin, reportController.updateContentReportStatus);
router.delete('/admin/content-reports/:reportId', authJwt.verifyToken, authJwt.isAdmin, reportController.deleteContentReport); // Chỉ Admin có thể xóa hẳn

export default router;