import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Session = sequelize.define('Session', {
    sid: {
        type: DataTypes.STRING,
        primaryKey: true
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    expires: DataTypes.DATE,
    data: DataTypes.TEXT
}, {
    tableName: 'Sessions',
    timestamps: false
});

export default Session;