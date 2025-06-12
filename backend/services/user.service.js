// backend/services/user.service.js
import bcrypt from 'bcrypt';
import db from "../models/index.js";
import { Op, fn, col, literal, Sequelize } from 'sequelize';
import { createAndEmitNotification } from '../utils/notificationUtils.js'; // Sẽ dùng trong các hàm service khác

const User = db.User;
const Role = db.Role;
const WatchHistory = db.WatchHistory;
const Episode = db.Episode;
const Movie = db.Movie;
const Genre = db.Genre;
const Category = db.Category;
const Country = db.Country;
const UserInventory = db.UserInventory;
const ShopItem = db.ShopItem;

export const formatUserResponseInternal = (user, roles) => ({
    id: user.id,
    uuid: user.uuid,
    name: user.name,
    email: user.email,
    phoneNumber: user.phoneNumber,
    avatar: user.avatar,
    roles: roles.map(r => r.name),
    createdAt: user.createdAt,
    status: user.status,
    socialLinks: user.socialLinks,
    points: user.points,
    level: user.level,
    lastLoginStreakAt: user.lastLoginStreakAt,
    currentDailyStreak: user.currentDailyStreak,
    privacySettings: user.privacySettings
});

export const getGenrePreferencesForUser = async (userId) => {
    const user = await User.findByPk(userId);
    if (!user) {
        const error = new Error("Người dùng không tồn tại.");
        error.statusCode = 404;
        throw error;
    }

    const watchHistory = await WatchHistory.findAll({
        where: { userId },
        include: [{
            model: Episode,
            attributes: ['movieId'],
            include: [{
                model: Movie,
                as: 'movie',
                attributes: ['id'],
                include: [{
                    model: Genre,
                    as: 'genres',
                    attributes: ['id', 'title', 'slug'],
                    through: { attributes: [] }
                }]
            }]
        }]
    });

    const genreCounts = {};
    watchHistory.forEach(historyItem => {
        const genres = historyItem.Episode?.movie?.genres;
        if (genres) {
            genres.forEach(genre => {
                genreCounts[genre.id] = (genreCounts[genre.id] || 0) + 1;
            });
        }
    });

    const sortedGenres = Object.entries(genreCounts)
        .sort(([, countA], [, countB]) => countB - countA)
        .map(([id, count]) => ({ id: parseInt(id), count, title: watchHistory.find(wh => wh.Episode?.movie?.genres?.find(g => g.id === parseInt(id)))?.Episode.movie.genres.find(g => g.id === parseInt(id))?.title }));

    return sortedGenres;
};

export const getPublicUserProfile = async (userIdOrUuid) => {
    const userInstance = await User.findOne({
        where: {
            [userIdOrUuid.length > 10 && userIdOrUuid.includes('-') ? 'uuid' : 'id']: userIdOrUuid,
            deletedAt: null
        },
        attributes: ['id', 'uuid', 'name', 'avatar', 'status', 'socialLinks', 'points', 'level', 'createdAt', 'privacySettings']
    });

    if (!userInstance) {
        const error = new Error("Người dùng không tồn tại.");
        error.statusCode = 404;
        throw error;
    }

    const userData = {
        id: userInstance.id,
        uuid: userInstance.uuid,
        name: userInstance.name,
        avatar: userInstance.avatar,
        status: userInstance.status,
        socialLinks: userInstance.socialLinks,
        points: userInstance.points,
        level: userInstance.level,
        createdAt: userInstance.createdAt,
        privacySettings: userInstance.privacySettings,
        activeAvatarFrame: null,
        activeChatColor: null,
        activeTheme: null,
        activeProfileBackground: null
    };

    const activeItems = await UserInventory.findAll({
        where: { userId: userInstance.id, isActive: true },
        include: [{
            model: ShopItem,
            as: 'itemDetails',
            attributes: ['type', 'value'],
            required: true
        }]
    });

    activeItems.forEach(invItem => {
        if (invItem.itemDetails) { //
            switch (invItem.itemDetails.type) {
                case 'AVATAR_FRAME':
                    userData.activeAvatarFrame = invItem.itemDetails.value;
                    break;
                case 'CHAT_COLOR':
                    userData.activeChatColor = invItem.itemDetails.value;
                    break;
                case 'THEME_UNLOCK':
                    userData.activeTheme = invItem.itemDetails.value;
                    break;
                case 'PROFILE_BACKGROUND':
                    userData.activeProfileBackground = invItem.itemDetails.value;
                    break;
            }
        }
    });
    return userData;
};

