import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const UserInventory = sequelize.define('user_inventories', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE'
    },
    shopItemId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'ShopItems', key: 'id' },
        onDelete: 'CASCADE' 
    },
    purchasedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    expiresAt: {
        type: DataTypes.DATE,
        allowNull: true
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: false 
    },
    quantity: {
        type: DataTypes.INTEGER,
        defaultValue: 1
    }
}, {
    timestamps: true,
    indexes: [
        { fields: ['userId', 'shopItemId'] }
    ]
});

export default UserInventory;