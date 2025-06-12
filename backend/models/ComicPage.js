// models/ComicPage.js
import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const ComicPage = sequelize.define('comic_pages', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    chapterId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'chapters',
            key: 'id'
        },
        onDelete: 'CASCADE'
    },
    imageUrl: {
        type: DataTypes.STRING,
        allowNull: false
    },
    pageNumber: {
        type: DataTypes.INTEGER,
        allowNull: false
    }
}, {
    timestamps: false,
    indexes: [
        { fields: ['chapterId'] },
        { unique: true, fields: ['chapterId', 'pageNumber'] }
    ]
});

export default ComicPage;