// backend/routes/shop.routes.js
import express from 'express';
import * as shopController from '../controllers/shop.controller.js';
import authJwt from '../middlewares/authJwt.js';

const router = express.Router();

// === USER ROUTES ===
router.get('/shop/items', authJwt.verifyToken, shopController.getShopItems);
router.post('/shop/items/:itemId/purchase', authJwt.verifyToken, shopController.purchaseShopItem);
router.get('/user/inventory', authJwt.verifyToken, shopController.getUserInventory);
router.put('/user/inventory/:inventoryId/activate', authJwt.verifyToken, shopController.toggleItemActivation);

// === ADMIN ROUTES ===
// Lấy tất cả vật phẩm (kể cả inactive) cho admin quản lý
router.get(
    '/admin/shop/items',
    authJwt.verifyToken,
    authJwt.isEditorOrAdmin, // Hoặc chỉ isAdmin
    shopController.adminGetShopItems
);

// Tạo vật phẩm mới
router.post(
    '/admin/shop/items',
    authJwt.verifyToken,
    authJwt.isEditorOrAdmin,
    shopController.adminCreateShopItem
);

// Cập nhật vật phẩm
router.put(
    '/admin/shop/items/:itemId',
    authJwt.verifyToken,
    authJwt.isEditorOrAdmin,
    shopController.adminUpdateShopItem
);

// Xóa vật phẩm
router.delete(
    '/admin/shop/items/:itemId',
    authJwt.verifyToken,
    authJwt.isAdmin, // Chỉ Admin mới được xóa hẳn vật phẩm
    shopController.adminDeleteShopItem
);


export default router;