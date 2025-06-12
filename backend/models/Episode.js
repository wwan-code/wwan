import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Episode = sequelize.define('Episode', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    uuid: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        unique: true,
    },
    episodeNumber: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    views: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    linkEpisode: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    movieId: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    duration: {
        type: DataTypes.STRING,
        allowNull: false,
    },
});

export default Episode;