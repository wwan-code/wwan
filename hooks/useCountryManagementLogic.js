// hooks/useCountryManagementLogic.js
import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast, Bounce } from 'react-toastify';
import authHeader from '../services/auth-header';
import useTableData from '../hooks/useTableData';

export const useCountryManagementLogic = () => {
    const [countries, setCountries] = useState([]); // State lưu danh sách quốc gia
    const [editingCountryData, setEditingCountryData] = useState(null); // Dữ liệu quốc gia đang sửa
    const [isDataLoading, setIsDataLoading] = useState(false); // Loading fetch dữ liệu
    const [isSubmitting, setIsSubmitting] = useState(false); // Loading submit (save/delete)

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
    } = useTableData(countries, 10); // Hook quản lý bảng với dữ liệu `countries`

    // Hàm fetch danh sách quốc gia
    const fetchCountries = useCallback(async () => {
        setIsDataLoading(true);
        try {
            // Thay đổi API endpoint
            const response = await axios.get("/api/countries", { headers: authHeader() });
            setCountries(response.data);
        } catch (error) {
            console.error("Failed to fetch countries:", error);
            toast.error("Không thể tải danh sách quốc gia.", { /* ... toast options */ });
            setCountries([]);
        } finally {
            setIsDataLoading(false);
        }
    }, []);

    // Fetch lần đầu
    useEffect(() => {
        fetchCountries();
    }, [fetchCountries]);

    // Hàm xử lý lỗi API chung
    const handleApiError = (error, operation = "thực hiện") => {
        console.error(`Failed to ${operation} country:`, error);
        let message = `Không thể ${operation} quốc gia. Vui lòng thử lại.`;
        if (error.response?.data?.message) { // Lấy lỗi cụ thể từ backend nếu có
            message = error.response.data.message;
        } else if (error.message) {
             message = error.message;
        }
        toast.error(message, {
            position: "top-right",
            autoClose: 4000,
             theme: document.documentElement.getAttribute("data-ww-theme") || "light",
            transition: Bounce,
            // ... các options khác
        });
    };

    // Hàm lưu (Thêm mới hoặc Cập nhật)
    const handleSave = async (countryData, editingId) => {
        setIsSubmitting(true);
        try {
             // Thay đổi API endpoint
            const url = editingId ? `/api/countries/${editingId}` : "/api/countries";
            const method = editingId ? "put" : "post";
            await axios[method](url, countryData, { headers: authHeader() });

            toast.success(editingId ? "Đã cập nhật quốc gia thành công." : "Đã lưu quốc gia thành công.", { /* ... toast options */ });

            // --- Tải lại danh sách sau khi thành công ---
            await fetchCountries();
            // ------------------------------------------

            localStorage.removeItem("countryDraft"); // Xóa nháp
            setEditingCountryData(null); // Reset form edit

        } catch (error) {
            handleApiError(error, editingId ? "cập nhật" : "lưu");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Hàm xóa
    const handleDelete = async (countryId) => {
        if (!countryId) return;
        // Thay đổi thông báo xác nhận
        const confirmDelete = window.confirm("Bạn có chắc chắn muốn xóa quốc gia này?");
        if (!confirmDelete) return;

        setIsSubmitting(true);
        try {
            // Thay đổi API endpoint
            await axios.delete(`/api/countries/${countryId}`, { headers: authHeader() });
             // Thay đổi thông báo thành công
            toast.success(`Đã xóa quốc gia thành công.`, { /* ... toast options */ });

             // --- Tải lại danh sách sau khi thành công ---
            await fetchCountries();
             // ------------------------------------------

            // Reset form nếu đang sửa quốc gia vừa xóa
            if (editingCountryData?.id === countryId) {
                setEditingCountryData(null);
                localStorage.removeItem("countryDraft");
            }

        } catch (error) {
            handleApiError(error, "xóa");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Bắt đầu chỉnh sửa
    const handleEdit = useCallback((country) => {
        if (!country) return;
         // Đặt dữ liệu quốc gia vào state để form nhận
        setEditingCountryData({ id: country.id, title: country.title, slug: country.slug });
    }, []);

    // Hủy bỏ
    const handleDiscard = () => {
        setEditingCountryData(null);
        // Thay đổi key localStorage
        localStorage.removeItem("countryDraft");
        toast.info("Đã hủy bỏ thay đổi.", { /* ... toast options */ });
    };

    // Lưu nháp
    const handleSaveDraft = (draftData) => {
         // Thay đổi thông báo kiểm tra
        if (!draftData.title?.trim()) {
            toast.warn("Tên quốc gia không được để trống để lưu nháp.", { /* ... toast options */ });
            return;
        }
        // Thay đổi key localStorage
        localStorage.setItem("countryDraft", JSON.stringify(draftData));
        toast.success("Đã lưu bản nháp thành công.", { /* ... toast options */ });
    };

    // Load nháp ban đầu
     const loadInitialDraft = () => {
        // Thay đổi key localStorage
         const savedDraft = localStorage.getItem("countryDraft");
         if (savedDraft) {
             try {
                 const draftData = JSON.parse(savedDraft);
                 if (draftData.title || draftData.slug || draftData.editingCountryId) {
                      setEditingCountryData({
                          id: draftData.editingCountryId || null,
                          title: draftData.title || "",
                          slug: draftData.slug || ""
                      });
                 }
             } catch (e) {
                 console.error("Failed to parse country draft", e);
                 localStorage.removeItem("countryDraft");
             }
         }
     };

     useEffect(() => {
         loadInitialDraft();
     }, []);

    // Trả về state và các hàm cần thiết
    return {
        countries, // Ít dùng trực tiếp
        editingCountryData,
        isDataLoading,
        isSubmitting,
        handleSave,
        handleDelete,
        handleEdit,
        handleDiscard,
        handleSaveDraft,
        // Props cho TableControls và CountryTable từ useTableData
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