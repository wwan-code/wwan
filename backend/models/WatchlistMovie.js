import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const WatchlistMovie = sequelize.define('watchlist_movies', {
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
    movieId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'movies',
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
    indexes: [
        { unique: true, fields: ['watchlistId', 'movieId'] },
        { fields: ['movieId'] }
    ]
});

export default WatchlistMovie;