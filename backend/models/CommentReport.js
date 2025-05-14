import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const CommentReport = sequelize.define('comment_reports', {
    commentId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'comments',
            key: 'id'
        }
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id'
        }
    },
    reason: {
        type: DataTypes.STRING,
        allowNull: false
    }
}, {
    timestamps: true,
});

export default CommentReport;