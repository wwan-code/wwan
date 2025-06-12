import { DataTypes, Op } from 'sequelize';
import sequelize from '../config/database.js';
import { generateSlug } from '../utils/slugUtils.js';
const Watchlist = sequelize.define('watchlists', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id'
        },
        onDelete: 'CASCADE'
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notEmpty: { msg: "Tên danh sách không được để trống." },
            len: { args: [1, 100], msg: "Tên danh sách phải từ 1 đến 100 ký tự." }
        }
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    isPublic: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false,
    },
    slug: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true,
    },
    type: {
        type: DataTypes.ENUM('movie', 'comic'),
        defaultValue: 'movie',
        allowNull: false,
    },
    coverImageUrl: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    likesCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    }
}, {
    timestamps: true,
    indexes: [
        { fields: ['userId'] },
        { fields: ['slug'], unique: true, name: 'unique_slug_if_not_null', where: { slug: { [Op.ne]: null } } }
    ]
});

Watchlist.beforeSave(async (list, options) => {
    if (list.isPublic && (list.changed('name') || (list.isNewRecord && !list.slug) || (list.changed('isPublic') && !list.slug) )) {
        let baseSlug = generateSlug(list.name);
        let uniqueSlug = baseSlug;
        let counter = 1;
        const queryOptions = options.transaction ? { transaction: options.transaction } : {};
        while (await Watchlist.findOne({ where: { slug: uniqueSlug, id: { [Op.ne]: list.id || null } }, ...queryOptions })) {
            uniqueSlug = `${baseSlug}-${counter}`;
            counter++;
        }
        list.slug = uniqueSlug;
    } else if (!list.isPublic && list.slug !== null) {
        list.slug = null;
    }
});


export default Watchlist;