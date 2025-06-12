import { Op, Sequelize } from "sequelize";
import { handleServerError } from "../utils/errorUtils.js";
import db from '../models/index.js';
import sequelize from "../config/database.js";

const Movie = db.Movie;
const User = db.User;
const Comic = db.Comic;
const Episode = db.Episode;
const Chapter = db.Chapter;
const Section = db.Section;
const Series = db.Series;
const Favorite = db.Favorite;
const FollowMovie = db.FollowMovie;
const Genre = db.Genre;
const Country = db.Country;
const Category = db.Category;
const Rating = db.Rating;
const Role = db.Role;
const ShopItem = db.ShopItem;
const UserInventory = db.UserInventory;
const Friend = db.Friend;

export const getDashboard = async (req, res) => {
    try {
        const [movies, genres, countries, categories, episodes, users] = await Promise.all([
            Movie.findAll(),
            Genre.findAll(),
            Country.findAll(),
            Category.findAll(),
            Episode.findAll(),
            User.findAll(),
        ]);
        res.status(200).json({ movies, genres, countries, categories, episodes, users });
    } catch (error) {
        handleServerError(res, error, "Lấy dữ liệu dashboard");
    }
};

const COMMON_MOVIE_INCLUDES_FOR_CARD = [
    { model: Genre, as: 'genres', attributes: ['id', 'title', 'slug'], through: { attributes: [] }, required: false },
    { model: Country, as: 'countries', attributes: ['id', 'title', 'slug'], required: false },
    { model: Category, as: 'categories', attributes: ['id', 'title', 'slug'], required: false },
    {
        model: Episode,
        as: 'Episodes',
        attributes: ['id', 'episodeNumber'],
        order: [['episodeNumber', 'DESC']],
        limit: 1,
        required: false
    },
];

const COMMON_COMIC_INCLUDES_FOR_CARD = [
    { model: Genre, as: 'genres', attributes: ['id', 'title', 'slug'], through: { attributes: [] }, required: false },
    { model: Country, as: 'country', attributes: ['id', 'title', 'slug'], required: false },
    { model: Category, as: 'category', attributes: ['id', 'title', 'slug'], required: false },
    {
        model: Chapter,
        as: 'chapters',
        attributes: ['id', 'chapterNumber', 'title', 'order', 'createdAt'],
        order: [['order', 'DESC']],
        limit: 1,
        required: false
    },
];

