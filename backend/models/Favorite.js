import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Favorite = sequelize.define('favorites', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    movieId: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    episodeId: {
        type: DataTypes.INTEGER,
        allowNull: false,
    }
}, {
    timestamps: true,
});

export default Favorite;