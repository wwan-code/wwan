// src/pages/admin/comics/AddComic.jsx
import axios from "axios";
import React, { useCallback, useEffect, useState } from "react";
import { Bounce, toast } from "react-toastify";
import { useNavigate, Link } from "react-router-dom"; // Thêm Link

import ComicInfoForm from "../../../components/Admin/ComicForms/ComicInfoForm";
import ComicMetaForm from "../../../components/Admin/ComicForms/ComicMetaForm";
import ComicCoverUploader from "../../../components/Admin/ComicForms/ComicCoverUploader";
import AddItemOffcanvas from "../../../components/Admin/MovieForms/AddItemOffcanvas"; // Dùng lại AddItemOffcanvas của Movie

import useSlug from "../../../hooks/useSlug";
import authHeader from "../../../services/auth-header";
import '../../../assets/scss/admin/AddEditContentPage.scss';

const initialComicData = {
    title: '', subTitle: '', slug: '', description: '', author: '', artist: '',
    status: 'ongoing', year: new Date().getFullYear(), genreIds: [],
    countryId: '', categoryId: '',
};

const AddComic = () => {
    const [data, setData] = useState(initialComicData);
    const [genres, setGenres] = useState([]);
    const [countries, setCountries] = useState([]);
    const [categories, setCategories] = useState([]);
    const [coverImageFile, setCoverImageFile] = useState(null); // Chỉ File object cho ảnh mới
    const [selectedGenres, setSelectedGenres] = useState([]); // Mảng các object {id, title}
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isFetchingInitial, setIsFetchingInitial] = useState(true);

    const [showOffcanvas, setShowOffcanvas] = useState(false);
    const [offcanvasType, setOffcanvasType] = useState(null);

    const { slug, setInput: setTitleForSlugHook } = useSlug(300);
    const navigate = useNavigate();

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

    const fetchInitialSelectData = useCallback(async () => {
        setIsFetchingInitial(true);
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

            // Set default country/category nếu có dữ liệu và chưa có giá trị
            if (fetchedCountries.length > 0 && !data.countryId) {
                setData(prev => ({ ...prev, countryId: String(fetchedCountries[0].id) }));
            }
            if (fetchedCategories.length > 0 && !data.categoryId) {
                setData(prev => ({ ...prev, categoryId: String(fetchedCategories[0].id) }));
            }
            loadDraft(fetchedGenres, fetchedCountries, fetchedCategories); // Truyền cả 3

        } catch (error) {
            handleApiError(error, "tải dữ liệu cần thiết cho form");
        } finally {
            setIsFetchingInitial(false);
        }
    }, []); // Bỏ data.countryId, data.categoryId khỏi dependency

    useEffect(() => {
        fetchInitialSelectData();
    }, [fetchInitialSelectData]);


    const handleChange = useCallback((e) => {
        const { name, value } = e.target;
        setData(prev => ({ ...prev, [name]: value }));
    }, []);

    const handleTitleChange = useCallback((e) => {
        const title = e.target.value;
        setData(prev => ({ ...prev, title }));
        setTitleForSlugHook(title);
    }, [setTitleForSlugHook]);

    useEffect(() => { // Cập nhật slug vào data khi hook useSlug trả về slug mới
        setData(prev => ({ ...prev, slug }));
    }, [slug]);

    useEffect(() => { // Cập nhật genreIds trong data khi selectedGenres thay đổi
        setData(prev => ({ ...prev, genreIds: selectedGenres.map(g => g.id) }));
    }, [selectedGenres]);

    const handleCoverImageChange = useCallback((file) => {
        setCoverImageFile(file);
    }, []);

    const resetForm = useCallback(() => {
        setData(initialComicData);
        setCoverImageFile(null);
        setSelectedGenres([]);
        setTitleForSlugHook('');
        if (countries.length > 0) setData(prev => ({ ...prev, countryId: String(countries[0].id) }));
        if (categories.length > 0) setData(prev => ({ ...prev, categoryId: String(categories[0].id) }));
    }, [countries, categories, setTitleForSlugHook]);

    const handleDiscard = useCallback(() => {
        if (window.confirm("Bạn chắc chắn muốn hủy bỏ các thay đổi và xóa bản nháp (nếu có)?")) {
            resetForm();
            localStorage.removeItem("comicDraft");
            toast.info("Đã hủy bỏ thay đổi.", { autoClose: 2000 });
        }
    }, [resetForm]);

    const handleSaveDraft = useCallback(() => {
        if (!data.title.trim()) {
            toast.warn("Tên truyện không được để trống để lưu nháp."); return;
        }
        const draft = { ...data, selectedGenres }; // Lưu selectedGenres để khôi phục
        localStorage.setItem("comicDraft", JSON.stringify(draft));
        toast.success("Đã lưu bản nháp thành công.");
    }, [data, selectedGenres]);

    const loadDraft = useCallback((currentGenres, currentCountries, currentCategories) => {
        const savedDraft = localStorage.getItem("comicDraft");
        if (savedDraft) {
            try {
                const draftData = JSON.parse(savedDraft);
                const { selectedGenres: draftSelectedGenres, ...restOfDraftData } = draftData;
                setData(prev => ({
                    ...initialComicData, // Bắt đầu từ initial để đảm bảo các field
                    ...restOfDraftData,
                    // Đảm bảo countryId và categoryId là string nếu chúng tồn tại trong draft
                    countryId: draftData.countryId ? String(draftData.countryId) : (currentCountries.length > 0 ? String(currentCountries[0].id) : ''),
                    categoryId: draftData.categoryId ? String(draftData.categoryId) : (currentCategories.length > 0 ? String(currentCategories[0].id) : ''),
                }));

                if (draftSelectedGenres && currentGenres.length > 0) {
                    const restoredGenres = draftSelectedGenres
                        .map(draftGenre => currentGenres.find(g => String(g.id) === String(draftGenre.id)))
                        .filter(Boolean);
                    setSelectedGenres(restoredGenres);
                }
                if (draftData.title) setTitleForSlugHook(draftData.title);
                toast.info("Đã khôi phục bản nháp.", { autoClose: 1500 });
            } catch (e) { console.error("Lỗi parse comic draft:", e); localStorage.removeItem("comicDraft"); }
        }
    }, [setTitleForSlugHook]);


    const handleSave = async (e) => {
        e.preventDefault();
        if (!data.title.trim()) { toast.warn("Tên truyện là bắt buộc."); return; }
        if (!coverImageFile) { toast.warn("Ảnh bìa là bắt buộc."); return; }
        if (data.genreIds.length === 0) { toast.warn("Vui lòng chọn ít nhất một thể loại."); return; }
        if (!data.countryId) { toast.warn("Vui lòng chọn quốc gia."); return; }
        if (!data.categoryId) { toast.warn("Vui lòng chọn phân loại (category)."); return; }


        setIsSubmitting(true);
        const formDataToSend = new FormData();
        Object.keys(data).forEach(key => {
            if (key === 'genreIds') {
                data.genreIds.forEach(id => formDataToSend.append('genreIds[]', id));
            } else if (data[key] !== null && data[key] !== '') { // Chỉ gửi nếu có giá trị
                formDataToSend.append(key, data[key]);
            }
        });
        if (coverImageFile) formDataToSend.append('coverImage', coverImageFile);

        try {
            await axios.post("/api/admin/comics", formDataToSend, { headers: { ...authHeader() } });
            toast.success("Đã thêm truyện mới thành công!");
            localStorage.removeItem("comicDraft");
            resetForm();
            setTimeout(() => navigate('/admin/comics'), 500);
        } catch (error) { handleApiError(error, "lưu truyện"); }
        finally { setIsSubmitting(false); }
    };

    // --- Logic Offcanvas (Giữ nguyên) ---
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
            <div className="flex-grow-1 container-p-y container-fluid add-edit-content-page"> {/* Dùng class chung */}
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4 row-gap-4 page-actions-header">
                    <div className="d-flex flex-column justify-content-center">
                        <h4 className="mb-1 page-main-title">Thêm Truyện Ảnh Mới</h4>
                    </div>
                    <div className="d-flex align-content-center flex-wrap gap-3">
                        <button className="btn btn-label-secondary" onClick={handleDiscard} disabled={isSubmitting}>
                            <i className="fas fa-times-circle me-2"></i>Hủy bỏ
                        </button>
                        <button className="btn btn-label-info" onClick={handleSaveDraft} disabled={isSubmitting}>
                            <i className="fas fa-save me-2"></i>Lưu nháp
                        </button>
                        <button className="btn btn-primary" onClick={handleSave} disabled={isSubmitting || isFetchingInitial}>
                            {isSubmitting ? <span className="spinner-border spinner-border-sm me-2"></span> : <i className="fas fa-plus me-2"></i>}
                            {isSubmitting ? "Đang lưu..." : "Lưu Truyện"}
                        </button>
                    </div>
                </div>

                {isFetchingInitial ? (
                    <div className="text-center p-5"> <span className="spinner-border spinner-border-lg text-primary"></span> </div>
                ) : (
                    <form onSubmit={handleSave}> {/* Bọc toàn bộ form nếu bạn muốn submit từ nút cuối */}
                        <div className="row">
                            <div className="col-12 col-lg-8">
                                <ComicInfoForm
                                    data={data}
                                    slug={data.slug} // Truyền slug từ state data (đã được hook cập nhật)
                                    onTitleChange={handleTitleChange}
                                    onInputChange={handleChange}
                                    isSubmitting={isSubmitting}
                                />
                                <ComicCoverUploader
                                    coverImageFile={coverImageFile}
                                    // initialCoverImageUrl không cần cho AddComic
                                    onCoverImageChange={handleCoverImageChange}
                                    isSubmitting={isSubmitting}
                                    comicData={null} // Không có comicData ban đầu khi thêm mới
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
                        {/* Nút Lưu có thể đặt ở đây nếu form quá dài, hoặc giữ ở header */}
                        {/*
                         <div className="mt-4 text-end">
                             <button className="btn btn-primary" type="submit" disabled={isSubmitting || isFetchingInitial}>
                                 {isSubmitting ? <span className="spinner-border spinner-border-sm me-2"></span> : <i className="fas fa-plus me-2"></i>}
                                 {isSubmitting ? "Đang lưu..." : "Lưu Truyện"}
                             </button>
                         </div>
                         */}
                    </form>
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

export default AddComic;