export const getHomePageLayoutData = async (req, res) => {
    const {
        limitHero = 5,
        limitSidebar = 10,
        limitLatestMovies = 8,
        limitComics = 10,
        limitAnime = 8,
        limitTopSingleMovies = 4,
        limitTopSeriesMovies = 4,
    } = req.query;

    try {
        const twoWeeksAgo = new Date();
        twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
        twoWeeksAgo.setHours(0, 0, 0, 0);
        const featuredForHero = await Movie.findAll({
            where: {
                status: 1,
                updatedAt: { [Op.gte]: twoWeeksAgo },
            },
            order: [
                ['views', 'DESC'],
                ['updatedAt', 'DESC']
            ],
            limit: parseInt(limitHero, 10),
            include: [
                { model: Genre, as: 'genres', attributes: ['id', 'title', 'slug'], through: { attributes: [] }, required: false },
                { model: Country, as: 'countries', attributes: ['id', 'title', 'slug'], required: false },
                { model: Category, as: 'categories', attributes: ['id', 'title', 'slug'], required: false },
                { model: Episode, as: 'Episodes', attributes: ['id', 'episodeNumber'], order: [['episodeNumber', 'DESC']], limit: 1, required: false },
                { model: Rating, as: 'ratings', attributes: ['rating'], required: false }
            ],
            distinct: true,
        });

        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const featuredForSidebar = await Movie.findAll({
            where: {
                status: 1,
                updatedAt: { [Op.gte]: sevenDaysAgo }
            },
            order: [['views', 'DESC'], ['updatedAt', 'DESC']],
            limit: parseInt(limitSidebar, 10),
            attributes: ['id', 'title', 'slug', 'bannerURL', 'belongToCategory', 'totalEpisodes'],
            include: [
                { model: Episode, as: 'Episodes', attributes: ['episodeNumber'], order: [['episodeNumber', 'DESC']], limit: 1, required: false },
            ],
            distinct: true,
            subQuery: false,
        });

        const latestMovies = await Movie.findAll({
            where: { status: 1 },
            order: [['updatedAt', 'DESC'], ['createdAt', 'DESC']],
            limit: parseInt(limitLatestMovies, 10),
            include: COMMON_MOVIE_INCLUDES_FOR_CARD,
            distinct: true,
            subQuery: false,
        });

        const latestComics = await Comic.findAll({
            order: [['lastChapterUpdatedAt', 'DESC']],
            include: COMMON_COMIC_INCLUDES_FOR_CARD,
            limit: parseInt(limitComics, 10),
        });

        const popularComics = await Comic.findAll({
            order: [['views', 'DESC'], ['lastChapterUpdatedAt', 'DESC']],
            limit: parseInt(limitComics, 10),
            include: COMMON_COMIC_INCLUDES_FOR_CARD,
            distinct: true,
            subQuery: false,
        });

        const animeCategory = await Category.findOne({ where: { slug: 'anime' } });
        let trendingAnime = [];
        if (animeCategory) {
            trendingAnime = await Movie.findAll({
                where: {
                    categoryId: animeCategory.id,
                    status: 1
                },
                order: [['views', 'DESC'], ['updatedAt', 'DESC']],
                limit: parseInt(limitAnime, 10),
                include: COMMON_MOVIE_INCLUDES_FOR_CARD,
                distinct: true,
                subQuery: false,
            });
        }

        const singleMovieCategory = await Category.findOne({ where: { slug: 'phim-le' } });
        let topSingleMovies = [];
        if (singleMovieCategory) {
            topSingleMovies = await Movie.findAll({
                where: {
                    categoryId: singleMovieCategory.id,
                    belongToCategory: 0,
                },
                order: [['views', 'DESC'], ['createdAt', 'DESC']],
                limit: parseInt(limitTopSingleMovies, 10),
                include: COMMON_MOVIE_INCLUDES_FOR_CARD,
                distinct: true,
                subQuery: false,
            });
        } else {
            console.warn("Không tìm thấy Category 'Phim Lẻ'. Mục Top Single Movies có thể trống.");
        }

        const seriesMovieCategory = await Category.findOne({ where: { slug: 'phim-bo' } });
        let topSeriesMovies = [];
        if (seriesMovieCategory) {
            topSeriesMovies = await Movie.findAll({
                where: {
                    categoryId: seriesMovieCategory.id,
                    belongToCategory: 1,
                },
                order: [['views', 'DESC'], ['createdAt', 'DESC']],
                limit: parseInt(limitTopSeriesMovies, 10),
                include: COMMON_MOVIE_INCLUDES_FOR_CARD,
                distinct: true,
            });
        } else {
            console.warn("Không tìm thấy Category 'Phim Bộ'. Mục Top Series Movies có thể trống.");
        }

        res.status(200).json({
            success: true,
            data: {
                featuredForHero,
                featuredForSidebar,
                latestMovies,
                latestComics,
                popularComics,
                trendingAnime,
                topSingleMovies,
                topSeriesMovies,
            }
        });

    } catch (error) {
        handleServerError(res, error, "tải dữ liệu layout trang chủ");
    }
};

export const getPaginatedMovies = async (req, res) => {
    try {
        const page = parseInt(req.query.page || '1', 10);
        const limit = parseInt(req.query.limit || ITEMS_PER_MAIN_LIST, 10);
        const offset = (page - 1) * limit;
        const sortBy = req.query.sortBy || 'createdAt';
        const sortOrder = (req.query.sortOrder || 'DESC').toUpperCase();

        const orderOptions = [];
        if (sortBy === 'views') {
            orderOptions.push(['views', sortOrder]);
        } else {
            orderOptions.push(['createdAt', sortOrder]);
        }

        if (sortBy !== 'id') {
            orderOptions.push(['id', 'DESC']);
        }


        const { count, rows: movies } = await Movie.findAndCountAll({
            where: { status: 1 },
            include: COMMON_MOVIE_INCLUDES_FOR_CARD,
            order: orderOptions,
            limit: limit,
            offset: offset,
            distinct: true,
            subQuery: false,
        });

        const totalPages = Math.ceil(count / limit);

        res.status(200).json({
            success: true,
            movies,
            pagination: {
                totalItems: count,
                totalPages,
                currentPage: page,
                itemsPerPage: limit,
            },
        });
    } catch (error) {
        handleServerError(res, error, "tải danh sách phim phân trang");
    }
};

