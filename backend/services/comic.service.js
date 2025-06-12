// backend/services/comic.service.js
import db from "../models/index.js";
import { Op, Sequelize } from "sequelize";
import fs from "fs/promises";
import path from "path";
import { generateSlug } from "../utils/slugUtils.js";
import { subDays, startOfDay } from "date-fns";

const Comic = db.Comic;
const Chapter = db.Chapter;
const Genre = db.Genre;
const Country = db.Country;
const Category = db.Category;
const ComicPage = db.ComicPage;
const ComicViewDaily = db.ComicViewDaily;
const UserComicHistory = db.UserComicHistory;

/**
 * Helper để xóa file an toàn (bao gồm cả file trên ImageKit nếu có fileId)
 * @param {string} relativePathOrFileId - Đường dẫn tương đối của file local hoặc fileId trên ImageKit.
 * @param {boolean} isImageKitFile - True nếu là file trên ImageKit.
 */
const deleteFileSafely = async (inputPath) => {
    if (!inputPath) return;

    const uploadsAbsolutePath = path.resolve("uploads");
    let fileRelativePath = inputPath;

    // Nếu input là đường dẫn tuyệt đối nằm trong uploads
    if (inputPath.startsWith(uploadsAbsolutePath)) {
        fileRelativePath = path.relative(uploadsAbsolutePath, inputPath);
    }
    // Nếu input là đường dẫn tương đối bắt đầu bằng uploads/
    else if (
        inputPath.startsWith(path.sep + "uploads" + path.sep) ||
        inputPath.startsWith("uploads" + path.sep)
    ) {
        fileRelativePath = inputPath.replace(new RegExp(`^${path.sep}?uploads${path.sep}`), "");
    }

    const fileAbsolutePath = path.join(uploadsAbsolutePath, fileRelativePath);

    try {
        await fs.access(fileAbsolutePath);
        await fs.unlink(fileAbsolutePath);
        console.log(`Successfully deleted local file: ${fileAbsolutePath}`);
    } catch (error) {
        if (error.code === "ENOENT") {
            console.warn(`Local file not found, cannot delete: ${fileAbsolutePath}`);
        } else {
            console.error(`Error deleting local file ${fileAbsolutePath}:`, error);
        }
    }
};

// --- ADMIN SERVICES ---

/**
 * Admin: Creates a new comic.
 * @param {object} comicData - Data from req.body.
 * @param {object} [coverImageFile] - Optional file object for coverImage from multer.
 * @returns {Promise<object>} The created comic object.
 */
export const createNewComic = async (comicData, coverImageFile, bannerImageFile) => {
    const {
        title, subTitle, description, author, artist, status, year,
        genreIds, countryId, categoryId
    } = comicData;
    let { slug } = comicData;

    if (!slug && title) {
        slug = generateSlug(title);
    } else if (slug) {
        slug = generateSlug(slug);
    }

    const t = await db.sequelize.transaction();

    let coverImagePath = null;
    let bannerImagePath = null;
    
    try {
        if (coverImageFile) {
            const normalizedPath = coverImageFile.path.replace(/\\/g, "/");
            const uploadsDir = path.resolve("uploads").replace(/\\/g, "/");
            coverImagePath = normalizedPath.startsWith(uploadsDir)
                ? path.relative(uploadsDir, normalizedPath).replace(/\\/g, "/")
                : normalizedPath.replace(/^uploads[\\/]/, "");
        }

        if (bannerImageFile) {
            const normalizedPath = bannerImageFile.path.replace(/\\/g, "/");
            const uploadsDir = path.resolve("uploads").replace(/\\/g, "/");
            bannerImagePath = normalizedPath.startsWith(uploadsDir)
                ? path.relative(uploadsDir, normalizedPath).replace(/\\/g, "/")
                : normalizedPath.replace(/^uploads[\\/]/, "");
        }

        const newComic = await Comic.create({
            title,
            subTitle: subTitle || null,
            slug,
            description: description || null,
            author: author || null,
            artist: artist || null,
            status: status || 'Đang tiến hành',
            year: year ? parseInt(year) : null,
            coverImage: coverImagePath,
            bannerImage: bannerImagePath,
            countryId: countryId ? parseInt(countryId) : null,
            categoryId: categoryId ? parseInt(categoryId) : null,
            lastChapterUpdatedAt: new Date(),
        }, { transaction: t });

        if (genreIds) {
            const genresToAssign = (Array.isArray(genreIds) ? genreIds : [genreIds]).map(id => parseInt(id)).filter(id => !isNaN(id));
            if (genresToAssign.length > 0) {
                await newComic.setGenres(genresToAssign, { transaction: t });
            }
        }

        await t.commit();
        const resultComic = await Comic.findByPk(newComic.id, {
            include: [
                { model: Genre, as: "genres", through: { attributes: [] } },
                { model: Country, as: "country" },
                { model: Category, as: "category" },
            ],
        });
        return resultComic;

    } catch (error) {
        await t.rollback();
        if (coverImageFile && coverImagePath) {
            await deleteFileSafely(coverImagePath);
        }

        if (bannerImageFile && bannerImagePath) {
            await deleteFileSafely(bannerImagePath);
        }

        if (error.name === "SequelizeUniqueConstraintError") {
            const newError = new Error("Truyện với tiêu đề hoặc slug này đã tồn tại.");
            newError.statusCode = 409;
            throw newError;
        }
        throw error;
    }
};