/**
 * Creates a new user.
 * @param {object} userData - Data for the new user (name, email, password, roleNames, phoneNumber, status).
 * @returns {Promise<object>} The formatted user response.
 * @throws {Error} If email already exists or on other errors.
 */
export const addNewUser = async (userData) => {
    const { name, email, password, roleNames, phoneNumber, status } = userData;

    if (!name || !email || !password) {
        const error = new Error('Tên, email, và mật khẩu là bắt buộc.');
        error.statusCode = 400;
        throw error;
    }

    const t = await db.sequelize.transaction();
    try {
        const existingUser = await User.findOne({ where: { email }, transaction: t });
        if (existingUser) {
            await t.rollback();
            const error = new Error('Email đã tồn tại.');
            error.statusCode = 409;
            throw error;
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = await User.create({
            name,
            email,
            password: hashedPassword,
            phoneNumber,
            status: status !== undefined ? status : 1,
        }, { transaction: t });

        let assignedRoles = [];
        const rolesToAssign = roleNames && Array.isArray(roleNames) && roleNames.length > 0 ? roleNames : ['user'];

        const foundRoles = await Role.findAll({ where: { name: { [Op.in]: rolesToAssign } }, transaction: t });

        if (rolesToAssign.length > 0 && foundRoles.length === 0) {
            await t.rollback();
            console.warn("Không tìm thấy roles để gán:", rolesToAssign);
            const error = new Error(`Không tìm thấy vai trò: ${rolesToAssign.join(', ')}.`);
            error.statusCode = 400;
            throw error;
        }

        if (foundRoles.length > 0) {
            await newUser.setRoles(foundRoles, { transaction: t });
            assignedRoles = foundRoles;
        } else {
            console.warn("Không có vai trò nào được gán cho người dùng mới, kiểm tra lại logic gán vai trò mặc định.");
        }


        await t.commit();
        return formatUserResponseInternal(newUser, assignedRoles);
    } catch (error) {
        if (t.finished !== 'commit' && t.finished !== 'rollback') {
            await t.rollback();
        }
        throw error;
    }
};

/**
 * Fetches all users with pagination and role information.
 * @param {object} queryParams - Query parameters for pagination (page, limit).
 * @returns {Promise<{count: number, rows: Array<object>}>} Object with total count and formatted user list.
 */
export const fetchAllUsersWithRoles = async (queryParams) => {
    const page = parseInt(queryParams.page) || 1;
    const limit = parseInt(queryParams.limit) || 20; // Giữ nguyên default từ controller
    const offset = (page - 1) * limit;

    const { count, rows } = await User.findAndCountAll({
        attributes: { exclude: ['password', 'resetPasswordToken', 'resetPasswordExpires', 'deletedAt'] }, // Thêm deletedAt vào exclude
        include: [
            {
                model: Role,
                as: 'roles', // Alias từ controller gốc
                attributes: ['name'], //
                through: { attributes: [] } //
            },
        ],
        where: {
            deletedAt: null // Chỉ lấy những user chưa bị soft delete
        },
        limit: limit,
        offset: offset,
        order: [['createdAt', 'DESC']],
        distinct: true
    });

    const formattedUsers = rows.map(user => formatUserResponseInternal(user, user.roles || []));
    return { count, rows: formattedUsers, totalPages: Math.ceil(count / limit), currentPage: page };
};

/**
 * Fetches a single user by their ID, excluding sensitive fields.
 * @param {string|number} userId - The ID of the user.
 * @returns {Promise<object>} The formatted user response.
 * @throws {Error} If user is not found.
 */
export const fetchUserById = async (userId) => {
    const id = parseInt(userId);
    if (isNaN(id)) {
        const error = new Error('User ID không hợp lệ.');
        error.statusCode = 400;
        throw error;
    }

    const user = await User.findByPk(id, {
        attributes: { exclude: ['password', 'resetPasswordToken', 'resetPasswordExpires', 'deletedAt'] },
        include: [{
            model: Role,
            as: 'roles',
            attributes: ['name'],
            through: { attributes: [] }
        }],
        where: {
            deletedAt: null
        }
    });

    if (!user) {
        const error = new Error("Người dùng không tồn tại.");
        error.statusCode = 404;
        throw error;
    }
    return formatUserResponseInternal(user, user.roles || []);
};

/**
 * Updates an existing user.
 * @param {string|number} userId - The ID of the user to update.
 * @param {object} updateData - Data for updating the user (name, email, roleNames, phoneNumber, status).
 * @returns {Promise<object>} The formatted user response.
 * @throws {Error} If user not found, email exists, or on other errors.
 */
export const updateExistingUser = async (userId, updateData) => {
    const id = parseInt(userId);
    if (isNaN(id)) {
        const error = new Error('User ID không hợp lệ.');
        error.statusCode = 400;
        throw error;
    }

    const { name, email, roles: roleNames, phoneNumber, status } = updateData;

    const t = await db.sequelize.transaction();
    try {
        const user = await User.findOne({ where: { id, deletedAt: null }, transaction: t });
        if (!user) {
            await t.rollback();
            const error = new Error("Người dùng không tồn tại.");
            error.statusCode = 404;
            throw error;
        }

        // Kiểm tra email mới có bị trùng không (nếu email được cập nhật và khác email cũ)
        if (email && email.toLowerCase() !== user.email.toLowerCase()) {
            const existingUserWithNewEmail = await User.findOne({
                where: {
                    email: email,
                    id: { [Op.ne]: user.id }, // Loại trừ chính user này
                    deletedAt: null
                },
                transaction: t
            });
            if (existingUserWithNewEmail) {
                await t.rollback();
                const error = new Error('Email đã được sử dụng bởi tài khoản khác.');
                error.statusCode = 409;
                throw error;
            }
            user.email = email;
        }

        // Cập nhật các trường được phép
        if (name !== undefined) user.name = name;
        if (phoneNumber !== undefined) user.phoneNumber = phoneNumber;
        if (status !== undefined) user.status = status;

        let updatedRolesForResult = await user.getRoles({ transaction: t }); // Lấy roles hiện tại để trả về nếu không có thay đổi

        if (roleNames && Array.isArray(roleNames)) {
            if (roleNames.length > 0) {
                const foundRoles = await Role.findAll({ where: { name: { [Op.in]: roleNames } }, transaction: t });
                if (foundRoles.length !== roleNames.length) {
                     console.warn(`Một số role không tìm thấy khi cập nhật: ${roleNames.filter(rn => !foundRoles.find(fr => fr.name === rn)).join(', ')}`);
                     // Quyết định: chỉ gán những role tìm thấy hay báo lỗi? Hiện tại là gán những role tìm thấy.
                }
                await user.setRoles(foundRoles, { transaction: t });
                updatedRolesForResult = foundRoles; // Cập nhật để trả về
            } else { // Nếu roleNames là mảng rỗng -> xóa hết role
                await user.setRoles([], { transaction: t });
                updatedRolesForResult = [];
            }
        }

        await user.save({ transaction: t });
        await t.commit();

        return formatUserResponseInternal(user, updatedRolesForResult);
    } catch (error) {
        if (t.finished !== 'commit' && t.finished !== 'rollback') {
            await t.rollback();
        }
        if (error.name === 'SequelizeUniqueConstraintError') {
            // Lỗi này đã được xử lý ở trên cho trường hợp email, tuy nhiên có thể có các unique constraint khác.
            const customError = new Error(error.errors?.[0]?.message || 'Dữ liệu không hợp lệ, vi phạm ràng buộc duy nhất.');
            customError.statusCode = 409;
            throw customError;
        }
        throw error;
    }
};

/**
 * Deletes a user by their ID. (Soft delete by default, or hard delete if specified)
 * @param {string|number} userId - The ID of the user to delete.
 * @param {boolean} [hardDelete=false] - If true, performs a hard delete. Otherwise, soft delete.
 * @returns {Promise<void>}
 * @throws {Error} If user is not found.
 */
export const removeUser = async (userId, hardDelete = false) => {
    const id = parseInt(userId);
    if (isNaN(id)) {
        const error = new Error('User ID không hợp lệ.');
        error.statusCode = 400;
        throw error;
    }

    const user = await User.findByPk(id);
    if (!user) {
        const error = new Error("Người dùng không tồn tại.");
        error.statusCode = 404;
        throw error;
    }

    if (hardDelete) {
        // Cân nhắc: Xóa các dữ liệu liên quan trước khi hard delete (ví dụ: avatar trên ImageKit nếu dùng)
        // Xóa các bản ghi trong bảng user_roles
        await user.setRoles([]); // Xóa tất cả các role liên kết
        await user.destroy(); // Hard delete
    } else {
        // Soft delete (đã có trường deletedAt trong model User)
        // user.status = 0; // Cập nhật status nếu cần thiết cho soft delete
        // user.email = `${user.email}_deleted_${Date.now()}`; // Để cho phép email được dùng lại
        // await user.save(); // Lưu thay đổi trước khi gọi destroy() cho soft delete
        await user.destroy(); // Sequelize's destroy() sẽ tự động set `deletedAt` nếu paranoid: true
                               // Nếu paranoid: false ở model, bạn cần tự set deletedAt và save.
                               // File User.js của bạn không có paranoid: true, nhưng có trường deletedAt.
                               // Controller gốc dùng user.destroy() có vẻ như mong muốn soft delete.
                               // Để đảm bảo soft delete, ta nên set `deletedAt` và save, hoặc cấu hình model User với `paranoid:true`.
                               // Hiện tại, theo controller gốc là user.destroy().
                               // Giả sử model User được cấu hình `paranoid: true` hoặc `user.destroy()` tự xử lý soft delete.
                               // Nếu không, chúng ta cần:
        // user.deletedAt = new Date();
        // user.status = 0; // (ví dụ: 0 là deleted)
        // user.email = `${user.email}_deleted_${Date.now()}`; // Optional: để giải phóng email
        // await user.save();
        // Để nhất quán với cách auth.controller xóa tài khoản:
        user.deletedAt = new Date();
        user.status = 0; // Cập nhật status (trong model User.js status là INTEGER, giả sử 0 là deleted)
        user.email = `${user.email}_deleted_${Date.now()}`;
        // Xóa avatar nếu có (tương tự auth.controller)
        // if (user.avatarFileId && imageKit) { try { await imageKit.deleteFile(user.avatarFileId); } catch (e) { console.error(e); }}
        // user.avatar = null;
        // user.avatarFileId = null;
        await user.save();
    }
};

/**
 * Fetches badges for a given user.
 * @param {string} userIdOrUuid - The ID or UUID of the user.
 * @returns {Promise<Array<object>>} An array of badge objects.
 * @throws {Error} If user is not found.
 */
export const fetchUserBadges = async (userIdOrUuid) => {
    const user = await User.findOne({
        where: {
            [userIdOrUuid.length > 10 ? 'uuid' : 'id']: userIdOrUuid,
            deletedAt: null
        }
    });

    if (!user) {
        const error = new Error("Người dùng không tồn tại.");
        error.statusCode = 404;
        throw error;
    }

    // Controller gốc dùng targetUser.getBadges() với alias 'badges'
    // Điều này ngụ ý có một mối quan hệ many-to-many giữa User và Badge,
    // và association được đặt tên là 'badges'.
    const userBadges = await user.getBadges({
        attributes: ['id', 'name', 'description', 'iconUrl', 'criteriaType', 'criteriaValue'],
        joinTableAttributes: ['earnedAt']
    });

    // user.getBadges() sẽ trả về một mảng các instance của Badge,
    // mỗi instance sẽ có thêm object UserBadge (chứa earnedAt) nếu joinTableAttributes được sử dụng.
    // Cần format lại để giống với mong muốn (nếu cần).
    // Ví dụ, nếu muốn earnedAt nằm cùng cấp với các thuộc tính của badge:
    return userBadges.map(badge => ({
        id: badge.id,
        name: badge.name,
        description: badge.description,
        iconUrl: badge.iconUrl,
        criteriaType: badge.criteriaType,
        criteriaValue: badge.criteriaValue,
        earnedAt: badge.UserBadge ? badge.UserBadge.earnedAt : null // UserBadge là tên mặc định của bảng trung gian trong Sequelize
    }));
    // Hoặc giữ nguyên cấu trúc trả về từ Sequelize nếu frontend đã xử lý.
    // Controller gốc trả về trực tiếp kết quả của getBadges().
    // return userBadges;
};

/**
 * Fetches user statistics (daily, monthly, status).
 * @returns {Promise<object>} Object containing daily, monthly, and status stats.
 */
export const fetchUserStatistics = async () => {
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    const startOfCurrentYear = new Date(new Date().getFullYear(), 0, 1);

    const [dailyStatsRaw, monthlyStatsRaw, statusStatsRaw] = await Promise.all([
        User.findAll({
            attributes: [
                [fn('DATE', col('createdAt')), 'date'],
                [fn('COUNT', col('id')), 'count']
            ],
            where: { createdAt: { [Op.gte]: lastMonth }, deletedAt: null },
            group: [fn('DATE', col('createdAt'))],
            order: [[fn('DATE', col('createdAt')), 'ASC']],
            raw: true
        }),
        User.findAll({
            attributes: [
                [fn('MONTH', col('createdAt')), 'month'],
                [fn('YEAR', col('createdAt')), 'year'],
                [fn('COUNT', col('id')), 'count']
            ],
            where: { createdAt: { [Op.gte]: startOfCurrentYear }, deletedAt: null },
            group: [fn('YEAR', col('createdAt')), fn('MONTH', col('createdAt'))],
            order: [[fn('YEAR', col('createdAt')), 'ASC'], [fn('MONTH', col('createdAt')), 'ASC']],
            raw: true
        }),
        User.findAll({
            attributes: ['status', [fn('COUNT', col('id')), 'count']],
            where: { deletedAt: null },
            group: ['status'],
            raw: true
        })
    ]);

    // Định dạng lại cho dễ dùng ở frontend nếu cần, và đảm bảo count là số
    const formattedDaily = dailyStatsRaw.map(s => ({ date: s.date, count: parseInt(s.count, 10) }));
    const formattedMonthly = monthlyStatsRaw.map(s => ({ year: s.year, month: s.month, count: parseInt(s.count, 10) }));
    const formattedStatus = statusStatsRaw.map(s => ({ status: s.status, count: parseInt(s.count, 10) }));

    return {
        daily: formattedDaily,
        monthly: formattedMonthly,
        status: formattedStatus
    };
};

/**
 * Fetches movie recommendations for a user based on their watch history and genre preferences.
 * @param {number} userId - The ID of the user.
 * @param {number} [limit=10] - The maximum number of recommendations to return.
 * @returns {Promise<{recommendations: Array<object>, message?: string}>}
 * An object containing an array of recommended movies and an optional message.
 */
export const fetchMovieRecommendationsForUser = async (userId, limit = 10) => {
    const genrePreferences = await getGenrePreferencesForUser(userId);

    if (genrePreferences.length === 0) {
        const popularMovies = await Movie.findAll({
            order: [['views', 'DESC']],
            limit: limit,
            include: [
                { model: Genre, as: 'genres', attributes: ['id', 'title', 'slug'], through: { attributes: [] } },
                { model: Episode, as: 'Episodes', attributes: ['id', 'episodeNumber', 'duration'], order: [['episodeNumber', 'DESC']], limit: 1 }
            ],
            where: { status: 1 }
        });
        return { recommendations: popularMovies, message: "Phim phổ biến do bạn chưa có lịch sử xem." };
    }

    const topGenreIds = genrePreferences.slice(0, 3).map(g => g.id);

    const watchedMovieIds = (await WatchHistory.findAll({
        where: { userId },
        include: [{ model: Episode, attributes: ['movieId'] }]
    })).map(wh => wh.Episode?.movieId).filter(id => id != null);

    const recommendedMovies = await Movie.findAll({
        include: [
            {
                model: Genre,
                as: 'genres',
                attributes: ['id', 'title', 'slug'],
                where: { id: { [Op.in]: topGenreIds } },
                through: { attributes: [] },
                required: true
            },
            { model: Episode, as: 'Episodes', attributes: ['id', 'episodeNumber', 'duration'], order: [['episodeNumber', 'DESC']], limit: 1 },
            { model: Category, as: 'categories', attributes: ['id', 'title', 'slug'] },
            { model: Country, as: 'countries', attributes: ['id', 'title', 'slug'] }
        ],
        where: {
            id: { [Op.notIn]: watchedMovieIds },
            status: 1
        },
        order: [
            ['createdAt', 'DESC'],
            ['views', 'DESC']
        ],
        limit: limit,
        distinct: true,
        subQuery: false
    });

    return { recommendations: recommendedMovies };
};

/**
 * Fetches the leaderboard based on specified criteria.
 * @param {object} queryParams - Parameters for pagination and sorting (limit, page, sortBy).
 * @returns {Promise<object>} Object containing users list and pagination info.
 */
export const fetchLeaderboardData = async (queryParams) => {
    const limit = parseInt(queryParams.limit) || 10;
    const page = parseInt(queryParams.page) || 1;
    const offset = (page - 1) * limit;
    const sortBy = queryParams.sortBy || 'points';

    const orderOptions = [];
    const attributes = ['id', 'uuid', 'name', 'avatar', 'points', 'level', 'createdAt'];
    const includeOptions = [
        {
            model: Role,
            as: 'roles',
            attributes: ['name'],
            through: { attributes: [] }
        }
    ];

    switch (sortBy) {
        case 'level':
            orderOptions.push(['level', 'DESC']);
            orderOptions.push(['points', 'DESC']);
            break;
        case 'movies_watched':
            attributes.push([
                Sequelize.literal(`(
                    SELECT COUNT(DISTINCT \`Episode\`.\`movieId\`)
                    FROM \`watch_histories\` AS \`wh\`
                    INNER JOIN \`Episodes\` AS \`Episode\` ON \`wh\`.\`episodeId\` = \`Episode\`.\`id\`
                    WHERE \`wh\`.\`userId\` = \`users\`.\`id\`
                )`),
                'moviesWatchedCount'
            ]);
            orderOptions.push([Sequelize.col('moviesWatchedCount'), 'DESC']);
            orderOptions.push(['points', 'DESC']);
            break;
        case 'comments_count':
            attributes.push([
                Sequelize.literal(`(
                    SELECT COUNT(*)
                    FROM \`comments\` AS \`cmt\`
                    WHERE \`cmt\`.\`userId\` = \`users\`.\`id\` AND \`cmt\`.\`parentId\` IS NULL
                )`),
                'commentsCount'
            ]);
            orderOptions.push([Sequelize.col('commentsCount'), 'DESC']);
            orderOptions.push(['points', 'DESC']);
            break;
        case 'points':
        default:
            orderOptions.push(['points', 'DESC']);
            orderOptions.push(['level', 'DESC']);
            break;
    }
    orderOptions.push(['createdAt', 'ASC']);

    const { count, rows: users } = await User.findAndCountAll({
        attributes: attributes,
        include: includeOptions,
        where: {
            status: { [Op.ne]: 0 },
            deletedAt: null
        },
        order: orderOptions,
        limit: limit,
        offset: offset,
        distinct: true,
    });

    // Lọc admin và editor ở application level như controller gốc
    // Hoặc tốt hơn là thêm điều kiện vào query nếu Role có ID cố định hoặc tên role không đổi
    const filteredUsers = users.filter(user => {
        const userRoles = user.roles ? user.roles.map(r => r.name) : [];
        return !userRoles.includes('admin') && !userRoles.includes('editor');
    });
    // Nếu đã lọc ở DB, thì count sẽ là count đã lọc. Hiện tại lọc ở app.

    // Cần trả về `count` của danh sách đã lọc nếu bạn lọc ở application level
    // và muốn pagination dựa trên danh sách đã lọc.
    // Tuy nhiên, `findAndCountAll` trả về tổng count trước khi filter ở app level.
    // Để đơn giản, ta sẽ trả về `filteredUsers` và `count` gốc (tổng số user không phải admin/editor thỏa mãn where).
    // Nếu muốn count chính xác sau khi filter ở app level, cần tính lại count của filteredUsers.
    // Controller gốc dùng filteredUsers.length cho totalItems, nên ta cũng làm vậy.

    const finalCount = filteredUsers.length; // Số lượng sau khi lọc admin/editor ở app-level
    const totalPages = Math.ceil(finalCount / limit); // Dựa trên số lượng đã lọc

    const formattedUsers = filteredUsers.map(user => { //
        const userData = user.toJSON ? user.toJSON() : { ...user }; // Đảm bảo là plain object
        return {
            id: userData.id,
            uuid: userData.uuid,
            name: userData.name,
            avatar: userData.avatar,
            points: userData.points,
            level: userData.level,
            roles: userData.roles ? userData.roles.map(r => r.name) : [],
            createdAt: userData.createdAt,
            moviesWatchedCount: userData.moviesWatchedCount, // Sẽ là undefined nếu sortBy không phải là movies_watched
            commentsCount: userData.commentsCount,       // Sẽ là undefined nếu sortBy không phải là comments_count
        };
    });


    return {
        users: formattedUsers, // Trả về danh sách đã lọc và format
        pagination: {
            totalItems: finalCount,
            totalPages,
            currentPage: page,
            itemsPerPage: limit,
            sortBy
        }
    };
};

/**
 * Updates privacy settings for the authenticated user.
 * @param {number} userId - The ID of the user.
 * @param {object} newSettings - Object containing new privacy settings (showFriendsList, showTimeline).
 * @returns {Promise<object>} The updated privacy settings.
 * @throws {Error} If user not found or settings are invalid.
 */
export const updateUserPrivacySettings = async (userId, newSettings) => {
    const { showFriendsList, showTimeline } = newSettings;
    const validSettings = ['public', 'friends', 'private'];

    if ((showFriendsList && !validSettings.includes(showFriendsList)) ||
        (showTimeline && !validSettings.includes(showTimeline))) {
        const error = new Error("Giá trị cài đặt không hợp lệ. Chỉ chấp nhận 'public', 'friends', hoặc 'private'.");
        error.statusCode = 400;
        throw error;
    }

    const user = await User.findByPk(userId);
    if (!user || user.deletedAt) {
        const error = new Error("Người dùng không tồn tại.");
        error.statusCode = 404;
        throw error;
    }

    const currentPrivacy = user.privacySettings || { showFriendsList: 'public', showTimeline: 'public' };
    const updatedPrivacy = {
        showFriendsList: showFriendsList !== undefined ? showFriendsList : currentPrivacy.showFriendsList,
        showTimeline: showTimeline !== undefined ? showTimeline : currentPrivacy.showTimeline,
    };

    user.privacySettings = updatedPrivacy;
    await user.save();

    return updatedPrivacy;
};