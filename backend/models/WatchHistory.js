import sequelize from '../config/database.js';
import { DataTypes } from 'sequelize';

const WatchHistory = sequelize.define('watch_histories', {
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id',
        },
    },
    episodeId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'episodes',
            key: 'id',
        },
    },
    watchedDuration: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0,
    },
    watchedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
    },
}, {
    timestamps: false,
});

export default WatchHistory;