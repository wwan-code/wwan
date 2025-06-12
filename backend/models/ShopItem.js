// backend/models/ShopItem.js
import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const ShopItem = sequelize.define('ShopItem', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    type: { // AVATAR_FRAME, CHAT_COLOR, THEME_UNLOCK, AD_SKIP_TICKET, BADGE_DISPLAY_SLOT, PROFILE_BACKGROUND
        type: DataTypes.STRING,
        allowNull: false
    },
    value: { // URL to frame, hex color, theme name, number of tickets, etc.
        type: DataTypes.STRING,
        allowNull: true // Có thể không cần value nếu type tự giải thích (vd: 1 vé bỏ qua QC)
    },
    price: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
    },
    iconUrl: {
        type: DataTypes.STRING,
        allowNull: true
    },
    durationDays: { // null for permanent items
        type: DataTypes.INTEGER,
        allowNull: true
    },
    isActive: { // Item is available in shop
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    stock: { // null for unlimited stock
        type: DataTypes.INTEGER,
        allowNull: true
    },
    requiredLevel: {
        type: DataTypes.INTEGER,
        defaultValue: 1
    }
}, { timestamps: true, tableName: 'ShopItems' });

export default ShopItem;