export const getGenre = async (req, res) => {
    try {
        const { slug } = req.params;
        const genre = await Genre.findOne({
            where: { slug },
            include: { model: Movie, include: { model: Episode } },
        });
        if (!genre) {
            return res.status(404).json({ success: false, message: 'Thể loại không tồn tại.' });
        }
        res.status(200).json({ success: true, genre });
    } catch (error) {
        handleServerError(res, error, `Lấy dữ liệu thể loại ${req.params.slug}`);
    }
}

export const getUserByUUID = async (req, res) => {
    try {
        const { uuid } = req.params;
        const viewingUserId = req.userId;
        const user = await User.findOne({
            where: { uuid, deletedAt: null },
            attributes: [
                'id', 'uuid', 'name', 'avatar', 'createdAt',
                'points', 'level', 'socialLinks', 'status', 'privacySettings'
            ],
            include: [
                {
                    model: Role,
                    as: 'roles',
                    attributes: ['name'],
                    through: { attributes: [] }
                },
                {
                    model: UserInventory,
                    as: 'inventory',
                    where: { isActive: true },
                    required: false,
                    attributes: ['id'],
                    include: [{
                        model: ShopItem,
                        as: 'itemDetails',
                        attributes: ['type', 'value'],
                        where: {
                            type: {
                                [Op.in]: ['AVATAR_FRAME', 'PROFILE_BACKGROUND', 'CHAT_COLOR']
                            }
                        },
                        required: true
                    }]
                }
            ]
        });

        if (!user) {
            return res.status(404).json({ success: false, message: "Người dùng không tồn tại." });
        }

        const userData = user.toJSON();
        userData.activeAvatarFrame = null;
        userData.activeChatColor = null;
        userData.activeProfileBackground = null;

        if (userData.inventory && Array.isArray(userData.inventory)) {
            userData.inventory.forEach(invItem => {
                if (invItem.itemDetails) {
                    switch (invItem.itemDetails.type) {
                        case 'AVATAR_FRAME':
                            userData.activeAvatarFrame = invItem.itemDetails.value;
                            break;
                        case 'CHAT_COLOR':
                            userData.activeChatColor = invItem.itemDetails.value;
                            break;
                        case 'PROFILE_BACKGROUND':
                            userData.activeProfileBackground = invItem.itemDetails.value;
                            break;
                    }
                }
            });
        }
        delete userData.inventory;

        if (userData.roles) {
            userData.roles = userData.roles.map(r => r.name);
        }
        const privacy = userData.privacySettings || { showFriendsList: 'public', showTimeline: 'public' };
        let canViewFriends = false;
        let canViewTimeline = false;

        if (viewingUserId === userData.id) {
            canViewFriends = true;
            canViewTimeline = true;
        } else {
            let areFriends = false;
            if (viewingUserId) {
                const friendship = await Friend.findOne({
                    where: {
                        status: 'accepted',
                        [Op.or]: [
                            { userId: viewingUserId, friendId: userData.id },
                            { userId: userData.id, friendId: viewingUserId }
                        ]
                    }
                });
                areFriends = !!friendship;
            }

            if (privacy.showFriendsList === 'public') canViewFriends = true;
            else if (privacy.showFriendsList === 'friends' && areFriends) canViewFriends = true;

            if (privacy.showTimeline === 'public') canViewTimeline = true;
            else if (privacy.showTimeline === 'friends' && areFriends) canViewTimeline = true;
        }

        userData.canViewFriends = canViewFriends;
        userData.canViewTimeline = canViewTimeline;

        res.status(200).json({ success: true, user: userData });

    } catch (error) {
        handleServerError(res, error, `Lấy thông tin người dùng ${req.params.uuid}`);
    }
};

