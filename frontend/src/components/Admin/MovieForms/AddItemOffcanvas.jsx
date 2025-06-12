// components/Admin/MovieForms/AddItemOffcanvas.js
import { useState, useEffect } from 'react';
import { Offcanvas } from "react-bootstrap";
import axios from 'axios';
import authHeader from '@services/auth-header';
import useSlug from '@hooks/useSlug';
import { toast } from 'react-toastify';

const AddItemOffcanvas = ({ show, onHide, type, onItemAdded, handleApiError }) => {
    const [newItem, setNewItem] = useState({ title: '', slug: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { slug, setInput } = useSlug(300);

    useEffect(() => {
        if (show) {
            setNewItem({ title: '', slug: '' });
            setInput('');
        }
    }, [show, type, setInput]);

    useEffect(() => {
        setNewItem(prev => ({ ...prev, slug }));
    }, [slug]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewItem((prev) => ({ ...prev, [name]: value }));
        if (name === 'title') {
            setInput(value);
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
            const response = await axios.post(endpoint, newItem, { headers: authHeader() });
            onItemAdded(type, response.data);
        } catch (error) {
            handleApiError(error, `thêm ${type} mới`);
        } finally {
            setIsSubmitting(false);
        }
    };

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
                            value={newItem.slug}
                            readOnly
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