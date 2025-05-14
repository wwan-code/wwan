// components/Admin/MovieForms/MovieImageUploader.js
import React, { useRef, useState, useEffect } from 'react';
import { toast } from 'react-toastify';

// Thêm prop initialImageUrls
const MovieImageUploader = ({ picture, initialImageUrls, onPictureChange }) => {
    const fileInputRef = {
        image: useRef(null),
        poster: useRef(null)
    };
    const [previewUrls, setPreviewUrls] = useState({ image: null, posterImage: null });

    // Tạo và dọn dẹp Object URL cho ảnh MỚI hoặc sử dụng URL ban đầu
    useEffect(() => {
        const newImageFile = picture.image;
        const newPosterFile = picture.posterImage;
        const initialImageUrl = initialImageUrls?.image;
        const initialPosterUrl = initialImageUrls?.posterImage;

        // Ưu tiên preview ảnh mới nếu là File object
        const imageUrl = newImageFile instanceof File
            ? URL.createObjectURL(newImageFile)
            : (initialImageUrl ? `/${initialImageUrl}` : null); // Hiển thị ảnh ban đầu nếu có

        const posterUrl = newPosterFile instanceof File
            ? URL.createObjectURL(newPosterFile)
            : (initialPosterUrl ? `/${initialPosterUrl}` : null); // Hiển thị poster ban đầu nếu có

        setPreviewUrls({ image: imageUrl, posterImage: posterUrl });

        // Cleanup function chỉ cần cho ảnh mới (là File object)
        return () => {
            if (newImageFile instanceof File && imageUrl) URL.revokeObjectURL(imageUrl);
            if (newPosterFile instanceof File && posterUrl) URL.revokeObjectURL(posterUrl);
        };
        // Thêm initialImageUrls vào dependencies
    }, [picture.image, picture.posterImage, initialImageUrls]);


    const handleDragOver = (e) => e.preventDefault();

    const handleDrop = (e, type) => {
        e.preventDefault();
        const files = e.dataTransfer.files;
        if (files.length) {
            handleFiles(files, type);
        }
    };

    const handleFiles = (files, type) => {
        if (files && files[0] && files[0].type.startsWith('image/')) {
            onPictureChange(type, files[0]); // Cập nhật state cha với File mới
        } else if (files && files[0]) {
            toast.error('Vui lòng chọn một tệp hình ảnh hợp lệ.');
        }
        // Reset input để có thể chọn lại cùng file
        if (type === 'image' && fileInputRef.image.current) {
            fileInputRef.image.current.value = "";
        } else if (type === 'posterImage' && fileInputRef.poster.current) {
            fileInputRef.poster.current.value = "";
        }
    };

    const handleClick = (type) => {
        if (type === 'image' && fileInputRef.image.current) {
            fileInputRef.image.current.click();
        } else if (type === 'posterImage' && fileInputRef.poster.current) {
            fileInputRef.poster.current.click();
        }
    };

    // Hàm xóa ảnh preview và reset state file MỚI ở cha
    const handleRemoveImage = (type) => {
        onPictureChange(type, null); // Reset file mới về null ở cha
        // Preview sẽ tự động hiển thị lại ảnh ban đầu (nếu có) do useEffect
        // Reset input tương ứng
        if (type === 'image' && fileInputRef.image.current) {
            fileInputRef.image.current.value = "";
        } else if (type === 'posterImage' && fileInputRef.poster.current) {
            fileInputRef.poster.current.value = "";
        }
    }


    const renderDropzone = (type, label) => {
        // Lấy URL preview (có thể là Object URL của file mới hoặc URL của ảnh cũ)
        const currentPreviewUrl = previewUrls[type];
        // Kiểm tra xem có phải là file mới đang được chọn không
        const isNewFile = picture[type] instanceof File;
        // Kiểm tra xem có ảnh ban đầu không
        const hasInitialImage = !!initialImageUrls?.[type];

        const fileInput = fileInputRef[type === 'image' ? 'image' : 'poster'];

        return (
            <div className="form-group col-6 position-relative">
                <label className='form-label p-2'>
                    {label} <span className="text-danger">*</span>
                    <div className='position-absolute bottom-0 end-0 m-2 btn-group'>
                        {/* Nút bấm để thay đổi ảnh */}
                        <button type="button" className="btn btn-sm btn-secondary" onClick={(e) => { e.stopPropagation(); handleClick(type); }} style={{ zIndex: 10 }}>
                            Đổi ảnh
                        </button>
                        {/* Chỉ hiện nút xóa nếu đang có ảnh mới hoặc có ảnh ban đầu */}
                        {(isNewFile || hasInitialImage) && (
                            <button type="button" className="btn btn-sm btn-danger" onClick={() => handleRemoveImage(type)} style={{ zIndex: 10 }}>
                                {isNewFile ? 'Hủy thay đổi ảnh' : 'Xóa ảnh hiện tại'}
                            </button>
                        )}
                    </div>
                </label>
                <div
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, type)}
                    // Cho phép click để browse ngay cả khi đã có ảnh (để thay đổi)
                    onClick={() => handleClick(type)}
                    className="dropzone dz-clickable"
                    style={{ minHeight: '230px', position: 'relative', cursor: 'pointer' }} // Thêm cursor pointer
                >
                    {currentPreviewUrl ? (
                        <div className="dz-preview dz-processing dz-image-preview dz-success dz-complete">
                            <div className="dz-image d-flex justify-content-center align-items-center" style={{ height: '200px' }}>
                                <img src={currentPreviewUrl} alt="Preview" data-dz-thumbnail="" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                            </div>
                            
                        </div>

                    ) : (
                        <div className="dz-message needsclick d-flex flex-column justify-content-center align-items-center" style={{ height: '100%' }}>
                            <p className="h5 pt-4 mb-2">Kéo thả ảnh vào đây</p>
                            <p className="h6 text-body-secondary d-block fw-normal mb-3">hoặc</p>
                            <span className="needsclick btn btn-sm btn-label-primary">
                                Chọn ảnh
                            </span>
                        </div>
                    )}
                    <input
                        type="file"
                        accept="image/*"
                        ref={fileInput}
                        style={{ display: 'none' }}
                        onChange={(e) => handleFiles(e.target.files, type)}
                    />
                </div>
            </div>
        );
    };

    return (
        <div className="card mb-4">
            <div className="card-header d-flex justify-content-between align-items-center">
                <h5 className="mb-0 card-title">Hình ảnh phim</h5>
            </div>
            <div className="card-body">
                <div className="d-flex flex-column flex-md-row">
                    {renderDropzone('image', 'Ảnh chính (Thumbnail)')}
                    {renderDropzone('posterImage', 'Ảnh Poster')}
                </div>
            </div>
        </div>
    );
};

export default MovieImageUploader;