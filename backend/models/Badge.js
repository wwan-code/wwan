// models/Badge.js
import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Badge = sequelize.define('badges', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    iconUrl: {
        type: DataTypes.STRING,
        allowNull: true
    },
    criteriaType: {
        type: DataTypes.ENUM(
            'points',
            'level',
            'logins',
            'comments',
            'movies_watched',
            'episodes_watched',
            'ratings_count',
            'daily_check_in_streak',
            'late_night_watcher',
            'genre_explorer', // Số thể loại khác nhau đã xem
            'watchlist_count', // Số lượng watchlist đã tạo
            'other' // Cho các trường hợp đặc biệt như "Người Tiên Phong"
        ),
        allowNull: false
    },
    criteriaValue: { // Giá trị cần đạt được cho tiêu chí (ví dụ: 1000 điểm, cấp 5, 10 bình luận)
        type: DataTypes.INTEGER,
        allowNull: false
    },
    // Thêm các trường khác nếu cần, ví dụ: rarity (độ hiếm)
}, {
    timestamps: true
});

export default Badge;