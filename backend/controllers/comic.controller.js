// controllers/comic.controller.js
import db from "../models/index.js";
import { handleServerError } from "../utils/errorUtils.js";
import { Op, Sequelize } from "sequelize";
import fs from "fs/promises";
import path from "path";
import { generateSlug } from "../utils/slugUtils.js"; // Import

const Comic = db.Comic;
const Chapter = db.Chapter;
const Genre = db.Genre;
const Country = db.Country;
const Category = db.Category;
const ComicGenre = db.ComicGenre;
const ComicPage = db.ComicPage;

// Helper xóa file local an toàn
const deleteLocalFile = async (relativePath) => {
    if (!relativePath) return;
    // Đường dẫn từ thư mục gốc của backend, giả sử thư mục 'uploads' nằm ở gốc
    const fullPath = path.resolve("uploads", relativePath);
    try {
        await fs.access(fullPath); // Kiểm tra file tồn tại
        await fs.unlink(fullPath);
        console.log(`Successfully deleted local file: ${fullPath}`);
    } catch (error) {
        if (error.code === "ENOENT") {
            console.warn(`Local file not found, cannot delete: ${fullPath}`);
        } else {
            console.error(`Error deleting local file ${fullPath}:`, error);
        }
    }
};

// --- ADMIN: Tạo Truyện mới ---
export const createComic = async (req, res) => {
    const {
        title,
        subTitle,
        description,
        author,
        artist,
        status,
        year,
        genreIds,
        countryId,
        categoryId,
    } = req.body;
    let { slug } = req.body;

    const coverImageFile = req.files?.coverImage?.[0];

    if (!title) {
        return res
            .status(400)
            .json({ success: false, message: "Tên truyện là bắt buộc." });
    }
    if (!coverImageFile) {
        return res
            .status(400)
            .json({ success: false, message: "Ảnh bìa là bắt buộc." });
    }
    if (!slug) {
        slug = generateSlug(title); // Tạo slug nếu không có
    } else {
        slug = generateSlug(slug); // Chuẩn hóa slug nếu có
    }

    const t = await db.sequelize.transaction();
    let coverImagePath = null;
    if (coverImageFile) {
        const normalizedPath = coverImageFile.path.replace(/\\/g, "/");
        const uploadsDir = path.resolve("uploads").replace(/\\/g, "/");
        coverImagePath = normalizedPath.startsWith(uploadsDir)
            ? normalizedPath.substring(uploadsDir.length + 1)
            : normalizedPath.replace(/^uploads\//, "");
    }

    try {
        const newComic = await Comic.create(
            {
                title,
                subTitle,
                slug,
                description,
                author,
                artist,
                status,
                year,
                coverImage: coverImagePath,
                countryId: countryId || null,
                categoryId: categoryId || null,
                lastChapterUpdatedAt: new Date(),
            },
            { transaction: t }
        );

        if (genreIds && genreIds.length > 0) {
            await newComic.setGenres(
                genreIds.map((id) => parseInt(id)),
                { transaction: t }
            );
        }

        await t.commit();
        const resultComic = await Comic.findByPk(newComic.id, {
            include: [
                { model: Genre, as: "genres", through: { attributes: [] } },
                { model: Country, as: "country" },
                { model: Category, as: "category" },
            ],
        });
        res.status(201).json({ success: true, comic: resultComic });
    } catch (error) {
        await t.rollback();
        if (coverImageFile && coverImagePath) {
            // Xóa file đã upload nếu transaction lỗi
            await deleteLocalFile(coverImagePath);
        }
        if (error.name === "SequelizeUniqueConstraintError") {
            return res
                .status(409)
                .json({
                    success: false,
                    message: "Truyện với tiêu đề hoặc slug này đã tồn tại.",
                });
        }
        handleServerError(res, error, "Tạo truyện mới");
    }
};

// --- ADMIN: Cập nhật Truyện ---
export const updateComic = async (req, res) => {
    const { id } = req.params;
    const {
        title,
        subTitle,
        description,
        author,
        artist,
        status,
        year,
        genreIds,
        countryId,
        categoryId,
        removeCoverImage,
    } = req.body;
    let { slug } = req.body;

    const coverImageFile = req.files?.coverImage?.[0];
    const t = await db.sequelize.transaction();
    let newUploadedCoverPath = null; // Đường dẫn của file mới upload (nếu có)

    try {
        const comic = await Comic.findByPk(id, { transaction: t });
        if (!comic) {
            await t.rollback();
            return res
                .status(404)
                .json({ success: false, message: "Không tìm thấy truyện." });
        }

        let finalCoverImage = comic.coverImage;
        const oldCoverImageRelativePath = comic.coverImage; // Lưu lại đường dẫn cũ để xóa

        if (coverImageFile) {
            newUploadedCoverPath = coverImageFile.path.replace(/\\/g, "/");
            const uploadsDir = path.resolve("uploads").replace(/\\/g, "/") + "/";
            if (newUploadedCoverPath.startsWith(uploadsDir)) {
                finalCoverImage = newUploadedCoverPath.substring(uploadsDir.length);
            } else if (newUploadedCoverPath.startsWith("uploads/")) {
                finalCoverImage = newUploadedCoverPath.substring("uploads/".length);
            } else {
                finalCoverImage = newUploadedCoverPath; // Nếu multer trả về đúng dạng rồi
            }
        } else if (removeCoverImage === "true" || req.body.coverImage === "") {
            // Client muốn xóa ảnh hiện tại
            finalCoverImage = null;
        }
        // Nếu không có file mới và không yêu cầu xóa, finalCoverImage vẫn là comic.coverImage

        if (title && !slug) slug = generateSlug(title);
        else if (slug) slug = generateSlug(slug);

        await comic.update(
            {
                title: title || comic.title,
                subTitle: subTitle !== undefined ? subTitle : comic.subTitle,
                slug: slug || comic.slug,
                description:
                    description !== undefined ? description : comic.description,
                author: author !== undefined ? author : comic.author,
                artist: artist !== undefined ? artist : comic.artist,
                status: status || comic.status,
                year: year || comic.year,
                coverImage: finalCoverImage,
                countryId:
                    countryId !== undefined ? countryId || null : comic.countryId,
                categoryId:
                    categoryId !== undefined ? categoryId || null : comic.categoryId,
            },
            { transaction: t }
        );

        if (genreIds !== undefined) {
            const genresToAssign = Array.isArray(genreIds)
                ? genreIds
                : genreIds
                    ? [genreIds]
                    : [];
            const genres = await Genre.findAll({
                where: { id: { [Op.in]: genresToAssign.map((id) => parseInt(id)) } },
                transaction: t,
            });
            await comic.setGenres(genres, { transaction: t });
        }

        await t.commit();

        // Xóa file ảnh bìa cũ nếu có file mới được upload hoặc nếu yêu cầu xóa
        if (
            (coverImageFile || removeCoverImage === "true") &&
            oldCoverImageRelativePath &&
            oldCoverImageRelativePath !== finalCoverImage
        ) {
            await deleteLocalFile(oldCoverImageRelativePath);
        }

        const updatedComic = await Comic.findByPk(id, {
            include: [
                { model: Genre, as: "genres", through: { attributes: [] } },
                { model: Country, as: "country" },
                { model: Category, as: "category" },
            ],
        });
        res.status(200).json({ success: true, comic: updatedComic });
    } catch (error) {
        await t.rollback();
        // Xóa file mới upload nếu transaction lỗi
        if (newUploadedCoverPath) {
            await deleteLocalFile(
                newUploadedCoverPath.replace(
                    path.resolve("uploads").replace(/\\/g, "/") + "/",
                    ""
                )
            );
        }
        if (error.name === "SequelizeUniqueConstraintError") {
            return res
                .status(409)
                .json({
                    success: false,
                    message: "Truyện với tiêu đề hoặc slug này đã tồn tại.",
                });
        }
        handleServerError(res, error, `Cập nhật truyện ID ${id}`);
    }
};

// --- ADMIN: Lấy danh sách truyện (cho trang quản lý) ---
export const getAllComicsAdmin = async (req, res) => {
    const { q: searchTerm, status, genreId, countryId, categoryId } = req.query; // Thêm filter
    // ...
    const whereClause = {};
    const includeComic = [
        {
            model: Genre,
            as: "genres",
            attributes: ["id", "title"],
            through: { attributes: [] },
        },
        { model: Country, as: "country", attributes: ["id", "title"] },
        { model: Category, as: "category", attributes: ["id", "title"] },
    ];
    if (searchTerm) {
    }
    if (status) {
    }
    if (countryId) whereClause.countryId = countryId;
    if (categoryId) whereClause.categoryId = categoryId;
    if (genreId) {
        // Lọc theo genreId
        includeComic.push({
            model: Genre,
            as: "genres",
            where: { id: genreId },
        });
    }

    try {
        const { count, rows: comics } = await Comic.findAndCountAll({
            where: whereClause,
            include: includeComic,
            attributes: {
                include: [
                    [
                        db.sequelize.literal(
                            "(SELECT COUNT(*) FROM chapters WHERE chapters.`comicId` = comics.id)"
                        ),
                        "chaptersCount",
                    ],
                ],
            },
            order: [
                [
                    req.query.sortBy || "lastChapterUpdatedAt",
                    req.query.sortOrder || "DESC",
                ],
                ["createdAt", "DESC"],
            ],
            limit: parseInt(req.query.limit) || 10,
            offset:
                ((parseInt(req.query.page) || 1) - 1) *
                (parseInt(req.query.limit) || 10),
            distinct: true,
        });
        const totalPages = Math.ceil(count / (parseInt(req.query.limit) || 10));
        res.status(200).json({
            success: true,
            comics,
            pagination: {
                totalItems: count,
                totalPages,
                currentPage: parseInt(req.query.page) || 1,
                itemsPerPage: parseInt(req.query.limit) || 10,
            },
        });
    } catch (error) {
        handleServerError(res, error, "Lấy danh sách truyện cho admin");
    }
};

// --- ADMIN: Lấy chi tiết 1 truyện (để edit form có thể populate associations) ---
export const getComicByIdAdmin = async (req, res) => {
    const { id } = req.params;
    try {
        const comic = await Comic.findByPk(id, {
            include: [
                {
                    model: Genre,
                    as: "genres",
                    attributes: ["id", "title"],
                    through: { attributes: [] },
                },
                { model: Country, as: "country", attributes: ["id", "title"] },
                { model: Category, as: "category", attributes: ["id", "title"] },
            ],
        });
        if (!comic) {
            return res
                .status(404)
                .json({ success: false, message: "Không tìm thấy truyện." });
        }
        res.status(200).json({ success: true, comic });
    } catch (error) {
        handleServerError(res, error, `Lấy chi tiết truyện ID ${id} cho admin`);
    }
};

// --- ADMIN: Xóa truyện ---
export const deleteComic = async (req, res) => {
    const { id } = req.params;
    const t = await db.sequelize.transaction();
    try {
        const comic = await Comic.findByPk(id, {
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
            return res
                .status(404)
                .json({ success: false, message: "Không tìm thấy truyện." });
        }

        // Xóa các file ảnh của từng trang trong từng chương
        for (const chapter of comic.chapters) {
            for (const page of chapter.pages) {
                if (page.imageUrl) await deleteLocalFile(page.imageUrl);
            }
        }
        // Xóa ảnh bìa
        if (comic.coverImage) await deleteLocalFile(comic.coverImage);

        // Xóa chapter (sẽ cascade xóa pages), rồi xóa comic
        // Sequelize sẽ tự xử lý onDelete: 'CASCADE' cho Chapter và ComicPage
        // Xóa associations với Genre
        await comic.setGenres([], { transaction: t });
        await comic.destroy({ transaction: t }); // destroy() sẽ gọi hooks và cascade nếu được cấu hình

        await t.commit();
        res
            .status(200)
            .json({
                success: true,
                message: "Đã xóa truyện và các tệp liên quan thành công.",
            });
    } catch (error) {
        await t.rollback();
        handleServerError(res, error, `Xóa truyện ID ${id}`);
    }
};

// --- API CHO USER: LẤY DANH SÁCH TRUYỆN (FILTER & SORT) ---
export const getComics = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;

        // Lấy các tham số filter từ query
        const {
            q,
            genre,
            country,
            status,
            year,
            sortBy = "lastChapterUpdatedAt",
            sortOrder = "DESC",
        } = req.query;

        const whereClause = {};
        const includeOptions = [
            // Các model cần include
            {
                model: Chapter,
                as: "chapters",
                attributes: ["id", "chapterNumber", "title", "createdAt", "order"],
                limit: 1,
                order: [["order", "DESC"]],
            },
            {
                model: Genre,
                as: "genres",
                attributes: ["id", "title", "slug"],
                through: { attributes: [] },
            },
            {
                model: Country,
                as: "country",
                attributes: ["id", "title", "slug"],
            },
        ];

        // Xử lý Filter
        if (q) {
            const searchTerm = `%${q.toLowerCase()}%`;
            whereClause[Op.or] = [
                { title: { [Op.like]: searchTerm } },
                { subTitle: { [Op.like]: searchTerm } },
                { author: { [Op.like]: searchTerm } },
                { artist: { [Op.like]: searchTerm } },
                { '$genres.title$': { [Op.like]: searchTerm } }
            ];
        }

        if (status && status !== "all" && status !== "") {
            whereClause.status = status;
        }

        if (year) {
            if (year.includes("-")) {
                const [startYear, endYear] = year
                    .split("-")
                    .map((y) => parseInt(y.trim()));
                if (!isNaN(startYear) && !isNaN(endYear)) {
                    whereClause.year = { [Op.between]: [startYear, endYear] };
                }
            } else if (!isNaN(parseInt(year))) {
                whereClause.year = parseInt(year);
            }
        }

        // Lọc theo Genre, Country, Category (bằng slug hoặc ID)
        // Client sẽ gửi slug, chúng ta cần tìm ID tương ứng
        if (genre) {
            const genreInstance = await Genre.findOne({
                where: { [Op.or]: [{ slug: genre }, { id: parseInt(genre) || 0 }] },
            });
            if (genreInstance) {
                // Để lọc truyện có genre này, cần join và filter qua bảng trung gian
                whereClause.id = {
                    // Lọc các comicId có trong bảng comic_genres với genreId này
                    [Op.in]: Sequelize.literal(
                        `(SELECT comicId FROM comic_genres WHERE genreId = ${genreInstance.id})`
                    ),
                };
                
            } else {
                // Nếu không tìm thấy genre, trả về mảng rỗng
                return res
                    .status(200)
                    .json({
                        success: true,
                        comics: [],
                        pagination: {
                            totalItems: 0,
                            totalPages: 1,
                            currentPage: page,
                            itemsPerPage: limit,
                            sortBy,
                            sortOrder,
                        },
                    });
            }
        }
        if (country) {
            const countryInstance = await Country.findOne({
                where: { [Op.or]: [{ slug: country }, { id: parseInt(country) || 0 }] },
            });
            if (countryInstance) whereClause.countryId = countryInstance.id;
            else
                return res
                    .status(200)
                    .json({
                        success: true,
                        comics: [],
                        pagination: {
                            totalItems: 0,
                            totalPages: 1,
                            currentPage: page,
                            itemsPerPage: limit,
                            sortBy,
                            sortOrder,
                        },
                    });
        }

        // Xử lý Sắp xếp
        const order = [];
        const validSortByFields = [
            "lastChapterUpdatedAt",
            "views",
            "createdAt",
            "title",
            "year",
        ];
        const sortField = validSortByFields.includes(sortBy)
            ? sortBy
            : "lastChapterUpdatedAt";
        const sortDirection = ["ASC", "DESC"].includes(sortOrder.toUpperCase())
            ? sortOrder.toUpperCase()
            : "DESC";

        order.push([sortField, sortDirection]);
        if (sortField !== "title") {
            order.push(["title", "ASC"]);
        }

        const { count, rows: comics } = await Comic.findAndCountAll({
            where: whereClause,
            include: includeOptions,
            order: order,
            limit: limit,
            offset: offset,
            distinct: true,
            subQuery: false,
        });

        const totalPages = Math.ceil(count / limit);

        res.status(200).json({
            success: true,
            comics: comics.map((c) => {
                const comicJson = c.toJSON();
                if (comicJson.chapters && comicJson.chapters.length > 0) {
                    comicJson.chapters = [comicJson.chapters[0]];
                }
                return comicJson;
            }),
            pagination: {
                totalItems: count,
                totalPages,
                currentPage: page,
                itemsPerPage: limit,
                sortBy: sortField,
                sortOrder: sortDirection,
            },
        });
    } catch (error) {
        handleServerError(res, error, "Lấy danh sách truyện");
    }
};

