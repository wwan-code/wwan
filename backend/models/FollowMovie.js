import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import Movie from './Movie.js';

const FollowMovie = sequelize.define('follow_movies', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id',
        },
    },
    movieId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'movies',
            key: 'id',
        },
    },
}, {
    timestamps: true,
});


export default FollowMovie;