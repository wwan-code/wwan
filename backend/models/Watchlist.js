import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Watchlist = sequelize.define('watchlists', {
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
    name: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notEmpty: { msg: "Tên danh sách không được để trống." },
            len: { args: [1, 100], msg: "Tên danh sách phải từ 1 đến 100 ký tự." }
        }
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    timestamps: true,
    indexes: [
        { fields: ['userId'] }
    ]
});

export default Watchlist;