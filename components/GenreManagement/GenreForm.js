// components/GenreManagement/GenreForm.js
import React, { useState, useEffect } from 'react';
import useSlug from '../../hooks/useSlug'; // Giả sử hook này tồn tại và hoạt động đúng
import { toast } from 'react-toastify';

const GenreForm = ({ initialData, onSave, onDiscard, onSaveDraft, isSubmitting }) => {
    const [genre, setGenre] = useState({ title: "", slug: "" });
    const [editingGenreId, setEditingGenreId] = useState(null);
    const { slug, setInput } = useSlug(300); // Hook tạo slug

    // Cập nhật state của form khi initialData (từ edit hoặc draft) thay đổi
    useEffect(() => {
        if (initialData) {
            setGenre({ title: initialData.title || "", slug: initialData.slug || "" });
            setEditingGenreId(initialData.id || null);
            // Nếu có title ban đầu, cũng cần setInput cho useSlug
            if (initialData.title) {
                setInput(initialData.title);
            }
        } else {
            // Reset form nếu không có initialData (ví dụ sau khi discard hoặc save)
            setGenre({ title: "", slug: "" });
            setEditingGenreId(null);
            setInput(""); // Reset cả input cho useSlug
        }
    }, [initialData, setInput]);

    // Cập nhật slug trong state của form khi hook useSlug tạo ra slug mới
    useEffect(() => {
        // Chỉ cập nhật slug nếu người dùng đang không chỉnh sửa (tránh ghi đè slug cũ)
        // Hoặc nếu title đang rỗng (để slug cũng rỗng theo)
        // Hoặc nếu slug hiện tại rỗng (lần đầu tạo slug)
        if (!editingGenreId || genre.title === "" || genre.slug === "") {
            setGenre((prev) => ({ ...prev, slug: slug }));
        }
        // Nếu đang edit và title thay đổi, ta *có thể* muốn cập nhật slug
        // Nhưng thường thì slug không nên thay đổi sau khi đã tạo để tránh broken link
        // Quyết định này tùy thuộc vào yêu cầu. Hiện tại giữ nguyên slug khi edit.
    }, [slug, editingGenreId, genre.title, genre.slug]); // Thêm dependency

    const handleTitleChange = (e) => {
        const title = e.target.value;
        setGenre((prev) => ({ ...prev, title }));
        setInput(title); // Cập nhật input cho hook useSlug
    };

    const handleFormSave = (e) => {
        e.preventDefault(); // Ngăn submit form mặc định nếu dùng thẻ <form>
        if (!genre.title.trim()) {
            toast.warn("Tên thể loại không được để trống.");
            return;
        }
        // Đảm bảo gửi slug mới nhất được tạo tự động nếu đang thêm mới
        const dataToSend = {
            ...genre,
            slug: editingGenreId ? genre.slug : slug // Lấy slug mới nhất từ hook nếu thêm mới
        };
        onSave(dataToSend, editingGenreId); // Gọi hàm save từ component cha
    };

    const handleFormSaveDraft = () => {
        // Chuẩn bị dữ liệu nháp để gửi lên cha
        const draftData = {
            title: genre.title,
            slug: genre.slug,
            editingGenreId: editingGenreId,
        };
        onSaveDraft(draftData); // Gọi hàm lưu nháp từ component cha
    };

    const handleFormDiscard = () => {
        onDiscard(); // Gọi hàm hủy bỏ từ component cha
        // Việc reset state form sẽ được xử lý bởi useEffect [initialData] khi initialData thành null
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
                            disabled={isSubmitting} // Disable khi đang submit
                        >
                            Hủy bỏ
                        </button>
                        <button
                            className="btn btn-label-info"
                            onClick={handleFormSaveDraft}
                            disabled={isSubmitting || !genre.title.trim()} // Disable khi đang submit hoặc title rỗng
                        >
                            Lưu nháp
                        </button>
                    </div>
                    <button
                        className="btn btn-label-primary"
                        onClick={handleFormSave}
                        disabled={isSubmitting || !genre.title.trim()} // Disable khi đang submit hoặc title rỗng
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
                            {/* Không cần thẻ <form> nếu không submit theo cách truyền thống */}
                            <div className="mb-3">
                                <label className="form-label">Tên thể loại</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Nhập tên thể loại"
                                    value={genre.title}
                                    onChange={handleTitleChange}
                                    readOnly={isSubmitting} // Readonly khi đang submit
                                />
                            </div>
                            <div className="mb-3">
                                <label className="form-label">Slug</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Slug sẽ được tạo tự động"
                                    value={genre.slug}
                                    readOnly // Slug luôn readonly trong form này
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