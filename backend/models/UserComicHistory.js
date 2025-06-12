import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const UserComicHistory = sequelize.define(
    "user_comic_history",
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: "users",
                key: "id",
            },
            onDelete: "CASCADE",
        },
        comicId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: "comics",
                key: "id",
            },
            onDelete: "CASCADE",
        },
        lastReadAt: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
        },
        lastChapterId: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: "chapters",
                key: "id",
            },
            onDelete: "SET NULL",
        },
    },
    {
        timestamps: false,
        indexes: [
            { unique: true, fields: ["userId", "comicId"] },
            { fields: ["userId"] },
            { fields: ["comicId"] },
        ],
        tableName: "user_comic_history",
    }
);

export default UserComicHistory;