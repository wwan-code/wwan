// backend/controllers/collection.controller.js
import db from '../models/index.js';
import { handleServerError } from '../utils/errorUtils.js';
import { Op, Sequelize } from 'sequelize';

const UserList = db.Watchlist;
const User = db.User;
const Movie = db.Movie;
const Comic = db.Comic;
const Episode = db.Episode;
const Chapter = db.Chapter;
const WatchlistMovie = db.WatchlistMovie;
const WatchlistComic = db.WatchlistComic;

// Lấy danh sách các Collections công khai
export const getPublicCollections = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const offset = (page - 1) * limit;
    const searchTerm = req.query.q || '';
    const listType = req.query.type;
    const sortBy = req.query.sortBy || 'updatedAt';
    const sortOrder = req.query.sortOrder?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const whereClause = { isPublic: true };
    if (searchTerm) whereClause.name = { [Op.like]: `%${searchTerm}%` };
    if (listType && ['movie', 'comic'].includes(listType)) whereClause.type = listType;

    const order = [];
    const validSortFields = ['name', 'createdAt', 'updatedAt', 'likesCount'];
    if (validSortFields.includes(sortBy)) {
        order.push([sortBy, sortOrder]);
    } else if (sortBy === 'itemCount') {
        order.push(['updatedAt', sortOrder]);
    } else {
        order.push(['updatedAt', sortOrder]);
    }
    if (sortBy !== 'id') order.push(['id', 'DESC']);


    try {
        const { count, rows: collections } = await UserList.findAndCountAll({
            where: whereClause,
            attributes: {
                include: [
                    [Sequelize.literal(`(SELECT COUNT(*) FROM watchlist_movies AS wm WHERE wm.watchlistId = watchlists.id)`), 'movieCount'],
                    [Sequelize.literal(`(SELECT COUNT(*) FROM watchlist_comics AS wc WHERE wc.watchlistId = watchlists.id)`), 'comicCount'],
                ]
            },
            include: [
                { model: User, as: 'user', attributes: ['id', 'name', 'avatar', 'uuid'] },
                {
                    model: Movie, as: 'movies',
                    attributes: ['id', 'title', 'slug', 'bannerURL'],
                    through: { attributes: [] }, required: false, limit: 3,
                    order: [[WatchlistMovie, 'addedAt', 'DESC']]
                },
                {
                    model: Comic, as: 'comics',
                    attributes: ['id', 'title', 'slug', 'coverImage'],
                    through: { attributes: [] }, required: false, limit: 3,
                    order: [[WatchlistComic, 'addedAt', 'DESC']]
                }
            ],
            order: order,
            limit: limit,
            offset: offset,
            distinct: true,
            group: ['watchlists.id', 'user.id', 'movies.id', 'movies->watchlist_movies.id', 'comics.id', 'comics->watchlist_comics.id']
        });

        const totalPages = Math.ceil(count / limit);

        const collectionsWithItemCount = collections.map(col => {
            const colJson = col.toJSON();
            const movieCount = parseInt(colJson.movieCount, 10) || 0;
            const comicCount = parseInt(colJson.comicCount, 10) || 0;

            if (colJson.type === 'movie') {
                colJson.itemCount = movieCount;
            } else if (colJson.type === 'comic') {
                colJson.itemCount = comicCount;
            } else {
                colJson.itemCount = movieCount + comicCount;
            }
            return colJson;
        });

        res.status(200).json({
            success: true,
            collections: collectionsWithItemCount,
            pagination: { totalItems: count, totalPages, currentPage: page, itemsPerPage: limit }
        });
    } catch (error) {
        handleServerError(res, error, "Lấy danh sách Collections công khai");
    }
};

// Lấy chi tiết một Collection công khai bằng slug
export const getPublicCollectionBySlug = async (req, res) => {
    const { slug } = req.params;
    const itemPage = parseInt(req.query.itemPage) || 1;
    const itemLimit = parseInt(req.query.itemLimit) || 20;
    const itemOffset = (itemPage - 1) * itemLimit;

    try {
        const collection = await UserList.findOne({
            where: { slug, isPublic: true },
            include: [{ model: User, as: 'user', attributes: ['id', 'name', 'avatar', 'uuid'] }]
        });

        if (!collection) {
            return res.status(404).json({ success: false, message: "Không tìm thấy bộ sưu tập." });
        }

        let itemsInCollection = [];
        let totalItemsInCollection = 0;

        if (collection.type === 'movie') {
            itemsInCollection = await collection.getMovies({
                attributes: ['id', 'title', 'slug', 'bannerURL', 'year', 'subTitle', 'duration', 'quality', 'views', 'belongToCategory'],
                include: [
                    { model: Episode, as: 'Episodes', attributes: ['episodeNumber'], order: [['episodeNumber', 'DESC']], limit: 1 },
                    { model: WatchlistMovie, as: 'watchlist_movies', attributes: ['addedAt'] }
                ],
                joinTableAttributes: ['addedAt'],
                order: [[WatchlistMovie, 'addedAt', 'DESC']],
                limit: itemLimit,
                offset: itemOffset,
                distinct: true,
            });
            totalItemsInCollection = await collection.countMovies();
        } else if (collection.type === 'comic') {
            itemsInCollection = await collection.getComics({
                attributes: ['id', 'title', 'slug', 'coverImage', 'status', 'author', 'artist', 'lastChapterUpdatedAt', 'views', 'year'],
                include: [
                    { model: Chapter, as: 'chapters', attributes:['chapterNumber', 'title', 'id'], order: [['order', 'DESC']], limit: 1 },
                    { model: WatchlistComic, as: 'watchlist_comics', attributes: ['addedAt'] }
                ],
                joinTableAttributes: ['addedAt'],
                order: [[WatchlistComic, 'addedAt', 'DESC']],
                limit: itemLimit,
                offset: itemOffset,
                distinct: true,
            });
            totalItemsInCollection = await collection.countComics();
        }
        // TODO: Xử lý cho type 'mixed'
        // Nếu type là 'mixed', bạn sẽ cần lấy cả movies và comics, sau đó merge và sắp xếp chúng.
        // Ví dụ:
        // if (collection.type === 'mixed') {
        //     const movies = await collection.getMovies({ ... });
        //     const comics = await collection.getComics({ ... });
        //     // Thêm trường 'item_type' để phân biệt ở frontend
        //     const allItems = [
        //         ...movies.map(m => ({ ...m.toJSON(), item_type: 'movie', addedAt: m.watchlist_movies.addedAt })),
        //         ...comics.map(c => ({ ...c.toJSON(), item_type: 'comic', addedAt: c.watchlist_comics.addedAt }))
        //     ];
        //     // Sắp xếp theo addedAt (cần đảm bảo addedAt có cùng cấu trúc)
        //     allItems.sort((a, b) => new Date(b.addedAt) - new Date(a.addedAt));
        //     totalItemsInCollection = await collection.countMovies() + await collection.countComics();
        //     // Phân trang cho allItems
        //     itemsInCollection = allItems.slice(itemOffset, itemOffset + itemLimit);
        // }

        const totalItemPages = Math.ceil(totalItemsInCollection / itemLimit);

        res.status(200).json({
            success: true,
            collection: {
                ...collection.toJSON(),
                items: itemsInCollection,
                itemPagination: {
                    totalItems: totalItemsInCollection,
                    totalPages: totalItemPages,
                    currentPage: itemPage,
                    itemsPerPage: itemLimit
                }
            }
        });
    } catch (error) {
        handleServerError(res, error, `Lấy chi tiết bộ sưu tập ${slug}`);
    }
};