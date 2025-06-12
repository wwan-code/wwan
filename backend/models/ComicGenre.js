// models/ComicGenre.js
import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const ComicGenre = sequelize.define('comic_genres', {
    comicId: {
        type: DataTypes.INTEGER,
        references: {
            model: 'comics',
            key: 'id'
        },
        primaryKey: true,
        onDelete: 'CASCADE'
    },
    genreId: {
        type: DataTypes.INTEGER,
        references: {
            model: 'genres',
            key: 'id'
        },
        primaryKey: true,
        onDelete: 'CASCADE'
    }
}, {
    timestamps: true
});

export default ComicGenre;