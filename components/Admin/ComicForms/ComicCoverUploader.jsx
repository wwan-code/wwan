// src/components/Admin/ComicForms/ComicCoverUploader.jsx
import React, { useRef, useState, useEffect } from 'react';
import { toast } from 'react-toastify';

const ComicCoverUploader = ({ coverImageFile, initialCoverImageUrl, onCoverImageChange, isSubmitting, comicData }) => {
    const fileInputRef = useRef(null);
    const [previewUrl, setPreviewUrl] = useState(null);

    useEffect(() => {
        if (coverImageFile instanceof File) {
            const objectUrl = URL.createObjectURL(coverImageFile);
            setPreviewUrl(objectUrl);
            return () => URL.revokeObjectURL(objectUrl);
        } else if (initialCoverImageUrl) {
            // Nếu là URL từ server (khi edit), đảm bảo có dấu '/' ở đầu nếu là đường dẫn tương đối
            setPreviewUrl(initialCoverImageUrl.startsWith('http') ? initialCoverImageUrl : `/uploads/${initialCoverImageUrl}`);
        } else {
            setPreviewUrl(null);
        }
    }, [coverImageFile, initialCoverImageUrl]);

    const handleDragOver = (e) => e.preventDefault();

    const handleDrop = (e) => {
        e.preventDefault();
        const files = e.dataTransfer.files;
        if (files.length) {
            handleFile(files[0]);
        }
    };

    const handleFile = (file) => {
        if (file && file.type.startsWith('image/')) {
            onCoverImageChange(file); // Cập nhật state cha với File mới
        } else if (file) {
            toast.error('Vui lòng chọn một tệp hình ảnh hợp lệ.');
        }
        if (fileInputRef.current) {
            fileInputRef.current.value = ""; // Reset input
        }
    };

    const handleClick = () => {
        fileInputRef.current?.click();
    };

    const handleRemoveImage = () => {
        onCoverImageChange(null); // Reset file ở cha
        setPreviewUrl(null); // Xóa preview
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    return (
        <div className="card mb-4">
            <div className="card-header d-flex justify-content-between align-items-center">
                <h5 className="mb-0 card-title">Ảnh Bìa Truyện</h5>
            </div>
            <div className="card-body">
                <div className="form-group position-relative">
                    {previewUrl && ( // Chỉ hiện nút xóa/đổi nếu có ảnh
                        <div className='position-absolute top-0 end-0 m-2 btn-group bg-white bg-opacity-75 rounded p-1' style={{zIndex:1}}>
                            <button type="button" className="btn btn-sm btn-label-secondary" onClick={handleClick} disabled={isSubmitting} title="Đổi ảnh">
                                <i className="fas fa-sync-alt"></i>
                            </button>
                            <button type="button" className="btn btn-sm btn-label-danger" onClick={handleRemoveImage} disabled={isSubmitting} title="Xóa ảnh">
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                    )}
                    <div
                        onDragOver={handleDragOver}
                        onDrop={handleDrop}
                        onClick={!previewUrl ? handleClick : undefined} // Chỉ cho click dropzone khi chưa có ảnh
                        className="dropzone dz-clickable comic-cover-dropzone"
                        style={{ minHeight: '250px', cursor: !previewUrl ? 'pointer' : 'default' }}
                    >
                        {previewUrl ? (
                            <div className="dz-preview dz-processing dz-image-preview dz-success dz-complete">
                                <div className="dz-image d-flex justify-content-center align-items-center" style={{ height: '200px' }}>
                                    <img src={previewUrl} alt="Cover Preview" data-dz-thumbnail="" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: 'var(--w-border-radius-sm)' }} />
                                </div>
                            </div>
                        ) : (
                            <div className="dz-message needsclick d-flex flex-column justify-content-center align-items-center h-100">
                                <i className="fas fa-image fa-3x text-muted mb-2"></i>
                                <p className="h5 mb-2">Kéo thả ảnh bìa vào đây</p>
                                <p className="text-body-secondary d-block fw-normal mb-3">hoặc</p>
                                <span className="needsclick btn btn-sm btn-label-primary">
                                    Chọn ảnh bìa
                                </span>
                            </div>
                        )}
                        <input
                            type="file"
                            accept="image/*"
                            ref={fileInputRef}
                            style={{ display: 'none' }}
                            onChange={(e) => handleFile(e.target.files[0])}
                            disabled={isSubmitting}
                        />
                    </div>
                     {!initialCoverImageUrl && !coverImageFile && <small className="form-text text-danger mt-1 d-block">Ảnh bìa là bắt buộc.</small>}
                </div>
            </div>
        </div>
    );
};

export default ComicCoverUploader;