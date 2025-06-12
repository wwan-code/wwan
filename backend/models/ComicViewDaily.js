// models/ComicViewDaily.js
import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const ComicViewDaily = sequelize.define(
    "comic_view_daily",
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
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
        viewDate: {
            type: DataTypes.DATEONLY,
            allowNull: false,
        },
        count: {
            type: DataTypes.INTEGER,
            defaultValue: 1,
            allowNull: false,
        },
    },
    {
        timestamps: false,
        indexes: [
            { unique: true, fields: ["comicId", "viewDate"] },
            { fields: ["comicId"] },
            { fields: ["viewDate"] },
        ],
        tableName: "comic_view_daily",
    }
);

export default ComicViewDaily;