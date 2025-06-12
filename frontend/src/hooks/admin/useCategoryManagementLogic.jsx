// hooks/useCategoryManagementLogic.js
import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import authHeader from '@services/auth-header';
import useTableData from '@hooks/useTableData';
import { showErrorToast, showSuccessToast, showInfoToast, showWarningToast } from '@utils/errorUtils';

export const useCategoryManagementLogic = () => {
    const [categories, setCategories] = useState([]);
    const [editingCategoryData, setEditingCategoryData] = useState(null);
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
    } = useTableData(categories, 10);

    // Hàm fetch danh sách danh mục (chỉ chạy lần đầu)
    const fetchCategories = useCallback(async () => {
        setIsDataLoading(true);
        try {
            const response = await axios.get("/api/categories", { headers: authHeader() });
            setCategories(response.data);
        } catch (error) {
            console.error("Failed to fetch categories:", error);
            showErrorToast(error, "Không thể tải danh sách danh mục.");
            setCategories([]);
        } finally {
            setIsDataLoading(false);
        }
    }, []);

    // Fetch lần đầu
    useEffect(() => {
        fetchCategories();
    }, [fetchCategories]);

    // Hàm lưu (Thêm mới hoặc Cập nhật) - Manual State Update
    const handleSave = async (categoryData, editingId) => {
        setIsSubmitting(true);
        try {
            const url = editingId ? `/api/categories/${editingId}` : "/api/categories";
            const method = editingId ? "put" : "post";
            const response = await axios[method](url, categoryData, { headers: authHeader() });
            const savedCategory = response.data;

            if (editingId) {
                setCategories(prevCategories =>
                    prevCategories.map(cat =>
                        cat.id === editingId ? savedCategory : cat
                    )
                );
            } else {
                setCategories(prevCategories => [...prevCategories, savedCategory]);
            }

            showSuccessToast(editingId ? "Đã cập nhật danh mục thành công." : "Đã lưu danh mục thành công.");
            localStorage.removeItem("categoryDraft");
            setEditingCategoryData(null);

        } catch (error) {
            showErrorToast(error, editingId ? "cập nhật" : "lưu");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Hàm xóa - Manual State Update
    const handleDelete = async (categoryId) => {
        if (!categoryId) return;
        const confirmDelete = window.confirm("Bạn có chắc chắn muốn xóa danh mục này?");
        if (!confirmDelete) return;

        setIsSubmitting(true);
        try {
            await axios.delete(`/api/categories/${categoryId}`, { headers: authHeader() });

            setCategories(prevCategories =>
                prevCategories.filter(cat => cat.id !== categoryId)
            );

            showSuccessToast(`Đã xóa danh mục thành công.`);

            if (editingCategoryData?.id === categoryId) {
                setEditingCategoryData(null);
                localStorage.removeItem("categoryDraft");
            }

        } catch (error) {
            showErrorToast(error, "xóa");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Bắt đầu chỉnh sửa
    const handleEdit = useCallback((category) => {
        if (!category) return;
        setEditingCategoryData({ id: category.id, title: category.title, slug: category.slug });
    }, []);

    // Hủy bỏ
    const handleDiscard = () => {
        setEditingCategoryData(null);
        localStorage.removeItem("categoryDraft");
        showInfoToast("Đã hủy bỏ thay đổi.");
    };

    // Lưu nháp
    const handleSaveDraft = (draftData) => {
        if (!draftData.title?.trim()) {
            showWarningToast("Tên danh mục không được để trống để lưu nháp.");
            return;
        }
        localStorage.setItem("categoryDraft", JSON.stringify(draftData));
        showSuccessToast("Đã lưu bản nháp thành công.");
    };

    // Load nháp ban đầu
    const loadInitialDraft = () => {
        const savedDraft = localStorage.getItem("categoryDraft");
        if (savedDraft) {
            try {
                const draftData = JSON.parse(savedDraft);
                if (draftData.title || draftData.slug || draftData.editingCategoryId) {
                    setEditingCategoryData({
                        id: draftData.editingCategoryId || null,
                        title: draftData.title || "",
                        slug: draftData.slug || ""
                    });
                }
            } catch (e) {
                console.error("Failed to parse category draft", e);
                localStorage.removeItem("categoryDraft");
            }
        }
    };

    useEffect(() => {
        loadInitialDraft();
    }, []);


    return {
        categories,
        editingCategoryData,
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