/**
 * Admin: Updates an existing comic.
 * @param {string|number} comicIdOrSlug - ID hoặc slug của truyện.
 * @param {object} updateData - Data từ req.body.
 * @param {object} [coverImageFile] - Optional new cover image file.
 * @returns {Promise<object>} The updated comic object.
 */
export const updateExistingComic = async (comicIdOrSlug, updateData, coverImageFile, bannerImageFile) => {
    const {
        title, subTitle, description, author, artist, status, year,
        genreIds, countryId, categoryId, removeCoverImage
    } = updateData;
    let { slug } = updateData;

    const findCondition = isNaN(parseInt(comicIdOrSlug)) ? { slug: comicIdOrSlug } : { id: parseInt(comicIdOrSlug) };

    const t = await db.sequelize.transaction();
    let newUploadedCoverRelativePath = null;
    let newUploadedBannerRelativePath = null;

    try {
        const comic = await Comic.findOne({ where: findCondition, transaction: t });
        if (!comic) {
            await t.rollback();
            const error = new Error("Không tìm thấy truyện.");
            error.statusCode = 404;
            throw error;
        }

        const oldCoverImageRelativePath = comic.coverImage;
        let finalCoverImage = comic.coverImage;

        const oldBannerImageRelativePath = comic.bannerImage;
        let finalBannerImage = comic.bannerImage;

        if (coverImageFile) {
            const normalizedPath = coverImageFile.path.replace(/\\/g, "/");
            const uploadsDirResolved = path.resolve("uploads").replace(/\\/g, "/");
            if (normalizedPath.startsWith(uploadsDirResolved)) {
                newUploadedCoverRelativePath = path.relative(uploadsDirResolved, normalizedPath).replace(/\\/g, "/");
            } else {
                newUploadedCoverRelativePath = normalizedPath.replace(/^uploads[\\/]/, '');
            }
            finalCoverImage = newUploadedCoverRelativePath;
        } else if (removeCoverImage === "true" || removeCoverImage === true || updateData.coverImage === "") {
            finalCoverImage = null;
        }

        if (bannerImageFile) {
            const normalizedPath = bannerImageFile.path.replace(/\\/g, "/");
            const uploadsDirResolved = path.resolve("uploads").replace(/\\/g, "/");
            if (normalizedPath.startsWith(uploadsDirResolved)) {
                newUploadedBannerRelativePath = path.relative(uploadsDirResolved, normalizedPath).replace(/\\/g, "/");
            } else {
                newUploadedBannerRelativePath = normalizedPath.replace(/^uploads[\\/]/, '');
            }
            finalBannerImage = newUploadedBannerRelativePath;
        } else if (removeCoverImage === "true" || removeCoverImage === true || updateData.bannerImage === "") {
            finalBannerImage = null;
        }

        if (title && title !== comic.title && !slug) {
            slug = generateSlug(title);
        } else if (slug) {
            slug = generateSlug(slug);
        }

        await comic.update({
            title: title !== undefined ? title : comic.title,
            subTitle: subTitle !== undefined ? subTitle : comic.subTitle,
            slug: slug || comic.slug,
            description: description !== undefined ? description : comic.description,
            author: author !== undefined ? author : comic.author,
            artist: artist !== undefined ? artist : comic.artist,
            status: status !== undefined ? status : comic.status,
            year: year !== undefined ? (year ? parseInt(year) : null) : comic.year,
            coverImage: finalCoverImage,
            bannerImage: finalBannerImage,
            countryId: countryId !== undefined ? (countryId ? parseInt(countryId) : null) : comic.countryId,
            categoryId: categoryId !== undefined ? (categoryId ? parseInt(categoryId) : null) : comic.categoryId,
        }, { transaction: t });

        if (genreIds !== undefined) {
            const genresToAssign = (Array.isArray(genreIds) ? genreIds : (genreIds ? [genreIds] : [])).map(id => parseInt(id)).filter(id => !isNaN(id));
            const genres = await Genre.findAll({ where: { id: { [Op.in]: genresToAssign } }, transaction: t });
            await comic.setGenres(genres, { transaction: t });
        }

        await t.commit();

        if (oldCoverImageRelativePath && oldCoverImageRelativePath !== finalCoverImage) {
            await deleteFileSafely(oldCoverImageRelativePath);
        }

        if (oldBannerImageRelativePath && oldBannerImageRelativePath !== finalBannerImage) {
            await deleteFileSafely(oldBannerImageRelativePath);
        }

        const updatedComic = await Comic.findByPk(comic.id, {
            include: [
                { model: Genre, as: "genres", through: { attributes: [] } },
                { model: Country, as: "country" },
                { model: Category, as: "category" },
            ],
        });
        return updatedComic;

    } catch (error) {
        await t.rollback();
        if (newUploadedCoverRelativePath) {
            await deleteFileSafely(newUploadedCoverRelativePath);
        }

        if (newUploadedBannerRelativePath) {
            await deleteFileSafely(newUploadedBannerRelativePath);
        }
        if (error.name === "SequelizeUniqueConstraintError") {
            const newError = new Error("Truyện với tiêu đề hoặc slug này đã tồn tại.");
            newError.statusCode = 409;
            throw newError;
        }
        throw error;
    }
};

