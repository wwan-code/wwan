// src/pages/admin/comics/EditComic.jsx
import axios from "axios";
import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useNavigate, useParams, Link } from "react-router-dom";

import ComicInfoForm from "@components/Admin/ComicForms/ComicInfoForm";
import ComicMetaForm from "@components/Admin/ComicForms/ComicMetaForm";
import AddItemOffcanvas from "@components/Admin/MovieForms/AddItemOffcanvas";
import ComicImageUploader from "@components/Admin/ComicForms/ComicImageUploader";
import { handleApiError } from "@utils/handleApiError";
import useSlug from "@hooks/useSlug";
import authHeader from "@services/auth-header";
import '@assets/scss/admin/AddEditContentPage.scss';

const initialComicData = {
    title: '', subTitle: '', slug: '', description: '', author: '', artist: '',
    status: 'ongoing', year: new Date().getFullYear(), genreIds: [],
    countryId: '', categoryId: '',
};

const EditComic = () => {
    const { comicId } = useParams();
    const navigate = useNavigate();

    const [data, setData] = useState(null);
    const [genres, setGenres] = useState([]);
    const [countries, setCountries] = useState([]);
    const [categories, setCategories] = useState([]);
    const [imageFiles, setImageFiles] = useState({
        cover: null,
        banner: null
    });
    const [initialImageUrls, setInitialImageUrls] = useState({ cover: null, banner: null });
    const [selectedGenres, setSelectedGenres] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isFetchingInitial, setIsFetchingInitial] = useState(true);
    const [showOffcanvas, setShowOffcanvas] = useState(false);
    const [offcanvasType, setOffcanvasType] = useState(null);

    const { slug, setInput: setTitleForSlugHook } = useSlug(300);

    useEffect(() => {
        const fetchAllDataForEdit = async () => {
            if (!comicId) {
                toast.error("Không tìm thấy ID truyện.");
                setIsFetchingInitial(false);
                navigate("/admin/comics");
                return;
            }
            setIsFetchingInitial(true);
            try {
                const [comicRes, genresRes, countriesRes, categoriesRes] = await Promise.all([
                    axios.get(`/api/admin/comics/${comicId}`, { headers: authHeader() }),
                    axios.get(`/api/genres`),
                    axios.get(`/api/countries`),
                    axios.get(`/api/categories`)
                ]);

                if (!comicRes.data || !comicRes.data.success || !comicRes.data.comic) {
                    throw new Error("Không tìm thấy dữ liệu truyện.");
                }
                const comic = comicRes.data.comic;
                const allGenres = genresRes.data || [];
                const allCountries = countriesRes.data || [];
                const allCategories = categoriesRes.data || [];

                setGenres(allGenres);
                setCountries(allCountries);
                setCategories(allCategories);

                setData({
                    title: comic.title || '',
                    subTitle: comic.subTitle || '',
                    slug: comic.slug || '',
                    description: comic.description || '',
                    author: comic.author || '',
                    artist: comic.artist || '',
                    status: comic.status || 'ongoing',
                    year: comic.year || new Date().getFullYear(),
                    genreIds: comic.genres ? comic.genres.map(g => String(g.id)) : [],
                    countryId: comic.countryId ? String(comic.countryId) : (allCountries.length > 0 ? String(allCountries[0].id) : ''),
                    categoryId: comic.categoryId ? String(comic.categoryId) : (allCategories.length > 0 ? String(allCategories[0].id) : ''),
                });
                setTitleForSlugHook(comic.title || '');
                setInitialImageUrls({ cover: comic.coverImage || null, banner: comic.bannerImage || null });
                if (comic.genres && allGenres.length > 0) {
                    const currentSelected = comic.genres
                        .map(cg => allGenres.find(g => g.id === cg.id))
                        .filter(Boolean);
                    setSelectedGenres(currentSelected);
                }


            } catch (error) {
                handleApiError(error, `tải dữ liệu truyện ID ${comicId}`);
                navigate('/admin/comics');
            } finally {
                setIsFetchingInitial(false);
            }
        };
        fetchAllDataForEdit();
    }, [comicId, navigate, setTitleForSlugHook]);


    const handleChange = useCallback((e) => {
        const { name, value } = e.target;
        setData(prev => ({ ...prev, [name]: value }));
    }, []);

    const handleTitleChange = useCallback((e) => {
        const title = e.target.value;
        setData(prev => ({ ...prev, title }));
        setTitleForSlugHook(title);
    }, [setTitleForSlugHook]);

    useEffect(() => {
        if (data && data.title && slug && slug !== data.slug) {
            setData(prev => ({ ...prev, slug }));
        }
    }, [slug, data, data?.title, data?.slug]);

    useEffect(() => {
        if (!data) return;
        const newGenreIds = selectedGenres.map(g => g.id);
        if (
            !Array.isArray(data.genreIds) ||
            data.genreIds.length !== newGenreIds.length ||
            data.genreIds.some((id, idx) => id !== newGenreIds[idx])
        ) {
            setData(prev => ({ ...prev, genreIds: newGenreIds }));
        }
    }, [selectedGenres]);

    const handleImageChange = useCallback((imageType, file) => {
        setImageFiles(prev => ({ ...prev, [imageType]: file }));
        if (file && initialImageUrls[imageType]) {
            setInitialImageUrls(prev => ({ ...prev, [imageType]: null }));
        }
    }, []);

    const handleSave = async (e) => {
        e.preventDefault();
        if (!data.title.trim()) { toast.warn("Tên truyện là bắt buộc."); return; }
        if (data.genreIds.length === 0) { toast.warn("Vui lòng chọn ít nhất một thể loại."); return; }
        if (!data.countryId) { toast.warn("Vui lòng chọn quốc gia."); return; }
        if (!data.categoryId) { toast.warn("Vui lòng chọn phân loại (category)."); return; }

        setIsSubmitting(true);
        const formDataToSend = new FormData();
        Object.keys(data).forEach(key => {
            if (key === 'genreIds') {
                data.genreIds.forEach(id => formDataToSend.append('genreIds[]', id));
            } else if (data[key] !== null && data[key] !== '' && data[key] !== initialComicData[key]) {
                formDataToSend.append(key, data[key]);
            } else if (key === 'year' && data[key]) {
                formDataToSend.append(key, data[key]);
            }
        });
        
        if (imageFiles.cover instanceof File) {
            formDataToSend.append('coverImage', imageFiles.cover);
        }
        if (imageFiles.banner instanceof File) {
            formDataToSend.append('bannerImage', imageFiles.banner);
        }

        try {
            await axios.put(`/api/admin/comics/${comicId}`, formDataToSend, { headers: { ...authHeader() } });
            toast.success("Đã cập nhật truyện thành công!");
            setImageFiles({ cover: null, banner: null });
            setTimeout(() => navigate('/admin/comics'), 500);
        } catch (error) { handleApiError(error, "cập nhật truyện"); }
        finally { setIsSubmitting(false); }
    };

    const handleShowOffcanvas = useCallback((type) => { setOffcanvasType(type); setShowOffcanvas(true); }, []);
    const handleCloseOffcanvas = useCallback(() => { setShowOffcanvas(false); setOffcanvasType(null); }, []);
    const handleItemAdded = useCallback((type, newItem) => {
        if (!newItem || !type) return;
        switch (type) {
            case 'genre':
                setGenres(prev => {
                    const exists = prev.some(g => g.id === newItem.genre.id);
                    return exists ? prev : [...prev, newItem.genre];
                });
                setSelectedGenres(prev => {
                    const exists = prev.some(g => g.id === newItem.genre.id);
                    return exists ? prev : [...prev, { id: newItem.genre.id, title: newItem.genre.title }];
                });
                break;
            case 'category':
                setCategories(prev => {
                    const exists = prev.some(c => c.id === newItem.category.id);
                    return exists ? prev : [...prev, newItem.category];
                });
                setData(prev => ({ ...prev, categoryId: String(newItem.category.id) }));
                break;
            case 'country':
                setCountries(prev => {
                    const exists = prev.some(c => c.id === newItem.country.id);
                    return exists ? prev : [...prev, newItem.country];
                });
                setData(prev => ({ ...prev, countryId: String(newItem.country.id) }));
                break;
            default: break;
        }
        handleCloseOffcanvas();
        toast.success(`Đã thêm ${type} "${newItem.genre?.title || newItem.category?.title || newItem.country?.title}" mới thành công!`);
    }, [handleCloseOffcanvas]);

    return (
        <>
            <div className="flex-grow-1 container-p-y container-fluid add-edit-content-page">
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4 row-gap-4 page-actions-header">
                    <div className="d-flex align-items-center flex-column justify-content-center">
                        <h4 className="mb-0 page-main-title">Chỉnh sửa Truyện: {isFetchingInitial ? '...' : <span className="fw-light">{data.title}</span>}</h4>
                    </div>
                    <div className="d-flex align-content-center flex-wrap gap-3">
                        <button className="btn btn-label-secondary" onClick={() => navigate('/admin/comics')} disabled={isSubmitting}>
                            <i className="fas fa-chevron-left me-2"></i> Quay lại
                        </button>
                        <button className="btn btn-primary" onClick={handleSave} disabled={isSubmitting || isFetchingInitial}>
                            {isSubmitting ? <i className="fas fa-spinner fa-spin me-2"></i> : <i className="fas fa-save me-2"></i>}
                            {isSubmitting ? "Đang lưu..." : "Lưu thay đổi"}
                        </button>
                    </div>
                </div>
                {(isFetchingInitial || !data) ? (
                    <div className="d-flex justify-content-center align-items-center position-absolute top-0 bottom-0 start-0 end-0">
                        <div className="spinner-border text-primary" role="status">
                            <span className="visually-hidden">Loading...</span>
                        </div>
                    </div>
                ) : (
                    <div className="row">
                        <div className="col-12 col-lg-8">
                            <ComicInfoForm
                                data={data}
                                slug={data.slug}
                                onTitleChange={handleTitleChange}
                                onInputChange={handleChange}
                                isSubmitting={isSubmitting}
                            />
                            <ComicImageUploader
                                imageFiles={imageFiles}
                                initialImageUrls={initialImageUrls}
                                onImageChange={handleImageChange}
                                isSubmitting={isSubmitting}
                                comicData={data}
                            />
                        </div>
                        <div className="col-12 col-lg-4">
                            <ComicMetaForm
                                data={data}
                                onInputChange={handleChange}
                                genres={genres}
                                countries={countries}
                                categories={categories}
                                selectedGenres={selectedGenres}
                                onSelectedGenresChange={setSelectedGenres}
                                onShowAddItemOffcanvas={handleShowOffcanvas}
                                isSubmitting={isSubmitting}
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
export default EditComic;