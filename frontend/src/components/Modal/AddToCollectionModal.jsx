// src/components/Modal/AddToCollectionModal.jsx
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import authHeader from '@services/auth-header';
import { handleApiError } from "@utils/handleApiError";
import classNames from '@utils/classNames';
import CustomModal from '../CustomModal';

import '@assets/scss/components/_add-to-collection-modal.scss';

const AddToCollectionModal = ({ show, onHide, itemType, itemId, itemTitle }) => {
    const [collections, setCollections] = useState([]);
    const [selectedCollectionId, setSelectedCollectionId] = useState('');
    const [loadingCollections, setLoadingCollections] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);

    const [showCreateNewCollectionForm, setShowCreateNewCollectionForm] = useState(false);
    const [newCollectionName, setNewCollectionName] = useState('');
    const [newCollectionIsPublic, setNewCollectionIsPublic] = useState(false);


    const fetchUserCollectionsByType = useCallback(async () => {
        if (!show || !itemType) {
            setCollections([]);
            return;
        }
        setLoadingCollections(true);
        setError(null);
        try {
            const response = await axios.get(`/api/watchlists?type=${itemType}&includeItems=true`, { headers: authHeader() });
            if (response.data.success) {
                const fetchedCollections = response.data.watchlists || [];
                setCollections(fetchedCollections);
                if (fetchedCollections.length > 0) {
                    setSelectedCollectionId(fetchedCollections[0].id);
                } else {
                    setSelectedCollectionId('');
                    setShowCreateNewCollectionForm(true);
                }
            } else {
                throw new Error(response.data.message || "Lỗi tải danh sách bộ sưu tập.");
            }
        } catch (err) {
            setError("Lỗi tải danh sách bộ sưu tập của bạn. Vui lòng thử lại.");
            console.error("Fetch collections error:", err);
        } finally {
            setLoadingCollections(false);
        }
    }, [show, itemType]);

    useEffect(() => {
        if (!show) {
            setCollections([]);
            setSelectedCollectionId('');
            setShowCreateNewCollectionForm(false);
            setNewCollectionName('');
            setNewCollectionIsPublic(false);
            setError(null);
        } else {
            fetchUserCollectionsByType();
        }
    }, [show, fetchUserCollectionsByType]);


    const handleCreateAndAdd = async () => {
        if (!newCollectionName.trim()) {
            toast.warn("Vui lòng nhập tên cho bộ sưu tập mới.");
            return;
        }
        setSubmitting(true);
        setError(null);
        try {
            // Bước 1: Tạo collection mới
            const createResponse = await axios.post('/api/watchlists', {
                name: newCollectionName.trim(),
                description: `Bộ sưu tập chứa "${itemTitle}" và các ${itemType === 'movie' ? 'phim' : 'truyện'} tương tự.`,
                type: itemType,
                isPublic: newCollectionIsPublic,
            }, { headers: authHeader() });

            if (createResponse.data.success && createResponse.data.watchlist) {
                const newColId = createResponse.data.watchlist.id;
                // Bước 2: Thêm item vào collection vừa tạo
                const addItemApiUrl = itemType === 'movie'
                    ? `/api/watchlists/${newColId}/movies`
                    : `/api/watchlists/${newColId}/comics`;
                await axios.post(addItemApiUrl,
                    itemType === 'movie' ? { movieId: itemId } : { comicId: itemId },
                    { headers: authHeader() }
                );
                toast.success(`Đã tạo bộ sưu tập "${newCollectionName.trim()}" và thêm "${itemTitle}"!`);
                onHide();
            } else {
                throw new Error(createResponse.data.message || "Lỗi tạo bộ sưu tập mới.");
            }
        } catch (err) {
            handleApiError(err, "Lỗi khi tạo và thêm vào bộ sưu tập");
        } finally {
            setSubmitting(false);
        }
    };

    const handleAddToExisting = async () => {
        if (!selectedCollectionId) {
            toast.warn("Vui lòng chọn một bộ sưu tập.");
            return;
        }
        setSubmitting(true);
        setError(null);
        try {
            const apiUrl = itemType === 'movie'
                ? `/api/watchlists/${selectedCollectionId}/movies`
                : `/api/watchlists/${selectedCollectionId}/comics`;

            await axios.post(apiUrl,
                itemType === 'movie' ? { movieId: itemId } : { comicId: itemId },
                { headers: authHeader() }
            );
            const selectedCol = collections.find(c => c.id === parseInt(selectedCollectionId));
            toast.success(`Đã thêm "${itemTitle}" vào bộ sưu tập "${selectedCol?.name || ''}"!`);
            onHide();
        } catch (err) {
            if (err.response?.status === 409) {
                toast.warn(err.response?.data?.message || "Mục này đã có trong bộ sưu tập.");
            } else {
                handleApiError(err, "Lỗi thêm vào bộ sưu tập");
            }
        } finally {
            setSubmitting(false);
        }
    };

    const modalFooter = (
        <>
            <button type="button" className="btn btn-secondary" onClick={onHide} disabled={submitting}>Hủy</button>
            {showCreateNewCollectionForm || collections.length === 0 ? (
                <button type="button" className="btn btn-primary" onClick={handleCreateAndAdd} disabled={submitting || loadingCollections || !newCollectionName.trim()}>
                    {submitting ? <span className="spinner--small"></span> : "Tạo và Thêm"}
                </button>
            ) : (
                <button type="button" className="btn btn-primary" onClick={handleAddToExisting} disabled={submitting || loadingCollections || !selectedCollectionId}>
                    {submitting ? <span className="spinner--small"></span> : "Thêm vào bộ sưu tập"}
                </button>
            )}
        </>
    );
    return (
        <CustomModal
            show={show}
            onHide={onHide}
            title={`Thêm "${itemTitle}" vào Bộ sưu tập`}
            footer={modalFooter}
            size="md"
            submitting={submitting}
            modalId="add-to-collection-modal"
            classNameModal="add-to-collection-modal"
        >
            {loadingCollections && <div className="loading-placeholder--small"><span className="spinner--small"></span> Đang tải danh sách...</div>}
            {error && <div className="alert-message alert-danger">{error}</div>}

            {!loadingCollections && !error && (
                <>
                    {collections.length > 0 && !showCreateNewCollectionForm && (
                        <div className="form-group">
                            <label htmlFor="selectCollection" className="form-label">Chọn bộ sưu tập hiện có:</label>
                            <select
                                id="selectCollection"
                                className="form-select"
                                value={selectedCollectionId}
                                onChange={(e) => setSelectedCollectionId(e.target.value)}
                                disabled={submitting}
                            >
                                {collections.map(col => (
                                    <option key={col.id} value={col.id}>
                                        {col.name} ({col.isPublic ? 'Công khai' : 'Riêng tư'}) - {col.movies?.length || col.comics?.length || 0} mục
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {(!showCreateNewCollectionForm && collections.length > 0) && (
                        <button type="button" className="btn-link-action mt-2" onClick={() => setShowCreateNewCollectionForm(true)}>
                            Hoặc tạo bộ sưu tập mới...
                        </button>
                    )}

                    {(showCreateNewCollectionForm || collections.length === 0) && (
                        <div className="create-new-collection-form mt-3">
                            <h6>Tạo bộ sưu tập mới cho "{itemTitle}"</h6>
                            <div className="form-group">
                                <label htmlFor="newCollectionName" className="form-label">Tên bộ sưu tập mới:</label>
                                <input
                                    type="text" id="newCollectionName" className="form-control"
                                    value={newCollectionName}
                                    onChange={(e) => setNewCollectionName(e.target.value)}
                                    placeholder={`Ví dụ: ${itemType === 'movie' ? 'Phim' : 'Truyện'} ${itemTitle.substring(0, 15)}... yêu thích`}
                                    disabled={submitting}
                                />
                            </div>
                            <div className="form-check form-switch mt-2">
                                <input className="form-check-input" type="checkbox" role="switch" id="newCollectionIsPublicModal"
                                    checked={newCollectionIsPublic}
                                    onChange={(e) => setNewCollectionIsPublic(e.target.checked)}
                                    disabled={submitting} />
                                <label className="form-check-label" htmlFor="newCollectionIsPublicModal">
                                    Công khai bộ sưu tập này?
                                </label>
                            </div>
                            {collections.length > 0 && (
                                <button type="button" className="btn-link-action mt-2" onClick={() => setShowCreateNewCollectionForm(false)}>
                                    Quay lại chọn từ danh sách
                                </button>
                            )}
                        </div>
                    )}
                </>
            )}
        </CustomModal>
    );
};

export default AddToCollectionModal;