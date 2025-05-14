// hooks/useCategoryManagementLogic.js
import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast, Bounce } from 'react-toastify';
import authHeader from '../services/auth-header';
import useTableData from '../hooks/useTableData';

export const useCategoryManagementLogic = () => {
    const [categories, setCategories] = useState([]); // State lưu danh sách danh mục
    const [editingCategoryData, setEditingCategoryData] = useState(null); // Dữ liệu danh mục đang sửa
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
    } = useTableData(categories, 10); // Hook quản lý bảng với dữ liệu `categories`

    // Hàm fetch danh sách danh mục (chỉ chạy lần đầu)
    const fetchCategories = useCallback(async () => {
        setIsDataLoading(true);
        try {
            // Thay đổi API endpoint
            const response = await axios.get("/api/categories", { headers: authHeader() });
            setCategories(response.data);
        } catch (error) {
            console.error("Failed to fetch categories:", error);
            toast.error("Không thể tải danh sách danh mục.", { /* ... toast options */ });
            setCategories([]);
        } finally {
            setIsDataLoading(false);
        }
    }, []);

    // Fetch lần đầu
    useEffect(() => {
        fetchCategories();
    }, [fetchCategories]);

    // Hàm xử lý lỗi API chung
    const handleApiError = (error, operation = "thực hiện") => {
        console.error(`Failed to ${operation} category:`, error);
        let message = `Không thể ${operation} danh mục. Vui lòng thử lại.`;
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
            // ... các options khác
        });
    };

    // Hàm lưu (Thêm mới hoặc Cập nhật) - Manual State Update
    const handleSave = async (categoryData, editingId) => {
        setIsSubmitting(true);
        try {
            // Thay đổi API endpoint
            const url = editingId ? `/api/categories/${editingId}` : "/api/categories";
            const method = editingId ? "put" : "post";
            // --- Gọi API ---
            const response = await axios[method](url, categoryData, { headers: authHeader() });
            const savedCategory = response.data; // Dữ liệu trả về từ server

            // --- CẬP NHẬT STATE THỦ CÔNG ---
            if (editingId) {
                // Cập nhật item đã có trong mảng
                setCategories(prevCategories =>
                    prevCategories.map(cat =>
                        cat.id === editingId ? savedCategory : cat
                    )
                );
            } else {
                // Thêm item mới vào cuối mảng
                setCategories(prevCategories => [...prevCategories, savedCategory]);
            }
            // ---------------------------------

            toast.success(editingId ? "Đã cập nhật danh mục thành công." : "Đã lưu danh mục thành công.", { /* ... toast options */ });
            localStorage.removeItem("categoryDraft"); // Xóa nháp
            setEditingCategoryData(null); // Reset form edit

        } catch (error) {
            handleApiError(error, editingId ? "cập nhật" : "lưu");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Hàm xóa - Manual State Update
    const handleDelete = async (categoryId) => {
        if (!categoryId) return;
        // Thay đổi thông báo xác nhận
        const confirmDelete = window.confirm("Bạn có chắc chắn muốn xóa danh mục này?");
        if (!confirmDelete) return;

        setIsSubmitting(true);
        try {
             // Thay đổi API endpoint
            await axios.delete(`/api/categories/${categoryId}`, { headers: authHeader() });

             // --- CẬP NHẬT STATE THỦ CÔNG ---
             setCategories(prevCategories =>
                prevCategories.filter(cat => cat.id !== categoryId)
             );
             // ---------------------------------

            // Thay đổi thông báo thành công
            toast.success(`Đã xóa danh mục thành công.`, { /* ... toast options */ });

            // Reset form nếu đang sửa danh mục vừa xóa
            if (editingCategoryData?.id === categoryId) {
                setEditingCategoryData(null);
                localStorage.removeItem("categoryDraft");
            }

        } catch (error) {
            handleApiError(error, "xóa");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Bắt đầu chỉnh sửa
    const handleEdit = useCallback((category) => {
        if (!category) return;
        // Đặt dữ liệu danh mục vào state để form nhận
        setEditingCategoryData({ id: category.id, title: category.title, slug: category.slug });
    }, []);

    // Hủy bỏ
    const handleDiscard = () => {
        setEditingCategoryData(null);
        // Thay đổi key localStorage
        localStorage.removeItem("categoryDraft");
        toast.info("Đã hủy bỏ thay đổi.", { /* ... toast options */ });
    };

    // Lưu nháp
    const handleSaveDraft = (draftData) => {
        // Thay đổi thông báo kiểm tra
        if (!draftData.title?.trim()) {
            toast.warn("Tên danh mục không được để trống để lưu nháp.", { /* ... toast options */ });
            return;
        }
         // Thay đổi key localStorage
        localStorage.setItem("categoryDraft", JSON.stringify(draftData));
        toast.success("Đã lưu bản nháp thành công.", { /* ... toast options */ });
    };

     // Load nháp ban đầu
     const loadInitialDraft = () => {
         // Thay đổi key localStorage
         const savedDraft = localStorage.getItem("categoryDraft");
         if (savedDraft) {
             try {
                 const draftData = JSON.parse(savedDraft);
                 if (draftData.title || draftData.slug || draftData.editingCategoryId) { // Check key id nháp
                      setEditingCategoryData({
                          id: draftData.editingCategoryId || null, // Sử dụng đúng key id nháp
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


    // Trả về state và các hàm cần thiết
    return {
        categories, // Dữ liệu gốc (ít dùng trực tiếp)
        editingCategoryData,
        isDataLoading,
        isSubmitting,
        handleSave,
        handleDelete,
        handleEdit,
        handleDiscard,
        handleSaveDraft,
        // Props cho TableControls và CategoryTable từ useTableData
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