export const getTheatricalFilms = async (req, res) => {
    try {
        const page = parseInt(req.query.page || '1', 10);
        const limit = parseInt(req.query.limit || '30', 10);
        const offset = (page - 1) * limit;

        const { count, rows } = await Movie.findAndCountAll({
            where: { categoryId: 3 },
            order: [['createdAt', 'DESC']],
            limit: limit,
            offset: offset,
            include: [
                { model: Episode, attributes: ['episodeNumber'], order: [['episodeNumber', 'DESC']], limit: 1 },
                { model: Genre, attributes: ['id', 'title', 'slug'], through: { attributes: [] } },
                { model: Country, as: 'countries', attributes: ['id', 'title'] },
                { model: Category, as: 'categories', attributes: ['id', 'title'] },
            ],
            distinct: true
        });

        const totalPages = Math.ceil(count / limit);
        res.status(200).json({
            success: true,
            movies: rows,
            pagination: { totalItems: count, totalPages, currentPage: page, itemsPerPage: limit }
        });
    } catch (error) {
        handleServerError(res, error, 'Lấy danh sách phim chiếu rạp');
    }
};

export const getNewlyUpdatedMovies = async (req, res) => {
    try {
        const movies = await Movie.findAll({
            order: [['createdAt', 'DESC']],
            include: [
                { model: Episode },
                { model: Section, as: 'sections' },
                { model: Genre, attributes: ['id', 'title'] },
            ],
        });
        res.status(200).json(movies);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching theatrical films' });
    }

}

export const getPlayMovie = async (req, res) => {
    const userId = req.userId;
    try {
        const { slug } = req.params;
        const { t } = req.query;
        const movie = await Movie.findOne({
            where: { slug },
            include: [
                { model: Genre, as: 'genres', attributes: ['id', 'title', 'slug'] },
                { model: Country, as: 'countries' },
                { model: Category, as: 'categories' },
                { model: Episode },
                { model: Section, as: 'sections' },
                { model: Series, as: 'series', attributes: ['id', 'title'] },
            ],
        });

        if (!movie) {
            return res.status(404).json({ success: false, message: 'Phim không tồn tại.' });
        }

        Movie.increment('views', { where: { id: movie.id } }).catch(err => console.error("Failed to increment views:", err));

        const episodeNumber = parseInt(t, 10);
        const episode = movie.Episodes?.find(ep => ep.episodeNumber === episodeNumber);
        if (!episode) {
            return res.status(404).json({ success: false, message: `Tập ${episodeNumber} không tồn tại cho phim này.` });
        }
        const genres = movie.genres?.map(genre => genre.id) || [];

        const [genreMovies, seriesMoviesData, totalFavorites, totalFavoritesByEpisode, favoriteResult, followResult] = await Promise.all([
            Movie.findAll({
                where: {
                    id: { [Op.ne]: movie.id },
                    categoryId: movie.categoryId,
                    '$genres.id$': { [Op.in]: genres }
                },
                include: [
                    { model: Genre, as: 'genres', attributes: [], through: { attributes: [] }, required: true }, // Join bắt buộc
                    { model: Episode, attributes: ['episodeNumber'], order: [['episodeNumber', 'DESC']], limit: 1 } // Include cần thiết để hiển thị card
                ],
                limit: 10,
                distinct: true, // Cần thiết khi include many-to-many và limit
                subQuery: false // Có thể cần tùy cấu trúc query phức tạp
            }),

            movie.seriesId ? Movie.findAll({
                where: { seriesId: movie.seriesId, id: { [Op.ne]: movie.id } }, // Loại trừ phim hiện tại
                include: [{ model: Episode, attributes: ['episodeNumber'], order: [['episodeNumber', 'DESC']], limit: 1 }],
            }) : Promise.resolve([]),

            Favorite.count({ where: { movieId: movie.id } }),
            Favorite.count({ where: { episodeId: episode.id } }),

            userId ? Favorite.findOne({ where: { userId: userId, episodeId: episode.id } }) : Promise.resolve(null),

            userId ? FollowMovie.findOne({ where: { userId: userId, movieId: movie.id } }) : Promise.resolve(null),
        ]);
        const similarMovies = genreMovies;
        const seriesMovie = seriesMoviesData;
        res.status(200).json({
            success: true,
            movie,
            episode,
            similarMovies,
            seriesMovie,
            totalFavorites,
            totalFavoritesByEpisode,
            isFavorite: favoriteResult !== null, // True nếu tìm thấy bản ghi
            isFollow: followResult !== null, // True nếu tìm thấy bản ghi
            genreMovies
        });
    } catch (error) {
        handleServerError(res, error, `Lấy dữ liệu xem phim ${req.params.slug}`);
    }
}

