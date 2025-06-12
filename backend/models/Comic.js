// models/Comic.js
import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Comic = sequelize.define('comics', {
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
        unique: true
    },
    subTitle: {
        type: DataTypes.STRING,
        allowNull: true
    },
    slug: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    coverImage: {
        type: DataTypes.STRING,
        allowNull: true
    },
    bannerImage: {
        type: DataTypes.STRING,
        allowNull: true
    },
    author: {
        type: DataTypes.STRING,
        allowNull: true
    },
    artist: {
        type: DataTypes.STRING,
        allowNull: true
    },
    status: {
        type: DataTypes.ENUM('ongoing', 'completed', 'paused', 'dropped'),
        defaultValue: 'ongoing',
        allowNull: false
    },
    year: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    views: {
        type: DataTypes.BIGINT,
        defaultValue: 0
    },
    countryId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'countries',
            key: 'id'
        }
    },
    categoryId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'categories',
            key: 'id'
        }
    },
    lastChapterUpdatedAt: {
        type: DataTypes.DATE,
        allowNull: true
    }
}, {
    timestamps: true,
    indexes: [
        { fields: ['title'] },
        { fields: ['slug'] },
        { fields: ['status'] },
        { fields: ['lastChapterUpdatedAt'] },
        { fields: ['countryId'] },
        { fields: ['categoryId'] }
    ]
});

export default Comic;