// backend/controllers/shop.controller.js
import db from '../models/index.js';
import { handleServerError } from '../utils/errorUtils.js';
import { Op } from 'sequelize';

const User = db.User;
const Role = db.Role;
const ShopItem = db.ShopItem;
const UserInventory = db.UserInventory;

// === USER FACING CONTROLLERS ===
export const getShopItems = async (req, res) => {
    const userId = req.userId;

    try {
        let allActiveItems = await ShopItem.findAll({
            where: {
                isActive: true,
                [Op.or]: [
                    { stock: null },
                    { stock: { [Op.gt]: 0 } }
                ]
            },
            order: [['price', 'ASC'], ['name', 'ASC']],
        });

        if (userId) {
            const ownedNonStackableItems = await UserInventory.findAll({
                where: {
                    userId,
                    [Op.or]: [
                        { expiresAt: null },
                        { expiresAt: { [Op.gt]: new Date() } }
                    ]
                },
                include: [{
                    model: ShopItem,
                    as: 'itemDetails',
                    attributes: ['id', 'type'],
                    where: {
                        type: { [Op.notIn]: ['AD_SKIP_TICKET'] } 
                    }
                }]
            });

            const ownedItemIds = new Set(ownedNonStackableItems.map(inv => inv.shopItemId));

            allActiveItems = allActiveItems.filter(item => {
                if (item.type === 'AD_SKIP_TICKET') {
                    return true;
                }
                return !ownedItemIds.has(item.id);
            });
        }

        res.status(200).json({ success: true, items: allActiveItems });
    } catch (error) {
        handleServerError(res, error, "Lấy danh sách vật phẩm cửa hàng");
    }
};

export const purchaseShopItem = async (req, res) => {
    const userId = req.userId;
    const { itemId } = req.params;
    const t = await db.sequelize.transaction();

    try {
        const user = await User.findByPk(userId, {
            include: [{ model: Role, as: 'roles', attributes: ['name'], through: { attributes: [] } }],
            transaction: t
        });
        const item = await ShopItem.findByPk(itemId, { transaction: t });

        if (!user) {
            await t.rollback();
            return res.status(404).json({ success: false, message: "Người dùng không tồn tại." });
        }
        if (!item || !item.isActive) {
            await t.rollback();
            return res.status(404).json({ success: false, message: "Vật phẩm không tồn tại hoặc không có sẵn để mua." });
        }

        const userRoles = user.roles.map(role => role.name);

        if (item.value === 'assets/icons/frames/admin.png' && !userRoles.includes('admin')) {
            await t.rollback();
            return res.status(403).json({ success: false, message: "Chỉ Quản trị viên mới có thể sở hữu vật phẩm này." });
        }
        if (item.value === 'assets/icons/frames/editor.png' && !userRoles.includes('editor') && !userRoles.includes('admin')) {
            await t.rollback();
            return res.status(403).json({ success: false, message: "Chỉ Người chỉnh sửa hoặc Quản trị viên mới có thể sở hữu vật phẩm này." });
        }

        if (user.level < item.requiredLevel) {
            await t.rollback();
            return res.status(403).json({ success: false, message: `Bạn cần đạt cấp độ ${item.requiredLevel} để mua vật phẩm này.` });
        }
        if (item.price > 0 && user.points < item.price) {
            const isAdminItem = item.value === 'assets/icons/frames/admin.png' && userRoles.includes('admin');
            const isEditorItem = item.value === 'assets/icons/frames/editor.png' && (userRoles.includes('editor') || userRoles.includes('admin'));

            if (!(isAdminItem || isEditorItem) || item.price > 0) {
                 if (user.points < item.price) {
                    await t.rollback();
                    return res.status(403).json({ success: false, message: "Bạn không đủ điểm để mua vật phẩm này." });
                 }
            }
        }
        if (item.stock !== null && item.stock <= 0) {
            await t.rollback();
            return res.status(400).json({ success: false, message: "Vật phẩm này đã hết hàng." });
        }

        if (item.price > 0) {
            user.points -= item.price;
        }

        if (item.stock !== null) {
            item.stock -= 1;
        }

        let expiresAt = null;
        if (item.durationDays) {
            expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + item.durationDays);
        }

        let inventoryEntry;
        const existingConsumableInventory = await UserInventory.findOne({
            where: {
                userId,
                shopItemId: item.id,
                expiresAt: item.durationDays ? expiresAt : null
            },
            transaction: t
        });

        if (item.type === 'AD_SKIP_TICKET' && existingConsumableInventory) {
            existingConsumableInventory.quantity += 1;
            await existingConsumableInventory.save({ transaction: t });
            inventoryEntry = existingConsumableInventory;
        } else {
            const [newEntry, created] = await UserInventory.findOrCreate({
                where: { userId, shopItemId: item.id, expiresAt: expiresAt },
                defaults: {
                    userId,
                    shopItemId: item.id,
                    expiresAt,
                    isActive: false,
                    quantity: 1
                },
                transaction: t
            });
             if (!created && item.type !== 'AD_SKIP_TICKET') {
                await t.rollback();
                return res.status(409).json({ success: false, message: `Bạn đã sở hữu vật phẩm "${item.name}" này.` });
            }
            inventoryEntry = newEntry;
        }

        await user.save({ transaction: t });
        await item.save({ transaction: t });
        await t.commit();

        const finalInventoryEntry = await UserInventory.findByPk(inventoryEntry.id, {
            include: [{ model: ShopItem, as: 'itemDetails' }]
        });

        res.status(200).json({
            success: true,
            message: `Mua thành công vật phẩm "${item.name}"!`,
            userPoints: user.points,
            purchasedItem: finalInventoryEntry
        });

    } catch (error) {
        await t.rollback();
        handleServerError(res, error, "Mua vật phẩm");
    }
};

