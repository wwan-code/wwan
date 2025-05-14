// pages/Admin/Movie/MovieList.js (Component Cha - Đã sửa đổi)
import axios from "axios";
import React, { useCallback, useEffect, useState } from "react";
import { Bounce, toast } from "react-toastify";
// Import các component con sẽ tạo
import MovieCard from "../../../components/Admin/Movie/MovieCard";
import MovieDetailsModal from "../../../components/Admin/Movie/MovieDetailsModal";
import AddToSeriesOffcanvas from "../../../components/Admin/Movie/AddToSeriesOffcanvas";
// Hooks và services
import useDropdown from "../../../hooks/useDropdown"; // Hook dropdown cho từng card
import authHeader from "../../../services/auth-header";

const MovieList = () => {
    // --- State Chính ---
    const [movies, setMovies] = useState([]);
    const [visibleMovies, setVisibleMovies] = useState(24); // Số lượng phim hiển thị ban đầu/mỗi lần load
    const [loading, setLoading] = useState(false); // Loading fetch phim ban đầu
    const [isSubmitting, setIsSubmitting] = useState(false); // Loading cho các thao tác (xóa, thêm tập, thêm series)
    const [searchTerm, setSearchTerm] = useState('');
    const [series, setSeries] = useState([]); // Danh sách series (fetch 1 lần)

    // --- State cho Modal & Offcanvas ---
    const [selectedMovie, setSelectedMovie] = useState(null); // Phim đang được chọn cho modal/offcanvas
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isOffcanvasOpen, setIsOffcanvasOpen] = useState(false);

    // --- State liên quan đến Episodes (quản lý ở cha vì cần fetch khi mở modal) ---
    const [episodes, setEpisodes] = useState([]); // Danh sách tập của phim đang chọn
    const [loadingEpisodes, setLoadingEpisodes] = useState(false);
    const [addEpisodeState, setAddEpisodeState] = useState({}); // State để bật/tắt form add episode trong modal { movieId: boolean }
    const [episodeCountMap, setEpisodeCountMap] = useState({}); // Lưu trữ số tập hiện có của mỗi phim { movieId: count }

    // --- Hooks ---
    const { openDropdown, toggleDropdown, dropdownRefCallback } = useDropdown(); // Hook cho dropdown actions

    // --- Hàm xử lý lỗi API chung ---
    const handleApiError = useCallback((error, operation = "thực hiện") => {
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
    }, []); // useCallback vì là hàm tiện ích không đổi

    // --- Fetch Dữ liệu ---
    // Fetch Movies
    const fetchMovies = useCallback(async () => {
        setLoading(true);
        try {
            const res = await axios.get("/api/movies", { headers: authHeader() });
            // Giả sử res.data.movies là mảng phim
            const fetchedMovies = res.data?.movies || [];
            setMovies(fetchedMovies);
            // Tính toán số tập ban đầu cho mỗi phim
            const initialCounts = {};
            fetchedMovies.forEach(movie => {
                // Giả sử API trả về số tập hiện có hoặc cần tính toán riêng
                // Ở đây tạm gán là 0, sẽ cập nhật khi mở modal
                initialCounts[movie.id] = movie.currentEpisodeCount || 0; // Thay 'currentEpisodeCount' bằng trường đúng nếu API có
            });
            setEpisodeCountMap(initialCounts);
        } catch (error) {
            handleApiError(error, 'tải danh sách phim');
        } finally {
            setLoading(false);
        }
    }, [handleApiError]); // Thêm dependency

    // Fetch Series (chỉ 1 lần)
    const fetchSeries = useCallback(async () => {
        // Có thể thêm setLoading cho series nếu cần
        try {
            const res = await axios.get('/api/series'); // API lấy danh sách series
            setSeries(res.data || []);
        } catch (err) {
            handleApiError(err, 'tải danh sách series');
        }
    }, [handleApiError]); // Thêm dependency

    useEffect(() => {
        fetchMovies();
        fetchSeries();
    }, [fetchMovies, fetchSeries]); // Chạy khi component mount

    // Fetch Episodes khi mở Modal
    const fetchEpisodes = useCallback(async (movieId) => {
        if (!movieId) return;
        setLoadingEpisodes(true);
        try {
            const { data } = await axios.get(`/api/episodes/${movieId}`); // API lấy episodes theo movie ID
            const fetchedEpisodes = data?.episodes || [];
            setEpisodes(fetchedEpisodes);
            // Cập nhật lại episode count chính xác khi có dữ liệu episodes
            setEpisodeCountMap(prev => ({ ...prev, [movieId]: fetchedEpisodes.length }));
        } catch (error) {
            handleApiError(error, `tải tập phim cho phim ID ${movieId}`);
            setEpisodes([]); // Reset nếu lỗi
        } finally {
            setLoadingEpisodes(false);
        }
    }, [handleApiError]); // Thêm dependency

    // --- Infinite Scroll ---
    const handleScroll = useCallback(() => {
        // Check if we're near the bottom
        const nearBottom = window.innerHeight + document.documentElement.scrollTop >= document.documentElement.offsetHeight - 300; // Gần cuối trang 300px
        if (nearBottom && !loading && visibleMovies < movies.length) { // Chỉ load thêm nếu không đang loading và còn phim
            setVisibleMovies(prev => Math.min(prev + 20, movies.length)); // Tăng số lượng hiển thị
        }
    }, [visibleMovies, movies.length, loading]); // Thêm loading dependency

    useEffect(() => {
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [handleScroll]);

    // --- Filtering ---
    const filteredMovies = movies.filter(movie =>
        movie.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        movie.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (movie.subtitles && movie.subtitles.toLowerCase().includes(searchTerm.toLowerCase())) // Kiểm tra subtitles tồn tại
    );

    // --- Modal Handlers ---
    const handleShowModal = useCallback((movie) => {
        setSelectedMovie(movie);
        setIsModalOpen(true);
        fetchEpisodes(movie.id); // Fetch episodes khi mở modal
        // Reset trạng thái form thêm tập cho phim này
        setAddEpisodeState(prev => ({ ...prev, [movie.id]: false }));
    }, [fetchEpisodes]); // Thêm fetchEpisodes dependency

    const closeModal = useCallback(() => {
        setIsModalOpen(false);
        setEpisodes([]); // Xóa danh sách tập khi đóng modal
        setLoadingEpisodes(false); // Reset loading episodes
        // Không cần reset selectedMovie ở đây vì nó sẽ tự mất khi Modal unmount
        // Nếu muốn reset ngay lập tức: setSelectedMovie(null);
    }, []);

    const toggleShowEpisodeForm = useCallback((movieId) => {
        setAddEpisodeState(prevState => ({
            ...prevState,
            [movieId]: !prevState[movieId]
        }));
    }, []);

    // Xử lý thêm tập phim (API call nằm ở cha)
    const handleAddEpisode = useCallback(async (episodeData) => {
        if (!selectedMovie) return;

        const currentCount = episodeCountMap[selectedMovie.id] || 0;
        const maxEpisodes = parseInt(selectedMovie.totalEpisodes, 10) || Infinity; // Nếu ko có thì coi như vô hạn

        if (currentCount >= maxEpisodes) {
            toast.info(`Đã đạt số tập tối đa (${maxEpisodes}) cho phim này.`);
            return; // Dừng nếu đã đủ tập
        }

        setIsSubmitting(true);
        try {
            const payload = { ...episodeData, movieId: selectedMovie.id };
            const { data } = await axios.post('/api/episode', payload, { headers: authHeader() });
            const newEpisode = data.episode;

            // Cập nhật state thủ công
            setEpisodes(prevEpisodes => [newEpisode, ...prevEpisodes]); // Thêm vào đầu danh sách
            setEpisodeCountMap(prevCount => ({
                ...prevCount,
                [selectedMovie.id]: (prevCount[selectedMovie.id] || 0) + 1
            }));

            toast.success('Thêm tập phim thành công!');
            // Tự động ẩn form sau khi thêm thành công
            toggleShowEpisodeForm(selectedMovie.id);

        } catch (error) {
            handleApiError(error, "thêm tập phim");
        } finally {
            setIsSubmitting(false);
        }
    }, [selectedMovie, episodeCountMap, toggleShowEpisodeForm, handleApiError]); // Thêm dependencies

    // Xử lý xóa phim
    const handleDeleteMovie = useCallback(async (movieId) => {
        if (!movieId) return;
        const confirmDelete = window.confirm("Bạn có chắc chắn muốn xóa phim này và tất cả tập phim liên quan?");
        if (!confirmDelete) return;

        setIsSubmitting(true);
        try {
            await axios.delete(`/api/movies/${movieId}`, { headers: authHeader() });
            // Cập nhật state thủ công
            setMovies(prevMovies => prevMovies.filter(movie => movie.id !== movieId));
            // Xóa count của phim đã xóa
            setEpisodeCountMap(prevCount => {
                const newCount = { ...prevCount };
                delete newCount[movieId];
                return newCount;
            });
            toast.success(`Xóa phim thành công.`);
            closeModal(); // Đóng modal nếu đang mở

        } catch (error) {
            handleApiError(error, `xóa phim ID ${movieId}`);
        } finally {
            setIsSubmitting(false);
        }
    }, [closeModal, handleApiError]); // Thêm dependencies

    // --- Offcanvas Handlers ---
    const handleShowOffcanvas = useCallback((movie) => {
        setSelectedMovie(movie);
        setIsOffcanvasOpen(true);
    }, []);

    const closeOffcanvas = useCallback(() => {
        setIsOffcanvasOpen(false);
        // Reset selectedMovie sau khi animation đóng hoàn tất (hoặc ngay lập tức)
        // setTimeout(() => setSelectedMovie(null), 300);
        setSelectedMovie(null); // Reset ngay
    }, []);

    // Xử lý thêm phim vào series
    const handleAddMovieToSeries = useCallback(async (seriesId) => {
        if (!selectedMovie || !seriesId) return;
        setIsSubmitting(true);
        try {
            await axios.post('/api/movies/add-to-series', {
                movieId: selectedMovie.id,
                seriesId: seriesId,
            }, { headers: authHeader() });

            toast.success(`Đã thêm phim "${selectedMovie.title}" vào series thành công.`);
            // Cập nhật trạng thái phim trong danh sách (nếu cần) - ví dụ: đánh dấu đã có series
            setMovies(prev => prev.map(m =>
                m.id === selectedMovie.id ? { ...m, series: { id: seriesId, title: '...' } } : m // Cập nhật tạm
            ));
            closeOffcanvas(); // Đóng Offcanvas

        } catch (error) {
            handleApiError(error, `thêm phim vào series`);
        } finally {
            setIsSubmitting(false);
        }
    }, [selectedMovie, closeOffcanvas, handleApiError]); // Thêm dependencies


    // --- Render ---
    return (
        <div className="container-fluid flex-grow-1 container-p-y">
            {/* --- Search Bar --- */}
            <div className="card mb-4">
                <h5 className="card-header">Tìm kiếm phim</h5>
                <div className="card-body">
                    <input
                        className="form-control"
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Nhập tên phim, slug, phụ đề..."
                    />
                </div>
            </div>

            {/* --- Movie List --- */}
            <div className="row g-3">
                {/* Loading ban đầu */}
                {loading && (
                    <div className="col-12 text-center p-5">
                        <div className="spinner-border text-primary" role="status">
                            <span className="visually-hidden">Loading...</span>
                        </div>
                    </div>
                )}
                {/* Danh sách phim */}
                {!loading && filteredMovies.length === 0 && (
                    <div className="col-12 text-center p-5">Không tìm thấy phim nào.</div>
                )}
                {!loading && filteredMovies.slice(0, visibleMovies).map((movie) => (
                    <MovieCard
                        key={movie.id}
                        movie={movie}
                        onShowModal={handleShowModal}
                        onShowOffcanvas={handleShowOffcanvas}
                        dropdownProps={{
                            openDropdownId: openDropdown, // Sửa tên prop cho rõ ràng
                            toggleDropdown: toggleDropdown,
                            dropdownRefCallback: dropdownRefCallback
                        }}
                    />
                ))}
                {/* Loading khi cuộn (có thể thêm indicator ở cuối) */}
                {!loading && visibleMovies < filteredMovies.length && (
                    <div className="col-12 text-center p-3">
                        <div className="spinner-border spinner-border-sm text-secondary" role="status">
                            <span className="visually-hidden">Loading more...</span>
                        </div>
                    </div>
                )}
            </div>

            {/* --- Modal --- */}
            {isModalOpen && selectedMovie && (
                <MovieDetailsModal
                    show={isModalOpen}
                    onHide={closeModal}
                    movie={selectedMovie}
                    episodes={episodes}
                    loadingEpisodes={loadingEpisodes}
                    onAddEpisode={handleAddEpisode} // Truyền hàm xử lý API add
                    onDeleteMovie={handleDeleteMovie} // Truyền hàm xử lý API delete
                    isAddingEpisode={!!addEpisodeState[selectedMovie.id]} // Chuyển thành boolean
                    onToggleAddEpisodeForm={() => toggleShowEpisodeForm(selectedMovie.id)} // Truyền hàm toggle
                    episodeCount={episodeCountMap[selectedMovie.id] || 0}
                    maxEpisodes={parseInt(selectedMovie.totalEpisodes, 10) || Infinity}
                    isSubmitting={isSubmitting} // Truyền trạng thái submit chung
                />
            )}

            {/* --- Offcanvas --- */}
            {isOffcanvasOpen && selectedMovie && (
                <AddToSeriesOffcanvas
                    show={isOffcanvasOpen}
                    onHide={closeOffcanvas}
                    movie={selectedMovie}
                    seriesList={series} // Truyền danh sách series đã fetch
                    onAddToSeries={handleAddMovieToSeries} // Truyền hàm xử lý API add to series
                    isSubmitting={isSubmitting} // Truyền trạng thái submit chung
                />
            )}
        </div>
    );
};

export default MovieList;