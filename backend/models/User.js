import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const User = sequelize.define('users', {
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
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  password: {
    type: DataTypes.STRING
  },
  email: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false
  },
  phoneNumber: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  avatar: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  avatarFileId: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  resetPasswordToken: {
    type: DataTypes.STRING,
    allowNull: true
  },
  resetPasswordExpires: {
    type: DataTypes.DATE,
    allowNull: true
  },
  provider: {
    type: DataTypes.STRING,
    allowNull: true
  },
  socialLinks: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {
      github: '',
      twitter: '',
      instagram: '',
      facebook: ''
    }
  },
  status: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  },
  lastActiveAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  deletedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: null
  },
  points: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  level: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
  },
  lastLoginStreakAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  currentDailyStreak: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  privacySettings: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {
      showFriendsList: 'public',
      showTimeline: 'public'
    }
  }
});

export default User;
