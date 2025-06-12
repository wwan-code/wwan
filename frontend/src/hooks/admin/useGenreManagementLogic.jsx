// hooks/useGenreManagement.js
import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import authHeader from '@services/auth-header';
import useTableData from '@hooks/useTableData';
import { showErrorToast, showSuccessToast, showInfoToast, showWarningToast } from '@utils/errorUtils';

export const useGenreManagementLogic = () => {
    const [genres, setGenres] = useState([]);
    const [editingGenreData, setEditingGenreData] = useState(null);
    const [isDataLoading, setIsDataLoading] = useState(false); 
    const [isSubmitting, setIsSubmitting] = useState(false);

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
    } = useTableData(genres, 10);

    const fetchGenres = useCallback(async () => {
        setIsDataLoading(true);
        try {
            const response = await axios.get("/api/genres", { headers: authHeader() });
            setGenres(response.data);
        } catch (error) {
            showErrorToast("Không thể tải danh sách thể loại.");
            setGenres([]);
        } finally {
            setIsDataLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchGenres();
    }, [fetchGenres]);

    const handleSave = async (genreData, editingId) => {
        setIsSubmitting(true);
        try {
            const url = editingId ? `/api/genres/${editingId}` : "/api/genres";
            const method = editingId ? "put" : "post";
            await axios[method](url, genreData, { headers: authHeader() });

            showSuccessToast(editingId ? "Đã cập nhật thể loại thành công." : "Đã lưu thể loại thành công.");

            await fetchGenres();

            localStorage.removeItem("genreDraft");
            setEditingGenreData(null);

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
            showSuccessToast("Đã xóa thể loại thành công.");

            await fetchGenres();

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
        setEditingGenreData({ id: genre.id, title: genre.title, slug: genre.slug });
    }, []);

    // Hàm hủy bỏ chỉnh sửa/thêm mới
    const handleDiscard = () => {
        setEditingGenreData(null);
        localStorage.removeItem("genreDraft");
        showInfoToast("Đã hủy bỏ thay đổi.");
    };

    // Hàm lưu nháp (có thể giữ ở component cha hoặc chuyển vào form)
    const handleSaveDraft = (draftData) => {
         if (!draftData.title?.trim()) {
            showWarningToast("Tên thể loại không được để trống để lưu nháp.");
            return;
        }
        localStorage.setItem("genreDraft", JSON.stringify(draftData));
        showSuccessToast("Đã lưu bản nháp thành công.");
    };

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


    return {
        genres,
        editingGenreData,
        isDataLoading,
        isSubmitting,
        handleSave,
        handleDelete,
        handleEdit,
        handleDiscard,
        handleSaveDraft,
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