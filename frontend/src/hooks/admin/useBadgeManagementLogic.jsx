// src/hooks/admin/useBadgeManagementLogic.js
import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import authHeader from '@services/auth-header';
import useTableData from '@hooks/useTableData';

const API_URL = '/api/admin/badges';

// Các loại huy hiệu có thể có (ví dụ)
export const BADGE_TYPES = [
    { value: 'EVENT', label: 'Sự kiện' },
    { value: 'ACHIEVEMENT', label: 'Thành tích' },
    { value: 'MILESTONE', label: 'Cột mốc' },
    { value: 'COMMUNITY', label: 'Cộng đồng' },
    { value: 'SPECIAL', label: 'Đặc biệt' },
];

const useBadgeManagementLogic = () => {
    const [badges, setBadges] = useState([]);
    const [editingBadge, setEditingBadge] = useState(null);
    const [isDataLoading, setIsDataLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const {
        data: displayedData, // Sẽ là badges đã filter và sort
        totalPages, currentPage, searchTerm, handleSearch,
        requestSort, goToPage, sortConfig, itemsPerPage, handleItemsPerPageChange,
    } = useTableData(badges, 10); // 10 items/page

    const fetchBadges = useCallback(async (page = 1, limit = itemsPerPage, search = searchTerm) => {
        setIsDataLoading(true);
        try {
            const response = await axios.get(API_URL, {
                headers: authHeader(),
                params: { page, limit, q: search }
            });
            setBadges(response.data.badges || []);
            // Cần cập nhật pagination từ response nếu API hỗ trợ
            // Ví dụ: setPagination(response.data.pagination);
        } catch (error) {
            console.error("Lỗi tải huy hiệu:", error);
            toast.error("Không thể tải danh sách huy hiệu.");
            setBadges([]);
        } finally {
            setIsDataLoading(false);
        }
    }, [itemsPerPage, searchTerm]); // Thêm itemsPerPage và searchTerm để fetch lại khi thay đổi

    useEffect(() => {
        fetchBadges(currentPage); // Fetch với trang hiện tại từ useTableData
    }, [fetchBadges, currentPage]); // Chạy lại khi currentPage thay đổi

    const handleApiError = (error, operation = "thực hiện") => { /* ... (như cũ) ... */ };

    const handleSaveBadge = async (badgeData, editingId) => {
        setIsSubmitting(true);
        const formData = new FormData(); // Dùng FormData để gửi file icon
        formData.append('name', badgeData.name);
        formData.append('description', badgeData.description);
        formData.append('type', badgeData.type);
        // Criteria cần là JSON string nếu backend nhận string
        formData.append('criteria', typeof badgeData.criteria === 'object' ? JSON.stringify(badgeData.criteria) : badgeData.criteria);

        if (badgeData.badgeIconFile) { // Nếu có file icon mới
            formData.append('badgeIconFile', badgeData.badgeIconFile);
        } else if (badgeData.iconUrl !== undefined && badgeData.iconUrl !== (editingBadge?.iconUrl || '')) {
            // Nếu iconUrl được thay đổi (ví dụ: thành class FA hoặc URL khác) nhưng không phải file
            formData.append('iconUrl', badgeData.iconUrl);
        }
        if (editingId && badgeData.iconUrl === null && editingBadge?.iconUrl) {
             // Nếu user xóa iconUrl (đặt thành null) và có icon cũ
             formData.append('removeIcon', 'true');
        }


        try {
            const url = editingId ? `${API_URL}/${editingId}` : API_URL;
            const method = editingId ? "put" : "post";
            const response = await axios({ method, url, data: formData, headers: { ...authHeader(), 'Content-Type': 'multipart/form-data' } });

            if (response.data.success) {
                toast.success(editingId ? "Cập nhật huy hiệu thành công." : "Thêm huy hiệu mới thành công.");
                fetchBadges(currentPage); // Fetch lại trang hiện tại
                setEditingBadge(null); // Reset form
            } else { throw new Error(response.data.message || "Thao tác thất bại."); }
        } catch (error) { handleApiError(error, editingId ? "cập nhật" : "lưu");
        } finally { setIsSubmitting(false); }
    };

    const handleDeleteBadge = async (badgeId) => { /* ... (tương tự handleDeleteChallenge) ... */ };
    const handleEditBadge = useCallback(async (badgeId) => {
        setIsDataLoading(true);
        try {
            const response = await axios.get(`${API_URL}/${badgeId}`, { headers: authHeader() });
            if (response.data.success && response.data.badge) {
                const fetchedBadge = response.data.badge;
                setEditingBadge({
                    ...fetchedBadge,
                    criteria: fetchedBadge.criteria ? JSON.stringify(fetchedBadge.criteria, null, 2) : '{}',
                    // iconUrl sẽ được xử lý bởi BadgeForm (hiển thị preview nếu là URL ảnh)
                });
            } else { toast.error("Không thể tải chi tiết huy hiệu."); }
        } catch (error) { handleApiError(error, "tải chi tiết huy hiệu");
        } finally { setIsDataLoading(false); }
    }, []);
    const handleDiscardEdit = () => { setEditingBadge(null); toast.info("Đã hủy bỏ."); };

    return {
        editingBadge, isDataLoading, isSubmitting,
        handleSaveBadge, handleDeleteBadge, handleEditBadge, handleDiscardEdit,
        displayedData, totalPages, currentPage, searchTerm, handleSearch,
        requestSort, goToPage, sortConfig, itemsPerPage, handleItemsPerPageChange,
    };
};

export default useBadgeManagementLogic;