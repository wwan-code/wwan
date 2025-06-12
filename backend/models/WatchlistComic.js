// backend/models/WatchlistComic.js
import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const WatchlistComic = sequelize.define('watchlist_comics', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    watchlistId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'watchlists',
            key: 'id'
        },
        onDelete: 'CASCADE'
    },
    comicId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'comics',
            key: 'id'
        },
        onDelete: 'CASCADE'
    },
    addedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    timestamps: false,
    tableName: 'watchlist_comics',
    indexes: [
        {
            unique: true,
            fields: ['watchlistId', 'comicId']
        }
    ]
});

export default WatchlistComic;