// --- API CHO USER: LẤY CÁC TÙY CHỌN FILTER CHO TRUYỆN ---
export const getComicFilterOptions = async (req, res) => {
    try {
        const genres = await Genre.findAll({
            attributes: ["id", "title", "slug"],
            include: [
                {
                    model: Comic,
                    as: "comicsInGenre",
                    attributes: [],
                    required: true,
                },
            ],
            order: [["title", "ASC"]],
        });
        const countries = await Country.findAll({
            attributes: ["id", "title", "slug"],
            include: [
                {
                    model: Comic,
                    as: "comicsInCountry",
                    attributes: [],
                    required: true,
                },
            ],
            order: [["title", "ASC"]],
        });
        const categories = await Category.findAll({
            attributes: ["id", "title", "slug"],
            include: [
                {
                    model: Comic,
                    as: "comicsInCategory",
                    attributes: [],
                    required: true,
                },
            ],
            order: [["title", "ASC"]],
        });

        // Có thể thêm logic lấy danh sách năm có truyện từ CSDL
        // Hoặc danh sách status có truyện

        res.status(200).json({
            success: true,
            data: {
                genres,
                countries,
                categories,
            },
        });
    } catch (error) {
        handleServerError(res, error, "Lấy tùy chọn bộ lọc truyện");
    }
};

export const getComicBySlug = async (req, res) => {
    const { slug } = req.params;
    try {
        const comic = await Comic.findOne({
            where: { slug },
            include: [
                {
                    model: Genre,
                    as: "genres",
                    attributes: ["id", "title", "slug"],
                    through: { attributes: [] },
                },
                {
                    model: Category,
                    as: "category",
                    attributes: ["id", "title", "slug"],
                },
                { model: Country, as: "country", attributes: ["id", "title", "slug"] },
            ],
        });
        if (!comic) {
            return res
                .status(404)
                .json({ success: false, message: "Không tìm thấy truyện." });
        }
        // Tăng lượt xem
        await comic.increment("views");
        res.status(200).json({ success: true, comic });
    } catch (error) {
        handleServerError(res, error, `Lấy chi tiết truyện ${slug}`);
    }
};
