// src/components/Admin/ComicForms/ComicInfoForm.jsx
const ComicInfoForm = ({ data, slug, onTitleChange, onInputChange, isSubmitting }) => {
    return (
        <div className="card mb-4">
            <div className="card-header">
                <h5 className="card-title mb-0">Thông tin cơ bản Truyện</h5>
            </div>
            <div className="card-body">
                <div className="mb-3">
                    <label htmlFor="comicTitle" className="form-label">Tên truyện <span className="text-danger">*</span></label>
                    <input
                        type="text"
                        id="comicTitle"
                        name="title"
                        className="form-control"
                        placeholder="Nhập tên truyện"
                        value={data.title}
                        onChange={onTitleChange}
                        required
                        disabled={isSubmitting}
                    />
                </div>
                <div className="mb-3">
                    <label htmlFor="comicSlug" className="form-label">Slug</label>
                    <input
                        type="text"
                        id="comicSlug"
                        name="slug"
                        className="form-control"
                        placeholder="Slug sẽ được tạo tự động"
                        value={data.slug || slug}
                        onChange={onInputChange}
                        disabled={isSubmitting}
                    />
                     <small className="form-text text-muted">Nếu để trống hoặc tên thay đổi, slug sẽ được cập nhật tự động.</small>
                </div>
                <div className="mb-3">
                    <label htmlFor="comicSubTitle" className="form-label">Tên khác (Tên gốc)</label>
                    <input
                        type="text"
                        id="comicSubTitle"
                        name="subTitle"
                        className="form-control"
                        value={data.subTitle}
                        onChange={onInputChange}
                        placeholder="Nhập tên khác nếu có"
                        disabled={isSubmitting}
                    />
                </div>
                <div className="mb-3">
                    <label htmlFor="comicDescription" className="form-label">Mô tả</label>
                    <textarea
                        id="comicDescription"
                        name="description"
                        className="form-control"
                        rows={5}
                        value={data.description}
                        onChange={onInputChange}
                        placeholder="Nhập mô tả chi tiết về truyện"
                        disabled={isSubmitting}
                    />
                </div>
            </div>
        </div>
    );
};

export default ComicInfoForm;