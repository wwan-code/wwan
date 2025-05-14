import express from 'express';
import {
    createSection,
    getAllSections,
    getSectionById,
    updateSection,
    deleteSection,
    getSectionsBySeriesId,
    getSectionsByMovie
} from '../controllers/section.controller.js';
import authJwt from '../middlewares/authJwt.js';

const router = express.Router();

// Tạo một Section mới
router.post('/sections', authJwt.verifyToken, authJwt.isEditorOrAdmin, createSection);

// Lấy tất cả Sections
router.get('/sections', getAllSections);

// Lấy Section theo ID
router.get('/sections/:id', getSectionById);

// Cập nhật Section
router.put('/sections/:id', authJwt.verifyToken, authJwt.isEditorOrAdmin, updateSection);

// Xóa Section
router.delete('/sections/:id', authJwt.verifyToken, authJwt.isEditorOrAdmin, deleteSection);

// Lấy tất cả Sections theo Series ID
router.get('/series/:seriesId/sections', getSectionsBySeriesId);

// Lấy tất cả Sections theo Movie ID
router.get('/movies/:movieId/sections', getSectionsByMovie);

export default router;