export const getAlbumMovie = async (req, res) => {
    const userId = req.userId;
    try {
        const { slug } = req.params;
        const movie = await Movie.findOne({
            where: { slug }, include: [
                { model: Genre, as: 'genres', attributes: ['id', 'title', 'slug'] },
                { model: Country, as: 'countries' },
                { model: Category, as: 'categories' },
                { model: Episode },
                { model: Section, as: 'sections' },
                { model: Series, as: 'series', attributes: ['id', 'title'] },
                { model: Rating, as: 'ratings', attributes: ['rating'] }
            ]
        });
        if (!movie) return res.status(404).json({ error: 'Phim không tồn tại' });

        let averageRating = 0;
        if (movie.ratings && movie.ratings.length > 0) {
            const sum = movie.ratings.reduce((acc, rating) => acc + (rating.rating || 0), 0);
            averageRating = sum / movie.ratings.length;
        }

        const episode = movie.Episodes?.find(ep => ep.episodeNumber === 1);
        const genres = movie.genres?.map(genre => genre.id) || [];
        const [genreMovies, seriesMoviesData, totalFollows, followResult] = await Promise.all([
            Movie.findAll({
                where: {
                    id: { [Op.ne]: movie.id },
                    categoryId: movie.categoryId,
                    '$genres.id$': { [Op.in]: genres }
                },
                include: [
                    { model: Genre, as: 'genres', attributes: [], through: { attributes: [] }, required: true },
                    { model: Episode, attributes: ['episodeNumber'], order: [['episodeNumber', 'DESC']], limit: 1 }
                ],
                limit: 10,
                distinct: true,
                subQuery: false
            }),
            movie.seriesId ? Movie.findAll({ // Phim cùng series
                where: { seriesId: movie.seriesId, id: { [Op.ne]: movie.id } },
                include: [{ model: Episode, attributes: ['episodeNumber'], order: [['episodeNumber', 'DESC']], limit: 1 }],
            }) : Promise.resolve([]),
            FollowMovie.count({ where: { movieId: movie.id } }),
            userId ? FollowMovie.findOne({ where: { userId: userId, movieId: movie.id } }) : Promise.resolve(null),
        ]);
        const similarMovies = genreMovies;
        const seriesMovie = seriesMoviesData;
        res.status(200).json({
            success: true,
            movie,
            averageRating: averageRating,
            episode,
            similarMovies,
            seriesMovie,
            isFollowed: followResult !== null,
            totalFollows
        });
    } catch (error) {
        res.status(500).json({ error });
    }
}

export const searchMovies = async (req, res) => {
    const { q } = req.query;

    if (!q) {
        return res.status(400).json({ message: 'Vui lòng nhập từ khóa để tìm kiếm!' });
    }

    try {
        const movies = await Movie.findAll({
            where: {
                [Op.or]: [
                    { title: { [Op.like]: `%${q}%` } },
                    { subTitle: { [Op.like]: `%${q}%` } }
                ]
            },
            include: { model: Episode, attributes: ['id', 'episodeNumber'] }
        });

        res.status(200).json(movies);
    } catch (error) {
        handleServerError(res, error, `Tìm kiếm phim với từ khóa "${q}"`);
    }
};

