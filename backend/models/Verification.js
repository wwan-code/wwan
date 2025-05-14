import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Verification = sequelize.define('verifications', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    email: {
        type: DataTypes.STRING,
        unique: true,
    },
    verificationCode: {
        type: DataTypes.STRING,
    },
    expires: {
        type: DataTypes.DATE,
    },
}, {
    timestamps: false,
});

export default Verification;
