import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Friend = sequelize.define('friends', {
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    friendId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'pending'
    }
});


export default Friend;
