// models/ContentReport.js
import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const ContentReport = sequelize.define('content_reports', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    userId: { // Người báo cáo (có thể null nếu cho phép báo cáo ẩn danh, nhưng nên yêu cầu đăng nhập)
        type: DataTypes.INTEGER,
        allowNull: false, // Nên yêu cầu người dùng đăng nhập để báo cáo
        references: {
            model: 'users',
            key: 'id'
        }
    },
    movieId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'movies',
            key: 'id'
        }
    },
    episodeId: { // Có thể null nếu báo lỗi cho cả phim (không cụ thể tập nào)
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'Episodes', // Tên model Episode của bạn
            key: 'id'
        }
    },
    reportType: { // Loại lỗi
        type: DataTypes.ENUM(
            'video_error',      // Video không phát, giật lag, chất lượng kém
            'audio_error',      // Âm thanh không khớp, rè, mất tiếng
            'subtitle_error',   // Phụ đề sai, thiếu, không khớp
            'content_issue',    // Nội dung không phù hợp, sai thông tin phim
            'other'             // Khác
        ),
        allowNull: false
    },
    description: { // Mô tả chi tiết của người dùng
        type: DataTypes.TEXT,
        allowNull: false,
        validate: {
            notEmpty: { msg: "Vui lòng mô tả chi tiết lỗi bạn gặp phải." }
        }
    },
    timestamp: {
        type: DataTypes.STRING,
        allowNull: true
    },
    status: { // Trạng thái của báo cáo: pending, resolved, ignored
        type: DataTypes.ENUM('pending', 'resolved', 'ignored', 'acknowledged'),
        defaultValue: 'pending',
        allowNull: false
    },
    adminNotes: { // Ghi chú của admin khi xử lý
        type: DataTypes.TEXT,
        allowNull: true
    },
    processedBy: {
        type: DataTypes.INTEGER,
        allowNull: true
    }
    // createdAt, updatedAt tự động
}, {
    timestamps: true,
    indexes: [
        { fields: ['movieId'] },
        { fields: ['episodeId'] },
        { fields: ['status'] },
        { fields: ['userId'] },
    ]
});

export default ContentReport;