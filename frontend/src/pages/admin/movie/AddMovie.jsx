import axios from "axios";
import { useCallback, useEffect, useState } from "react";
import {toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

import MovieInfoForm from "@components/Admin/MovieForms/MovieInfoForm";
import MovieMetaForm from "@components/Admin/MovieForms/MovieMetaForm";
import MovieImageUploader from "@components/Admin/MovieForms/MovieImageUploader";
import AddItemOffcanvas from "@components/Admin/MovieForms/AddItemOffcanvas";

import useSlug from "@hooks/useSlug";
import authHeader from "@services/auth-header";
import { handleApiError } from "@utils/handleApiError";

const initialMovieData = {
    title: '',
    subTitle: '',
    slug: '',
    duration: '',
    quality: 4,
    subtitles: '',
    status: 1,
    views: 0,
    totalEpisodes: '',
    description: '',
    genreIds: [],
    countryId: '',
    categoryId: '',
    belongToCategory: 0,
    hasSection: 0,
    year: new Date().getFullYear(),
    releaseDate: '',
    classification: '',
    trailerUrl: '',
    type: 'movie', // 'movie' or 'tv'
    tags: [],
};

const AddMovie = () => {
    const [data, setData] = useState(initialMovieData);
    const [genres, setGenres] = useState([]);
    const [countries, setCountries] = useState([]);
    const [categories, setCategories] = useState([]);
    const [picture, setPicture] = useState({ poster: null, banner: null });
    const [selectedGenres, setSelectedGenres] = useState([])
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isFetching, setIsFetching] = useState(false);

    const [showOffcanvas, setShowOffcanvas] = useState(false);
    const [offcanvasType, setOffcanvasType] = useState(null);

    const { slug, setInput } = useSlug(300);
    const navigate = useNavigate();

    const fetchInitialData = useCallback(async () => {
        setIsFetching(true);
        try {
            const [genresRes, countriesRes, categoriesRes] = await Promise.all([
                axios.get(`/api/genres`),
                axios.get(`/api/countries`),
                axios.get(`/api/categories`)
            ]);

            const fetchedGenres = genresRes.data || [];
            const fetchedCountries = countriesRes.data || [];
            const fetchedCategories = categoriesRes.data || [];

            setGenres(fetchedGenres);
            setCountries(fetchedCountries);
            setCategories(fetchedCategories);

            loadDraft(fetchedGenres);

            if (fetchedCountries.length > 0 && !data.countryId) {
                setData(prev => ({ ...prev, countryId: fetchedCountries[0].id }));
            }
            if (fetchedCategories.length > 0 && !data.categoryId) {
                setData(prev => ({ ...prev, categoryId: fetchedCategories[0].id }));
            }

        } catch (error) {
            console.error("Failed to fetch initial data:", error);
            handleApiError(error, "tải dữ liệu cần thiết");
        } finally {
            setIsFetching(false);
        }
    }, []);

    useEffect(() => {
        fetchInitialData();
    }, [fetchInitialData]);

    const handleChange = useCallback((e) => {
        const { name, value, type, checked } = e.target;
        setData((prevData) => ({
            ...prevData,
            [name]: type === "checkbox" ? (checked ? 1 : 0) : value,
        }));
    }, []);

    const handleTitleChange = useCallback((e) => {
        const title = e.target.value;
        setData((prev) => ({ ...prev, title }));
        setInput(title);
    }, [setInput]);

    useEffect(() => {
        setData((prev) => ({ ...prev, slug }));
    }, [slug]);

    useEffect(() => {
        const newGenreIds = selectedGenres.map((genre) => genre.id);
        setData((prev) => ({ ...prev, genreIds: newGenreIds }));
    }, [selectedGenres]);

    const handlePictureChange = useCallback((pictureType, file) => {
        setPicture(prev => ({ ...prev, [pictureType]: file }));
    }, []);

    const resetForm = useCallback(() => {
        setData(initialMovieData);
        setPicture({ poster: null, banner: null });
        setSelectedGenres([]);
        setInput('');
        if (countries.length > 0) setData(prev => ({ ...prev, countryId: countries[0].id }));
        if (categories.length > 0) setData(prev => ({ ...prev, categoryId: categories[0].id }));
    }, [countries, categories, setInput]);

    const handleDiscard = useCallback(() => {
        resetForm();
        localStorage.removeItem("movieDraft");
        toast.info("Đã hủy bỏ thay đổi và xóa bản nháp.");
    }, [resetForm]);

    const handleSaveDraft = useCallback(() => {
        if (!data.title.trim()) {
            toast.warn("Tên phim không được để trống để lưu nháp.");
            return;
        }
        const draft = { ...data, selectedGenres };
        localStorage.setItem("movieDraft", JSON.stringify(draft));
        toast.success("Đã lưu bản nháp thành công.");
    }, [data, selectedGenres]);

    const loadDraft = useCallback((currentGenres) => {
        const savedDraft = localStorage.getItem("movieDraft");
        if (savedDraft) {
            try {
                const draftData = JSON.parse(savedDraft);
                const { slug: draftSlug, selectedGenres: draftSelectedGenres, ...restOfDraftData } = draftData;
                setData(prev => ({ ...initialMovieData, ...restOfDraftData }));
                if (draftSelectedGenres && currentGenres.length > 0) {
                    const restoredGenres = draftSelectedGenres
                        .map(draftGenre => currentGenres.find(g => g.id === draftGenre.id))
                        .filter(Boolean);
                    setSelectedGenres(restoredGenres);
                }
                if (draftData.title) {
                    setInput(draftData.title);
                }
                toast.info("Đã khôi phục bản nháp.", { autoClose: 1500 });
            } catch (e) {
                console.error("Failed to parse movie draft:", e);
                localStorage.removeItem("movieDraft");
            }
        }
    }, [setInput]);

    const handleSave = async (e) => {
        e.preventDefault();
        if (!data.title.trim()) {
            toast.warn("Tên phim không được để trống.");
            return;
        }
        if (!picture.poster) {
            toast.warn("Vui lòng thêm hình ảnh chính cho phim.");
            return;
        }
        if (!picture.banner) {
            toast.warn("Vui lòng thêm ảnh banner cho phim.");
            return;
        }

        setIsSubmitting(true);

        const formDataToSend = new FormData();
        for (let key in data) {
            if (key === 'genreIds') {
                data.genreIds.forEach(id => formDataToSend.append('genreIds[]', id));
            } else if (data[key] !== null && typeof data[key] !== 'undefined') {
                formDataToSend.append(key, data[key]);
            }
        }
        if (picture.poster) formDataToSend.append('poster', picture.poster);
        if (picture.banner) formDataToSend.append('banner', picture.banner);

        try {
            const url = "/api/admin/movies";
            await axios.post(url, formDataToSend, {
                headers: {
                    ...authHeader(),
                    'Content-Type': 'multipart/form-data'
                }
            });

            toast.success("Đã thêm phim mới thành công!");
            localStorage.removeItem("movieDraft");
            resetForm();
            setTimeout(() => navigate('/admin/movie/list'), 500);

        } catch (error) {
            handleApiError(error, "lưu phim");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleShowOffcanvas = useCallback((type) => {
        setOffcanvasType(type);
        setShowOffcanvas(true);
    }, []);

    const handleCloseOffcanvas = useCallback(() => {
        setShowOffcanvas(false);
        setOffcanvasType(null);
    }, []);

    const handleItemAdded = useCallback((type, newItem) => {
        if (!newItem || !type) return;
        switch (type) {
            case 'genre':
                setGenres(prev => [...prev, newItem]);
                setSelectedGenres(prev => [...prev, { id: newItem.id, title: newItem.title }]);
                break;
            case 'category':
                setCategories(prev => [...prev, newItem]);
                setData(prev => ({ ...prev, categoryId: newItem.id }));
                break;
            case 'country':
                setCountries(prev => [...prev, newItem]);
                setData(prev => ({ ...prev, countryId: newItem.id }));
                break;
            default:
                break;
        }
        handleCloseOffcanvas();
        toast.success(`Đã thêm ${type} mới thành công!`);
    }, [handleCloseOffcanvas]);

    return (
        <>
            <div className="flex-grow-1 container-p-y container-fluid add-edit-content-page">
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4 row-gap-4">
                    <div className="d-flex flex-column justify-content-center">
                        <h4 className="mb-1">Thêm Phim Mới</h4>
                    </div>
                    <div className="d-flex align-content-center flex-wrap gap-4">
                        <div className="d-flex gap-4">
                            <button className="btn btn-label-secondary" onClick={handleDiscard} disabled={isSubmitting}>Hủy bỏ</button>
                            <button className="btn btn-label-info" onClick={handleSaveDraft} disabled={isSubmitting}>Lưu nháp</button>
                        </div>
                        <button className="btn btn-primary" onClick={handleSave} disabled={isSubmitting || isFetching}>
                            {isSubmitting ? <i className="fas fa-spinner fa-spin me-2"></i> : <i className="fas fa-plus me-2"></i>}
                            {isSubmitting ? "Đang lưu..." : "Lưu Phim"}
                        </button>
                    </div>
                </div>

                {isFetching ? (
                    <div className="text-center p-5"> <i className="fas fa-spinner fa-spin fa-3x"></i> </div>
                ) : (
                    <div className="row">
                        <div className="col-12 col-lg-8">
                            <MovieInfoForm
                                data={data}
                                slug={slug}
                                onTitleChange={handleTitleChange}
                                onInputChange={handleChange}
                            />
                            <MovieImageUploader
                                picture={picture}
                                onPictureChange={handlePictureChange}
                            />
                        </div>

                        <div className="col-12 col-lg-4">
                            <MovieMetaForm
                                data={data}
                                onInputChange={handleChange}
                                genres={genres}
                                countries={countries}
                                categories={categories}
                                selectedGenres={selectedGenres}
                                onSelectedGenresChange={setSelectedGenres}
                                onShowAddItemOffcanvas={handleShowOffcanvas}
                            />
                        </div>
                    </div>
                )}
            </div>

            <AddItemOffcanvas
                show={showOffcanvas}
                onHide={handleCloseOffcanvas}
                type={offcanvasType}
                onItemAdded={handleItemAdded}
                handleApiError={handleApiError}
            />
        </>
    );
};

export default AddMovie;