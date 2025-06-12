// components/CategoryManagement/CategoryForm.js
import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import useSlug from '@hooks/useSlug';

const CategoryForm = ({ initialData, onSave, onDiscard, onSaveDraft, isSubmitting }) => {
    // Đổi tên state
    const [category, setCategory] = useState({ title: "", slug: "" });
    const [editingCategoryId, setEditingCategoryId] = useState(null);
    const { slug, setInput } = useSlug(300);

    useEffect(() => {
        if (initialData) {
            setCategory({ title: initialData.title || "", slug: initialData.slug || "" });
            setEditingCategoryId(initialData.id || null);
            if (initialData.title) {
                setInput(initialData.title);
            }
        } else {
            setCategory({ title: "", slug: "" });
            setEditingCategoryId(null);
            setInput("");
        }
    }, [initialData, setInput]);

    useEffect(() => {
        if (!editingCategoryId || category.title === "" || category.slug === "") {
            setCategory((prev) => ({ ...prev, slug: slug }));
        }
    }, [slug, editingCategoryId, category.title, category.slug]);

    const handleTitleChange = (e) => {
        const title = e.target.value;
        setCategory((prev) => ({ ...prev, title }));
        setInput(title);
    };

    const handleFormSave = (e) => {
        e.preventDefault();
        if (!category.title.trim()) {
            toast.warn("Tên danh mục không được để trống.");
            return;
        }
        const dataToSend = {
            ...category,
            slug: editingCategoryId ? category.slug : slug
        };
        onSave(dataToSend, editingCategoryId);
    };

    const handleFormSaveDraft = () => {
        const draftData = {
            title: category.title,
            slug: category.slug,
            // Đổi tên id
            editingCategoryId: editingCategoryId,
        };
        onSaveDraft(draftData);
    };

    const handleFormDiscard = () => {
        onDiscard();
    };

    return (
        <div className="add-category">
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4 row-gap-4">
                <div className="d-flex flex-column justify-content-center">
                    <h4 className="mb-1">{editingCategoryId ? "Chỉnh sửa Danh mục" : "Thêm Danh mục mới"}</h4>
                </div>
                <div className="d-flex align-content-center flex-wrap gap-4">
                    <div className="d-flex gap-4">
                        <button className="btn btn-label-secondary" onClick={handleFormDiscard} disabled={isSubmitting}>Hủy bỏ</button>
                        <button className="btn btn-label-info" onClick={handleFormSaveDraft} disabled={isSubmitting || !category.title.trim()}>Lưu nháp</button>
                    </div>
                    <button
                        className="btn btn-primary"
                        onClick={handleFormSave}
                        disabled={isSubmitting || !category.title.trim()}
                        title={editingCategoryId ? "Cập nhật Danh mục" : "Lưu Danh mục"}
                    >
                        {isSubmitting ? <i className="fas fa-spinner fa-spin me-2"></i> : null}
                        {editingCategoryId ? <i className="fas fa-save me-2"></i> : <i className="fas fa-plus me-2"></i>}
                        {editingCategoryId ? "Cập nhật" : "Lưu"}
                    </button>
                </div>
            </div>
            <div className="row">
                <div className="col-12">
                    <div className="card mb-4">
                        <div className="card-header">
                            <h5 className="card-tile mb-0">Thông tin Danh mục</h5>
                        </div>
                        <div className="card-body">
                            <div className="mb-3">
                                <label className="form-label">Tên Danh mục</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Nhập tên danh mục"
                                    value={category.title}
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
                                    value={category.slug}
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

export default CategoryForm;