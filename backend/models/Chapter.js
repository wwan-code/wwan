// models/Chapter.js
import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Chapter = sequelize.define('chapters', { // Tên bảng 'chapters'
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    comicId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'comics', // Tham chiếu đến bảng comics
            key: 'id'
        },
        onDelete: 'CASCADE' // Nếu truyện bị xóa, các chương cũng xóa
    },
    title: { // Tên chương (ví dụ: "Chương 1: Khởi Đầu Mới")
        type: DataTypes.STRING,
        allowNull: true // Có thể chỉ dùng chapterNumber
    },
    chapterNumber: { // Số thứ tự chương, có thể là string để hỗ trợ "Extra", "0.5"
        type: DataTypes.STRING, // Hoặc FLOAT nếu muốn số thập phân
        allowNull: false
    },
    order: { // Để sắp xếp chương, có thể dùng FLOAT
        type: DataTypes.FLOAT, // Dùng FLOAT để có thể chèn chương 1.5, 1.6
        allowNull: false
    },
    views: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
}, {
    timestamps: true,
    indexes: [
        { fields: ['comicId'] },
        { fields: ['comicId', 'order'] }, // Sắp xếp chương theo truyện
        { unique: true, fields: ['comicId', 'chapterNumber'] } // Mỗi truyện không có 2 chương trùng số
    ]
});

export default Chapter;