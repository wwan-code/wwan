// models/UserBadge.js
import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const UserBadge = sequelize.define('user_badges', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id'
        },
        onDelete: 'CASCADE'
    },
    badgeId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'badges',
            key: 'id'
        },
        onDelete: 'CASCADE'
    },
    earnedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    timestamps: false, // Chỉ cần earnedAt
    indexes: [
        { unique: true, fields: ['userId', 'badgeId'] } // Mỗi user chỉ nhận 1 huy hiệu loại đó 1 lần
    ]
});

export default UserBadge;