// controllers/comic.controller.js
import * as comicService from '../services/comic.service.js';
import { handleServerError } from "../utils/errorUtils.js";

// --- ADMIN: Tạo Truyện mới ---
export const createComic = async (req, res) => {
    try {
        const comicData = req.body;
        const coverImageFile = req.files?.coverImage?.[0];
        const bannerImageFile = req.files?.bannerImage?.[0];


        if (!comicData.title) { //
            return res.status(400).json({ success: false, message: "Tên truyện là bắt buộc." });
        }
        if (!coverImageFile) {
            return res.status(400).json({ success: false, message: "Ảnh bìa hoặc URL ảnh bìa là bắt buộc." });
        }

        const newComic = await comicService.createNewComic(comicData, coverImageFile, bannerImageFile);
        res.status(201).json({ success: true, comic: newComic });
    } catch (error) {
        const statusCode = error.statusCode || 500;
        handleServerError(res, error, "Tạo truyện mới", statusCode);
    }
};

// --- ADMIN: Cập nhật Truyện ---
export const updateComic = async (req, res) => {
    try {
        const comicIdOrSlug = req.params.id;
        const updateData = req.body;
        const coverImageFile = req.files?.coverImage?.[0] || req.file;
        const bannerImageFile = req.files?.bannerImage?.[0];

        const updatedComic = await comicService.updateExistingComic(comicIdOrSlug, updateData, coverImageFile, bannerImageFile);
        res.status(200).json({ success: true, comic: updatedComic });
    } catch (error) {
        const statusCode = error.statusCode || 500;
        handleServerError(res, error, `Cập nhật truyện ID/Slug ${req.params.id}`, statusCode);
    }
};

// --- ADMIN: Lấy danh sách truyện (cho trang quản lý) ---
export const getAllComicsAdmin = async (req, res) => {
    try {
        const result = await comicService.fetchAllComicsForAdmin(req.query);
        res.status(200).json({ success: true, ...result });
    } catch (error) {
        handleServerError(res, error, "Lấy danh sách truyện cho admin");
    }
};

// --- ADMIN: Lấy chi tiết 1 truyện ---
export const getComicByIdAdmin = async (req, res) => {
    const { id } = req.params;
    try {
        const comic = await comicService.fetchComicByIdForAdmin(id);
        res.status(200).json({ success: true, comic });
    } catch (error) {
        const statusCode = error.statusCode || 500;
        handleServerError(res, error, `Lấy chi tiết truyện ID ${id} cho admin`, statusCode);
    }
};

// --- ADMIN: Xóa truyện ---
export const deleteComic = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await comicService.deleteComicById(id);
        res.status(200).json({ success: true, message: result.message });
    } catch (error) {
        const statusCode = error.statusCode || 500;
        handleServerError(res, error, `Xóa truyện ID ${id}`, statusCode);
    }
};

// --- API CHO USER: LẤY DANH SÁCH TRUYỆN (FILTER & SORT) ---
export const getComics = async (req, res) => {
    try {
        const result = await comicService.fetchComicsForUser(req.query);
        res.status(200).json({ success: true, ...result });
    } catch (error) {
        handleServerError(res, error, "Lấy danh sách truyện");
    }
};

// --- API CHO USER: LẤY CÁC TÙY CHỌN FILTER CHO TRUYỆN ---
export const getComicFilterOptions = async (req, res) => {
    try {
        const filterOptions = await comicService.fetchComicFilterOptions();
        res.status(200).json({ success: true, data: filterOptions });
    } catch (error) {
        handleServerError(res, error, "Lấy tùy chọn bộ lọc truyện");
    }
};

// --- API CHO USER: LẤY CHI TIẾT TRUYỆN BẰNG SLUG ---
export const getComicBySlug = async (req, res) => {
    const { slug } = req.params;
    try {
        const comic = await comicService.fetchComicBySlugForUser(slug);
        res.status(200).json({ success: true, comic });
    } catch (error) {
        const statusCode = error.statusCode || 500;
        handleServerError(res, error, `Lấy chi tiết truyện ${slug}`, statusCode);
    }
};

// --- API CHO USER: LẤY
export const getComicRecommendations = async (req, res) => {
    try {
        const userId = req.userId; // lấy từ middleware verifyToken
        const limit = parseInt(req.query.limit) || 7;
        const comics = await comicService.fetchComicRecommendations(userId, limit);
        res.json({ comics });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};