// components/Admin/MovieForms/AddItemOffcanvas.js
import React, { useState, useEffect } from 'react';
import { Offcanvas } from "react-bootstrap";
import axios from 'axios';
import authHeader from '../../../services/auth-header'; // Đảm bảo import đúng
import useSlug from '../../../hooks/useSlug'; // Dùng hook slug nếu cần
import { toast } from 'react-toastify';

const AddItemOffcanvas = ({ show, onHide, type, onItemAdded, handleApiError }) => {
    const [newItem, setNewItem] = useState({ title: '', slug: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { slug, setInput } = useSlug(300); // Dùng slug cho item mới

    useEffect(() => {
        // Reset form khi offcanvas mở hoặc type thay đổi
        if (show) {
            setNewItem({ title: '', slug: '' });
            setInput(''); // Reset slug input
        }
    }, [show, type, setInput]);

     // Cập nhật slug khi title thay đổi
    useEffect(() => {
        setNewItem(prev => ({ ...prev, slug }));
    }, [slug]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewItem((prev) => ({ ...prev, [name]: value }));
        if (name === 'title') {
            setInput(value); // Cập nhật slug input
        }
    };

    const getApiEndpoint = () => {
        switch (type) {
            case 'genre': return '/api/genres';
            case 'category': return '/api/categories';
            case 'country': return '/api/countries';
            default: return null;
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const endpoint = getApiEndpoint();
        if (!endpoint || !newItem.title.trim()) {
            toast.warn(`Tên ${type} không được để trống.`); // Thông báo cụ thể
            return;
        }

        setIsSubmitting(true);
        try {
            // Gửi cả title và slug (đã tự tạo)
            const response = await axios.post(endpoint, newItem, { headers: authHeader() });
            onItemAdded(type, response.data); // Gọi callback của cha với type và dữ liệu mới
            // onHide(); // Đã chuyển vào hàm cha handleItemAdded để đóng sau khi cập nhật state cha
        } catch (error) {
             // Sử dụng handleApiError từ cha
            handleApiError(error, `thêm ${type} mới`);
        } finally {
            setIsSubmitting(false);
        }
    };

     // Lấy tên hiển thị cho title của Offcanvas
     const getTitle = () => {
        switch (type) {
            case 'genre': return 'Thêm Thể loại mới';
            case 'category': return 'Thêm Danh mục mới';
            case 'country': return 'Thêm Quốc gia mới';
            default: return 'Thêm mới';
        }
     }

    return (
        <Offcanvas show={show} onHide={onHide} placement="end">
            <Offcanvas.Header closeButton>
                <Offcanvas.Title>{getTitle()}</Offcanvas.Title>
            </Offcanvas.Header>
            <Offcanvas.Body>
                <form onSubmit={handleSubmit}>
                    <div className="mb-3">
                        <label className="form-label">Tên {type}</label>
                        <input
                            type="text"
                            className="form-control"
                            placeholder={`Nhập tên ${type}`}
                            name="title"
                            value={newItem.title}
                            onChange={handleInputChange}
                            required
                        />
                    </div>
                    <div className="mb-3">
                        <label className="form-label">Slug</label>
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Slug sẽ được tạo tự động"
                            name="slug"
                            value={newItem.slug} // Hiển thị slug từ state
                            readOnly // Slug thường là readonly
                        />
                    </div>
                    <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                         {isSubmitting ? <i className="fas fa-spinner fa-spin me-2"></i> : null}
                         Lưu {type}
                    </button>
                </form>
            </Offcanvas.Body>
        </Offcanvas>
    );
};

export default AddItemOffcanvas;