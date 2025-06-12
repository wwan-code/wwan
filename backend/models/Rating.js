import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Rating = sequelize.define('ratings', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    rating: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
            min: 1,
            max: 10
        }
    },
    reviewContent: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    isApproved: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id'
        }
    },
    movieId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'movies',
            key: 'id'
        }
    },
    likes: {
       type: DataTypes.JSON,
       defaultValue: [],
       allowNull: true
    },
}, {
    timestamps: true,
    indexes: [
        {
            unique: true,
            fields: ['userId', 'movieId']
        }
    ]
});

export default Rating;