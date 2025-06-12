import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

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
    posterURL: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    bannerURL: {
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
    releaseDate: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    classification: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    trailerUrl: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    seriesId: {
        type: DataTypes.INTEGER,
        references: {
            model: 'series',
            key: 'id',
        },
        allowNull: true,
    },
    type: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    tags: {
        type: DataTypes.JSON,
        allowNull: true,
    },
}, {
    timestamps: true,
    indexes: [
        {
            unique: true,
            fields: ['uuid']
        },
        {
            fields: ['title']
        },
        {
            fields: ['slug']
        }
    ],
});

export default Movie;