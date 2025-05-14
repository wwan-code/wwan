import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import Country from './Country.js';
import Category from './Category.js';
import Series from './Series.js';
import Favorite from './Favorite.js';
import Episode from './Episode.js';
import Section from './Section.js';

const Movie = sequelize.define('movies', {
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
        type: DataTypes.STRING,
        allowNull: false,
    },
    subTitle: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    slug: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    duration: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    quality: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    subtitles: {
        type: DataTypes.STRING,
    },
    image: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    poster: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    status: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    views: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    },
    countryId: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    categoryId: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    hasSection: {
        type: DataTypes.INTEGER,
    },
    year: {
        type: DataTypes.INTEGER,
    },
    belongToCategory: {
        type: DataTypes.INTEGER,
    },
    description: {
        type: DataTypes.TEXT,
    },
    totalEpisodes: {
        type: DataTypes.STRING,
    },
    premiere: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    classification : {
        type : DataTypes.STRING,
        allowNull: true,
    },
    trailer: {
        type : DataTypes.STRING,
        allowNull: true,
    },
    seriesId: {
        type: DataTypes.INTEGER,
        references: {
            model: 'series',
            key: 'id',
        },
        allowNull: true,
    }
}, {
    timestamps: true,
});

export default Movie;