export const fetchAllComicsForAdmin = async (queryParams) => {
    const { q: searchTerm, status, genreId, countryId, categoryId, sortBy, sortOrder, page, limit } = queryParams;
    const currentPage = parseInt(page) || 1;
    const itemsPerPage = parseInt(limit) || 10;
    const offset = (currentPage - 1) * itemsPerPage;

    const whereClause = {};
    const includeComic = [
        { model: Genre, as: "genres", attributes: ["id", "title"], through: { attributes: [] } },
        { model: Country, as: "country", attributes: ["id", "title"] },
        { model: Category, as: "category", attributes: ["id", "title"] },
    ];

    if (searchTerm) {
         whereClause[Op.or] = [
            { title: { [Op.like]: `%${searchTerm}%` } },
            { subTitle: { [Op.like]: `%${searchTerm}%` } },
            { author: { [Op.like]: `%${searchTerm}%` } },
            { artist: { [Op.like]: `%${searchTerm}%` } },
         ];
    }
    if (status && status !== "all") { 
        whereClause.status = status;
    }
    if (countryId) whereClause.countryId = parseInt(countryId);
    if (categoryId) whereClause.categoryId = parseInt(categoryId);

    if (genreId) {
        whereClause.id = {
             [Op.in]: Sequelize.literal(
                `(SELECT comicId FROM comic_genres WHERE genreId = ${parseInt(genreId)})`
            ),
        }
    }

    const orderConfig = [];
    const validSortFields = ["lastChapterUpdatedAt", "views", "createdAt", "title", "year"];
    const sortField = validSortFields.includes(sortBy) ? sortBy : "lastChapterUpdatedAt";
    const sortDir = ["ASC", "DESC"].includes(sortOrder?.toUpperCase()) ? sortOrder.toUpperCase() : "DESC";
    orderConfig.push([sortField, sortDir]);
    if (sortField !== 'title') orderConfig.push(['title', 'ASC']);

    try {
        const { count, rows: comics } = await Comic.findAndCountAll({
            where: whereClause,
            include: includeComic,
            attributes: {
                include: [
                    [db.sequelize.literal("(SELECT COUNT(*) FROM chapters WHERE chapters.comicId = comics.id)"), "chaptersCount"],
                ],
            },
            order: orderConfig,
            limit: itemsPerPage,
            offset: offset,
            distinct: true,
        });
        const totalPages = Math.ceil(count / itemsPerPage);
        return {
            comics,
            pagination: {
                totalItems: count,
                totalPages,
                currentPage,
                itemsPerPage,
            },
        };
    } catch (error) {
        console.error("Error in fetchAllComicsForAdmin service:", error);
        throw error;
    }
};

