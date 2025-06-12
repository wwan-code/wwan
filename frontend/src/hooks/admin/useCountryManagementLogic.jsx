// hooks/useCountryManagementLogic.js
import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import authHeader from '@services/auth-header';
import useTableData from '@hooks/useTableData';
import { showErrorToast, showSuccessToast, showInfoToast, showWarningToast } from '@utils/errorUtils';

export const useCountryManagementLogic = () => {
    const [countries, setCountries] = useState([]);
    const [editingCountryData, setEditingCountryData] = useState(null);
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
    } = useTableData(countries, 10);

    // Hàm fetch danh sách quốc gia
    const fetchCountries = useCallback(async () => {
        setIsDataLoading(true);
        try {
            const response = await axios.get("/api/countries", { headers: authHeader() });
            setCountries(response.data);
        } catch (error) {
            console.error("Failed to fetch countries:", error);
            showErrorToast(error, "Không thể tải danh sách quốc gia.");
            setCountries([]);
        } finally {
            setIsDataLoading(false);
        }
    }, []);

    // Fetch lần đầu
    useEffect(() => {
        fetchCountries();
    }, [fetchCountries]);

    // Hàm lưu (Thêm mới hoặc Cập nhật)
    const handleSave = async (countryData, editingId) => {
        setIsSubmitting(true);
        try {
            const url = editingId ? `/api/countries/${editingId}` : "/api/countries";
            const method = editingId ? "put" : "post";
            const response = await axios[method](url, countryData, { headers: authHeader() });
            const savedCountry = response.data;
            if (editingId) {
                setCountries(prevCountries =>
                    prevCountries.map(counntry =>
                        counntry.id === editingId ? savedCountry : counntry
                    )
                );
            } else {
                setCountries(prevCountries => [...prevCountries, savedCountry]);
            }

            showSuccessToast(editingId ? "Đã cập nhật quốc gia thành công." : "Đã lưu quốc gia thành công.");
            localStorage.removeItem("countryDraft");
            setEditingCountryData(null);

        } catch (error) {
            showErrorToast(error, editingId ? "cập nhật" : "lưu");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Hàm xóa
    const handleDelete = async (countryId) => {
        if (!countryId) return;
        const confirmDelete = window.confirm("Bạn có chắc chắn muốn xóa quốc gia này?");
        if (!confirmDelete) return;

        setIsSubmitting(true);
        try {
            await axios.delete(`/api/countries/${countryId}`, { headers: authHeader() });

            setCountries(prevCountries =>
                prevCountries.filter(count => count.id !== countryId)
            );
            showSuccessToast(`Đã xóa quốc gia thành công.`);
            if (editingCountryData?.id === countryId) {
                setEditingCountryData(null);
                localStorage.removeItem("countryDraft");
            }

        } catch (error) {
            showErrorToast(error, "xóa");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Bắt đầu chỉnh sửa
    const handleEdit = useCallback((country) => {
        if (!country) return;
        setEditingCountryData({ id: country.id, title: country.title, slug: country.slug });
    }, []);

    // Hủy bỏ
    const handleDiscard = () => {
        setEditingCountryData(null);
        localStorage.removeItem("countryDraft");
        showInfoToast("Đã hủy bỏ thay đổi.");
    };

    // Lưu nháp
    const handleSaveDraft = (draftData) => {
        if (!draftData.title?.trim()) {
            showWarningToast("Tên quốc gia không được để trống để lưu nháp.");
            return;
        }
        localStorage.setItem("countryDraft", JSON.stringify(draftData));
        showSuccessToast("Đã lưu bản nháp thành công.");
    };

    // Load nháp ban đầu
     const loadInitialDraft = () => {
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

    return {
        countries,
        editingCountryData,
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