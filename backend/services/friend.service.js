// backend/services/friend.service.js
import db from "../models/index.js";
import { Op } from 'sequelize';
import { createAndEmitNotification } from '../utils/notificationUtils.js';
import { getPublicUserProfile } from './user.service.js';


const User = db.User;
const Friend = db.Friend;

/**
 * Processes sending a friend request.
 * @param {number} requesterId - ID of the user sending the request.
 * @param {number} recipientId - ID of the user receiving the request.
 * @returns {Promise<{message: string}>} Result message.
 * @throws {Error} If users are invalid, already friends, or request already exists.
 */
export const processSendFriendRequest = async (requesterId, recipientId) => {
    if (requesterId === recipientId) {
        const error = new Error("Không thể tự gửi lời mời kết bạn cho chính mình.");
        error.statusCode = 400;
        throw error;
    }

    const [requester, recipient] = await Promise.all([
        User.findByPk(requesterId, { attributes: ['id', 'name', 'uuid', 'avatar'] }),
        User.findByPk(recipientId)
    ]);

    if (!requester || !recipient) {
        const error = new Error("Người gửi hoặc người nhận không tồn tại.");
        error.statusCode = 404;
        throw error;
    }
    if (recipient.deletedAt) {
        const error = new Error("Không thể gửi lời mời đến tài khoản đã bị xóa.");
        error.statusCode = 400;
        throw error;
    }


    const t = await db.sequelize.transaction();
    try {
        const existingFriendship = await Friend.findOne({
            where: {
                [Op.or]: [
                    { userId: requesterId, friendId: recipientId },
                    { userId: recipientId, friendId: requesterId }
                ]
            },
            transaction: t
        });

        if (existingFriendship) {
            if (existingFriendship.status === 'accepted') {
                const error = new Error("Hai bạn đã là bạn bè.");
                error.statusCode = 409;
                throw error;
            } else if (existingFriendship.status === 'pending') {
                const message = existingFriendship.userId === requesterId
                    ? "Bạn đã gửi lời mời kết bạn cho người này trước đó."
                    : "Người này đã gửi lời mời kết bạn cho bạn. Hãy kiểm tra trong danh sách lời mời.";
                const error = new Error(message);
                error.statusCode = 409;
                throw error;
            }
        }

        await Friend.create({ userId: requesterId, friendId: recipientId, status: 'pending' }, { transaction: t });

        await createAndEmitNotification({
            recipientId: recipientId,
            senderId: requesterId,
            type: 'FRIEND_REQUEST',
            message: `<strong>${requester.name}</strong> đã gửi cho bạn một lời mời kết bạn.`,
            link: `/profile/${requester.uuid}`,
            iconUrl: requester.avatar,
            transaction: t
        });

        await t.commit();
        return { message: "Đã gửi lời mời kết bạn thành công." };
    } catch (error) {
        if (t.finished !== 'commit' && t.finished !== 'rollback') {
            await t.rollback();
        }
        throw error;
    }
};

/**
 * Processes accepting a friend request.
 * @param {number} accepterId - ID of the user accepting the request.
 * @param {number} requesterId - ID of the user who sent the request.
 * @returns {Promise<{message: string, friend: object}>} Result message and public info of the new friend.
 * @throws {Error} If request not found or on other errors.
 */
export const processAcceptFriendRequest = async (accepterId, requesterId) => {
     if (accepterId === requesterId) {
        const error = new Error("Hành động không hợp lệ.");
        error.statusCode = 400;
        throw error;
    }
    const t = await db.sequelize.transaction();
    try {
        const friendRequest = await Friend.findOne({
            where: { userId: requesterId, friendId: accepterId, status: 'pending' },
            transaction: t
        });

        if (!friendRequest) {
            const error = new Error("Không tìm thấy lời mời kết bạn hoặc lời mời đã được xử lý.");
            error.statusCode = 404;
            throw error;
        }

        friendRequest.status = 'accepted';
        await friendRequest.save({ transaction: t });

        const accepter = await User.findByPk(accepterId, { attributes: ['id', 'name', 'uuid', 'avatar'], transaction: t });

        if (accepter) {
            await createAndEmitNotification({
                recipientId: requesterId,
                senderId: accepterId,
                type: 'REQUEST_ACCEPTED',
                message: `<strong>${accepter.name}</strong> đã chấp nhận lời mời kết bạn của bạn.`,
                link: `/profile/${accepter.uuid}`,
                iconUrl: accepter.avatar,
                transaction: t
            });
        }

        await t.commit();

        const newFriendProfile = await getPublicUserProfile(requesterId);

        return { message: "Đã chấp nhận lời mời kết bạn.", friend: newFriendProfile }; //
    } catch (error) {
        if (t.finished !== 'commit' && t.finished !== 'rollback') {
            await t.rollback();
        }
        throw error;
    }
};