export const fetchComicByIdForAdmin = async (comicId) => {
    try {
        const comic = await Comic.findByPk(comicId, {
            include: [
                { model: Genre, as: "genres", attributes: ["id", "title"], through: { attributes: [] } },
                { model: Country, as: "country", attributes: ["id", "title"] },
                { model: Category, as: "category", attributes: ["id", "title"] },
            ],
        });
        if (!comic) {
            const error = new Error("Không tìm thấy truyện.");
            error.statusCode = 404;
            throw error;
        }
        return comic;
    } catch (error) {
        console.error(`Error in fetchComicByIdForAdmin service (ID: ${comicId}):`, error);
        throw error;
    }
};

export const deleteComicById = async (comicId) => {
    const t = await db.sequelize.transaction();
    try {
        const comic = await Comic.findByPk(comicId, {
            include: [
                {
                    model: Chapter,
                    as: "chapters",
                    include: [{ model: ComicPage, as: "pages" }],
                },
            ],
            transaction: t,
        });

        if (!comic) {
            await t.rollback();
            const error = new Error("Không tìm thấy truyện.");
            error.statusCode = 404;
            throw error;
        }

        for (const chapter of comic.chapters) {
            for (const page of chapter.pages) {
                if (page.imageUrl) {
                    await deleteFileSafely(page.imageUrl);
                }
            }
        }

        if (comic.coverImage) {
            await deleteFileSafely(comic.coverImage);
        }

        if (comic.bannerImage) {
            await deleteFileSafely(comic.bannerImage);
        }

        await comic.setGenres([], { transaction: t });

        await comic.destroy({ transaction: t });

        await t.commit();
        return { message: "Đã xóa truyện và các tệp liên quan thành công." };
    } catch (error) {
        await t.rollback();
        console.error(`Error in deleteComicById service (ID: ${comicId}):`, error);
        throw error;
    }
};

/**
 * User: Fetches a list of comics with filtering, sorting, and pagination.
 * @param {object} queryParams - Query parameters from the request.
 * @returns {Promise<object>} Object containing comics list and pagination info.
 */
