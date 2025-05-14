// components/Admin/MovieForms/MovieInfoForm.js
import React from 'react';

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
                        onChange={onTitleChange} // Dùng handler riêng cho title
                        required
                    />
                </div>
                <div className="mb-3">
                    <label className="form-label">Slug</label>
                    <input
                        type="text"
                        className="form-control"
                        placeholder="Slug sẽ được tạo tự động"
                        value={slug} // Hiển thị slug từ hook
                        readOnly
                    />
                </div>
                <div className="mb-3">
                    <label className="form-label">Tên phụ (Subtitle)</label>
                    <input
                        type="text"
                        name="subTitle"
                        className="form-control"
                        value={data.subTitle}
                        onChange={onInputChange} // Dùng handler chung
                        placeholder="Nhập tên khác nếu có"
                    />
                </div>
                 <div className="mb-3"> {/* Chuyển Description vào đây */}
                    <label className="form-label">Mô tả</label>
                    <textarea
                        name="description"
                        className="form-control"
                        rows={6} // Giảm số dòng cho phù hợp
                        value={data.description}
                        onChange={onInputChange} // Dùng handler chung
                        placeholder="Nhập mô tả ngắn gọn về phim"
                    />
                </div>
            </div>
        </div>
    );
};

export default MovieInfoForm;