/**
 * Processes rejecting a friend request.
 * @param {number} currentUserId - ID of the user rejecting the request (recipient).
 * @param {number} requesterId - ID of the user who sent the request.
 * @returns {Promise<{message: string}>} Result message.
 * @throws {Error} If request not found or on other errors.
 */
export const processRejectFriendRequest = async (currentUserId, requesterId) => {
    if (!currentUserId || !requesterId) {
        const error = new Error("Thiếu thông tin người dùng.");
        error.statusCode = 400;
        throw error;
    }

    const deletedCount = await Friend.destroy({
        where: {
            userId: requesterId,
            friendId: currentUserId,
            status: 'pending'
        }
    });

    if (deletedCount > 0) {
        return { message: "Đã từ chối lời mời kết bạn." };
    } else {
        const error = new Error("Không tìm thấy lời mời kết bạn hoặc lời mời đã được xử lý.");
        error.statusCode = 404;
        throw error;
    }
};

/**
 * Processes cancelling a friend request that was sent by the current user.
 * @param {number} currentUserId - ID of the user cancelling the request (sender).
 * @param {number} recipientId - ID of the user to whom the request was sent.
 * @returns {Promise<{message: string}>} Result message.
 * @throws {Error} If request not found or on other errors.
 */
export const processCancelFriendRequest = async (currentUserId, recipientId) => {
    if (!currentUserId || !recipientId) {
        const error = new Error("Thiếu thông tin người dùng.");
        error.statusCode = 400;
        throw error;
    }

    // Hủy lời mời mà currentUserId (người gửi) đã gửi cho recipientId (người nhận)
    const deletedCount = await Friend.destroy({
        where: {
            userId: currentUserId, // Người gửi lời mời (là người dùng hiện tại đang hủy)
            friendId: recipientId,   // Người nhận lời mời
            status: 'pending'
        }
    });

    if (deletedCount > 0) {
        return { message: "Đã hủy lời mời kết bạn." };
    } else {
        const error = new Error("Không tìm thấy lời mời kết bạn để hủy hoặc lời mời đã được xử lý.");
        error.statusCode = 404;
        throw error;
    }
};

/**
 * Processes removing an existing friend.
 * @param {number} currentUserId - ID of the user initiating the removal.
 * @param {number} friendToRemoveId - ID of the friend to be removed.
 * @returns {Promise<{message: string}>} Result message.
 * @throws {Error} If friendship not found or on other errors.
 */
export const processRemoveFriend = async (currentUserId, friendToRemoveId) => {
    if (!currentUserId || !friendToRemoveId) {
        const error = new Error("Thiếu thông tin người dùng.");
        error.statusCode = 400;
        throw error;
    }
    if (currentUserId === friendToRemoveId) {
        const error = new Error("Không thể tự hủy kết bạn với chính mình.");
        error.statusCode = 400;
        throw error;
    }

    const t = await db.sequelize.transaction();
    try {
        const deletedCount = await Friend.destroy({
            where: {
                status: 'accepted',
                [Op.or]: [
                    { userId: currentUserId, friendId: friendToRemoveId },
                    { userId: friendToRemoveId, friendId: currentUserId }
                ]
            },
            transaction: t
        });

        if (deletedCount > 0) {
            // Gửi thông báo cho người bị hủy kết bạn (tùy chọn)
            // const currentUser = await User.findByPk(currentUserId, { attributes: ['name'], transaction: t });
            // if (currentUser) {
            //     await createAndEmitNotification({
            //         recipientId: friendToRemoveId,
            //         senderId: currentUserId,
            //         type: 'FRIEND_REMOVED',
            //         message: `<strong>${currentUser.name}</strong> đã hủy kết bạn với bạn.`,
            //         transaction: t
            //     });
            // }
            await t.commit();
            return { message: "Đã hủy kết bạn thành công." };
        } else {
            await t.rollback(); // Rollback nếu không có gì để xóa (không tìm thấy mối quan hệ)
            const error = new Error("Không tìm thấy mối quan hệ bạn bè này hoặc mối quan hệ không ở trạng thái 'accepted'.");
            error.statusCode = 404;
            throw error;
        }
    } catch (error) {
        if (t.finished !== 'commit' && t.finished !== 'rollback') {
            await t.rollback();
        }
        throw error;
    }
};