export const fetchComicsForUser = async (queryParams) => {
    const page = parseInt(queryParams.page) || 1;
    const limit = parseInt(queryParams.limit) || 20;
    const offset = (page - 1) * limit;

    const {
        q,
        genre: genreQuery,
        country: countryQuery,
        status,
        year,
        category: categoryQuery,
        sortBy = "lastChapterUpdatedAt",
        sortOrder = "DESC",
    } = queryParams;

    const whereClause = {};
    const includeOptions = [
        {
            model: Chapter,
            as: "chapters",
            attributes: ["id", "chapterNumber", "title", "createdAt", "order", "views"],
            required: false,
            limit: 1,
            order: [["order", "DESC"]],
        },
        {
            model: Genre,
            as: "genres",
            attributes: ["id", "title", "slug"],
            through: { attributes: [] },
            required: false,
        },
        {
            model: Country,
            as: "country",
            attributes: ["id", "title", "slug"],
            required: false,
        }
    ];

    if (q) {
        const searchTerm = `%${q.toLowerCase()}%`;
        whereClause[Op.or] = [
            { title: { [Op.like]: searchTerm } },
            { subTitle: { [Op.like]: searchTerm } },
            { author: { [Op.like]: searchTerm } },
            { artist: { [Op.like]: searchTerm } }
        ];
    }

    if (status && status.toLowerCase() !== "all" && status !== "") {
        whereClause.status = status;
    }

    if (year) {
        if (year.includes("-")) {
            const [startYear, endYear] = year.split("-").map((y) => parseInt(y.trim()));
            if (!isNaN(startYear) && !isNaN(endYear)) {
                whereClause.year = { [Op.between]: [startYear, endYear] };
            }
        } else if (!isNaN(parseInt(year))) {
            whereClause.year = parseInt(year);
        }
    }

    // Xử lý filter theo genre slug/id
    if (genreQuery) {
        const genreInstance = await Genre.findOne({
            where: { [Op.or]: [{ slug: genreQuery }, { id: parseInt(genreQuery) || 0 }] },
        });
        if (genreInstance) {
            // Cách 1: Dùng subquery (như controller gốc)
            whereClause.id = {
                [Op.in]: Sequelize.literal(
                    `(SELECT comicId FROM comic_genres WHERE genreId = ${genreInstance.id})`
                ), 
            };
            // Cách 2: Điều chỉnh includeOptions (phức tạp hơn nếu muốn AND các genre)
            // includeOptions.find(inc => inc.as === 'genres').where = { id: genreInstance.id };
            // includeOptions.find(inc => inc.as === 'genres').required = true;
        } else { //
            return { comics: [], pagination: { totalItems: 0, totalPages: 1, currentPage, itemsPerPage, sortBy, sortOrder } };
        }
    }

    // Xử lý filter theo country slug/id
    if (countryQuery) {
        const countryInstance = await Country.findOne({
            where: { [Op.or]: [{ slug: countryQuery }, { id: parseInt(countryQuery) || 0 }] },
        });
        if (countryInstance) whereClause.countryId = countryInstance.id;
        else return { comics: [], pagination: { totalItems: 0, totalPages: 1, currentPage, itemsPerPage, sortBy, sortOrder } };
    }

    if (categoryQuery) {
        const categoryInstance = await Category.findOne({
            where: { [Op.or]: [{ slug: categoryQuery }, { id: parseInt(categoryQuery) || 0 }] },
        });
        if (categoryInstance) whereClause.categoryId = categoryInstance.id;
        else return { comics: [], pagination: { totalItems: 0, totalPages: 1, currentPage: page, itemsPerPage: limit, sortBy, sortOrder } };
    }

    const order = [];
    const validSortByFields = ["lastChapterUpdatedAt", "views", "createdAt", "title", "year"];
    const sortField = validSortByFields.includes(sortBy) ? sortBy : "lastChapterUpdatedAt";
    const sortDirection = ["ASC", "DESC"].includes(sortOrder.toUpperCase()) ? sortOrder.toUpperCase() : "DESC";
    order.push([sortField, sortDirection]);
    if (sortField !== "title") order.push(["title", "ASC"]);

    const { count, rows: comics } = await Comic.findAndCountAll({
        where: whereClause,
        include: includeOptions,
        order: order,
        limit: limit,
        offset: offset,
        distinct: true
    });

    // --- Trending logic ---
    const today = startOfDay(new Date());
    const sevenDaysAgo = subDays(today, 7);
    const fourteenDaysAgo = subDays(today, 14);

    const comicIds = comics.map(c => c.id);

    // Lấy tổng views từng comic trong 7 ngày gần nhất và 7 ngày trước đó
    const viewStats = await ComicViewDaily.findAll({
        attributes: [
            "comicId",
            [Sequelize.fn("SUM", Sequelize.literal(`CASE WHEN viewDate >= '${sevenDaysAgo.toISOString().slice(0, 10)}' THEN count ELSE 0 END`)), "recentViews"],
            [Sequelize.fn("SUM", Sequelize.literal(`CASE WHEN viewDate >= '${fourteenDaysAgo.toISOString().slice(0, 10)}' AND viewDate < '${sevenDaysAgo.toISOString().slice(0, 10)}' THEN count ELSE 0 END`)), "prevViews"]
        ],
        where: {
            comicId: { [Op.in]: comicIds },
            viewDate: { [Op.gte]: fourteenDaysAgo.toISOString().slice(0, 10) }
        },
        group: ["comicId"],
        raw: true
    });

    // Map comicId -> trending
    const trendingMap = {};
    for (const row of viewStats) {
        const recent = parseInt(row.recentViews) || 0;
        const prev = parseInt(row.prevViews) || 0;
        if (recent > prev) trendingMap[row.comicId] = "up";
        else if (recent < prev) trendingMap[row.comicId] = "down";
        else trendingMap[row.comicId] = null;
    }

    comics.forEach(comic => {
        comic.dataValues.trending = trendingMap[comic.id] || null;
    });

    const totalPages = Math.ceil(count / limit);

    return {
        comics: comics,
        pagination: {
            totalItems: count,
            totalPages,
            currentPage: page,
            itemsPerPage: limit,
            sortBy: sortField,
            sortOrder: sortDirection,
        },
    };
};

