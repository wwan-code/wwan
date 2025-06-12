import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Series = sequelize.define('series', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false,
    },
}, {
    timestamps: true,
});


export default Series;
