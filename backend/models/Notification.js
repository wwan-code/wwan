// models/Notification.js
import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Notification = sequelize.define('notifications', { // Đổi tên bảng
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    recipientId: { // ID của người nhận thông báo
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'users', // Tham chiếu đến bảng users
            key: 'id'
        }
    },
    senderId: { // ID của người gửi/tạo ra thông báo (có thể null nếu là hệ thống)
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'users',
            key: 'id'
        }
    },
    type: { // Loại thông báo: 'FRIEND_REQUEST', 'REQUEST_ACCEPTED', 'NEW_MESSAGE', 'NEW_EPISODE', 'NEW_COMMENT_ON_FOLLOWED_MOVIE'
        type: DataTypes.STRING,
        allowNull: false
    },
    message: { // Nội dung thông báo
        type: DataTypes.STRING,
        allowNull: false
    },
    link: { // Đường dẫn đến nội dung liên quan (ví dụ: trang profile, trang phim)
        type: DataTypes.STRING,
        allowNull: true
    },
    isRead: { // Trạng thái đã đọc
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    },
    // createdAt, updatedAt tự động
}, {
    timestamps: true
});

export default Notification;