/**
 * Fetches friend list, received friend requests, and sent friend requests for a user.
 * @param {number} targetUserId - ID of the user whose friend data is being fetched.
 * @param {number} currentAuthUserId - ID of the currently authenticated user.
 * @returns {Promise<object>} Object containing lists of friends, friendRequests, and sentFriendRequests.
 */
export const fetchFriendshipData = async (targetUserId, currentAuthUserId) => {
    const targetUser = await User.findByPk(targetUserId);
    if (!targetUser || targetUser.deletedAt) {
        const error = new Error("Người dùng không tồn tại.");
        error.statusCode = 404;
        throw error;
    }

    // 1. Lấy danh sách bạn bè (status: 'accepted')
    const friendships = await Friend.findAll({
        where: {
            status: 'accepted',
            [Op.or]: [{ userId: targetUserId }, { friendId: targetUserId }]
        },
        attributes: ['userId', 'friendId']
    });

    const friendIds = friendships.map(fr => (fr.userId === targetUserId ? fr.friendId : fr.userId));

    const friendsListPromises = friendIds.map(friendId => getPublicUserProfile(friendId));
    const friendsList = (await Promise.all(friendsListPromises)).filter(Boolean); // Lọc bỏ null nếu user không còn tồn tại

    let friendRequestsReceivedList = [];
    let friendRequestsSentList = [];

    // 2. Nếu người dùng đang xem profile của chính họ, lấy thêm danh sách lời mời
    if (currentAuthUserId === targetUserId) {
        // Lời mời đã nhận (pending, targetUserId là friendId)
        const receivedRequestsData = await Friend.findAll({
            where: { friendId: targetUserId, status: 'pending' },
            include: [{
                model: User,
                as: 'user'
            }]
        });
        const receivedRequestsPromises = receivedRequestsData.map(fr => fr.user ? getPublicUserProfile(fr.user.id) : null);
        friendRequestsReceivedList = (await Promise.all(receivedRequestsPromises)).filter(Boolean);

        // Lời mời đã gửi (pending, targetUserId là userId)
        const sentRequestsData = await Friend.findAll({
            where: { userId: targetUserId, status: 'pending' },
            include: [{
                model: User,
                as: 'friend'
            }]
        });
        const sentRequestsPromises = sentRequestsData.map(fr => fr.friend ? getPublicUserProfile(fr.friend.id) : null);
        friendRequestsSentList = (await Promise.all(sentRequestsPromises)).filter(Boolean);
    }
    // Nếu không phải xem profile của chính mình, và targetUser có cài đặt privacy cho friend list:
    // Cần kiểm tra user.privacySettings.showFriendsList
    else {
        // Kiểm tra privacy settings của targetUser
        if (targetUser.privacySettings?.showFriendsList === 'private') {
            // Không trả về danh sách bạn bè
            return { friends: [], friendRequests: [], sentFriendRequests: [], message: "Danh sách bạn bè của người dùng này là riêng tư." };
        }
        // Nếu là 'friends', cần kiểm tra currentAuthUserId có phải là bạn của targetUserId không
        if (targetUser.privacySettings?.showFriendsList === 'friends') {
            const areFriends = friendIds.includes(currentAuthUserId);
            if (!areFriends) {
                return { friends: [], friendRequests: [], sentFriendRequests: [], message: "Bạn không có quyền xem danh sách bạn bè của người dùng này." };
            }
        }
    }


    return {
        friends: friendsList,
        friendRequests: friendRequestsReceivedList,
        sentFriendRequests: friendRequestsSentList
    };
};