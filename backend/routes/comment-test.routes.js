import express from 'express';
import authJwt from '../middlewares/authJwt.js';
import { createCommentOfEpiosde, deleteComment, getCommentOfEpiosdeById, getCommentsByEpisodeId, likeComment, updateCommentOfEpiosde, updateReplyOfComment } from '../controllers/comment.controller.js';

const router = express.Router();


router.post("/comments/:id/like", authJwt.verifyToken, likeComment);
router.get('/episodes/:episodeId/comments', getCommentsByEpisodeId);
router.post("/episodes/:episodeId/comments", authJwt.verifyToken, createCommentOfEpiosde);
router.get("/episodes/:episodeId/comments/:commentId/replies", authJwt.verifyToken, getCommentOfEpiosdeById);

router.put('/episodes/:episodeId/comments/:commentId', authJwt.verifyToken, updateCommentOfEpiosde);

router.put('/episodes/:episodeId/comments/:commentId/replies/:replyId', authJwt.verifyToken, updateReplyOfComment);

router.delete('/episodes/:episodeId/comments/:commentId', authJwt.verifyToken, deleteComment);
export default router;
