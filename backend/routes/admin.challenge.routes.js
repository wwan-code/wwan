// backend/routes/admin.challenge.routes.js
import express from 'express';
import ChallengeAdminController from '../controllers/challenge.admin.controller.js';
import authJwt from '../middlewares/authJwt.js';
import multer from 'multer';
import { handleChallengeIconUpload } from '../middlewares/uploadChallengeIcon.js';

const router = express.Router();
const challengeAdminCtrl = new ChallengeAdminController();


// POST /api/admin/challenges - Tạo thử thách mới
router.post(
    '/challenges',
    authJwt.verifyToken, authJwt.isAdmin,
    handleChallengeIconUpload,
    challengeAdminCtrl.createChallenge
);
// PUT /api/admin/challenges/:idOrUuid - Cập nhật thử thách
router.put(
    '/challenges/:idOrUuid',
    authJwt.verifyToken, authJwt.isAdmin,
    handleChallengeIconUpload,
    challengeAdminCtrl.updateChallenge
);
// DELETE /api/admin/challenges/:idOrUuid - Xóa thử thách
router.delete(
    '/challenges/:idOrUuid',
    authJwt.verifyToken, authJwt.isAdmin,
    challengeAdminCtrl.deleteChallenge
);
// GET /api/admin/challenges - Lấy tất cả thử thách (admin view)
router.get(
    '/challenges',
    authJwt.verifyToken, authJwt.isAdmin,
    challengeAdminCtrl.getAllChallengesAdmin
);
// GET /api/admin/challenges/:idOrUuid - Lấy chi tiết một thử thách (admin view)
router.get(
    '/challenges/:idOrUuid',
    authJwt.verifyToken, authJwt.isAdmin,
    challengeAdminCtrl.getChallengeByIdAdmin
);
// put /api/admin/challenges/:idOrUuid/toggle-activation - Thay đổi trạng thái kích hoạt
router.put(
    '/challenges/:idOrUuid/toggle-activation',
    authJwt.verifyToken, authJwt.isAdmin,
    challengeAdminCtrl.toggleChallengeActivation
);
export default router;