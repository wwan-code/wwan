import express from 'express';
import { commentReport, deleteCommentReport, getCommentReports } from '../controllers/commentReport.controller.js';
import authJwt from '../middlewares/authJwt.js';

const router = express.Router();

router.post('/report', authJwt.verifyToken, authJwt.isEditorOrAdmin, commentReport);
router.get('/reports', authJwt.verifyToken, authJwt.isEditorOrAdmin, getCommentReports);
router.delete('/report/:id', authJwt.verifyToken, authJwt.isEditorOrAdmin, deleteCommentReport);

export default router;