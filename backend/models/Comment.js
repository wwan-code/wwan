// backend/models/Comment.js
import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Comment = sequelize.define('Comment', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    uuid: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        unique: true,
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id',
        },
    },
    contentId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: 'ID của nội dung được bình luận (vd: episodeId, comicId)',
    },
    contentType: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: 'Loại nội dung (vd: "episode", "movie", "comic", "chapter")',
        validate: {
            isIn: [['episode', 'movie', 'comic', 'chapter']],
        }
    },
    parentId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'Comments',
            key: 'id',
        },
        onDelete: 'CASCADE'
    },
    text: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    likes: {
        type: DataTypes.JSON,
        defaultValue: [],
    },
    reports: {
        type: DataTypes.JSON,
        defaultValue: [],
    },
    isSpoiler: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
    isPinned: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
    isEdited: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
    isApproved: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
    },
    is_hidden: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    }
}, {
    timestamps: true,
    // paranoid: true,
    indexes: [
        { name: 'content_type_id_index', fields: ['contentType', 'contentId'] },
        { fields: ['userId'] },
        { fields: ['parentId'] },
    ],
});

export default Comment;