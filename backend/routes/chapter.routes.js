// routes/chapter.routes.js
import express from 'express';
import * as chapterController from '../controllers/chapter.controller.js';
import authJwt from '../middlewares/authJwt.js';
import { chapterPagesUpload, batchChapterPagesUploadAny } from '../middlewares/uploadComicFiles.js'; // Import middleware

const router = express.Router();

// User routes
router.get('/comics/:comicId/chapters', chapterController.getChaptersByComicId);
router.get('/chapters/:chapterId/pages', authJwt.verifyTokenOptional, chapterController.getChapterWithPages);

// Admin routes
router.post('/admin/chapters',
    authJwt.verifyToken,
    authJwt.isEditorOrAdmin,
    chapterController.prepareChapterUpload,
    chapterPagesUpload,
    chapterController.createChapter
);
router.put('/admin/chapters/:chapterId/info', authJwt.verifyToken, authJwt.isEditorOrAdmin, chapterController.updateChapterInfo);
router.put('/admin/chapters/:chapterId/manage-pages',
    authJwt.verifyToken,
    authJwt.isEditorOrAdmin,
    chapterController.prepareChapterUpload, // Chuẩn bị req cho Multer (cần comicSlug, chapterNumberSlug)
    chapterPagesUpload, // Multer field 'newPages'
    chapterController.manageChapterPages
);
router.delete('/admin/chapters/:chapterId', authJwt.verifyToken, authJwt.isAdmin, chapterController.deleteChapter);
// API riêng để thêm pages vào chapter đã có
router.post('/admin/chapters/:chapterId/pages',
    authJwt.verifyToken,
    authJwt.isEditorOrAdmin,
    chapterController.prepareChapterUpload,
    chapterPagesUpload,
    chapterController.addPagesToChapter
);
// API xóa page
router.delete('/admin/comic-pages/:pageId', authJwt.verifyToken, authJwt.isEditorOrAdmin, chapterController.deletePageFromChapter);

// API cho upload hàng loạt chương
router.post('/admin/comics/batch-upload-chapters',
    authJwt.verifyToken,
    authJwt.isEditorOrAdmin,
    batchChapterPagesUploadAny,
    chapterController.batchUploadChapters
);

export default router;