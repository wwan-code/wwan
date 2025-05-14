import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Comment = sequelize.define('comments', {
    content: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    parentId: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    is_hidden: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    episodeId: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    likes: {
        type: DataTypes.JSON,
        defaultValue: [],
    },
    replyingTo: {
        type: DataTypes.STRING,
        allowNull: true,
    },
}, {
    timestamps: true,
});

export default Comment;