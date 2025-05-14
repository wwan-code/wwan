// pages/Admin/Movie/EditMovie.js
import axios from "axios";
import React, { useCallback, useEffect, useState } from "react";
import { Bounce, toast } from "react-toastify";
import { useNavigate, useParams } from "react-router-dom";

// Import các component con đã tạo
import MovieInfoForm from "../../../components/Admin/MovieForms/MovieInfoForm";
import MovieMetaForm from "../../../components/Admin/MovieForms/MovieMetaForm";
import MovieImageUploader from "../../../components/Admin/MovieForms/MovieImageUploader";
import AddItemOffcanvas from "../../../components/Admin/MovieForms/AddItemOffcanvas";

// Hooks và services
import useSlug from "../../../hooks/useSlug";
import authHeader from "../../../services/auth-header";

const initialMovieData = {
    title: '', subTitle: '', slug: '', duration: '', quality: 4,
    subtitles: '', status: 1, views: 0, totalEpisodes: '', description: '',
    genreIds: [], countryId: '', categoryId: '', belongToCategory: 0,
    hasSection: 0, year: new Date().getFullYear(), premiere: '', classification: '', trailer: ''
};

const EditMovie = () => {
    const { id } = useParams(); // Lấy id từ URL
    const navigate = useNavigate();

    // --- States Chính ---
    const [data, setData] = useState(initialMovieData); // Dữ liệu form
    const [genres, setGenres] = useState([]);
    const [countries, setCountries] = useState([]);
    const [categories, setCategories] = useState([]);
    const [picture, setPicture] = useState({ image: null, posterImage: null }); // Chỉ lưu File MỚI
    const [initialImageUrls, setInitialImageUrls] = useState({ image: null, posterImage: null }); // Lưu URL ảnh ban đầu để preview
    const [selectedGenres, setSelectedGenres] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isFetching, setIsFetching] = useState(true); // Bắt đầu là true vì cần fetch dữ liệu

    // --- States cho Offcanvas (nếu dùng) ---
    const [showOffcanvas, setShowOffcanvas] = useState(false);
    const [offcanvasType, setOffcanvasType] = useState(null);

    // --- Hooks ---
    const { slug, setInput } = useSlug(300); // Dùng slug nếu title thay đổi

    // --- Xử lý lỗi API chung ---
    const handleApiError = (error, operation = "thực hiện") => {
        // ... (Giữ nguyên hàm handleApiError từ AddMovie) ...
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

    // --- Fetch dữ liệu ban đầu (Movie, Genres, Countries, Categories) ---
    useEffect(() => {
        const fetchAllData = async () => {
            if (!id) {
                toast.error("Không tìm thấy ID phim.");
                setIsFetching(false);
                return;
            }
            setIsFetching(true);
            try {
                const [movieRes, genresRes, countriesRes, categoriesRes] = await Promise.all([
                    axios.get(`/api/movies/${id}`, { headers: authHeader() }),
                    axios.get(`/api/genres`),
                    axios.get(`/api/countries`),
                    axios.get(`/api/categories`)
                ]);

                // Kiểm tra movieRes có dữ liệu không
                if (!movieRes.data || !movieRes.data.movie) {
                    throw new Error("Không tìm thấy dữ liệu phim.");
                }
                const movie = movieRes.data.movie;
                const allGenres = genresRes.data || [];
                const allCountries = countriesRes.data || [];
                const allCategories = categoriesRes.data || [];

                // Set state cho các danh sách
                setGenres(allGenres);
                setCountries(allCountries);
                setCategories(allCategories);
                console.log(movieRes.data.genreIds)
                // Set state data cho form
                setData({
                    title: movie.title || '',
                    subTitle: movie.subTitle || '',
                    slug: movie.slug || '', // Giữ slug cũ, chỉ thay đổi nếu title đổi
                    duration: movie.duration || '',
                    quality: movie.quality ?? 4, // Dùng ?? để xử lý null/undefined
                    subtitles: movie.subtitles || '',
                    status: movie.status ?? 1,
                    views: movie.views || 0,
                    totalEpisodes: movie.totalEpisodes || '',
                    description: movie.description || '',
                    genreIds: movieRes.data.genreIds || [], // Sẽ được cập nhật bởi selectedGenres effect
                    countryId: movie.countryId || (allCountries.length > 0 ? allCountries[0].id : ''),
                    categoryId: movie.categoryId || (allCategories.length > 0 ? allCategories[0].id : ''),
                    belongToCategory: movie.belongToCategory ?? 0,
                    hasSection: movie.hasSection ?? 0,
                    year: movie.year || new Date().getFullYear(),
                    premiere: movie.premiere ? new Date(movie.premiere).toISOString().split('T')[0] : '', // Format date cho input type="date"
                    classification: movie.classification || ''
                });

                // Set slug input để hook useSlug hoạt động nếu title thay đổi
                setInput(movie.title || '');

                // Set state cho selected genres
                const currentSelectedGenres = allGenres.filter(genre => movieRes.data.genreIds?.includes(genre.id));
                setSelectedGenres(currentSelectedGenres);

                // Set URL ảnh ban đầu để preview
                setInitialImageUrls({ image: movie.image || null, posterImage: movie.poster || null });

            } catch (error) {
                handleApiError(error, `tải dữ liệu phim ID ${id}`);
                // Có thể điều hướng về trang list nếu lỗi
                navigate('/admin/movie/list');
            } finally {
                setIsFetching(false);
            }
        };

        fetchAllData();
    }, [id, navigate, setInput]); // Thêm navigate, setInput


    // --- Xử lý Input Form (Giữ nguyên từ AddMovie) ---
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

    // Cập nhật slug vào state data nếu title thay đổi
    useEffect(() => {
        // Chỉ cập nhật slug nếu nó khác slug hiện tại (để tránh ghi đè slug cũ khi component mới load)
        if (data.title && slug !== data.slug) {
            setData((prev) => ({ ...prev, slug }));
        }
    }, [slug, data.title, data.slug]); // Thêm data.slug vào dependency

    // Cập nhật genreIds trong state data khi selectedGenres thay đổi
    useEffect(() => {
        const newGenreIds = selectedGenres.map((genre) => genre.id);
        // Chỉ cập nhật nếu genreIds thực sự thay đổi
        if (JSON.stringify(newGenreIds) !== JSON.stringify(data.genreIds)) {
            setData((prev) => ({ ...prev, genreIds: newGenreIds }));
        }
    }, [selectedGenres, data.genreIds]);


    // Xử lý thay đổi ảnh (File mới)
    const handlePictureChange = useCallback((pictureType, file) => {
        setPicture(prev => ({ ...prev, [pictureType]: file }));
        // Nếu chọn file mới, xóa URL ảnh ban đầu tương ứng để không gửi URL cũ
        if (file && initialImageUrls[pictureType]) {
            setInitialImageUrls(prev => ({ ...prev, [pictureType]: null }));
        }
    }, [initialImageUrls]); // Thêm dependency


    // --- Logic Lưu Cập Nhật ---
    const handleSave = async (e) => {
        e.preventDefault();
        if (!data.title.trim()) {
            toast.warn("Tên phim không được để trống.", { /* toast options */ });
            return;
        }
        // Kiểm tra xem có ảnh chính không (hoặc đã có từ trước hoặc mới upload)
        if (!initialImageUrls.image && !picture.image) {
            toast.warn("Vui lòng cung cấp hình ảnh chính cho phim.", { /* toast options */ });
            return;
        }
        if (!initialImageUrls.posterImage && !picture.posterImage) {
            toast.warn("Vui lòng cung cấp ảnh poster cho phim.", { /* toast options */ });
            return;
        }


        setIsSubmitting(true);
        const formDataToSend = new FormData();

        // Append fields từ state 'data'
        for (let key in data) {
            if (key === 'genreIds') {
                data.genreIds.forEach(id => formDataToSend.append('genreIds[]', id));
            } else if (key !== 'slug' && (data[key] !== null && typeof data[key] !== 'undefined')) { // Không gửi slug cũ, trừ khi nó đã được cập nhật bởi hook
                formDataToSend.append(key, data[key]);
            }
        }
        // Gửi slug MỚI NHẤT từ state data (đã được cập nhật bởi hook nếu title đổi)
        if (data.slug) {
            formDataToSend.append('slug', data.slug);
        }


        // --- Chỉ append ảnh NẾU nó là File object (ảnh mới) ---
        if (picture.image instanceof File) {
            formDataToSend.append('image', picture.image);
        }
        if (picture.posterImage instanceof File) {
            formDataToSend.append('poster', picture.posterImage);
        }
        // -------------------------------------------------------

        try {
            const url = `/api/movies/${id}`; // Endpoint cập nhật phim
            await axios.put(url, formDataToSend, { // Dùng PUT
                headers: {
                    ...authHeader(),
                    'Content-Type': 'multipart/form-data'
                }
            });

            toast.success("Đã cập nhật phim thành công!", { /* toast options */ });
            // Reset picture state để không gửi lại file cũ nếu ko chọn file mới
            setPicture({ image: null, posterImage: null });
            // Không cần reset toàn bộ form, có thể fetch lại dữ liệu mới nhất nếu muốn
            // fetchAllData(); // Tùy chọn: load lại data sau khi save thành công
            setTimeout(() => navigate('/admin/movie/list'), 500); // Điều hướng về danh sách

        } catch (error) {
            handleApiError(error, "cập nhật phim");
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
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4 row-gap-4">
                    <div className="d-flex flex-column justify-content-center">
                        {/* Thay đổi title */}
                        <h4 className="mb-1">Chỉnh sửa Phim: {isFetching ? '...' : data.title}</h4>
                    </div>
                    <div className="d-flex align-content-center flex-wrap gap-4">
                        {/* Nút quay lại danh sách */}
                        <button className="btn btn-label-secondary" onClick={() => navigate('/admin/movie/list')} disabled={isSubmitting}>
                            <i className="fas fa-chevron-left me-2"></i> Quay lại
                        </button>
                        <button className="btn btn-primary" onClick={handleSave} disabled={isSubmitting || isFetching}>
                            {isSubmitting ? <i className="fas fa-spinner fa-spin me-2"></i> : <i className="fas fa-save me-2"></i>}
                            {isSubmitting ? "Đang lưu..." : "Lưu thay đổi"}
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
                                slug={data.slug} // Hiển thị slug từ state data
                                onTitleChange={handleTitleChange}
                                onInputChange={handleChange}
                            />
                            <MovieImageUploader
                                picture={picture} // Chỉ chứa File mới
                                initialImageUrls={initialImageUrls} // Truyền URL ảnh ban đầu
                                onPictureChange={handlePictureChange}
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
                                selectedGenres={selectedGenres}
                                onSelectedGenresChange={setSelectedGenres}
                                onShowAddItemOffcanvas={handleShowOffcanvas} // Bỏ comment nếu dùng Offcanvas
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* --- Offcanvas Component (Nếu dùng) --- */}
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

export default EditMovie;