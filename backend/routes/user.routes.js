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

router.get('/m/users/:userIdOrUuid/badges', userController.getUserBadges);

router.get('/m/user/stats', authJwt.verifyToken, authJwt.isAdmin, userController.getUserStats);

router.get('/leaderboard', userController.getLeaderboard);

router.get('/users/me/movie-recommendations', authJwt.verifyToken, userController.getMovieRecommendations);
router.put('/users/me/privacy-settings', authJwt.verifyToken, userController.updatePrivacySettings);

export default router;