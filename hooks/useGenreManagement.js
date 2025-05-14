// hooks/useGenreManagement.js (Tạo custom hook để chứa logic)
// Hoặc giữ logic trong GenreManagement.js nếu không muốn tạo hook riêng
import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast, Bounce } from 'react-toastify';
import authHeader from '../services/auth-header';
import useTableData from '../hooks/useTableData';

export const useGenreManagementLogic = () => {
    const [genres, setGenres] = useState([]);
    const [editingGenreData, setEditingGenreData] = useState(null); // State để truyền vào form khi edit
    const [isDataLoading, setIsDataLoading] = useState(false); // Loading cho fetch ban đầu / refetch
    const [isSubmitting, setIsSubmitting] = useState(false); // Loading cho submit (save/delete)

    const {
        data: displayedData,
        totalPages,
        currentPage,
        searchTerm,
        handleSearch,
        requestSort,
        goToPage,
        sortConfig,
        itemsPerPage,
        handleItemsPerPageChange,
        totalEntries,
        filteredEntries,
        startEntry,
        endEntry,
    } = useTableData(genres, 10); // useTableData giờ quản lý dữ liệu từ state `genres`

    // Hàm fetch dữ liệu, dùng useCallback để tránh tạo lại không cần thiết
    const fetchGenres = useCallback(async () => {
        setIsDataLoading(true);
        try {
            const response = await axios.get("/api/genres", { headers: authHeader() });
            setGenres(response.data);
        } catch (error) {
            console.error("Failed to fetch genres:", error);
            toast.error("Không thể tải danh sách thể loại.", { /* ... toast options */ });
            setGenres([]); // Đặt lại thành mảng rỗng nếu lỗi
        } finally {
            setIsDataLoading(false);
        }
    }, []); // Dependency rỗng vì chỉ cần chạy 1 lần hoặc khi gọi thủ công

    // Fetch lần đầu khi component mount
    useEffect(() => {
        fetchGenres();
    }, [fetchGenres]); // fetchGenres là dependency

    // Hàm xử lý lỗi API và hiển thị toast
    const handleApiError = (error, operation = "thực hiện") => {
        console.error(`Failed to ${operation} genre:`, error);
        let message = `Không thể ${operation} thể loại. Vui lòng thử lại.`;
        // Kiểm tra lỗi trả về từ backend
        if (error.response && error.response.data && error.response.data.message) {
            message = error.response.data.message;
        } else if (error.message) {
             // Lỗi mạng hoặc lỗi khác từ axios/javascript
             message = error.message;
        }
        toast.error(message, {
            position: "top-right",
            autoClose: 4000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
            theme: document.documentElement.getAttribute("data-ww-theme") || "light",
            transition: Bounce,
        });
    };

    const handleSave = async (genreData, editingId) => {
        setIsSubmitting(true);
        try {
            const url = editingId ? `/api/genres/${editingId}` : "/api/genres";
            const method = editingId ? "put" : "post";
            await axios[method](url, genreData, { headers: authHeader() });

            toast.success(editingId ? "Đã cập nhật thể loại thành công." : "Đã lưu thể loại thành công.", { /* ... toast options */ });

            // --- CẬP NHẬT STATE: Tải lại danh sách ---
            await fetchGenres();
            // -----------------------------------------

            localStorage.removeItem("genreDraft"); // Xóa nháp sau khi lưu thành công
            setEditingGenreData(null); // Reset trạng thái edit

        } catch (error) {
            handleApiError(error, editingId ? "cập nhật" : "lưu");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (genreId) => {
        if (!genreId) return;
        const confirmDelete = window.confirm("Bạn có chắc chắn muốn xóa thể loại này?");
        if (!confirmDelete) return;

        setIsSubmitting(true);
        try {
            await axios.delete(`/api/genres/${genreId}`, { headers: authHeader() });
            toast.success("Đã xóa thể loại thành công.", { /* ... toast options */ });

            // --- CẬP NHẬT STATE: Tải lại danh sách ---
            await fetchGenres();
            // -----------------------------------------

            // Nếu đang sửa thể loại vừa bị xóa, reset form
             if (editingGenreData?.id === genreId) {
                setEditingGenreData(null);
                localStorage.removeItem("genreDraft");
            }

        } catch (error) {
            handleApiError(error, "xóa");
        } finally {
            setIsSubmitting(false);
        }
    };

     // Hàm để bắt đầu chỉnh sửa
    const handleEdit = useCallback((genre) => {
        if (!genre) return;
        setEditingGenreData({ id: genre.id, title: genre.title, slug: genre.slug }); // Đặt dữ liệu để form nhận
    }, []);

    // Hàm hủy bỏ chỉnh sửa/thêm mới
    const handleDiscard = () => {
        setEditingGenreData(null); // Reset trạng thái edit
        localStorage.removeItem("genreDraft"); // Xóa nháp
        toast.info("Đã hủy bỏ thay đổi.", { /* ... toast options */ });
    };

    // Hàm lưu nháp (có thể giữ ở component cha hoặc chuyển vào form)
    const handleSaveDraft = (draftData) => {
         if (!draftData.title?.trim()) {
            toast.warn("Tên thể loại không được để trống để lưu nháp.", { /* ... toast options */ });
            return;
        }
        localStorage.setItem("genreDraft", JSON.stringify(draftData));
        toast.success("Đã lưu bản nháp thành công.", { /* ... toast options */ });
    };

    // Logic load draft ban đầu (có thể giữ ở component cha)
     const loadInitialDraft = () => {
         const savedDraft = localStorage.getItem("genreDraft");
         if (savedDraft) {
             try {
                 const draftData = JSON.parse(savedDraft);
                 // Đặt editingGenreData để form tự động nhận khi render lần đầu
                 if (draftData.title || draftData.slug || draftData.editingGenreId) {
                      setEditingGenreData({
                          id: draftData.editingGenreId || null,
                          title: draftData.title || "",
                          slug: draftData.slug || ""
                      });
                 }
             } catch (e) {
                 console.error("Failed to parse genre draft", e);
                 localStorage.removeItem("genreDraft");
             }
         }
     };

     useEffect(() => {
         loadInitialDraft();
     }, []);


    // Trả về tất cả state và hàm cần thiết cho UI
    return {
        genres, // Dữ liệu gốc (ít dùng trực tiếp trong UI)
        editingGenreData,
        isDataLoading,
        isSubmitting,
        handleSave,
        handleDelete,
        handleEdit,
        handleDiscard,
        handleSaveDraft,
        // Props cho TableControls và GenreTable từ useTableData
        displayedData,
        totalPages,
        currentPage,
        searchTerm,
        handleSearch,
        requestSort,
        goToPage,
        sortConfig,
        itemsPerPage,
        handleItemsPerPageChange,
        totalEntries,
        filteredEntries,
        startEntry,
        endEntry,
    };
};