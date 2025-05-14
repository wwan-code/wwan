// src/pages/admin/comics/EditComic.jsx
import axios from "axios";
import React, { useCallback, useEffect, useState } from "react";
import { Bounce, toast } from "react-toastify";
import { useNavigate, useParams, Link } from "react-router-dom";

import ComicInfoForm from "../../../components/Admin/ComicForms/ComicInfoForm";
import ComicMetaForm from "../../../components/Admin/ComicForms/ComicMetaForm";
import ComicCoverUploader from "../../../components/Admin/ComicForms/ComicCoverUploader";
import AddItemOffcanvas from "../../../components/Admin/MovieForms/AddItemOffcanvas";

import useSlug from "../../../hooks/useSlug";
import authHeader from "../../../services/auth-header";
import '../../../assets/scss/admin/AddEditContentPage.scss';

const initialComicData = {
    title: '', subTitle: '', slug: '', description: '', author: '', artist: '',
    status: 'ongoing', year: new Date().getFullYear(), genreIds: [],
    countryId: '', categoryId: '',
};

const EditComic = () => {
    const { comicId } = useParams();
    const navigate = useNavigate();

    const [data, setData] = useState(null); // Dữ liệu form, ban đầu là null
    const [genres, setGenres] = useState([]);
    const [countries, setCountries] = useState([]);
    const [categories, setCategories] = useState([]);
    const [coverImageFile, setCoverImageFile] = useState(null);
    const [initialCoverImageUrl, setInitialCoverImageUrl] = useState(null); // URL ảnh bìa ban đầu
    const [selectedGenres, setSelectedGenres] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isFetchingInitial, setIsFetchingInitial] = useState(true);

    const [showOffcanvas, setShowOffcanvas] = useState(false);
    const [offcanvasType, setOffcanvasType] = useState(null);

    const { slug, setInput: setTitleForSlugHook } = useSlug(300);

    const handleApiError = (error, operation = "thực hiện") => {
        console.error(`Failed to ${operation}:`, error);
        let message = `Thao tác ${operation} thất bại. Vui lòng thử lại.`;
        if (error.response?.data?.message) {
            message = error.response.data.message;
        } else if (error.message) {
            message = error.message;
        }
        toast.error(message, {
            position: "top-right",
            autoClose: 4000,
            theme: document.documentElement.getAttribute("data-ww-theme") || "light",
            transition: Bounce,
        });
    };

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
                    // Sử dụng API lấy chi tiết comic cho admin đã tạo ở bước trước
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
                    genreIds: comic.genres ? comic.genres.map(g => String(g.id)) : [], // API nên trả về genres
                    countryId: comic.countryId ? String(comic.countryId) : (allCountries.length > 0 ? String(allCountries[0].id) : ''),
                    categoryId: comic.categoryId ? String(comic.categoryId) : (allCategories.length > 0 ? String(allCategories[0].id) : ''),
                });
                setTitleForSlugHook(comic.title || '');
                setInitialCoverImageUrl(comic.coverImage || null);

                // Khôi phục selectedGenres từ comic.genres
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

    useEffect(() => { // Cập nhật slug nếu title thay đổi VÀ slug mới khác slug cũ
        if (data && data.title && slug && slug !== data.slug) {
            setData(prev => ({ ...prev, slug }));
        }
    }, [slug, data, data?.title, data?.slug]);

    useEffect(() => {
    if (!data) return;
    const newGenreIds = selectedGenres.map(g => g.id);
    // Chỉ cập nhật nếu genreIds thực sự thay đổi
    if (
        !Array.isArray(data.genreIds) ||
        data.genreIds.length !== newGenreIds.length ||
        data.genreIds.some((id, idx) => id !== newGenreIds[idx])
    ) {
        setData(prev => ({ ...prev, genreIds: newGenreIds }));
    }
}, [selectedGenres]);


    const handleCoverImageChange = useCallback((file) => {
        setCoverImageFile(file);
        if (file) {
            setInitialCoverImageUrl(null); // Nếu chọn file mới, không dùng initial URL nữa
        }
    }, []);

    const handleSave = async (e) => {
        e.preventDefault();
        if (!data.title.trim()) { toast.warn("Tên truyện là bắt buộc."); return; }
        // Khi sửa, ảnh bìa không bắt buộc phải upload lại
        if (data.genreIds.length === 0) { toast.warn("Vui lòng chọn ít nhất một thể loại."); return; }
        if (!data.countryId) { toast.warn("Vui lòng chọn quốc gia."); return; }
        if (!data.categoryId) { toast.warn("Vui lòng chọn phân loại (category)."); return; }

        setIsSubmitting(true);
        const formDataToSend = new FormData();
        // Chỉ gửi những trường có thể đã thay đổi
        Object.keys(data).forEach(key => {
            if (key === 'genreIds') {
                data.genreIds.forEach(id => formDataToSend.append('genreIds[]', id));
            } else if (data[key] !== null && data[key] !== '' && data[key] !== initialComicData[key]) { // Chỉ gửi nếu thay đổi so với initial hoặc có giá trị
                formDataToSend.append(key, data[key]);
            } else if (key === 'year' && data[key]) { // Luôn gửi year nếu có
                formDataToSend.append(key, data[key]);
            }
        });
        // Gửi slug nếu nó đã thay đổi (hook useSlug sẽ cập nhật data.slug)
        if (data.slug) formDataToSend.append('slug', data.slug);


        if (coverImageFile) {
            formDataToSend.append('coverImage', coverImageFile);
        } else if (!initialCoverImageUrl && data.coverImage === null) { // Nếu ảnh ban đầu đã bị xóa và không có file mới
            formDataToSend.append('removeCoverImage', 'true'); // Tín hiệu cho backend xóa ảnh
        }


        try {
            await axios.put(`/api/admin/comics/${comicId}`, formDataToSend, { headers: { ...authHeader() } });
            toast.success("Đã cập nhật truyện thành công!");
            setCoverImageFile(null); // Reset file sau khi submit
            // fetchAllDataForEdit(); // Tải lại dữ liệu mới nhất
            setTimeout(() => navigate('/admin/comics'), 500);
        } catch (error) { handleApiError(error, "cập nhật truyện"); }
        finally { setIsSubmitting(false); }
    };

    // --- Logic Offcanvas ---
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

    if (isFetchingInitial || !data) { // Hiển thị loading khi đang fetch hoặc data chưa có
        return <div className="text-center p-5"> <span className="spinner-border spinner-border-lg text-primary"></span> </div>;
    }

    return (
        <>
            <div className="flex-grow-1 container-p-y container-fluid add-edit-content-page">
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4 row-gap-4 page-actions-header">
                    <div className="d-flex align-items-center">
                        <Link to="/admin/comics" className="btn btn-icon btn-label-secondary me-2" title="Quay lại danh sách">
                            <i className="fas fa-arrow-left"></i>
                        </Link>
                        <h4 className="mb-0 page-main-title">Chỉnh sửa Truyện: <span className="fw-light">{data.title}</span></h4>
                    </div>
                    <div className="d-flex align-content-center flex-wrap gap-3">
                        <button className="btn btn-primary" onClick={handleSave} disabled={isSubmitting || isFetchingInitial}>
                            {isSubmitting ? <span className="spinner-border spinner-border-sm me-2"></span> : <i className="fas fa-save me-2"></i>}
                            {isSubmitting ? "Đang lưu..." : "Lưu thay đổi"}
                        </button>
                    </div>
                </div>
                <form onSubmit={handleSave}>
                    <div className="row">
                        <div className="col-12 col-lg-8">
                            <ComicInfoForm
                                data={data}
                                slug={data.slug}
                                onTitleChange={handleTitleChange}
                                onInputChange={handleChange}
                                isSubmitting={isSubmitting}
                            />
                            <ComicCoverUploader
                                coverImageFile={coverImageFile}
                                initialCoverImageUrl={initialCoverImageUrl} // Truyền URL ảnh bìa ban đầu
                                onCoverImageChange={handleCoverImageChange}
                                isSubmitting={isSubmitting}
                                comicData={data} // Truyền comicData để component biết đang edit
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
                    {/*
                     <div className="mt-4 text-end">
                         <button className="btn btn-primary" type="submit" disabled={isSubmitting || isFetchingInitial}>
                             {isSubmitting ? <span className="spinner-border spinner-border-sm me-2"></span> : <i className="fas fa-save me-2"></i>}
                             {isSubmitting ? "Đang lưu..." : "Lưu thay đổi"}
                         </button>
                     </div>
                     */}
                </form>
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