// components/CountryManagement/CountryForm.js
import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import useSlug from '@hooks/useSlug';

const CountryForm = ({ initialData, onSave, onDiscard, onSaveDraft, isSubmitting }) => {
    const [country, setCountry] = useState({ title: "", slug: "" });
    const [editingCountryId, setEditingCountryId] = useState(null);
    const { slug, setInput } = useSlug(300);

    useEffect(() => {
        if (initialData) {
            setCountry({ title: initialData.title || "", slug: initialData.slug || "" });
            setEditingCountryId(initialData.id || null);
            if (initialData.title) {
                setInput(initialData.title);
            }
        } else {
            setCountry({ title: "", slug: "" });
            setEditingCountryId(null);
            setInput("");
        }
    }, [initialData, setInput]);

    useEffect(() => {
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
        if (!country.title.trim()) {
            toast.warn("Tên quốc gia không được để trống.");
            return;
        }
        const dataToSend = {
            ...country,
            slug: editingCountryId ? country.slug : slug
        };
        onSave(dataToSend, editingCountryId);

        setCountry({ title: "", slug: "" });
    };

    const handleFormSaveDraft = () => {
        const draftData = {
            title: country.title,
            slug: country.slug,
            editingCountryId: editingCountryId,
        };
        onSaveDraft(draftData);
    };

    const handleFormDiscard = () => {
        onDiscard();
    };

    return (
        <div className="add-country">
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4 row-gap-4">
                <div className="d-flex flex-column justify-content-center">
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
                        className="btn btn-primary"
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
                            <h5 className="card-tile mb-0">Thông tin Quốc gia</h5>
                        </div>
                        <div className="card-body">
                            <div className="mb-3">
                                <label className="form-label">Tên Quốc gia</label>
                                <input
                                    type="text"
                                    className="form-control"
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