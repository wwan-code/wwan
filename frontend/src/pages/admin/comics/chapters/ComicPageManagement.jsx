// src/pages/admin/comics/chapters/ComicPageManagement.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Button, Spinner, Alert, Image, Form, Row, Col } from 'react-bootstrap';
import { toast } from 'react-toastify';
import authHeader from '@services/auth-header';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import update from 'immutability-helper';

import '@assets/scss/admin/ChapterManagement.scss';
import '@assets/scss/admin/ComicPageManagement.scss';

const DRAGGABLE_TYPE_EXISTING_PAGE = 'EXISTING_COMIC_PAGE';

// ----- DraggableExistingPageItem Component -----
const DraggableExistingPageItem = ({ page, index, movePage, onRemove, isSubmitting }) => {
    const ref = useRef(null);
    const [{ isDragging }, drag] = useDrag({
        type: DRAGGABLE_TYPE_EXISTING_PAGE,
        item: () => ({ id: page.id, index }), // Gửi cả page.id và index
        collect: (monitor) => ({
            isDragging: monitor.isDragging(),
        }),
    });
    const [, drop] = useDrop({
        accept: DRAGGABLE_TYPE_EXISTING_PAGE,
        hover(item, monitor) {
            if (!ref.current) return;
            const dragIndex = item.index;
            const hoverIndex = index;
            if (dragIndex === hoverIndex) return;
            movePage(dragIndex, hoverIndex);
            item.index = hoverIndex;
        },
    });
    drag(drop(ref));

    const imageUrl = page.imageUrl.startsWith('http') ? page.imageUrl : `${process.env.REACT_APP_API_URL_IMAGE}/${page.imageUrl}`;

    return (
        <div
            ref={ref}
            style={{ opacity: isDragging ? 0.4 : 1, cursor: 'move' }}
            className="draggable-page-preview-item existing-page-item align-items-center"
        >
            <span className="page-preview-index draggable-handle me-2"><i className="fas fa-grip-vertical"></i> #{page.pageNumber} (ID: {page.id})</span>
            <Image src={imageUrl} alt={`Trang ${page.pageNumber}`} className="page-preview-img" />
            <span className="page-preview-name ms-2 text-muted small" title={page.imageUrl}>{page.imageUrl.split('/').pop()}</span>
            <Button variant="link" className="btn-remove-page ms-auto text-danger p-0" onClick={() => onRemove(page.id, index)} title="Xóa trang này" disabled={isSubmitting}>
                <i className="fas fa-times"></i>
            </Button>
        </div>
    );
};

const DraggablePagePreviewItem = ({ id, imageUrl, fileName, index, movePage, onRemove, isSubmitting }) => {
    const ref = useRef(null);
    const [, drop] = useDrop({
        accept: DRAGGABLE_TYPE_EXISTING_PAGE,
        hover(item, monitor) {
            if (!ref.current || item.index === index) return;
            movePage(item.index, index);
            item.index = index;
        },
    });
    const [{ isDragging }, drag] = useDrag({
        type: DRAGGABLE_TYPE_EXISTING_PAGE,
        item: () => ({ id, index }),
        collect: (monitor) => ({ isDragging: monitor.isDragging() }),
    });
    drag(drop(ref));

    return (
        <div
            ref={ref}
            style={{ opacity: isDragging ? 0.4 : 1, cursor: 'move' }}
            className="draggable-page-preview-item align-items-center"
        >
            <span className="page-preview-index draggable-handle me-2"><i className="fas fa-grip-vertical"></i> #{index + 1}</span>
            <Image src={imageUrl} alt={`Preview ${index + 1}`} className="page-preview-img" />
            <span className="page-preview-name ms-2" title={fileName}>{fileName}</span>
            <Button variant="link" className="btn-remove-page ms-auto text-danger" onClick={() => onRemove(index)} title="Xóa trang này" disabled={isSubmitting}>
                <i className="fas fa-times"></i>
            </Button>
        </div>
    );
};