export const setFilter = async (req, res) => {
    try {
        const filters = req.body;
        const page = parseInt(req.query.page || '1', 10);
        const limit = parseInt(req.query.limit || '30', 10);
        const offset = (page - 1) * limit;

        const options = {
            where: {},
            include: [
                { model: Genre, as: 'genres', attributes: ['id', 'title', 'slug'], through: { attributes: [] } },
                { model: Country, as: 'countries', attributes: ['id', 'title', 'slug'] },
                { model: Category, as: 'categories', attributes: ['id', 'title', 'slug'] },
                { model: Episode, attributes: ['id', 'episodeNumber'] }, // Chỉ lấy field cần thiết
                { model: Section, as: 'sections', attributes: ['id', 'title'] },
            ],
            distinct: true,
            limit: limit,
            offset: offset,
            order: [],
        };

        const whereClause = {};

        if (filters.region) {
            whereClause.countryId = filters.region;
        }

        if (filters.genre) {
            // options.include.push({
            //     model: Genre,
            //     where: { id: filters.genre },
            //     attributes: [], // Không cần lấy lại attributes của Genre ở đây
            //     through: { attributes: [] },
            //     required: true // INNER JOIN để chỉ lấy phim có genre này
            // });
            // Hoặc nếu đã include Genre ở trên, sửa nó:
            const genreInclude = options.include.find(inc => inc.model === Genre);
            if (genreInclude) {
                genreInclude.where = { id: filters.genre };
                genreInclude.required = true;
            }
        }

        // Lọc theo Năm (Year)
        if (filters.year) {
            const yearValue = filters.year;
            if (typeof yearValue === 'string' && yearValue.includes('-')) {
                const [startYear, endYear] = yearValue.split('-').map(Number);
                if (!isNaN(startYear) && !isNaN(endYear)) {
                    whereClause.year = { [Op.between]: [startYear, endYear] };
                }
            } else {
                const singleYear = parseInt(yearValue, 10);
                if (!isNaN(singleYear)) {
                    whereClause.year = singleYear;
                }
            }
        }

        // Lọc theo Mùa (Season) - Dùng hàm của DB
        if (filters.season) {
            const seasonMonths = {
                'Xuân': [3, 4, 5], 'Hạ': [6, 7, 8],
                'Thu': [9, 10, 11], 'Đông': [12, 1, 2]
            };
            const months = seasonMonths[filters.season];
            if (months) {
                whereClause[Op.and] = whereClause[Op.and] || [];
                whereClause[Op.and].push(
                    Sequelize.where(
                        Sequelize.fn('MONTH', Sequelize.col('releaseDate')),
                        { [Op.in]: months }
                    )
                );
            }
        }

        options.where = whereClause;

        if (filters.order) {
            if (filters.order === 'Hot') {
                options.order.push(['views', 'DESC']);
            } else if (filters.order === 'Mới nhất') {
                options.order.push(['createdAt', 'DESC']);
            }
        }
        if (options.order.length === 0) {
            options.order.push(['createdAt', 'DESC']);
        }

        const { count, rows } = await Movie.findAndCountAll(options);

        const totalPages = Math.ceil(count / limit);

        res.status(200).json({
            movies: rows,
            pagination: {
                totalItems: count,
                totalPages: totalPages,
                currentPage: page,
                itemsPerPage: limit
            }
        });

    } catch (error) {
        console.error('Error in setFilter:', error);
        res.status(500).json({ message: 'Lỗi khi lọc phim.', error: error.message });
    }
};

export const getFilters = async (req, res) => {
    try {
        const [genres, countries, categories] = await Promise.all([
            Genre.findAll(),
            Country.findAll(),
            Category.findAll()
        ]);

        const currentYear = new Date().getFullYear();
        const years = Array.from({ length: currentYear - 1990 + 1 }, (_, i) => 1990 + i);

        let filteredData = { genres, countries, categories, years };
        res.status(200).json(filteredData);

    } catch (error) {
        res.status(500).json({ error: 'Error fetching dashboard' });
    }
}

