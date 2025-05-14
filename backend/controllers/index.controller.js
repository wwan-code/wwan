import { col, fn, literal, Op } from "sequelize";
import sequelize from '../config/database.js';
import Category from "../models/Category.js";
import Country from "../models/Country.js";
import Episode from "../models/Episode.js";
import Genre from "../models/Genre.js";
import Movie from "../models/Movie.js";
import Section from "../models/Section.js";
import Series from "../models/Series.js";
import User from "../models/User.js";
import FollowMovie from "../models/FollowMovie.js";
import Favorite from "../models/Favorite.js";
import Rating from "../models/Rating.js";
import { handleServerError } from "../utils/errorUtils.js";

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

export const getHome = async (req, res) => {
    try {
        const filter = req.query.filter;
        const page = parseInt(req.query.page || '1', 10);
        const limit = parseInt(req.query.limit || '20', 10);
        const offset = (page - 1) * limit;

        const startOfWeek = new Date();
        startOfWeek.setDate(startOfWeek.getDate() - 7);
        startOfWeek.setHours(0, 0, 0, 0);

        const featuredMovies = await Movie.findAll({
            where: {
                updatedAt: { [Op.gte]: startOfWeek },
                // views: { [Op.gt]: 0 }
            },
            order: [['views', 'DESC']],
            limit: 10,
            include: [ // Include các association cần thiết để hiển thị card
                { model: Genre, attributes: ['id', 'title', 'slug'], through: { attributes: [] } },
                { model: Country, as: 'countries', attributes: ['id', 'title'] },
                { model: Category, as: 'categories', attributes: ['id', 'title'] },
                { model: Episode, attributes: ['episodeNumber'], order: [['episodeNumber', 'DESC']], limit: 1 },
                { model: Rating, attributes: ['id', 'rating'], as: 'ratings' },
            ]
        });

        // --- Lấy Danh sách Phim Chính (Theo filter và phân trang) ---
        const mainListOptions = {
            where: {},
            include: [
                { model: Genre, attributes: ['id', 'title', 'slug'], through: { attributes: [] } },
                { model: Country, as: 'countries', attributes: ['id', 'title'] },
                { model: Category, as: 'categories', attributes: ['id', 'title'] },
                { model: Episode, attributes: ['episodeNumber'], order: [['episodeNumber', 'DESC']], limit: 1 },
            ],

            // Sequelize có thể tự xử lý distinct khi dùng findAndCountAll và include many-to-many
            distinct: true,
            limit: limit,
            offset: offset,
            order: [],
        };

        // Áp dụng filter cho danh sách chính
        if (filter === 'comming-soon') {
            mainListOptions.where.premiere = { [Op.gt]: new Date() };
            mainListOptions.order.push(['premiere', 'ASC']); // Sắp xếp phim sắp chiếu gần nhất trước
        } else if (filter === 'recently-released') {
            // Ví dụ: Phim công chiếu trong 30 ngày gần nhất
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            mainListOptions.where.premiere = { [Op.gte]: thirtyDaysAgo };
            mainListOptions.order.push(['premiere', 'DESC']); // Phim mới nhất lên đầu
        } else { // Mặc định hoặc filter === 'latest'
            mainListOptions.order.push(['createdAt', 'DESC']);
        }

        // Thêm order phụ để đảm bảo thứ tự nhất quán
        if (!mainListOptions.order.some(o => o[0] === 'createdAt')) {
            mainListOptions.order.push(['createdAt', 'DESC']);
        }


        const { count, rows: filteredMovies } = await Movie.findAndCountAll(mainListOptions);

        const totalPages = Math.ceil(count / limit);

        res.status(200).json({
            success: true,
            featuredMovies: featuredMovies, // Danh sách phim nổi bật (luôn có)
            filteredMovies: filteredMovies, // Danh sách phim chính đã lọc và phân trang
            pagination: {
                totalItems: count,
                totalPages: totalPages,
                currentPage: page,
                itemsPerPage: limit
            }
        });

    } catch (error) {
        handleServerError(res, error, "Tải dữ liệu trang chủ");
    }
};
export const getGenre = async (req, res) => {
    try {
        const { slug } = req.params;
        const genre = await Genre.findOne({
            where: { slug },
            include: { model: Movie, include: { model: Episode } }, // Include cần thiết
        });
        if (!genre) {
            return res.status(404).json({ success: false, message: 'Thể loại không tồn tại.' });
        }
        res.status(200).json({ success: true, genre }); // Trả về genre trong object
    } catch (error) {
        handleServerError(res, error, `Lấy dữ liệu thể loại ${req.params.slug}`);
    }
}