export const getUserInventory = async (req, res) => {
    const userId = req.userId;
    try {
        const inventory = await UserInventory.findAll({
            where: {
                userId,
                [Op.or]: [
                    { expiresAt: null },
                    { expiresAt: { [Op.gt]: new Date() } }
                ]
            },
            include: [{
                model: ShopItem,
                as: 'itemDetails',
                attributes: ['id', 'name', 'description', 'type', 'value', 'iconUrl', 'durationDays']
            }],
            order: [['purchasedAt', 'DESC']]
        });
        res.status(200).json({ success: true, inventory });
    } catch (error) {
        handleServerError(res, error, "Lấy kho đồ người dùng");
    }
};

export const toggleItemActivation = async (req, res) => {
    const userId = req.userId;
    const { inventoryId } = req.params;

    const t = await db.sequelize.transaction();
    try {
        const inventoryItemToToggle = await UserInventory.findOne({
            where: { id: inventoryId, userId },
            include: [{ model: ShopItem, as: 'itemDetails' }],
            transaction: t
        });

        if (!inventoryItemToToggle) {
            await t.rollback();
            return res.status(404).json({ success: false, message: "Không tìm thấy vật phẩm trong kho đồ của bạn." });
        }

        if (inventoryItemToToggle.expiresAt && new Date(inventoryItemToToggle.expiresAt) < new Date()) {
            if (inventoryItemToToggle.isActive) {
                inventoryItemToToggle.isActive = false;
                await inventoryItemToToggle.save({ transaction: t });
            }
            await t.commit();
            return res.status(400).json({ success: false, message: "Vật phẩm này đã hết hạn và được hủy kích hoạt." });
        }

        const itemTypeToToggle = inventoryItemToToggle.itemDetails.type;
        const newPotentialActivationState = !inventoryItemToToggle.isActive;

        if (newPotentialActivationState) {
            const exclusiveTypes = ['AVATAR_FRAME', 'CHAT_COLOR', 'THEME_UNLOCK', 'PROFILE_BACKGROUND'];
            if (exclusiveTypes.includes(itemTypeToToggle)) {
                const itemsToDeactivate = await UserInventory.findAll({
                    where: {
                        userId,
                        isActive: true,
                        id: { [Op.ne]: inventoryItemToToggle.id }
                    },
                    include: [{
                        model: ShopItem,
                        as: 'itemDetails',
                        attributes: ['id', 'type'],
                        where: {
                            type: itemTypeToToggle
                        },
                        required: true
                    }],
                    attributes: ['id'],
                    transaction: t
                });

                const idsToDeactivate = itemsToDeactivate.map(item => item.id);

                if (idsToDeactivate.length > 0) {
                    console.log(`Deactivating UserInventory IDs of type ${itemTypeToToggle}:`, idsToDeactivate);
                    await UserInventory.update(
                        { isActive: false },
                        {
                            where: {
                                id: { [Op.in]: idsToDeactivate }
                            },
                            transaction: t
                        }
                    );
                }
            }
        }

        inventoryItemToToggle.isActive = newPotentialActivationState;
        await inventoryItemToToggle.save({ transaction: t });
        await t.commit();

        const finalInventoryItem = await UserInventory.findByPk(inventoryItemToToggle.id, {
             include: [{ model: ShopItem, as: 'itemDetails' }]
        });

        res.status(200).json({
            success: true,
            message: `Đã ${newPotentialActivationState ? 'kích hoạt' : 'hủy kích hoạt'} vật phẩm "${finalInventoryItem.itemDetails.name}".`,
            inventoryItem: finalInventoryItem
        });

    } catch (error) {
        await t.rollback();
        console.error(`Lỗi khi toggle item ${inventoryId} cho user ${userId}:`, error);
        handleServerError(res, error, "Kích hoạt/hủy vật phẩm");
    }
};

