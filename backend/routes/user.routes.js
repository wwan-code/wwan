import express from 'express';
import UserController from '../controllers/user.controller.js';
import authJwt from '../middlewares/authJwt.js';

const router = express.Router();
const userController = new UserController();

router.post('/users', authJwt.verifyToken , authJwt.isEditorOrAdmin, userController.createUser);

router.get('/users', authJwt.verifyToken , authJwt.isAdmin, userController.getAllUsers);

router.get('/users/:id', userController.getUserById);

router.put('/users/:id', authJwt.verifyToken , authJwt.isAdmin, userController.updateUser );

router.delete('/users/:id', authJwt.verifyToken , authJwt.isAdmin, userController.deleteUser);

router.get('/users/:userIdOrUuid/badges', authJwt.verifyToken, userController.getUserBadges);

router.get('/users/me/sessions', authJwt.verifyToken, userController.getActiveSessions);
router.delete('/users/me/sessions/others', authJwt.verifyToken, userController.revokeOtherSessions);
router.delete('/users/me/sessions/:sessionId', authJwt.verifyToken, userController.revokeSession);

router.get('/leaderboard', userController.getLeaderboard);

router.get('/m/user/stats', authJwt.verifyToken, authJwt.isAdmin, userController.getUserStats);

router.post('/friends/request', authJwt.verifyToken, userController.sendFriendRequest);
router.post('/friends/accept', authJwt.verifyToken, userController.acceptFriendRequest);
router.post('/friends/reject', authJwt.verifyToken, userController.rejectFriendRequest);
router.post('/friends/cancel', authJwt.verifyToken, userController.cancelFriendRequest);
router.post('/friends/remove', authJwt.verifyToken, userController.removeFriend);
router.get('/friends/:userId', authJwt.verifyToken, userController.getFriends);
router.get('/users/me/movie-recommendations', authJwt.verifyToken, userController.getMovieRecommendations);

export default router;