export const getUserByUUID = async (req, res) => {
    try {
        const { uuid } = req.params;
        const user = await User.findOne({
            where: { uuid },
            attributes: ['id', 'name', 'email', 'googleId', 'avatar', 'createdAt', 'status'], // Thêm status nếu cần
        });
        if (!user) {
            // Trả về JSON chuẩn hóa
            return res.status(404).json({ success: false, message: "Người dùng không tồn tại." });
        } else {
            // Trả về JSON chuẩn hóa
            res.status(200).json({ success: true, user });
        }
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
                { model: Genre, attributes: ['id', 'title', 'slug'] },
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

        // Thực hiện các truy vấn song song
        const [genreMovies, seriesMoviesData, totalFavorites, totalFavoritesByEpisode, favoriteResult, followResult] = await Promise.all([
            // Lấy các phim cùng thể loại
            Movie.findAll({
                where: {
                    id: { [Op.ne]: movie.id }, // Loại trừ phim hiện tại
                    categoryId: movie.categoryId, // Cùng category
                    '$genres.id$': { [Op.in]: genres } // Lọc theo genre IDs
                },
                include: [
                    { model: Genre, as: 'genres', attributes: [], through: { attributes: [] }, required: true }, // Join bắt buộc
                    { model: Episode, attributes: ['episodeNumber'], order: [['episodeNumber', 'DESC']], limit: 1 } // Include cần thiết để hiển thị card
                ],
                limit: 10,
                distinct: true, // Cần thiết khi include many-to-many và limit
                subQuery: false // Có thể cần tùy cấu trúc query phức tạp
            }),

            // Phim cùng series (nếu có seriesId)
            movie.seriesId ? Movie.findAll({
                where: { seriesId: movie.seriesId, id: { [Op.ne]: movie.id } }, // Loại trừ phim hiện tại
                include: [{ model: Episode, attributes: ['episodeNumber'], order: [['episodeNumber', 'DESC']], limit: 1 }],
            }) : Promise.resolve([]),

            // Đếm số lượng yêu thích
            Favorite.count({ where: { movieId: movie.id } }),
            Favorite.count({ where: { episodeId: episode.id } }),

            // Kiểm tra người dùng có yêu thích tập này không
            userId ? Favorite.findOne({ where: { userId: userId, episodeId: episode.id } }) : Promise.resolve(null),

            // Kiểm tra người dùng có theo dõi phim này không
            userId ? FollowMovie.findOne({ where: { userId: userId, movieId: movie.id } }) : Promise.resolve(null),
        ]);
        // Lọc kết quả trả về
        const similarMovies = genreMovies; // Đã lọc trong query
        const seriesMovie = seriesMoviesData; // Đã lọc trong query
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
                { model: Genre, attributes: ['id', 'title', 'slug'] },
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
            movie, // Trả về movie đầy đủ với episodes đã sắp xếp
            averageRating: averageRating,
            episode, // Bỏ episode riêng lẻ nếu không cần tập đầu nữa
            similarMovies, // Đổi tên từ genreMovies cho rõ
            seriesMovie, // Đổi tên từ series cho rõ
            isFollowed: followResult !== null, // isFollowed dựa trên kết quả tìm kiếm
            totalFollows
        });
    } catch (error) {
        res.status(500).json({ error });
    }
}

