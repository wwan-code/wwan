// components/CountryManagement/CountryForm.js
import React, { useState, useEffect } from 'react';
import useSlug from '../../hooks/useSlug'; // Giả sử hook này tồn tại và hoạt động đúng
import { toast } from 'react-toastify';

const CountryForm = ({ initialData, onSave, onDiscard, onSaveDraft, isSubmitting }) => {
    // Đổi tên state cho phù hợp
    const [country, setCountry] = useState({ title: "", slug: "" });
    const [editingCountryId, setEditingCountryId] = useState(null);
    const { slug, setInput } = useSlug(300);

    useEffect(() => {
        if (initialData) {
            setCountry({ title: initialData.title || "", slug: initialData.slug || "" });
            setEditingCountryId(initialData.id || null);
             if(initialData.title) {
                setInput(initialData.title);
             }
        } else {
            setCountry({ title: "", slug: "" });
            setEditingCountryId(null);
             setInput("");
        }
    }, [initialData, setInput]);

    useEffect(() => {
        // Logic cập nhật slug tương tự GenreForm
        if (!editingCountryId || country.title === "" || country.slug === "") {
             setCountry((prev) => ({ ...prev, slug: slug }));
         }
    }, [slug, editingCountryId, country.title, country.slug]);

    const handleTitleChange = (e) => {
        const title = e.target.value;
        setCountry((prev) => ({ ...prev, title }));
        setInput(title);
    };

    const handleFormSave = (e) => {
        e.preventDefault();
        // Thay đổi thông báo kiểm tra
        if (!country.title.trim()) {
            toast.warn("Tên quốc gia không được để trống.");
            return;
        }
         const dataToSend = {
            ...country,
            slug: editingCountryId ? country.slug : slug
        };
        onSave(dataToSend, editingCountryId);

        // reset state
        setCountry({ title: "", slug: "" });
    };

    const handleFormSaveDraft = () => {
        const draftData = {
            title: country.title,
            slug: country.slug,
            // Đổi tên id cho phù hợp
            editingCountryId: editingCountryId,
        };
        onSaveDraft(draftData);
    };

     const handleFormDiscard = () => {
        onDiscard();
    };

    return (
        // --- Giữ nguyên cấu trúc JSX, chỉ thay đổi text labels/titles ---
        <div className="add-country"> {/* Đổi class nếu cần */}
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4 row-gap-4">
                <div className="d-flex flex-column justify-content-center">
                     {/* Đổi title */}
                    <h4 className="mb-1">{editingCountryId ? "Chỉnh sửa Quốc gia" : "Thêm Quốc gia mới"}</h4>
                </div>
                <div className="d-flex align-content-center flex-wrap gap-4">
                    <div className="d-flex gap-4">
                        <button
                            className="btn btn-label-secondary"
                            onClick={handleFormDiscard}
                            disabled={isSubmitting}
                        >
                            Hủy bỏ
                        </button>
                        <button
                            className="btn btn-label-info"
                            onClick={handleFormSaveDraft}
                            disabled={isSubmitting || !country.title.trim()}
                        >
                            Lưu nháp
                        </button>
                    </div>
                    <button
                        className="btn btn-primary" // Đổi class nếu cần (btn-label-primary)
                        onClick={handleFormSave}
                        disabled={isSubmitting || !country.title.trim()}
                        title={editingCountryId ? "Cập nhật Quốc gia" : "Lưu Quốc gia"}
                    >
                        {isSubmitting ? <i className="fas fa-spinner fa-spin me-2"></i> : null}
                        {editingCountryId ? <i className="fas fa-save me-2"></i> : <i className="fas fa-plus me-2"></i>}
                        {editingCountryId ? "Cập nhật" : "Lưu"}
                    </button>
                </div>
            </div>
            <div className="row">
                <div className="col-12">
                    <div className="card mb-4">
                        <div className="card-header">
                             {/* Đổi title */}
                            <h5 className="card-tile mb-0">Thông tin Quốc gia</h5>
                        </div>
                        <div className="card-body">
                                <div className="mb-3">
                                     {/* Đổi label */}
                                    <label className="form-label">Tên Quốc gia</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        // Đổi placeholder
                                        placeholder="Nhập tên quốc gia"
                                        value={country.title}
                                        onChange={handleTitleChange}
                                        readOnly={isSubmitting}
                                    />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">Slug</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="Slug sẽ được tạo tự động"
                                        value={country.slug}
                                        readOnly
                                    />
                                </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CountryForm;