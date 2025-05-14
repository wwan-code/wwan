import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import Series from './Series.js';

const Section = sequelize.define('sections', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    order: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    movieId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'movies',
            key: 'id',
        },
    },
    seriesId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'series',
            key: 'id',
        },
    },
}, {
    timestamps: true,
});

Series.hasMany(Section, { foreignKey: 'seriesId' });
Section.belongsTo(Series, { foreignKey: 'seriesId' });

export default Section;
