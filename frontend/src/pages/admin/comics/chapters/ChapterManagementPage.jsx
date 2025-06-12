// src/pages/admin/comics/chapters/ChapterManagementPage.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Table, Button, Modal, Form, Spinner, Alert, Image, ProgressBar } from 'react-bootstrap';
import { toast } from 'react-toastify';
import authHeader from '@services/auth-header';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import update from 'immutability-helper';

import '@assets/scss/admin/ContentList.scss';
import '@assets/scss/admin/ChapterManagement.scss';

const DRAGGABLE_TYPE_CHAPTER_PAGE = 'CHAPTER_PAGE_PREVIEW';

const DraggablePagePreviewItem = ({ id, imageUrl, fileName, index, movePage, onRemove, isSubmitting }) => {
    const ref = useRef(null);
    const [, drop] = useDrop({
        accept: DRAGGABLE_TYPE_CHAPTER_PAGE,
        hover(item, monitor) {
            if (!ref.current || item.index === index) return;
            movePage(item.index, index);
            item.index = index;
        },
    });
    const [{ isDragging }, drag] = useDrag({
        type: DRAGGABLE_TYPE_CHAPTER_PAGE,
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

const BatchUploadChapters = ({ comicId, comicSlug }) => {
    const [selectedDirectory, setSelectedDirectory] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);

    const handleDirectoryChange = (event) => {
        const files = event.target.files;
        if (files && files.length > 0) {
            setSelectedDirectory(files);
            setError(null);
            setSuccessMessage(null);
        } else {
            setSelectedDirectory(null);
        }
    };

    const handleUpload = async () => {
        if (!selectedDirectory || selectedDirectory.length === 0) {
            toast.warn("Vui lòng chọn một thư mục chứa các chương.");
            return;
        }
        if (!comicId || !comicSlug) {
            toast.error("Không xác định được truyện để upload chương.");
            return;
        }

        setIsUploading(true);
        setError(null);
        setSuccessMessage(null);
        setUploadProgress(0);

        const formData = new FormData();
        formData.append('comicId', comicId);
        formData.append('comicSlug', comicSlug);
        const chaptersData = {};

        for (let i = 0; i < selectedDirectory.length; i++) {
            const file = selectedDirectory[i];
            const relativePath = file.webkitRelativePath;

            const pathParts = relativePath.split('/');
            if (pathParts.length < 3) {
                console.warn(`Bỏ qua file với đường dẫn không hợp lệ: ${relativePath}`);
                continue;
            }

            const chapterDirName = pathParts[pathParts.length - 2];

            const cleanedChapterDirName = chapterDirName.replace(/^[\s\-]+/, '').trim();
            const chapterMatch = cleanedChapterDirName.match(/^Chapter\s*(\d+([\.,]\d+)?|Extra)$/i);
            if (!chapterMatch) {
                console.warn(`Bỏ qua thư mục không đúng định dạng: ${chapterDirName}`);
                continue;
            }
            const chapterNumberForSort = chapterMatch[1].replace(',', '.');

            if (!chaptersData[cleanedChapterDirName]) {
                chaptersData[cleanedChapterDirName] = {
                    files: [],
                    originalName: cleanedChapterDirName,
                    sortKey: parseFloat(chapterNumberForSort.replace(/[^0-9.]/g, '')) || 0
                };
            }
            chaptersData[cleanedChapterDirName].files.push(file);
        }
        if (Object.keys(chaptersData).length === 0) {
            toast.error("Không tìm thấy thư mục chương hợp lệ nào (ví dụ: Chapter 1, Chapter 2,...) trong thư mục bạn chọn.");
            setIsUploading(false);
            return;
        }


        const sortedChapterKeys = Object.keys(chaptersData).sort((a, b) => {
            const numA = parseFloat(a.replace(/[^0-9.]/g, '')) || 0;
            const numB = parseFloat(b.replace(/[^0-9.]/g, '')) || 0;
            return numA - numB;
        });

        sortedChapterKeys.forEach((chapterName, chapterIndex) => {
            const chapterData = chaptersData[chapterName];
            chapterData.files.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
            formData.append(`chapters[${chapterIndex}][name]`, chapterName);
            formData.append(`chapters[${chapterIndex}][number]`, chapterData.sortKey.toString());

            chapterData.files.forEach((file, fileIndex) => {
                formData.append(`chapter_${chapterIndex}_pages`, file, file.name);
            });
        });


        try {
            const response = await axios.post('/api/admin/comics/batch-upload-chapters', formData, {
                headers: authHeader(),
                onUploadProgress: (progressEvent) => {
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    setUploadProgress(percentCompleted);
                },
            });

            if (response.data.success) {
                toast.success(response.data.message || "Upload nhiều chương thành công!");
                setSuccessMessage(response.data.message || "Upload thành công!");
                setSelectedDirectory(null);
            } else {
                throw new Error(response.data.message || "Upload thất bại.");
            }
        } catch (err) {
            console.error("Lỗi upload hàng loạt:", err);
            const apiError = err.response?.data?.message || err.message || "Lỗi không xác định khi upload.";
            setError(apiError);
            toast.error(apiError);
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="card mt-3">
            <div className="card-header">
                <h5 className="card-title mb-0">Upload Nhiều Chương</h5>
            </div>
            <div className="card-body">
                {error && <Alert variant="danger">{error}</Alert>}
                {successMessage && <Alert variant="success">{successMessage}</Alert>}
                <Form.Group controlId="batchChapterUpload" className="mb-3">
                    <Form.Label>Chọn thư mục truyện (ví dụ: "Tên Truyện" chứa các thư mục "Chapter 1", "Chapter 2",...)</Form.Label>
                    <input
                        type="file"
                        className="form-control"
                        webkitdirectory="true"
                        directory="true"
                        onChange={handleDirectoryChange}
                        disabled={isUploading}
                    />
                    <Form.Text muted>
                        Hệ thống sẽ tự động quét các thư mục con có tên theo định dạng "Chapter X" (X là số chương, ví dụ: Chapter 1, Chapter 2.5, Chapter Extra) và upload các ảnh bên trong.
                    </Form.Text>
                </Form.Group>

                {selectedDirectory && selectedDirectory.length > 0 && !isUploading && (
                    <div className="mb-3">
                        <p>Đã chọn {selectedDirectory.length} tệp/thư mục con. Nhấn "Bắt đầu Upload" để xử lý.</p>
                    </div>
                )}

                {isUploading && (
                    <div className="mb-3">
                        <ProgressBar now={uploadProgress} label={`${uploadProgress}%`} animated />
                        <p className="text-center mt-2">Đang upload, vui lòng chờ...</p>
                    </div>
                )}

                <Button
                    variant="primary"
                    onClick={handleUpload}
                    disabled={isUploading || !selectedDirectory || selectedDirectory.length === 0}
                >
                    {isUploading ? <Spinner as="span" animation="border" size="sm" /> : "Bắt đầu Upload Nhiều Chương"}
                </Button>
            </div>
        </div>
    );
};

const ChapterFormModal = ({
    show, onHide, comicId, comicSlug, chapterData, onSubmit, isSubmitting
}) => {
    const [formData, setFormData] = useState({ title: '', chapterNumber: '', order: '' });
    const [pageFiles, setPageFiles] = useState([]);
    const [pagePreviews, setPagePreviews] = useState([]);

    useEffect(() => {
        if (show) {
            if (chapterData) {
                setFormData({
                    title: chapterData.title || '',
                    chapterNumber: String(chapterData.chapterNumber || ''),
                    order: chapterData.order !== undefined ? String(chapterData.order) : ''
                });
                setPageFiles([]);
                setPagePreviews(chapterData.pages ? chapterData.pages.sort((a, b) => a.pageNumber - b.pageNumber).map(p => ({
                    id: p.id,
                    imageUrl: p.imageUrl.startsWith('http') ? p.imageUrl : `/${p.imageUrl}`,
                    fileName: p.imageUrl.split('/').pop()
                })) : []);
            } else {
                setFormData({ title: '', chapterNumber: '', order: '' });
                setPageFiles([]);
                setPagePreviews([]);
            }
        }
    }, [chapterData, show]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handlePageFilesChange = (e) => {
        const files = Array.from(e.target.files);
        const newFiles = [];
        const newPreviewsToAdd = [];

        files.forEach(file => {
            if (file.type.startsWith('image/')) {
                newFiles.push(file);
                newPreviewsToAdd.push({
                    id: `${file.name}-${Date.now()}-${Math.random()}`,
                    imageUrl: URL.createObjectURL(file),
                    fileName: file.name,
                    file: file
                });
            } else {
                toast.warn(`File ${file.name} không phải là ảnh và sẽ được bỏ qua.`);
            }
        });
        setPageFiles(prev => [...prev, ...newFiles]);
        setPagePreviews(prev => [...prev, ...newPreviewsToAdd]);
        e.target.value = null;
    };

    const movePagePreview = useCallback((dragIndex, hoverIndex) => {
        setPageFiles(prevFiles => update(prevFiles, { $splice: [[dragIndex, 1], [hoverIndex, 0, prevFiles[dragIndex]]] }));
        setPagePreviews(prevPreviews => update(prevPreviews, { $splice: [[dragIndex, 1], [hoverIndex, 0, prevPreviews[dragIndex]]] }));
    }, []);

    const removePagePreview = (indexToRemove) => {
        const previewUrlToRemove = pagePreviews[indexToRemove].imageUrl;
        if (previewUrlToRemove.startsWith('blob:')) {
            URL.revokeObjectURL(previewUrlToRemove);
        }
        setPagePreviews(prev => prev.filter((_, index) => index !== indexToRemove));
        setPageFiles(prev => prev.filter((_, index) => index !== indexToRemove));
    };

    const localHandleSubmit = (e) => {
        e.preventDefault();
        if (!formData.chapterNumber.trim() || formData.order === '') {
            toast.warn("Số chương và Thứ tự hiển thị là bắt buộc."); return;
        }
        if (!chapterData && pageFiles.length === 0) {
            toast.warn("Vui lòng upload ít nhất một trang ảnh cho chương mới."); return;
        }

        const dataToSubmit = new FormData();
        dataToSubmit.append('comicId', comicId);
        dataToSubmit.append('title', formData.title.trim());
        dataToSubmit.append('chapterNumber', formData.chapterNumber.trim());
        dataToSubmit.append('order', formData.order);

        if (!chapterData) {
            pageFiles.forEach((file) => {
                dataToSubmit.append('pages', file);
            });
        }
        onSubmit(dataToSubmit, chapterData?.id);
    };

    return (
        <Modal show={show} onHide={onHide} size="lg" centered backdrop="static" scrollable className='chapter-form-modal'>
            <Modal.Header closeButton={!isSubmitting}>
                <Modal.Title>{chapterData ? `Sửa Chương: ${chapterData.chapterNumber}` : 'Thêm Chương Mới'}</Modal.Title>
            </Modal.Header>
            <Form onSubmit={localHandleSubmit}>
                <Modal.Body>
                    <Form.Group className="mb-3" controlId="formChapterModalNumber">
                        <Form.Label>Số chương <span className="text-danger">*</span></Form.Label>
                        <Form.Control type="text" name="chapterNumber" placeholder="Ví dụ: 1 hoặc 1.5 hoặc Extra" value={formData.chapterNumber} onChange={handleChange} required disabled={isSubmitting} />
                    </Form.Group>
                    <Form.Group className="mb-3" controlId="formChapterModalTitle">
                        <Form.Label>Tên chương (tùy chọn)</Form.Label>
                        <Form.Control type="text" name="title" value={formData.title} onChange={handleChange} disabled={isSubmitting} />
                    </Form.Group>
                    <Form.Group className="mb-3" controlId="formChapterModalOrder">
                        <Form.Label>Thứ tự hiển thị <span className="text-danger">*</span></Form.Label>
                        <Form.Control type="number" step="0.1" name="order" value={formData.order} onChange={handleChange} required disabled={isSubmitting} />
                        <Form.Text muted>Dùng số thập phân để chèn chương (ví dụ: 1.5 sẽ nằm giữa 1 và 2).</Form.Text>
                    </Form.Group>

                    {!chapterData && (
                        <Form.Group controlId="formChapterModalPages" className="mb-3">
                            <Form.Label>Trang ảnh (kéo thả để sắp xếp) <span className="text-danger">*</span></Form.Label>
                            <Form.Control type="file" multiple accept="image/*" onChange={handlePageFilesChange} disabled={isSubmitting} size="sm" />
                            <div className="mt-3 p-2 border rounded preview-list-container-dnd">
                                {pagePreviews.map((page, index) => (
                                    <DraggablePagePreviewItem
                                        key={page.id}
                                        id={page.id}
                                        imageUrl={page.imageUrl}
                                        fileName={page.fileName}
                                        index={index}
                                        movePage={movePagePreview}
                                        onRemove={removePagePreview}
                                        isSubmitting={isSubmitting}
                                    />
                                ))}
                                {pagePreviews.length === 0 && <p className="text-muted text-center small py-3">Chưa có ảnh nào được chọn.</p>}
                            </div>
                            {pageFiles.length > 0 && <Form.Text muted>Trang đầu tiên sẽ được đánh số 1.</Form.Text>}
                        </Form.Group>
                    )}
                    {chapterData && chapterData.pages && (
                        <div className="mb-3">
                            <Form.Label>Các trang hiện tại ({chapterData.pages.length} trang)</Form.Label>
                            <div className="current-pages-list-display p-2 border rounded">
                                {chapterData.pages.length > 0 ? chapterData.pages.map(page => (
                                    <div key={page.id} className="current-page-item-rb">
                                        <Image src={page.imageUrl.startsWith('http') ? page.imageUrl : `/${page.imageUrl}`} alt={`Trang ${page.pageNumber}`} className="current-page-img-thumb-rb" />
                                        <span>Trang {page.pageNumber}</span>
                                    </div>
                                )) : <p className="text-muted small mb-0">Chưa có trang nào.</p>}
                            </div>
                            <Button as={Link} to={`/admin/comics/chapters/${chapterData.id}/pages`} variant="outline-secondary" size="sm" className="mt-2">
                                <i className="fas fa-images me-1"></i> Quản lý trang chi tiết
                            </Button>
                        </div>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={onHide} disabled={isSubmitting}>Hủy</Button>
                    <Button variant="primary" type="submit" disabled={isSubmitting}>
                        {isSubmitting ? <Spinner as="span" animation="border" size="sm" /> : (chapterData ? 'Cập nhật' : 'Thêm Chương')}
                    </Button>
                </Modal.Footer>
            </Form>
        </Modal>
    );
};

const ChapterManagementPage = () => {
    const { comicId } = useParams();
    const navigate = useNavigate();
    const [comic, setComic] = useState(null);
    const [chapters, setChapters] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [editingChapter, setEditingChapter] = useState(null);
    const [isSubmittingForm, setIsSubmittingForm] = useState(false);

    const fetchComicAndChapters = useCallback(async () => {
        setIsLoading(true); setError(null);
        try {
            const comicRes = await axios.get(`/api/admin/comics/${comicId}`, { headers: authHeader() });
            if (comicRes.data?.success) {
                setComic(comicRes.data.comic);
            } else {
                throw new Error(comicRes.data?.message || "Không tìm thấy thông tin truyện.");
            }

            const chaptersRes = await axios.get(`/api/comics/${comicId}/chapters`, {
                headers: authHeader(),
                params: { limit: 1000, page: 1 }
            });
            if (chaptersRes.data?.success) {
                const sortedChapters = (chaptersRes.data.chapters || []).sort((a, b) => a.order - b.order);
                setChapters(sortedChapters);
            } else {
                throw new Error(chaptersRes.data?.message || "Không thể tải danh sách chương.");
            }
        } catch (err) {
            console.error("Lỗi tải dữ liệu chương:", err);
            setError(err.response?.data?.message || err.message || "Lỗi không xác định.");
            if (err.response?.status === 404 && !comic) navigate("/admin/comics");
        } finally {
            setIsLoading(false);
        }
    }, [comicId, navigate]);

    useEffect(() => {
        fetchComicAndChapters();
    }, [fetchComicAndChapters]);

    const handleShowAddModal = () => { setEditingChapter(null); setShowModal(true); };
    const handleShowEditModal = async (chapter) => {
        setEditingChapter(chapter);
        setShowModal(true);
    };
    const handleCloseModal = () => { setShowModal(false); setEditingChapter(null); };

    const handleSubmitChapterForm = async (formData, chapterIdToUpdate) => {
        setIsSubmittingForm(true);
        try {
            const url = chapterIdToUpdate ? `/api/admin/chapters/${chapterIdToUpdate}/info` : '/api/admin/chapters';
            const method = chapterIdToUpdate ? 'put' : 'post';
            const response = await axios[method](url, formData, {
                headers: { ...authHeader() }
            });

            if (response.data?.success) {
                toast.success(chapterIdToUpdate ? "Cập nhật chương thành công!" : "Thêm chương mới thành công!");
                handleCloseModal();
                fetchComicAndChapters();
            } else {
                throw new Error(response.data?.message || "Thao tác thất bại.");
            }
        } catch (error) {
            console.error("Lỗi submit form chương:", error);
            const apiErrorMessage = error.response?.data?.message;
            const validationErrors = error.response?.data?.errors;
            let displayMessage = "Có lỗi xảy ra.";
            if (apiErrorMessage) displayMessage = apiErrorMessage;
            if (validationErrors && Array.isArray(validationErrors)) {
                displayMessage = validationErrors.map(err => err.msg).join(' ');
            }
            toast.error(displayMessage);
        } finally {
            setIsSubmittingForm(false);
        }
    };

    const handleDeleteChapter = async (chapterId) => {
        if (!window.confirm(`Xóa chương ID ${chapterId} và tất cả trang ảnh của nó?`)) return;
        try {
            await axios.delete(`/api/admin/chapters/${chapterId}`, { headers: authHeader() });
            toast.success("Đã xóa chương.");
            fetchComicAndChapters();
        } catch (error) {
            toast.error(error.response?.data?.message || "Lỗi xóa chương.");
        }
    };

    if (isLoading && !comic) return <div className="container pt-5 text-center"><Spinner animation="border" variant="primary" /></div>;
    if (error && !comic) return <div className="container mt-3"><Alert variant="danger">{error} <Link to="/admin/comics">Quay lại</Link></Alert></div>;
    if (!comic) return <div className="container mt-3"><Alert variant="info">Không tìm thấy thông tin truyện. <Link to="/admin/comics">Quay lại</Link></Alert></div>;

    return (
        <DndProvider backend={HTML5Backend}>
            <div className="flex-grow-1 container-fluid admin-content-list-page admin-chapter-management">
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4 row-gap-4 page-header">
                    <div className="d-flex align-items-center">
                        <h4 className="page-title mb-0">
                            Quản lý Chương: <span className="fw-normal text-primary">{comic.title}</span>
                        </h4>
                    </div>
                    <div className="d-flex align-content-center flex-wrap gap-4">
                        <button className="btn btn-label-secondary" onClick={() => navigate('/admin/comics')} title="Quay lại danh sách truyện">
                            <i className="fas fa-arrow-left me-2"></i> Quay Lại
                        </button>
                        <button className="btn btn-primary" onClick={handleShowAddModal}>
                            <i className="fas fa-plus me-1 me-2"></i> Thêm Chương Mới
                        </button>
                    </div>
                </div>

                {isLoading && chapters.length === 0 && <div className="text-center py-4"><Spinner animation="border" /></div>}
                {error && <Alert variant="danger" className="mt-3">{error}</Alert>}

                {!isLoading && chapters.length === 0 && !error && (
                    <Alert variant="info" className="mt-3">Truyện này chưa có chương nào. Hãy thêm chương mới!</Alert>
                )}
                <BatchUploadChapters comicId={comic.id} comicSlug={comic.slug} />

                {chapters.length > 0 && (
                    <div className="table-responsive-wrapper mt-3">
                        <Table striped bordered hover responsive="lg" size="sm" className="align-middle shadow-sm admin-table-custom chapters-table">
                            <thead>
                                <tr>
                                    <th style={{ width: '5%' }}>#</th>
                                    <th style={{ width: '15%' }}>Số chương</th>
                                    <th>Tên chương</th>
                                    <th className="text-center" style={{ width: '10%' }}>Thứ tự</th>
                                    <th className="text-center" style={{ width: '10%' }}>Số trang</th>
                                    <th className="text-center" style={{ width: '10%' }}>Lượt xem</th>
                                    <th style={{ width: '15%' }}>Ngày tạo</th>
                                    <th className="text-center" style={{ width: '12%' }}>Hành động</th>
                                </tr>
                            </thead>
                            <tbody>
                                {chapters.map((chapter, index) => (
                                    <tr key={chapter.id}>
                                        <td>{index + 1}</td>
                                        <td>{chapter.chapterNumber}</td>
                                        <td className="chapter-title-cell" title={chapter.title}>{chapter.title || <span className="text-muted fst-italic">Chưa có tên</span>}</td>
                                        <td className="text-center">{chapter.order}</td>
                                        <td className="text-center">{chapter.pages?.length || 0}</td>
                                        <td className="text-center">{chapter.views || 0}</td>
                                        <td>{new Date(chapter.createdAt).toLocaleDateString('vi-VN')}</td>
                                        <td className="text-center">
                                            <Button variant="outline-info" size="sm" as={Link} to={`/admin/comics/chapters/${chapter.id}/pages`} className="me-1 py-1 px-2" title="Quản lý trang ảnh">
                                                <i className="fas fa-images"></i>
                                            </Button>
                                            <Button variant="outline-primary" size="sm" onClick={() => handleShowEditModal(chapter)} className="me-1 py-1 px-2" title="Sửa thông tin chương">
                                                <i className="fas fa-edit"></i>
                                            </Button>
                                            <Button variant="outline-danger" size="sm" onClick={() => handleDeleteChapter(chapter.id)} className="py-1 px-2" title="Xóa chương">
                                                <i className="fas fa-trash"></i>
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    </div>
                )}
                <ChapterFormModal
                    show={showModal}
                    onHide={handleCloseModal}
                    comicId={comic.id}
                    comicSlug={comic.slug}
                    chapterData={editingChapter}
                    onSubmit={handleSubmitChapterForm}
                    isSubmitting={isSubmittingForm}
                />
            </div>
        </DndProvider>
    );
};

export default ChapterManagementPage;