const ComicPageManagement = () => {
    const { chapterId } = useParams();
    const navigate = useNavigate();
    const [comic, setComic] = useState(null);
    const [chapter, setChapter] = useState(null);
    const [pages, setPages] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [newImageFiles, setNewImageFiles] = useState([]);
    const [newImagePreviews, setNewImagePreviews] = useState([]);

    const handleApiError = (error, operation = "thực hiện") => {
        console.error(`Failed to ${operation}:`, error);
        let message = `Thao tác ${operation} thất bại. Vui lòng thử lại.`;
        if (error.response?.data?.message) {
            message = error.response.data.message;
        } else if (error.message) {
            message = error.message;
        }
        toast.error(message);
    };

    const fetchChapterWithPages = useCallback(async () => {
        setIsLoading(true); setError(null);
        try {
            const response = await axios.get(`/api/chapters/${chapterId}/pages`, { headers: authHeader() });
            if (response.data?.success && response.data.chapter) {
                setChapter(response.data.chapter);
                const sortedPages = (response.data.chapter.pages || []).sort((a, b) => a.pageNumber - b.pageNumber);
                setPages(sortedPages);
            } else {
                throw new Error(response.data?.message || "Không thể tải dữ liệu chương và trang.");
            }
        } catch (err) {
            console.error("Lỗi tải dữ liệu:", err);
            setError(err.response?.data?.message || err.message || "Lỗi không xác định.");
            if (err.response?.status === 404) toast.error("Không tìm thấy chương này.");
        } finally {
            setIsLoading(false);
        }
    }, [chapterId]);

    useEffect(() => {
        fetchChapterWithPages();
    }, [fetchChapterWithPages]);

    const handleNewImageFilesChange = (e) => {
        const files = Array.from(e.target.files);
        const currentFiles = [...newImageFiles];
        const currentPreviews = [...newImagePreviews];

        files.forEach(file => {
            if (file.type.startsWith('image/')) {
                currentFiles.push(file);
                currentPreviews.push({
                    id: `${file.name}-${Date.now()}-${Math.random()}`,
                    imageUrl: URL.createObjectURL(file),
                    fileName: file.name,
                    file: file
                });
            } else {
                toast.warn(`File ${file.name} không phải là ảnh và sẽ được bỏ qua.`);
            }
        });
        setNewImageFiles(currentFiles);
        setNewImagePreviews(currentPreviews);
        e.target.value = null;
    };

    // Kéo thả cho ảnh MỚI upload
    const moveNewPagePreview = useCallback((dragIndex, hoverIndex) => {
        setNewImageFiles(prevFiles => update(prevFiles, { $splice: [[dragIndex, 1], [hoverIndex, 0, prevFiles[dragIndex]]] }));
        setNewImagePreviews(prevPreviews => update(prevPreviews, { $splice: [[dragIndex, 1], [hoverIndex, 0, prevPreviews[dragIndex]]] }));
    }, []);
    const removeNewPagePreview = (indexToRemove) => {
        URL.revokeObjectURL(newImagePreviews[indexToRemove].imageUrl);
        setNewImagePreviews(prev => prev.filter((_, index) => index !== indexToRemove));
        setNewImageFiles(prev => prev.filter((_, index) => index !== indexToRemove));
    };

    // Kéo thả cho ảnh ĐÃ CÓ
    const moveExistingPage = useCallback((dragIndex, hoverIndex) => {
        setPages(prevPages => update(prevPages, { $splice: [[dragIndex, 1], [hoverIndex, 0, prevPages[dragIndex]]] }));
    }, []);

    const handleRemoveExistingPage = async (pageIdToRemove, indexInUI) => {
        if (!window.confirm(`Bạn chắc chắn muốn xóa trang ảnh này (ID: ${pageIdToRemove}) vĩnh viễn?`)) return;
        setIsSubmitting(true);
        try {
            await axios.delete(`/api/admin/comic-pages/${pageIdToRemove}`, { headers: authHeader() });
            toast.success(`Đã xóa trang ID ${pageIdToRemove}.`);
            setPages(prev => prev.filter(p => p.id !== pageIdToRemove));
        } catch (error) {
            handleApiError(error, `xóa trang ID ${pageIdToRemove}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSaveChanges = async () => {
        if (!chapter) return;
        setIsSubmitting(true);

        const formData = new FormData();
        if (pages.length > 0) {
            pages.forEach((page, index) => {
                formData.append('orderedPageIds[]', page.id);
            });
        }

        if (newImageFiles.length > 0) {
            newImageFiles.forEach(file => {
                formData.append('newPages', file);
            });
        }

        try {
            const response = await axios.put(
                `/api/admin/chapters/${chapterId}/manage-pages`,
                formData,
                { headers: { ...authHeader() } }
            );

            if (response.data?.success) {
                toast.success("Đã lưu thay đổi cho các trang thành công!");
                setNewImageFiles([]);
                setNewImagePreviews([]);
                fetchChapterWithPages();
            } else {
                throw new Error(response.data?.message || "Lưu thay đổi thất bại.");
            }
        } catch (error) {
            handleApiError(error, "lưu thay đổi trang");
        } finally {
            setIsSubmitting(false);
        }
    };


    if (isLoading) return <div className="container pt-5 text-center"><Spinner animation="border" variant="primary" /></div>;
    if (error) return <div className="container mt-3"><Alert variant="danger">{error} <Link to={comic ? `/admin/comics/${chapterId}/chapters` : "/admin/comics"} className="alert-link">Quay lại</Link></Alert></div>;
    if (!chapter) return <div className="container mt-3"><Alert variant="info">Không tìm thấy thông tin chương. <Link to="/admin/comics" className="alert-link">Quay lại</Link></Alert></div>;


    return (
        <DndProvider backend={HTML5Backend}>
            <div className="container-fluid admin-content-list-page comic-page-management">
                <div className="page-header">
                    <div className="d-flex align-items-center flex-wrap">
                        <Button size="sm" onClick={() => navigate(`/admin/comics/${chapter.comicId}/chapters`)} className="me-2 mb-2 mb-md-0 shadow-sm" title="Quay lại danh sách chương">
                            <i className="fas fa-arrow-left"></i>
                        </Button>
                        <h4 className="page-title mb-0 me-3">
                            Quản lý Trang Ảnh
                        </h4>
                        <span className="text-muted align-middle">
                            Truyện: <Link to={`/admin/comics/edit/${chapter.comicId}`} className="fw-medium">{chapter.comic?.title || 'N/A'}</Link> - Chương: <span className="fw-medium">{chapter.chapterNumber} {chapter.title && `(${chapter.title})`}</span>
                        </span>
                    </div>
                    <Button variant="success" onClick={handleSaveChanges} disabled={isSubmitting || (pages.length === 0 && newImageFiles.length === 0)}>
                        {isSubmitting ? <Spinner as="span" size="sm" /> : <><i className="fas fa-save me-1"></i> Lưu Thay Đổi Thứ Tự & Thêm Mới</>}
                    </Button>
                </div>

                <Row className="mt-3">
                    {/* Cột hiển thị các trang đã có */}
                    <Col md={7} className="mb-3 mb-md-0">
                        <h5>Các trang hiện tại ({pages.length}) - Kéo thả để sắp xếp</h5>
                        {pages.length > 0 ? (
                            <div className="pages-list-dnd border rounded p-3">
                                {pages.map((page, index) => (
                                    <DraggableExistingPageItem
                                        key={page.id}
                                        page={page}
                                        index={index}
                                        movePage={moveExistingPage}
                                        onRemove={handleRemoveExistingPage}
                                        isSubmitting={isSubmitting}
                                    />
                                ))}
                            </div>
                        ) : (
                            <Alert variant="secondary" className="text-center">Chương này chưa có trang nào hoặc tất cả đã bị xóa.</Alert>
                        )}
                    </Col>

                    {/* Cột upload ảnh mới */}
                    <Col md={5}>
                        <h5>Thêm trang ảnh mới</h5>
                        <Form.Group controlId="newComicPagesUpload" className="mb-2">
                            <Form.Label className="small">Chọn file ảnh (có thể chọn nhiều file, sẽ được thêm vào cuối danh sách hiện tại)</Form.Label>
                            <Form.Control
                                type="file"
                                multiple
                                accept="image/*"
                                onChange={handleNewImageFilesChange}
                                disabled={isSubmitting}
                                size="sm"
                            />
                        </Form.Group>
                        {newImagePreviews.length > 0 && (
                            <>
                                <h6 className="mt-3 small text-muted">Ảnh mới sẽ thêm (kéo thả để sắp xếp):</h6>
                                <div className="preview-list-container-dnd new-page-previews-list border rounded p-3">
                                    {newImagePreviews.map((page, index) => (
                                        <DraggablePagePreviewItem
                                            key={page.id}
                                            id={page.id}
                                            imageUrl={page.imageUrl}
                                            fileName={page.fileName}
                                            index={index}
                                            movePage={moveNewPagePreview}
                                            onRemove={removeNewPagePreview}
                                            isSubmitting={isSubmitting}
                                        />
                                    ))}
                                </div>
                            </>
                        )}
                        {newImageFiles.length > 0 &&
                            <Button variant="info" size="sm" className="mt-2 w-100" onClick={handleSaveChanges} disabled={isSubmitting}>
                                {isSubmitting ? <Spinner as="span" size="sm"/> : <> <i className="fas fa-plus-circle me-1"></i> Chỉ thêm các ảnh mới này </> }
                            </Button>
                        }
                    </Col>
                </Row>
            </div>
        </DndProvider>
    );
};

export default ComicPageManagement;