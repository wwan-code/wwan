// src/hooks/useShopItemManagementLogic.jsx
import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import authHeader from '@services/auth-header';
import useTableData from '@hooks/useTableData';

// Định nghĩa các loại vật phẩm (đồng bộ với backend)
export const SHOP_ITEM_TYPES = [
    { value: 'AVATAR_FRAME', label: 'Khung Avatar' },
    { value: 'CHAT_COLOR', label: 'Màu Chat' },
    { value: 'THEME_UNLOCK', label: 'Mở Khóa Theme' },
    { value: 'AD_SKIP_TICKET', label: 'Vé Bỏ Qua Quảng Cáo' },
    { value: 'PROFILE_BACKGROUND', label: 'Nền Trang Cá Nhân' },
    { value: 'BADGE_DISPLAY_SLOT', label: 'Ô Hiển Thị Huy Hiệu Thêm' },
];

const API_URL = '/api/admin/shop/items';

export const useShopItemManagementLogic = () => {
    const [shopItems, setShopItems] = useState([]);
    const [editingItemData, setEditingItemData] = useState(null);
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
    } = useTableData(shopItems, 10); // 10 items per page

    const fetchShopItems = useCallback(async () => {
        setIsDataLoading(true);
        try {
            const response = await axios.get(API_URL, { headers: authHeader() });
            setShopItems(response.data.items || []);
        } catch (error) {
            console.error("Lỗi tải vật phẩm:", error);
            toast.error("Không thể tải danh sách vật phẩm cửa hàng.");
            setShopItems([]);
        } finally {
            setIsDataLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchShopItems();
    }, [fetchShopItems]);

    const handleApiError = (error, operation = "thực hiện") => {
        console.error(`Lỗi ${operation} vật phẩm:`, error);
        const message = error.response?.data?.message || error.message || `Không thể ${operation} vật phẩm.`;
        toast.error(message);
    };

    const handleSave = async (itemData, editingId) => {
        setIsSubmitting(true);
        const stockValue = itemData.stock === '' || isNaN(parseInt(itemData.stock, 10))
            ? null
            : parseInt(itemData.stock, 10);

        const dataToSend = {
            ...itemData,
            price: parseInt(itemData.price, 10) || 0,
            requiredLevel: parseInt(itemData.requiredLevel, 10) || 1,
            durationDays: itemData.durationDays ? parseInt(itemData.durationDays, 10) : null,
            stock: stockValue,
            isActive: !!itemData.isActive,
        };

        try {
            const url = editingId ? `${API_URL}/${editingId}` : API_URL;
            const method = editingId ? "put" : "post";
            const response = await axios[method](url, dataToSend, { headers: authHeader() });

            if (response.data.success) {
                toast.success(editingId ? "Cập nhật vật phẩm thành công." : "Thêm vật phẩm mới thành công.");
                await fetchShopItems();
                setEditingItemData(null);
            } else {
                throw new Error(response.data.message || "Thao tác thất bại.");
            }
        } catch (error) {
            handleApiError(error, editingId ? "cập nhật" : "lưu");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (itemId) => {
        if (!itemId || !window.confirm("Bạn chắc chắn muốn xóa vật phẩm này?")) return;
        setIsSubmitting(true);
        try {
            const response = await axios.delete(`${API_URL}/${itemId}`, { headers: authHeader() });
            if (response.data.success) {
                toast.success("Đã xóa vật phẩm thành công.");
                await fetchShopItems();
                if (editingItemData?.id === itemId) {
                    setEditingItemData(null);
                }
            } else {
                throw new Error(response.data.message || "Xóa vật phẩm thất bại.");
            }
        } catch (error) {
            handleApiError(error, "xóa");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEdit = useCallback((item) => {
        setEditingItemData({
            ...item,
            price: item.price || 0,
            requiredLevel: item.requiredLevel || 1,
            durationDays: item.durationDays || '',
            stock: item.stock === null || item.stock === undefined ? '' : item.stock,
        });
    }, []);

    const handleDiscard = () => {
        setEditingItemData(null);
        toast.info("Đã hủy bỏ thay đổi.");
    };

    return {
        editingItemData,
        isDataLoading,
        isSubmitting,
        handleSave,
        handleDelete,
        handleEdit,
        handleDiscard,
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