// === ADMIN CONTROLLERS ===
export const adminGetShopItems = async (req, res) => {
    try {
        // Thêm phân trang và sắp xếp cho admin nếu cần
        const items = await ShopItem.findAll({
            order: [['createdAt', 'DESC']],
        });
        res.status(200).json({ success: true, items });
    } catch (error) {
        handleServerError(res, error, "Admin lấy danh sách vật phẩm");
    }
};

export const adminCreateShopItem = async (req, res) => {
    const { name, description, type, value, price, iconUrl, durationDays, isActive, stock, requiredLevel } = req.body;

    if (!name || !type || price === undefined) {
        return res.status(400).json({ success: false, message: "Tên, loại và giá vật phẩm là bắt buộc." });
    }
    if (isNaN(parseInt(price, 10)) || parseInt(price, 10) < 0) {
        return res.status(400).json({ success: false, message: "Giá vật phẩm phải là số không âm." });
    }
    if (requiredLevel !== undefined && (isNaN(parseInt(requiredLevel, 10)) || parseInt(requiredLevel, 10) < 1)) {
        return res.status(400).json({ success: false, message: "Cấp độ yêu cầu phải là số lớn hơn hoặc bằng 1." });
    }
    if (durationDays !== undefined && durationDays !== null && durationDays !== '' && (isNaN(parseInt(durationDays, 10)) || parseInt(durationDays, 10) <= 0)) {
        return res.status(400).json({ success: false, message: "Thời hạn (ngày) phải là số dương." });
    }
    if (stock !== undefined && stock !== null && stock !== '' && (isNaN(parseInt(stock, 10)) || parseInt(stock, 10) < 0)) {
        return res.status(400).json({ success: false, message: "Tồn kho phải là số không âm." });
    }


    try {
        const newItem = await ShopItem.create({
            name: name.trim(),
            description: description ? description.trim() : null,
            type,
            value: value ? value.trim() : null,
            price: parseInt(price, 10),
            iconUrl: iconUrl ? iconUrl.trim() : null,
            durationDays: (durationDays === '' || durationDays === undefined || durationDays === null) ? null : parseInt(durationDays, 10),
            isActive: !!isActive, // Chuyển thành boolean
            stock: (stock === '' || stock === null || stock === undefined) ? null : parseInt(stock, 10),
            requiredLevel: requiredLevel ? parseInt(requiredLevel, 10) : 1,
        });
        res.status(201).json({ success: true, item: newItem, message: "Vật phẩm đã được tạo." });
    } catch (error) {
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(409).json({ success: false, message: 'Tên vật phẩm đã tồn tại.' });
        }
        handleServerError(res, error, "Admin tạo vật phẩm mới");
    }
};

