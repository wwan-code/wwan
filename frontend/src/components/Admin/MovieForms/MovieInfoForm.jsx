// components/Admin/MovieForms/MovieInfoForm.js

const MovieInfoForm = ({ data, slug, onTitleChange, onInputChange }) => {
    return (
        <div className="card mb-4">
            <div className="card-header">
                <h5 className="card-tile mb-0">Thông tin cơ bản</h5>
            </div>
            <div className="card-body">
                <div className="mb-3">
                    <label className="form-label">Tên phim <span className="text-danger">*</span></label>
                    <input
                        type="text"
                        name="title"
                        className="form-control"
                        placeholder="Nhập tên phim"
                        value={data.title}
                        onChange={onTitleChange}
                        required
                    />
                </div>
                <div className="mb-3">
                    <label className="form-label">Slug</label>
                    <input
                        type="text"
                        className="form-control"
                        placeholder="Slug sẽ được tạo tự động"
                        value={slug}
                        readOnly
                    />
                </div>
                <div className="mb-3">
                    <label className="form-label">Tên khác (Subtitle)</label>
                    <input
                        type="text"
                        name="subTitle"
                        className="form-control"
                        value={data.subTitle}
                        onChange={onInputChange}
                        placeholder="Nhập tên khác nếu có"
                    />
                </div>
                 <div className="mb-3">
                    <label className="form-label">Mô tả</label>
                    <textarea
                        name="description"
                        className="form-control"
                        rows={6}
                        value={data.description}
                        onChange={onInputChange}
                        placeholder="Nhập mô tả ngắn gọn về phim"
                    />
                </div>
            </div>
        </div>
    );
};

export default MovieInfoForm;