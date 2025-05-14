import axios from "axios";
import React, { useCallback, useEffect, useState } from "react";
import { Bounce, toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

// Import các component con sẽ tạo
import MovieInfoForm from "../../../components/Admin/MovieForms/MovieInfoForm";
import MovieMetaForm from "../../../components/Admin/MovieForms/MovieMetaForm";
import MovieImageUploader from "../../../components/Admin/MovieForms/MovieImageUploader";
import AddItemOffcanvas from "../../../components/Admin/MovieForms/AddItemOffcanvas";

// Hooks và services
import useSlug from "../../../hooks/useSlug";
import authHeader from "../../../services/auth-header";

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
    year: new Date().getFullYear(), // Default year
    premiere: '',
    classification: '',
    trailer: '',
};

const AddMovie = () => {
    // --- States Chính ---
    const [data, setData] = useState(initialMovieData);
    const [genres, setGenres] = useState([]);
    const [countries, setCountries] = useState([]);
    const [categories, setCategories] = useState([]);
    const [picture, setPicture] = useState({ image: null, posterImage: null }); // State cho file ảnh
    const [selectedGenres, setSelectedGenres] = useState([]); // State riêng cho multi-select genre {id, title}
    const [isSubmitting, setIsSubmitting] = useState(false); // Đổi tên từ isLoading
    const [isFetching, setIsFetching] = useState(false); // State loading cho fetch dữ liệu ban đầu

    // --- States cho Offcanvas ---
    const [showOffcanvas, setShowOffcanvas] = useState(false);
    const [offcanvasType, setOffcanvasType] = useState(null); // 'genre', 'category', 'country'

    // --- Hooks ---
    const { slug, setInput } = useSlug(300); // Hook tạo slug
    const navigate = useNavigate();

    // --- Fetch dữ liệu ban đầu (Genres, Countries, Categories) ---
    const fetchInitialData = useCallback(async () => {
        setIsFetching(true);
        try {
            const [genresRes, countriesRes, categoriesRes] = await Promise.all([
                axios.get(`/api/genres`), // Bỏ header nếu API public
                axios.get(`/api/countries`),// Bỏ header nếu API public
                axios.get(`/api/categories`)// Bỏ header nếu API public
            ]);

            const fetchedGenres = genresRes.data || [];
            const fetchedCountries = countriesRes.data || [];
            const fetchedCategories = categoriesRes.data || [];

            setGenres(fetchedGenres);
            setCountries(fetchedCountries);
            setCategories(fetchedCategories);

            // Load draft sau khi có dữ liệu G/Co/Ca để xử lý selectedGenres đúng
            loadDraft(fetchedGenres);

            // Set default country/category nếu có dữ liệu
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
    }, []); // Dependency rỗng, chỉ chạy 1 lần

    useEffect(() => {
        fetchInitialData();
    }, [fetchInitialData]);

    // --- Xử lý lỗi API chung ---
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

    // --- Xử lý Input Form ---
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
        setInput(title); // Kích hoạt hook useSlug
    }, [setInput]);

    // Cập nhật slug vào state data
    useEffect(() => {
        // Chỉ cập nhật slug nếu người dùng đang nhập title (tránh ghi đè khi load draft)
        // Có thể thêm điều kiện kiểm tra khác nếu cần
        setData((prev) => ({ ...prev, slug }));
    }, [slug]);

    // Cập nhật genreIds trong state data khi selectedGenres thay đổi
    useEffect(() => {
        const newGenreIds = selectedGenres.map((genre) => genre.id);
        setData((prev) => ({ ...prev, genreIds: newGenreIds }));
    }, [selectedGenres]);

    // Xử lý thay đổi ảnh
    const handlePictureChange = useCallback((pictureType, file) => {
        setPicture(prev => ({ ...prev, [pictureType]: file }));
    }, []);

    // --- Logic Nháp ---
    const resetForm = useCallback(() => {
        setData(initialMovieData);
        setPicture({ image: null, posterImage: null });
        setSelectedGenres([]);
        setInput(''); // Reset cả slug
        // Đặt lại giá trị mặc định cho country/category nếu cần
        if (countries.length > 0) setData(prev => ({ ...prev, countryId: countries[0].id }));
        if (categories.length > 0) setData(prev => ({ ...prev, categoryId: categories[0].id }));
    }, [countries, categories, setInput]); // Thêm dependency

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
        // Lưu cả selectedGenres để khôi phục đúng
        const draft = { ...data, selectedGenres };
        localStorage.setItem("movieDraft", JSON.stringify(draft));
        toast.success("Đã lưu bản nháp thành công.");
    }, [data, selectedGenres]);

    const loadDraft = useCallback((currentGenres) => {
        const savedDraft = localStorage.getItem("movieDraft");
        if (savedDraft) {
            try {
                const draftData = JSON.parse(savedDraft);
                // Khôi phục state data (trừ slug vì nó sẽ tự tạo lại)
                const { slug: draftSlug, selectedGenres: draftSelectedGenres, ...restOfDraftData } = draftData;
                setData(prev => ({ ...initialMovieData, ...restOfDraftData })); // Merge với initial để có đủ field
                // Khôi phục selectedGenres dựa trên ID đã lưu và dữ liệu genres hiện tại
                if (draftSelectedGenres && currentGenres.length > 0) {
                    const restoredGenres = draftSelectedGenres
                        .map(draftGenre => currentGenres.find(g => g.id === draftGenre.id))
                        .filter(Boolean); // Lọc bỏ những genre không còn tồn tại
                    setSelectedGenres(restoredGenres);
                }
                // Kích hoạt lại slug nếu có title
                if (draftData.title) {
                    setInput(draftData.title);
                }
                toast.info("Đã khôi phục bản nháp.", { autoClose: 1500 });
            } catch (e) {
                console.error("Failed to parse movie draft:", e);
                localStorage.removeItem("movieDraft");
            }
        }
    }, [setInput]); // Không cần dependency nhiều vì chỉ chạy 1 lần trong fetchInitialData


    // --- Logic Lưu Phim Chính ---
    const handleSave = async (e) => {
        e.preventDefault();
        if (!data.title.trim()) {
            toast.warn("Tên phim không được để trống.");
            return;
        }
        if (!picture.image) {
            toast.warn("Vui lòng thêm hình ảnh chính cho phim.");
            return;
        }
        if (!picture.posterImage) {
            toast.warn("Vui lòng thêm ảnh poster cho phim.");
            return;
        }

        setIsSubmitting(true);

        const formDataToSend = new FormData();
        // Append fields từ state 'data'
        for (let key in data) {
            if (key === 'genreIds') { // Append mảng genreIds đúng cách
                data.genreIds.forEach(id => formDataToSend.append('genreIds[]', id));
            } else if (data[key] !== null && typeof data[key] !== 'undefined') { // Chỉ append nếu có giá trị
                formDataToSend.append(key, data[key]);
            }
        }
        // Append ảnh
        if (picture.image) formDataToSend.append('image', picture.image);
        if (picture.posterImage) formDataToSend.append('poster', picture.posterImage);

        try {
            const url = "/api/movies"; // Endpoint thêm phim
            await axios.post(url, formDataToSend, {
                headers: {
                    ...authHeader(),
                    'Content-Type': 'multipart/form-data' // Quan trọng cho FormData
                }
            });

            toast.success("Đã thêm phim mới thành công!");
            localStorage.removeItem("movieDraft"); // Xóa nháp
            resetForm(); // --- Reset Form sau khi lưu ---
            setTimeout(() => navigate('/admin/movie/list'), 500); // Điều hướng

        } catch (error) {
            // --- Xử lý lỗi API ---
            handleApiError(error, "lưu phim");
        } finally {
            setIsSubmitting(false);
        }
    };

    // --- Logic Offcanvas ---
    const handleShowOffcanvas = useCallback((type) => {
        setOffcanvasType(type);
        setShowOffcanvas(true);
    }, []);

    const handleCloseOffcanvas = useCallback(() => {
        setShowOffcanvas(false);
        setOffcanvasType(null);
    }, []);

    // Hàm được gọi khi item mới được thêm thành công từ Offcanvas
    const handleItemAdded = useCallback((type, newItem) => {
        if (!newItem || !type) return;
        switch (type) {
            case 'genre':
                setGenres(prev => [...prev, newItem]);
                // Tự động chọn luôn genre vừa thêm
                setSelectedGenres(prev => [...prev, { id: newItem.id, title: newItem.title }]);
                break;
            case 'category':
                setCategories(prev => [...prev, newItem]);
                // Tự động chọn category vừa thêm vào dropdown
                setData(prev => ({ ...prev, categoryId: newItem.id }));
                break;
            case 'country':
                setCountries(prev => [...prev, newItem]);
                // Tự động chọn country vừa thêm vào dropdown
                setData(prev => ({ ...prev, countryId: newItem.id }));
                break;
            default:
                break;
        }
        handleCloseOffcanvas(); // Đóng offcanvas sau khi thêm
        toast.success(`Đã thêm ${type} mới thành công!`);
    }, [handleCloseOffcanvas]); // Thêm dependency

    // --- Render ---
    return (
        <>
            <div className="flex-grow-1 container-p-y container-fluid">
                {/* Nút bấm và tiêu đề chính */}
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
                        {/* Cột Trái (Thông tin chính & Ảnh) */}
                        <div className="col-12 col-lg-8">
                            <MovieInfoForm
                                data={data}
                                slug={slug} // Truyền slug từ hook
                                onTitleChange={handleTitleChange}
                                onInputChange={handleChange} // Truyền hàm chung
                            />
                            <MovieImageUploader
                                picture={picture}
                                onPictureChange={handlePictureChange} // Truyền hàm cập nhật ảnh
                            />
                        </div>

                        {/* Cột Phải (Metadata & Thông tin bổ sung) */}
                        <div className="col-12 col-lg-4">
                            <MovieMetaForm
                                data={data}
                                onInputChange={handleChange}
                                genres={genres}
                                countries={countries}
                                categories={categories}
                                selectedGenres={selectedGenres} // Truyền state genre đã chọn
                                onSelectedGenresChange={setSelectedGenres} // Truyền hàm set state genre
                                onShowAddItemOffcanvas={handleShowOffcanvas} // Truyền hàm mở Offcanvas
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Offcanvas Component */}
            <AddItemOffcanvas
                show={showOffcanvas}
                onHide={handleCloseOffcanvas}
                type={offcanvasType}
                onItemAdded={handleItemAdded} // Truyền hàm callback khi thêm thành công
                handleApiError={handleApiError} // Truyền hàm xử lý lỗi chung
            />
        </>
    );
};

export default AddMovie;