export const adminUpdateShopItem = async (req, res) => {
    const { itemId } = req.params;
    const { name, description, type, value, price, iconUrl, durationDays, isActive, stock, requiredLevel } = req.body;

    if (!name || !type || price === undefined) {
        return res.status(400).json({ success: false, message: "Tên, loại và giá vật phẩm là bắt buộc." });
    }
    if (isNaN(parseInt(price, 10)) || parseInt(price, 10) < 0) {
        return res.status(400).json({ success: false, message: "Giá vật phẩm phải là số không âm." });
    }
    if (requiredLevel !== undefined && (isNaN(parseInt(requiredLevel, 10)) || parseInt(requiredLevel, 10) < 1)) {
        return res.status(400).json({ success: false, message: "Cấp độ yêu cầu phải là số lớn hơn hoặc bằng 1." });
    }
    if (durationDays !== undefined && durationDays !== null && durationDays !== '' && (isNaN(parseInt(durationDays, 10)) || parseInt(durationDays, 10) <= 0)) {
        return res.status(400).json({ success: false, message: "Thời hạn (ngày) phải là số dương." });
    }
    if (stock !== undefined && stock !== null && stock !== '' && (isNaN(parseInt(stock, 10)) || parseInt(stock, 10) < 0)) {
        return res.status(400).json({ success: false, message: "Tồn kho phải là số không âm." });
    }

    try {
        const item = await ShopItem.findByPk(itemId);
        if (!item) {
            return res.status(404).json({ success: false, message: "Không tìm thấy vật phẩm." });
        }

        item.name = name !== undefined ? name.trim() : item.name;
        item.description = description !== undefined ? (description.trim() || null) : item.description;
        item.type = type !== undefined ? type : item.type;
        item.value = value !== undefined ? (value.trim() || null) : item.value;
        item.price = price !== undefined ? parseInt(price, 10) : item.price;
        item.iconUrl = iconUrl !== undefined ? (iconUrl.trim() || null) : item.iconUrl;
        item.durationDays = (durationDays === '' || durationDays === undefined || durationDays === null) ? null : parseInt(durationDays, 10);
        item.isActive = isActive !== undefined ? !!isActive : item.isActive;
        item.stock = (stock === '' || stock === null || stock === undefined) ? null : parseInt(stock, 10);
        item.requiredLevel = requiredLevel !== undefined ? (parseInt(requiredLevel, 10) || 1) : item.requiredLevel;

        await item.save();
        res.status(200).json({ success: true, item, message: "Vật phẩm đã được cập nhật." });
    } catch (error) {
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(409).json({ success: false, message: 'Tên vật phẩm đã tồn tại (sau khi cập nhật).' });
        }
        handleServerError(res, error, `Admin cập nhật vật phẩm ID ${itemId}`);
    }
};

export const adminDeleteShopItem = async (req, res) => {
    const { itemId } = req.params;
    try {
        const item = await ShopItem.findByPk(itemId);
        if (!item) {
            return res.status(404).json({ success: false, message: "Không tìm thấy vật phẩm." });
        }

        // Cân nhắc: Nếu vật phẩm đã được mua, bạn có muốn thực sự xóa nó khỏi bảng ShopItem không?
        // Hoặc chỉ nên đặt isActive = false?
        // Nếu xóa, các bản ghi trong UserInventory có shopItemId này sẽ bị ảnh hưởng (CASCADE hoặc SET NULL tùy cấu hình model)
        // Hiện tại, chúng ta sẽ xóa hẳn.
        await item.destroy();
        res.status(200).json({ success: true, message: "Vật phẩm đã được xóa." });
    } catch (error) {
        handleServerError(res, error, `Admin xóa vật phẩm ID ${itemId}`);
    }
};