export const getPrevailingMovies = async (req, res) => {
    try {
        const page = parseInt(req.query.page || '1', 10);
        const limit = parseInt(req.query.limit || '12', 10);
        const offset = (page - 1) * limit;
        const categoryTitle = req.query.category;

        const whereClause = {};
        const includeOptions = [
            { model: Genre, as: 'genres', attributes: ['id', 'title', 'slug'], through: { attributes: [] } },
            { model: Country, as: 'countries', attributes: ['id', 'title', 'slug'] },
            { model: Category, as: 'categories', attributes: ['id', 'title', 'slug'] },
            { model: Episode, as: 'Episodes', attributes: ['episodeNumber'], order: [['episodeNumber', 'DESC']], limit: 1 },
        ];

        // Nếu có query param category, thì lọc theo category đó
        if (categoryTitle) {
            // Cần tìm categoryId dựa trên categoryTitle hoặc slug
            // Hoặc tốt hơn là client gửi categoryId/categorySlug
            // Ví dụ: Nếu client gửi categorySlug
            const categorySlug = req.query.categorySlug;
            if (categorySlug) {
                const category = await Category.findOne({ where: { slug: categorySlug }, attributes: ['id'] });
                if (category) {
                    whereClause.categoryId = category.id;
                } else {
                    // Nếu không tìm thấy category theo slug, có thể trả về lỗi hoặc không lọc
                    console.warn(`Category with slug "${categorySlug}" not found.`);
                }
            } else { // Hoặc nếu client gửi categoryTitle (cần đảm bảo title là unique hoặc xử lý nhiều kết quả)
                const category = await Category.findOne({ where: { title: categoryTitle }, attributes: ['id'] });
                if (category) {
                    whereClause.categoryId = category.id;
                }
            }
            // Cập nhật include để đảm bảo category được join đúng
            const categoryInclude = includeOptions.find(inc => inc.model === Category);
            if (categoryInclude) {
                categoryInclude.required = true; // INNER JOIN để đảm bảo phim thuộc category này
            }
        }
        // Nếu không có categoryTitle, sẽ lấy phim thịnh hành chung

        const { count, rows: prevailingMovies } = await Movie.findAndCountAll({
            where: whereClause,
            order: [
                ['views', 'DESC'],      // Sắp xếp chính theo lượt xem giảm dần
                ['updatedAt', 'DESC'],  // Sắp xếp phụ theo ngày cập nhật mới nhất
                ['createdAt', 'DESC']   // Rồi đến ngày tạo mới nhất
            ],
            limit,
            offset,
            include: includeOptions,
            distinct: true, // Cần thiết khi include many-to-many và có limit/order
            subQuery: false // Thường cần cho limit/offset với include phức tạp và order
        });

        const totalPages = Math.ceil(count / limit);

        res.status(200).json({
            success: true,
            movies: prevailingMovies,
            pagination: {
                totalItems: count,
                totalPages,
                currentPage: page,
                itemsPerPage: limit,
                currentFilter: categoryTitle || 'Tất cả' // Thông tin bộ lọc hiện tại
            }
        });
    } catch (error) {
        handleServerError(res, error, 'Lấy phim thịnh hành');
    }
};

export const getAnime = async (req, res) => {
    try {
        const { page = 1, limit = 30 } = req.query;
        const offset = (page - 1) * limit;
        const { count, rows } = await Movie.findAndCountAll({
            where: { '$categories.title$': 'Anime' },
            order: [['views', 'DESC']],
            limit: parseInt(limit, 10),
            offset: parseInt(offset, 10),
            include: [
                { model: Genre, as: 'genres', attributes: ['id', 'title'], through: { attributes: [] } },
                { model: Country, as: 'countries' },
                { model: Category, as: 'categories', attributes: [], required: true },
                { model: Episode, attributes: ['episodeNumber'], order: [['episodeNumber', 'DESC']], limit: 1 },
            ],
            distinct: true,
            subQuery: false
        });

        const totalPages = Math.ceil(count / limit);
        res.status(200).json({
            success: true,
            movies: rows,
            pagination: { totalItems: count, totalPages, currentPage: parseInt(page, 10), itemsPerPage: parseInt(limit, 10) }
        });
    } catch (error) {
        handleServerError(res, error, 'Lấy danh sách phim Anime');
    }
};

