import db from "../models/index.js";
import { Op, Sequelize } from 'sequelize';
import { handleServerError } from "../utils/errorUtils.js";
import * as userService from '../services/user.service.js';

const Session = db.Session;
const User = db.User;
const Role = db.Role;
const Friend = db.Friend;
const Notification = db.Notification;
const WatchHistory = db.WatchHistory;
const Comment = db.Comment;
const Rating = db.Rating;
const Episode = db.Episode;
const Movie = db.Movie;
const Genre = db.Genre;
const Category = db.Category;
const Country = db.Country;
const UserInventory = db.UserInventory;
const ShopItem = db.ShopItem;


export default class UserController {
    async createUser(req, res) {
        try {
            const newUserResponse = await userService.addNewUser(req.body);
            res.status(201).json({
                success: true,
                user: newUserResponse,
                message: "Người dùng đã được tạo thành công."
            });
        } catch (error) {
            console.error("Create User Error in Controller:", error);
            const statusCode = error.statusCode || 500;
            const message = error.message || 'Lỗi khi tạo người dùng.';
            if (message === 'Email đã tồn tại.') { //
                 return res.status(statusCode).json({ success: false, message });
            }
            // Nếu service chưa handle lỗi unique email thì controller phải làm
            if (error.name === 'SequelizeUniqueConstraintError') {
                return res.status(409).json({ success: false, message: 'Email đã tồn tại.' });
            }
            handleServerError(res, error, "Tạo người dùng");
        }
    }

    // Get all users (Thêm phân trang, tối ưu response, chuẩn hóa lỗi)
    async getAllUsers(req, res) {
        try {
            const { count, rows: formattedUsers, totalPages, currentPage } = await userService.fetchAllUsersWithRoles(req.query);

            res.status(200).json({
                success: true,
                users: formattedUsers,
                pagination: {
                    totalItems: count,
                    totalPages: totalPages,
                    currentPage: currentPage,
                    itemsPerPage: parseInt(req.query.limit) || 20
                }
            });
        } catch (error) {
            console.error("Get All Users Error in Controller:", error);
            handleServerError(res, error, "Lấy danh sách người dùng");
        }
    }

    // Get a user by ID (Chuẩn hóa lỗi/response)
    async getUserById(req, res) {
        try {
            const userId = req.params.id;
            const userResponse = await userService.fetchUserById(userId);
            res.status(200).json({ success: true, user: userResponse });
        } catch (error) {
            console.error(`Get User By ID Error in Controller (ID: ${req.params.id}):`, error);
            const statusCode = error.statusCode || 500;
            const message = error.message || 'Lỗi khi lấy thông tin người dùng.';
            if (message === "Người dùng không tồn tại.") {
                return res.status(statusCode).json({ success: false, message });
            }
            handleServerError(res, error, `Lấy người dùng ID ${req.params.id}`);
        }
    }

    // Update a user (Tối ưu response, chuẩn hóa lỗi)
    async updateUser(req, res) {
        try {
            const userId = req.params.id;
            const updatedUserResponse = await userService.updateExistingUser(userId, req.body);
            res.status(200).json({
                success: true,
                user: updatedUserResponse,
                message: "Người dùng đã được cập nhật thành công."
            });
        } catch (error) {
            console.error(`Update User Error in Controller (ID: ${req.params.id}):`, error);
            const statusCode = error.statusCode || 500;
            const message = error.message || 'Lỗi khi cập nhật người dùng.';
            handleServerError(res, error, `Cập nhật người dùng ID ${req.params.id}`);
        }
    }

    // Delete a user (Chuẩn hóa lỗi/response)
    async deleteUser(req, res) {
        try {
            const userId = req.params.id;
            // Mặc định là soft delete, có thể thêm query param để cho phép hard delete nếu cần
            const { hardDelete } = req.query;
            await userService.removeUser(userId, hardDelete === 'true');
            // await userService.removeUser(userId); // Hiện tại service mặc định soft delete logic như controller cũ
            res.status(200).json({ success: true, message: "Người dùng đã được xóa thành công." });
        } catch (error) {
            console.error(`Delete User Error in Controller (ID: ${req.params.id}):`, error);
            const statusCode = error.statusCode || 500;
            const message = error.message || 'Lỗi khi xóa người dùng.';
            handleServerError(res, error, `Xóa người dùng ID ${req.params.id}`);
        }
    }

    async getUserBadges(req, res) {
        const { userIdOrUuid } = req.params;

        try {
            const badges = await userService.fetchUserBadges(userIdOrUuid);
            res.status(200).json({ success: true, badges });
        } catch (error) {
            console.error(`Get User Badges Error in Controller (User: ${userIdOrUuid}):`, error);
            const statusCode = error.statusCode || 500;
            const message = error.message || 'Lỗi khi lấy huy hiệu người dùng.';
            handleServerError(res, error, `Lấy huy hiệu cho người dùng ${userIdOrUuid}`);
        }
    }

    async getUserStats(req, res) {
        try {
            const stats = await userService.fetchUserStatistics();
            res.status(200).json({
                success: true,
                stats
            });
        } catch (error) {
            console.error("Get User Stats Error in Controller:", error);
            handleServerError(res, error, "Lấy thống kê người dùng");
        }
    }

    async getMovieRecommendations(req, res) {
        try {
            const userId = req.userId;
            const limit = parseInt(req.query.limit) || 10;

            const result = await userService.fetchMovieRecommendationsForUser(userId, limit);
            res.status(200).json({ success: true, ...result });
        } catch (error) {
            console.error("Get Movie Recommendations Error in Controller:", error);
            handleServerError(res, error, "Lấy phim đề xuất");
        }
    }

    async getLeaderboard(req, res) {
        try {
            const leaderboardData = await userService.fetchLeaderboardData(req.query);
            res.status(200).json({
                success: true,
                users: leaderboardData.users,
                pagination: leaderboardData.pagination
            });
        } catch (error) {
            console.error("Get Leaderboard Error in Controller:", error);
            handleServerError(res, error, "Lấy bảng xếp hạng người dùng");
        }
    }

    async updatePrivacySettings(req, res) {
        try {
            const userId = req.userId;
            const updatedSettings = await userService.updateUserPrivacySettings(userId, req.body);
            res.status(200).json({
                success: true,
                message: "Cập nhật cài đặt riêng tư thành công.",
                privacySettings: updatedSettings
            });
        } catch (error) {
            console.error("Update Privacy Settings Error in Controller:", error);
            const statusCode = error.statusCode || 500;
            const message = error.message || 'Lỗi khi cập nhật cài đặt riêng tư.';
            handleServerError(res, error, "Cập nhật cài đặt riêng tư", statusCode);
        }
    }
}