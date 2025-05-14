import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import Movie from './Movie.js';

const Genre = sequelize.define('genres', {
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
    title: {
        type: DataTypes.STRING
    },
    slug: {
        type: DataTypes.STRING
    }
}, {
    timestamps: true,
});

// Genre.belongsToMany(Movie, { through: 'movie_genres' });
// Movie.belongsToMany(Genre, { through: 'movie_genres' });
export default Genre;
