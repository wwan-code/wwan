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
    timestamps: false, // Không cần timestamps riêng cho bảng trung gian này
    indexes: [
        // Đảm bảo không thêm cùng 1 phim vào 1 watchlist nhiều lần
        { unique: true, fields: ['watchlistId', 'movieId'] },
        // Index cho movieId để tìm các watchlist chứa phim đó (nếu cần)
        { fields: ['movieId'] }
    ]
});

export default WatchlistMovie;