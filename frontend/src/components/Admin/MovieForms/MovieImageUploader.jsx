// components/Admin/MovieForms/MovieImageUploader.js
import { useRef, useState, useEffect } from 'react';
import { toast } from 'react-toastify';

const MovieImageUploader = ({ picture, initialImageUrls, onPictureChange }) => {
    const fileInputRef = {
        banner: useRef(null),
        poster: useRef(null)
    };
    const [previewUrls, setPreviewUrls] = useState({ poster: null, banner: null });

    useEffect(() => {
        const newBannerFile = picture.banner;
        const newPosterFile = picture.poster;
        const initialBannerUrl = initialImageUrls?.banner;
        const initialPosterUrl = initialImageUrls?.poster;

        const bannerUrl = newBannerFile instanceof File
            ? URL.createObjectURL(newBannerFile)
            : (initialBannerUrl ? `${process.env.REACT_APP_API_URL_IMAGE}/${initialBannerUrl}` : null);

        const posterUrl = newPosterFile instanceof File
            ? URL.createObjectURL(newPosterFile)
            : (initialPosterUrl ? `${process.env.REACT_APP_API_URL_IMAGE}/${initialPosterUrl}` : null);

        setPreviewUrls({ banner: bannerUrl, poster: posterUrl });

        return () => {
            if (newBannerFile instanceof File && bannerUrl) URL.revokeObjectURL(bannerUrl);
            if (newPosterFile instanceof File && posterUrl) URL.revokeObjectURL(posterUrl);
        };
    }, [picture.banner, picture.poster, initialImageUrls]);


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
            onPictureChange(type, files[0]);
        } else if (files && files[0]) {
            toast.error('Vui lòng chọn một tệp hình ảnh hợp lệ.');
        }
        if (type === 'banner' && fileInputRef.banner.current) {
            fileInputRef.banner.current.value = "";
        } else if (type === 'poster' && fileInputRef.poster.current) {
            fileInputRef.poster.current.value = "";
        }
    };

    const handleClick = (type) => {
        if (type === 'banner' && fileInputRef.banner.current) {
            fileInputRef.banner.current.click();
        } else if (type === 'poster' && fileInputRef.poster.current) {
            fileInputRef.poster.current.click();
        }
    };

    const handleRemoveImage = (type) => {
        onPictureChange(type, null);
        if (type === 'banner' && fileInputRef.banner.current) {
            fileInputRef.banner.current.value = "";
        } else if (type === 'poster' && fileInputRef.poster.current) {
            fileInputRef.poster.current.value = "";
        }
    }

    const renderDropzone = (type, label) => {
        const currentPreviewUrl = previewUrls[type];
        const isNewFile = picture[type] instanceof File;
        const hasInitialImage = !!initialImageUrls?.[type];

        const fileInput = fileInputRef[type === 'banner' ? 'banner' : 'poster'];

        return (
            <div className="form-group col-6 position-relative">
                <label className='form-label p-2'>
                    {label} <span className="text-danger">*</span>
                    <div className='position-absolute bottom-0 end-0 m-2 btn-group'>
                        <button type="button" className="btn btn-sm btn-secondary" onClick={(e) => { e.stopPropagation(); handleClick(type); }} style={{ zIndex: 10 }}>
                            Đổi ảnh
                        </button>
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
                    onClick={() => handleClick(type)}
                    className="dropzone dz-clickable image-dropzone"
                    style={{ minHeight: '230px', position: 'relative', cursor: 'pointer' }}
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
                    {renderDropzone('poster', 'Ảnh Poster')}
                    {renderDropzone('banner', 'Ảnh Banner')}
                </div>
            </div>
        </div>
    );
};

export default MovieImageUploader;