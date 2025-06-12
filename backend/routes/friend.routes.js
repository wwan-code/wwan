// backend/routes/friend.routes.js
import express from 'express';
import FriendController from '../controllers/friend.controller.js';
import authJwt from '../middlewares/authJwt.js';

const router = express.Router();
const friendControllerInstance = new FriendController();

// Gửi lời mời kết bạn
router.post(
    '/friends/request',
    [authJwt.verifyToken],
    friendControllerInstance.sendFriendRequest
);

// Chấp nhận lời mời kết bạn
router.post(
    '/friends/accept',
    [authJwt.verifyToken],
    friendControllerInstance.acceptFriendRequest
);

router.post('/friends/reject', [authJwt.verifyToken], friendControllerInstance.rejectFriendRequest);
router.post('/friends/cancel', [authJwt.verifyToken], friendControllerInstance.cancelFriendRequest);
router.post('/friends/remove', [authJwt.verifyToken], friendControllerInstance.removeFriend);
router.get('/users/:userId/friends', [authJwt.verifyToken], friendControllerInstance.getFriends);

export default router;