export const fetchComicFilterOptions = async () => {
    try {
        const genres = await Genre.findAll({
            attributes: ["id", "title", "slug"],
            include: [{
                model: Comic,
                as: "comicsInGenre",
                attributes: [],
                required: true
            }],
            order: [["title", "ASC"]],
        });
        const countries = await Country.findAll({
            attributes: ["id", "title", "slug"],
            include: [{
                model: Comic,
                as: "comicsInCountry",
                attributes: [],
                required: true
            }],
            order: [["title", "ASC"]],
        });
        const categories = await Category.findAll({
            attributes: ["id", "title", "slug"],
             include: [{
                model: Comic,
                as: "comicsInCategory",
                attributes: [],
                required: true
            }],
            order: [["title", "ASC"]],
        });

        const yearsWithComics = await Comic.findAll({
            attributes: [[Sequelize.fn('DISTINCT', Sequelize.col('year')), 'year']],
            where: { year: { [Op.ne]: null } },
            order: [['year', 'DESC']],
            raw: true,
        });
        const years = yearsWithComics.map(y => y.year).filter(Boolean);

        const statuses = await Comic.findAll({
            attributes: [[Sequelize.fn('DISTINCT', Sequelize.col('status')), 'status']],
            where: { status: { [Op.ne]: null, [Op.ne]: '' } },
            raw: true,
        });
        const statusOptions = statuses.map(s => s.status).filter(Boolean);


        return {
            genres,
            countries,
            categories,
            years,
            statuses: statusOptions,
        };
    } catch (error) {
        console.error("Error in fetchComicFilterOptions service:", error);
        throw error;
    }
};

export const fetchComicBySlugForUser = async (slug) => {
    try {
        const comic = await Comic.findOne({
            where: { slug },
            include: [
                { model: Genre, as: "genres", attributes: ["id", "title", "slug"], through: { attributes: [] } },
                { model: Category, as: "category", attributes: ["id", "title", "slug"] },
                { model: Country, as: "country", attributes: ["id", "title", "slug"] }
            ],
        });

        if (!comic) {
            const error = new Error("Không tìm thấy truyện.");
            error.statusCode = 404;
            throw error;
        }

        await comic.increment("views");

        // Ghi log lượt xem theo ngày
        const today = new Date();
        const viewDate = today.toISOString().slice(0, 10); // YYYY-MM-DD

        await ComicViewDaily.upsert({
            comicId: comic.id,
            viewDate: viewDate,
            count: 1
        }, {
            fields: ["comicId", "viewDate", "count"],
            returning: false,
            conflictFields: ["comicId", "viewDate"]
        });

        return comic;
    } catch (error) {
        console.error(`Error in fetchComicBySlugForUser service (Slug: ${slug}):`, error);
        throw error;
    }
};

export const fetchComicRecommendations = async (userId, limit = 7) => {
    // Nếu có userId, lấy thể loại user hay đọc nhất
    if (userId) {
        // Lấy lịch sử đọc và đếm số lần đọc theo genre
        const histories = await UserComicHistory.findAll({
            where: { userId },
            include: [{
                model: Comic,
                as: 'comic',
                include: [{ model: Genre, as: 'genres', through: { attributes: [] } }]
            }]
        });

        // Đếm số lần đọc theo genreId
        const genreCount = {};
        const readComicIds = new Set();
        histories.forEach(h => {
            readComicIds.add(h.comicId);
            h.comic.genres.forEach(g => {
                genreCount[g.id] = (genreCount[g.id] || 0) + 1;
            });
        });

        // Lấy top 2-3 thể loại user đọc nhiều nhất
        const topGenres = Object.entries(genreCount)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([genreId]) => parseInt(genreId));

        if (topGenres.length > 0) {
            // Lấy truyện thuộc các thể loại này, loại trừ truyện đã đọc
            const comics = await Comic.findAll({
                include: [{
                    model: Genre,
                    as: 'genres',
                    where: { id: { [Op.in]: topGenres } },
                    through: { attributes: [] }
                }],
                where: { id: { [Op.notIn]: Array.from(readComicIds) } },
                order: [['views', 'DESC']],
                limit: 30
            });

            // Random limit truyện
            const shuffled = comics.sort(() => 0.5 - Math.random());
            return shuffled.slice(0, limit);
        }
    }

    // Nếu không có userId hoặc user chưa đọc gì, random trong top nhiều views
    const topComics = await Comic.findAll({
        include: [{ model: Genre, as: 'genres', through: { attributes: [] } }],
        order: [['views', 'DESC']],
        limit: 30
    });
    const shuffled = topComics.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, limit);
};

export const saveUserComicHistory = async (userId, comicId, chapterId) => {
    if (!userId || !comicId) return;
    await UserComicHistory.upsert({
        userId,
        comicId,
        lastReadAt: new Date(),
        lastChapterId: chapterId || null,
    }, {
        fields: ["userId", "comicId", "lastReadAt", "lastChapterId"],
        conflictFields: ["userId", "comicId"]
    });
};