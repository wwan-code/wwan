// components/GenreManagement/GenreForm.js
import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import useSlug from '@hooks/useSlug';

const GenreForm = ({ initialData, onSave, onDiscard, onSaveDraft, isSubmitting }) => {
    const [genre, setGenre] = useState({ title: "", slug: "" });
    const [editingGenreId, setEditingGenreId] = useState(null);
    const { slug, setInput } = useSlug(300);

    useEffect(() => {
        if (initialData) {
            setGenre({ title: initialData.title || "", slug: initialData.slug || "" });
            setEditingGenreId(initialData.id || null);
            if (initialData.title) {
                setInput(initialData.title);
            }
        } else {
            setGenre({ title: "", slug: "" });
            setEditingGenreId(null);
            setInput("");
        }
    }, [initialData, setInput]);

    useEffect(() => {
        if (!editingGenreId || genre.title === "" || genre.slug === "") {
            setGenre((prev) => ({ ...prev, slug: slug }));
        }

    }, [slug, editingGenreId, genre.title, genre.slug]);

    const handleTitleChange = (e) => {
        const title = e.target.value;
        setGenre((prev) => ({ ...prev, title }));
        setInput(title);
    };

    const handleFormSave = (e) => {
        e.preventDefault();
        if (!genre.title.trim()) {
            toast.warn("Tên thể loại không được để trống.");
            return;
        }
        const dataToSend = {
            ...genre,
            slug: editingGenreId ? genre.slug : slug
        };
        onSave(dataToSend, editingGenreId);
    };

    const handleFormSaveDraft = () => {
        const draftData = {
            title: genre.title,
            slug: genre.slug,
            editingGenreId: editingGenreId,
        };
        onSaveDraft(draftData);
    };

    const handleFormDiscard = () => {
        onDiscard();
    };


    return (
        <div className="add-genre">
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4 row-gap-4">
                <div className="d-flex flex-column justify-content-center">
                    <h4 className="mb-1">{editingGenreId ? "Chỉnh sửa thể loại" : "Thêm thể loại mới"}</h4>
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
                            disabled={isSubmitting || !genre.title.trim()}
                        >
                            Lưu nháp
                        </button>
                    </div>
                    <button
                        className="btn btn-label-primary"
                        onClick={handleFormSave}
                        disabled={isSubmitting || !genre.title.trim()}
                        title={editingGenreId ? "Cập nhật thể loại" : "Lưu thể loại"}
                    >
                        {isSubmitting ? <i className="fas fa-spinner fa-spin me-2"></i> : null}
                        {editingGenreId ? <i className="fas fa-save me-2"></i> : <i className="fas fa-plus me-2"></i>}
                        {editingGenreId ? "Cập nhật" : "Lưu"}
                    </button>
                </div>
            </div>
            <div className="row">
                <div className="col-12">
                    <div className="card mb-4">
                        <div className="card-header">
                            <h5 className="card-tile mb-0">Thông tin thể loại</h5>
                        </div>
                        <div className="card-body">
                            <div className="mb-3">
                                <label className="form-label">Tên thể loại</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Nhập tên thể loại"
                                    value={genre.title}
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
                                    value={genre.slug}
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

export default GenreForm;