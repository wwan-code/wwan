// backend/controllers/friend.controller.js
import * as friendService from '../services/friend.service.js';
import { handleServerError } from "../utils/errorUtils.js";

export default class FriendController {
    // Gửi lời mời kết bạn
    async sendFriendRequest(req, res) {
        try {
            const requesterId = req.userId;
            const { friendId: recipientId } = req.body;

            if (!recipientId) {
                return res.status(400).json({ success: false, message: "Thiếu thông tin người nhận (recipientId)." });
            }

            const result = await friendService.processSendFriendRequest(requesterId, parseInt(recipientId));
            res.status(200).json({ success: true, message: result.message });
        } catch (error) {
            console.error("Send Friend Request Error in Controller:", error);
            const statusCode = error.statusCode || 500;
            handleServerError(res, error, "Gửi lời mời kết bạn", statusCode);
        }
    }

    // Chấp nhận lời mời kết bạn
    async acceptFriendRequest(req, res) {
        try {
            const accepterId = req.userId;
            const { friendId: requesterId } = req.body;

             if (!requesterId) {
                return res.status(400).json({ success: false, message: "Thiếu thông tin người gửi lời mời (requesterId)." });
            }

            const result = await friendService.processAcceptFriendRequest(accepterId, parseInt(requesterId));
            res.status(200).json({ success: true, message: result.message, friend: result.friend });
        } catch (error)
        {
            console.error("Accept Friend Request Error in Controller:", error);
            const statusCode = error.statusCode || 500;
            handleServerError(res, error, "Chấp nhận lời mời kết bạn", statusCode);
        }
    }

    async rejectFriendRequest(req, res) {
        try {
            const currentUserId = req.userId; // Người nhận lời mời, người thực hiện hành động từ chối
            const { friendId: requesterId } = req.body; // ID của người đã gửi lời mời

            if (!requesterId) {
                return res.status(400).json({ success: false, message: "Thiếu thông tin người gửi lời mời (requesterId)." });
            }

            const result = await friendService.processRejectFriendRequest(currentUserId, parseInt(requesterId));
            res.status(200).json({ success: true, message: result.message });
        } catch (error) {
            console.error("Reject Friend Request Error in Controller:", error);
            const statusCode = error.statusCode || 500;
            handleServerError(res, error, "Từ chối lời mời kết bạn", statusCode);
        }
    }

    async cancelFriendRequest(req, res) {
        try {
            const currentUserId = req.userId; // Người gửi lời mời, người thực hiện hành động hủy
            const { friendId: recipientId } = req.body; // ID của người đã nhận lời mời

            if (!recipientId) {
                return res.status(400).json({ success: false, message: "Thiếu thông tin người nhận lời mời (recipientId)." });
            }

            const result = await friendService.processCancelFriendRequest(currentUserId, parseInt(recipientId));
            res.status(200).json({ success: true, message: result.message });
        } catch (error) {
            console.error("Cancel Friend Request Error in Controller:", error);
            const statusCode = error.statusCode || 500;
            handleServerError(res, error, "Hủy lời mời kết bạn", statusCode);
        }
    }

    async removeFriend(req, res) {
        try {
            const currentUserId = req.userId;
            const { friendId: friendToRemoveId } = req.body; // ID của người muốn hủy kết bạn

            if (!friendToRemoveId) {
                return res.status(400).json({ success: false, message: "Thiếu thông tin người muốn hủy kết bạn (friendId)." });
            }

            const result = await friendService.processRemoveFriend(currentUserId, parseInt(friendToRemoveId));
            res.status(200).json({ success: true, message: result.message });
        } catch (error) {
            console.error("Remove Friend Error in Controller:", error);
            const statusCode = error.statusCode || 500;
            handleServerError(res, error, "Hủy kết bạn", statusCode);
        }
    }

    async getFriends(req, res) {
        try {
            const targetUserId = parseInt(req.params.userId, 10); // ID của người dùng mà ta muốn xem danh sách bạn bè
            const currentAuthUserId = req.userId; // ID của người dùng đang đăng nhập, thực hiện request

            if (isNaN(targetUserId)) {
                return res.status(400).json({ success: false, message: "UserID không hợp lệ." });
            }

            const friendshipData = await friendService.fetchFriendshipData(targetUserId, currentAuthUserId);

            if (friendshipData.message && (friendshipData.message.includes("riêng tư") || friendshipData.message.includes("không có quyền"))) {
                 return res.status(403).json({ success: false, message: friendshipData.message });
            }


            res.status(200).json({
                success: true,
                data: friendshipData //
            });
        } catch (error) {
            console.error("Get Friends Error in Controller:", error);
            const statusCode = error.statusCode || 500;
            // Controller gốc không có message cụ thể cho lỗi này, dùng handleServerError
            handleServerError(res, error, "Lấy dữ liệu bạn bè", statusCode);
        }
    }
}