export const searchMulti = async (req, res) => {
    const { q, limit = 10 } = req.query;

    if (!q || q.trim() === "") {
        return res.status(400).json({ success: false, message: "Từ khóa tìm kiếm không được để trống." });
    }

    const searchTerm = q.trim();
    const searchLimit = parseInt(limit, 10);

    try {
        const movies = await Movie.findAll({
            where: {
                [Op.or]: [
                    { title: { [Op.like]: `%${searchTerm}%` } },
                    { subTitle: { [Op.like]: `%${searchTerm}%` } },
                ],
                status: 1,
            },
            limit: searchLimit,
            attributes: ['id', 'title', 'subTitle', 'slug', 'posterURL', 'year'],
            order: [
                ['views', 'DESC'],
                ['updatedAt', 'DESC']
            ]
        });

        const comics = await Comic.findAll({
            where: {
                [Op.or]: [
                    { title: { [Op.like]: `%${searchTerm}%` } }
                ],
            },
            limit: searchLimit,
            attributes: ['id', 'title', 'slug', 'coverImage', 'status', 'updatedAt'],
            order: [
                ['views', 'DESC'],
                ['updatedAt', 'DESC']
            ]
        });

        const combinedResults = [
            ...movies.map(movie => ({ ...movie.toJSON(), itemType: 'movie' })),
            ...comics.map(comic => ({ ...comic.toJSON(), itemType: 'comic' }))
        ];

        combinedResults.sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));

        const finalResults = combinedResults.slice(0, searchLimit);

        res.status(200).json({
            success: true,
            results: finalResults,
        });

    } catch (error) {
        console.error("SearchMulti Error:", error);
        handleServerError(res, error, "Lỗi khi tìm kiếm đa năng");
    }
};

export const getMovieReviews = async (req, res) => {
    const { movieId } = req.params;
    const page = parseInt(req.query.page || '1', 10);
    const limit = parseInt(req.query.limit || '10', 10);
    const sort = req.query.sort || 'newest';
    const offset = (page - 1) * limit;

    const orderOptions = [];
    switch (sort) {
        case 'rating_desc':
            orderOptions.push(['rating', 'DESC']);
            break;
        case 'rating_asc':
            orderOptions.push(['rating', 'ASC']);
            break;
        case 'likes_desc':
            orderOptions.push([sequelize.literal('JSON_LENGTH(likes)'), 'DESC']);
            break;
        case 'newest':
        default:
            orderOptions.push(['createdAt', 'DESC']);
            break;
    }
    // Thêm order phụ để đảm bảo ổn định
    if (!orderOptions.some(o => o[0] === 'createdAt')) {
        orderOptions.push(['createdAt', 'DESC']);
    }

    try {
        const { count, rows } = await Rating.findAndCountAll({
            where: {
                movieId: movieId,
                reviewContent: { [Op.ne]: null, [Op.ne]: '' },
                isApproved: true
            },
            include: [{
                model: User,
                as: 'user',
                attributes: ['id', 'name', 'avatar']
            }],
            order: orderOptions,
            limit: limit,
            offset: offset,
            distinct: true
        });

        const totalPages = Math.ceil(count / limit);

        res.status(200).json({
            success: true,
            reviews: rows,
            pagination: {
                totalItems: count,
                totalPages: totalPages,
                currentPage: page,
                itemsPerPage: limit,
                currentSort: sort
            }
        });

    } catch (error) {
        handleServerError(res, error, `Lấy reviews cho phim ID ${movieId}`);
    }
};

export const getMyReviewForMovie = async (req, res) => {
    const userId = req.userId;
    const { movieId } = req.params;

    if (!movieId) {
        return res.status(400).json({ success: false, message: 'Thiếu thông tin movieId.' });
    }

    try {
        const rating = await Rating.findOne({
            where: {
                userId: userId,
                movieId: movieId
            },
        });

        if (rating) {
            let ratingObj = rating.toJSON ? rating.toJSON() : rating;
            if (ratingObj.likes && typeof ratingObj.likes === 'string') {
                try {
                    ratingObj.likes = JSON.parse(ratingObj.likes);
                } catch {
                    ratingObj.likes = [];
                }
            }
            if (!Array.isArray(ratingObj.likes)) {
                ratingObj.likes = [];
            }
            res.status(200).json({
                success: true,
                rating: ratingObj
            });
        } else {
            res.status(200).json({
                success: true,
                rating: null
            });
        }

    } catch (error) {
        handleServerError(res, error, `Lấy đánh giá của bạn cho phim ID ${movieId}`);
    }
};