export const searchMovies = async (req, res) => {
    const { q } = req.query;

    if (!q) {
        return res.status(400).json({ message: 'Please enter a keyword to search' });
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
        const filters = req.body; // { region, genre, year, season, order }
        const page = parseInt(req.query.page || '1', 10);
        const limit = parseInt(req.query.limit || '30', 10); // Giới hạn mặc định 30 phim/trang
        const offset = (page - 1) * limit;

        const options = {
            where: {},
            include: [
                // Include cần thiết để hiển thị và có thể để lọc (nếu cần join)
                { model: Genre, attributes: ['id', 'title', 'slug'], through: { attributes: [] } }, // Bỏ qua bảng trung gian nếu dùng belongsToMany
                { model: Country, as: 'countries', attributes: ['id', 'title', 'slug'] },
                { model: Category, as: 'categories', attributes: ['id', 'title', 'slug'] },
                { model: Episode, attributes: ['id', 'episodeNumber'] }, // Chỉ lấy field cần thiết
                { model: Section, as: 'sections', attributes: ['id', 'title'] },
            ],
            distinct: true, // Quan trọng khi include many-to-many để count không bị sai
            limit: limit,
            offset: offset,
            order: [], // Sẽ được thêm vào bên dưới
        };

        // --- Xây dựng điều kiện WHERE động ---
        const whereClause = {};

        // Lọc theo Quốc gia (Country)
        if (filters.region) {
            // Giả sử khóa ngoại trong Movie là countryId
            whereClause.countryId = filters.region;
        }

        // Lọc theo Thể loại (Genre) - Dùng include where
        if (filters.genre) {
            options.include.push({
                model: Genre,
                where: { id: filters.genre },
                attributes: [], // Không cần lấy lại attributes của Genre ở đây
                through: { attributes: [] },
                required: true // INNER JOIN để chỉ lấy phim có genre này
            });
            // Hoặc nếu đã include Genre ở trên, sửa nó:
            // const genreInclude = options.include.find(inc => inc.model === Genre);
            // if (genreInclude) {
            //     genreInclude.where = { id: filters.genre };
            //     genreInclude.required = true;
            // }
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
                // Sử dụng fn('EXTRACT', ...) hoặc hàm tương ứng với DB của bạn
                // Ví dụ cho PostgreSQL/MySQL:
                whereClause[Op.and] = whereClause[Op.and] || []; // Khởi tạo mảng AND nếu chưa có
                whereClause[Op.and].push(
                    // Giả định 'premiere' là cột kiểu DATE/DATETIME
                    fn('EXTRACT', literal('MONTH FROM premiere')),
                    { [Op.in]: months }
                );
                // Cách khác an toàn hơn nếu dùng Sequelize v6+:
                // whereClause[Op.and].push(
                //     sequelize.where(fn('EXTRACT', literal('MONTH FROM premiere')), Op.in, months)
                // );
            }
        }

        options.where = whereClause;

        // --- Xây dựng điều kiện ORDER ---
        if (filters.order) {
            if (filters.order === 'Hot') {
                options.order.push(['views', 'DESC']);
            } else if (filters.order === 'Mới nhất') {
                options.order.push(['createdAt', 'DESC']);
            }
            // Thêm các điều kiện order khác nếu cần
        }
        // Thêm order mặc định nếu không có order nào được chỉ định
        if (options.order.length === 0) {
            options.order.push(['createdAt', 'DESC']);
        }

        // --- Thực hiện truy vấn ---
        const { count, rows } = await Movie.findAndCountAll(options);

        // --- Tính toán thông tin phân trang ---
        const totalPages = Math.ceil(count / limit);

        // --- Trả về kết quả ---
        res.status(200).json({
            movies: rows, // Dữ liệu phim cho trang hiện tại
            pagination: {
                totalItems: count, // Tổng số phim khớp bộ lọc
                totalPages: totalPages,
                currentPage: page,
                itemsPerPage: limit
            }
        });

    } catch (error) {
        console.error('Error in setFilter:', error); // Log lỗi chi tiết ở server
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

export const getPrevailingMovies = async (req, res) => { // Đổi tên cho rõ ràng hơn
    try {
        const page = parseInt(req.query.page || '1', 10);
        const limit = parseInt(req.query.limit || '12', 10); // Số lượng phim mỗi trang
        const offset = (page - 1) * limit;
        const categoryTitle = req.query.category; // Ví dụ: /api/prevailing?category=Anime

        const whereClause = {}; // Điều kiện lọc chính cho Movie
        const includeOptions = [ // Các bảng muốn include
            { model: Genre, as: 'genres', attributes: ['id', 'title', 'slug'], through: { attributes: [] } },
            { model: Country, as: 'countries', attributes: ['id', 'title', 'slug'] },
            { model: Category, as: 'categories', attributes: ['id', 'title', 'slug'] }, // Lấy cả slug category
            { model: Episode, as: 'Episodes', attributes: ['episodeNumber'], order: [['episodeNumber', 'DESC']], limit: 1 }, // Lấy tập mới nhất
            // { model: Section, as: 'sections' }, // Bỏ nếu không cần ngay
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

// lấy danh sách các bộ phim thuộc danh mục anime xắp xếp theo số lượng view giảm dần và chia ra từng trang mỗi trang có 30 phim
export const getAnime = async (req, res) => {
    try {
        const { page = 1, limit = 30 } = req.query;
        const offset = (page - 1) * limit;
        const { count, rows } = await Movie.findAndCountAll({
             where: { '$categories.title$': 'Anime' }, // Lọc Anime bằng association
            order: [['views', 'DESC']],
            limit: parseInt(limit, 10), // Đảm bảo là số
            offset: parseInt(offset, 10), // Đảm bảo là số
            include: [
                 { model: Genre, attributes: ['id', 'title'], through: { attributes: [] } },
                 { model: Country, as: 'countries' },
                 { model: Category, as: 'categories', attributes: [], required: true }, // required: true
                 { model: Episode, attributes: ['episodeNumber'], order: [['episodeNumber', 'DESC']], limit: 1 },
                 // { model: Section, as: 'sections' },
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