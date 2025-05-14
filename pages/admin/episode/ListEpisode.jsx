import axios from "axios";
import React, { useCallback, useEffect, useState } from "react";
import { Bounce, toast } from "react-toastify";
import useTableData from "../../../hooks/useTableData";
import authHeader from "../../../services/auth-header";
import { Modal } from "react-bootstrap";

const ListEpisode = () => {
    const [episodes, setEpisodes] = useState([]);
    const [isDataLoading, setIsDataLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingDataId, setEditingDataId] = useState(null);
    const [editingLinks, setEditingLinks] = useState({});
    const [reviewEpisodeState, setReviewEpisodeState] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const {
        data: displayedData,
        totalPages,
        currentPage,
        searchTerm,
        handleSearch,
        requestSort,
        goToPage,
        sortConfig,
        itemsPerPage,
        handleItemsPerPageChange,
        totalEntries,
        filteredEntries,
        startEntry,
        endEntry,
    } = useTableData(episodes, 10);

    // --- Hàm xử lý lỗi API ---
    const handleApiError = (error, operation = "thực hiện") => {
        console.error(`Failed to ${operation} episode:`, error);
        let message = `Không thể ${operation} tập phim. Vui lòng thử lại.`;
        if (error.response?.data?.message) {
            message = error.response.data.message;
        } else if (error.message) {
            message = error.message;
        }
        toast.error(message, {
            position: "top-right",
            autoClose: 4000,
            theme: document.documentElement.getAttribute("data-ww-theme") || "light",
            transition: Bounce,
        });
    };

    // --- Fetch dữ liệu ban đầu ---
    const fetchData = useCallback(async () => {
        setIsDataLoading(true); // Bắt đầu loading
        try {
            const response = await axios.get("/api/episodes", { headers: authHeader() });
            // Kiểm tra cấu trúc response trước khi set state
            if (response.data && Array.isArray(response.data.episodes)) {
                setEpisodes(response.data.episodes);
            } else {
                // Nếu cấu trúc không đúng, set mảng rỗng hoặc xử lý khác
                console.warn("Unexpected response structure:", response.data);
                setEpisodes([]);
                toast.warn("Dữ liệu tập phim trả về không đúng định dạng.");
            }
        } catch (error) {
            handleApiError(error, "tải"); // Dùng hàm xử lý lỗi chung
            setEpisodes([]); // Đặt lại mảng rỗng khi có lỗi
        } finally {
            setIsDataLoading(false); // Kết thúc loading
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // --- Xử lý Inline Editing ---
    const handleEdit = useCallback((episode) => {
        if (!episode) return;
        setEditingDataId(episode.id);
        // Đặt giá trị link hiện tại vào state editingLinks để hiển thị trong textarea
        setEditingLinks(prev => ({ ...prev, [episode.id]: episode.linkEpisode }));
    }, []); // Không cần dependency vì chỉ dùng tham số

    const handleCancelEdit = useCallback((episodeId) => {
        setEditingDataId(null);
        // Xóa link đang sửa khỏi state editingLinks
        setEditingLinks(prev => {
            const newState = { ...prev };
            delete newState[episodeId];
            return newState;
        });
    }, []);

    const handleLinkChange = useCallback((episodeId, newLink) => {
        setEditingLinks(prev => ({ ...prev, [episodeId]: newLink }));
    }, []);

    const handleSaveLink = useCallback(async (itemId) => {
        const editedLink = editingLinks[itemId];
        // Kiểm tra xem link có thực sự được sửa không (hoặc có tồn tại không)
        const originalEpisode = episodes.find(ep => ep.id === itemId);

        // Nếu không tìm thấy episode gốc hoặc link không thay đổi, hủy edit mà không gọi API
        if (!originalEpisode || editedLink === originalEpisode.linkEpisode || typeof editedLink === 'undefined') {
            handleCancelEdit(itemId); // Gọi hàm cancel để reset UI
            return;
        }

        setIsSubmitting(true);
        try {
            // Gửi chỉ linkEpisode đã thay đổi
            const payload = { linkEpisode: editedLink };
            // Đảm bảo endpoint đúng: /api/episode/ hoặc /api/episodes/
            const response = await axios.put(`/api/episodes/${itemId}`, payload, { headers: authHeader() });
            const updatedEpisode = response.data; // Episode đã cập nhật từ server

            // Cập nhật state thủ công
            setEpisodes(prev => prev.map(item => (item.id === itemId ? updatedEpisode : item)));

            toast.success("Đã lưu link tập phim thành công.");
            handleCancelEdit(itemId); // Reset trạng thái edit sau khi lưu

        } catch (error) {
            handleApiError(error, "lưu link");
        } finally {
            setIsSubmitting(false);
        }
    }, [editingLinks, episodes, handleCancelEdit]); // Thêm dependency

    // --- Xử lý Xóa ---
    const handleDelete = useCallback(async (dataId) => {
        if (!dataId) return;
        const confirmDelete = window.confirm("Bạn có chắc chắn muốn xóa tập phim này?");
        if (!confirmDelete) return;

        setIsSubmitting(true); // Sử dụng isSubmitting
        try {
            // Đảm bảo endpoint đúng
            await axios.delete(`/api/episodes/${dataId}`, { headers: authHeader() });

            // --- Cập nhật state thủ công sau khi xóa ---
            setEpisodes(prev => prev.filter(ep => ep.id !== dataId));
            // -----------------------------------------

            toast.success(`Đã xóa tập phim thành công.`, { /* ... toast options */ });

            // Reset form nếu đang sửa tập phim vừa xóa (mặc dù sửa inline ít khả năng xảy ra)
            if (editingDataId === dataId) {
                handleCancelEdit(dataId);
            }

        } catch (error) {
            handleApiError(error, "xóa");
        } finally {
            setIsSubmitting(false); // Sử dụng isSubmitting
        }
    }, [editingDataId, handleCancelEdit]); // Thêm dependency

    // --- Xử lý Modal Review ---
    const toggleShowReviewEpisode = useCallback((episodeId) => {
        const episodeToShow = episodes.find(episode => episode.id === episodeId);
        if (episodeToShow) {
            setReviewEpisodeState(episodeToShow);
            setIsModalOpen(true);
        } else {
            toast.error("Không tìm thấy thông tin tập phim để xem lại.");
        }
    }, [episodes]); // Phụ thuộc vào episodes

    const closeModal = () => {
        setIsModalOpen(false);
        setReviewEpisodeState(null)
    };

    // --- Render Modal (Thêm cảnh báo bảo mật) ---
    const renderReviewModal = (episode) => {
        if (!episode) return null;

        // --- CẢNH BÁO BẢO MẬT ---
        // Chỉ sử dụng dangerouslySetInnerHTML nếu bạn HOÀN TOÀN chắc chắn
        // nội dung `episode.linkEpisode` là an toàn hoặc đã được làm sạch (sanitized).
        // Nếu không, hãy tìm cách render an toàn hơn (ví dụ: dùng DOMPurify).
        // Ví dụ làm sạch với DOMPurify (cần cài đặt: npm install dompurify):
        // const cleanHtml = DOMPurify.sanitize(episode.linkEpisode);
        // <div dangerouslySetInnerHTML={{ __html: cleanHtml }}></div>

        // Giả sử ở đây linkEpisode là an toàn hoặc bạn sẽ xử lý sau:
        const potentiallyUnsafeHtml = episode.linkEpisode;

        return (
            <Modal show={isModalOpen} onHide={closeModal} size="lg"> {/* Thêm size="lg" */}
                <Modal.Header closeButton className="p-3">
                    {/* Kiểm tra episode.movie tồn tại */}
                    <Modal.Title>{episode.movie?.title || 'Chi tiết tập phim'}</Modal.Title>
                </Modal.Header>
                <Modal.Body className="p-3">
                    <div className='row g-3'> {/* Thêm khoảng cách g-3 */}
                        <div className='col-md-4 d-flex justify-content-center align-items-start'>
                            {episode.movie?.image ? (
                                <img className="img-fluid rounded"
                                    src={'/' + episode.movie.image}
                                    alt={episode.movie.title}
                                    style={{ maxHeight: '250px', objectFit: 'cover' }} />
                            ) : (
                                <div className="border rounded d-flex justify-content-center align-items-center bg-light" style={{ height: '250px', width: '100%' }}>
                                    Ảnh không có sẵn
                                </div>
                            )}
                        </div>
                        <div className='col-md-8'>
                            <div className="ratio ratio-16x9"> {/* Responsive iframe */}
                                <div dangerouslySetInnerHTML={{ __html: potentiallyUnsafeHtml }}></div>
                            </div>
                        </div>
                    </div>
                </Modal.Body>
            </Modal>
        );
    };

    const getSortIcon = (key) => {
        if (sortConfig.key !== key) return null;
        return sortConfig.direction === 'asc' ? (
            <i className="fas fa-sort-up ms-1"></i>
        ) : (
            <i className="fas fa-sort-down ms-1"></i>
        );
    };

    const getHeaderStyle = (key) => ({
        cursor: 'pointer',
        color: sortConfig.key === key ? 'var(--bs-primary)' : 'var(--bs-heading-color)',
        transition: 'color 0.3s ease',
    });

    return (
        <>
            <div className="flex-grow-1 container-p-y container-fluid">
                <div className="row mb-3 justify-content-between">
                    <div className="d-md-flex justify-content-between align-items-center dt-layout-start col-md-auto me-auto">
                        <div className="dt-search">
                            <input type="text" placeholder="Tìm kiếm..." className="form-control form-control-sm" value={searchTerm} onChange={handleSearch} />
                        </div>
                    </div>
                    <div className="d-md-flex justify-content-between align-items-center dt-layout-end col-md-auto ms-auto">
                        <div className="dt-length d-flex align-items-center">
                            <span className="me-2 text-nowrap">Hiển thị:</span>
                            <select value={itemsPerPage} className="form-select form-select-sm" onChange={handleItemsPerPageChange}>
                                <option value={10}>10</option>
                                <option value={15}>15</option>
                                <option value={20}>20</option>
                                <option value={50}>50</option>
                            </select>
                        </div>
                    </div>
                </div>
                <div className="table-responsive dt-layout-full">
                    <table className="table dataTable">
                        <thead>
                            <tr>
                                {/* Headers - Đã thêm movie.title */}
                                <th onClick={() => requestSort('episodeNumber')} style={getHeaderStyle('episodeNumber')}>
                                    Tập {getSortIcon('episodeNumber')}
                                </th>
                                <th onClick={() => requestSort('linkEpisode')} style={getHeaderStyle('linkEpisode')}>
                                    Link Episode {getSortIcon('linkEpisode')}
                                    </th>
                                <th onClick={() => requestSort('movie.title')} style={
                                    getHeaderStyle('movie.title')
                                } className="text-nowrap text-sm-end">
                                    Tên phim {getSortIcon('movie.title')}
                                </th>
                                <th onClick={() => requestSort('createdAt')} style={
                                    getHeaderStyle('createdAt')
                                } className="text-nowrap text-sm-end">
                                    Ngày tạo {getSortIcon('createdAt')}
                                </th>
                                <th className="text-lg-center">Hành động</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isDataLoading ? (
                                <tr><td colSpan="5" className="text-center p-5"><i className="fas fa-spinner fa-spin fa-2x"></i></td></tr>
                            ) : displayedData.length === 0 ? (
                                <tr><td colSpan="5" className="text-center p-5">Không tìm thấy tập phim nào.</td></tr>
                            ) : (
                                displayedData.map((item) => (
                                    <tr key={item.id} className="hover-effect">
                                        <td className="text-nowrap">{item.episodeNumber}</td>
                                        <td>
                                            {editingDataId !== item.id ? (
                                                // Hiển thị link rút gọn hoặc toàn bộ tùy ý
                                                <span title={item.linkEpisode} style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '300px' }}>
                                                    {item.linkEpisode}
                                                </span>
                                            ) : (
                                                <textarea
                                                    className="form-control form-control-sm"
                                                    rows="2" // Số dòng có thể điều chỉnh
                                                    value={editingLinks[item.id] ?? ''} // Lấy từ state editingLinks, fallback về rỗng
                                                    onChange={(e) => handleLinkChange(item.id, e.target.value)}
                                                    disabled={isSubmitting}
                                                />
                                            )}
                                        </td>
                                        {/* Kiểm tra item.movie tồn tại */}
                                        <td className="text-nowrap text-sm-end">{item.movie?.title || 'N/A'}</td>
                                        {/* Format ngày tháng nếu cần */}
                                        <td className="text-nowrap text-sm-end">{new Date(item.createdAt).toLocaleDateString()}</td>
                                        <td>
                                            <div className="d-flex align-items-sm-center justify-content-sm-center gap-1">
                                                {editingDataId !== item.id ? (
                                                    <button className="btn btn-sm btn-icon btn-edit" onClick={() => handleEdit(item)} title="Sửa Link" disabled={isSubmitting}>
                                                        <i className="icon-base fa-regular fa-edit text-info"></i>
                                                    </button>
                                                ) : (
                                                    <>
                                                        <button className="btn btn-sm btn-icon btn-cancel text-secondary" onClick={() => handleCancelEdit(item.id)} title="Hủy" disabled={isSubmitting}>
                                                            <i className="fas fa-times"></i>
                                                        </button>
                                                        <button className="btn btn-sm btn-icon btn-save text-success" onClick={() => handleSaveLink(item.id)} title="Lưu" disabled={isSubmitting}>
                                                            <i className="fas fa-check"></i>
                                                        </button>
                                                    </>
                                                )}
                                                <button className="btn btn-sm btn-icon btn-review" onClick={() => toggleShowReviewEpisode(item.id)} title="Xem trước" disabled={isSubmitting}>
                                                    <i className="icon-base fa-regular fa-eye text-success"></i>
                                                </button>
                                                <button className="btn btn-sm btn-icon btn-delete" onClick={() => handleDelete(item.id)} title="Xóa" disabled={isSubmitting}>
                                                    <i className="icon-base fa-regular fa-trash text-danger"></i>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                {(totalPages > 0) && (
                    <div className="row mx-3 mb-3 justify-content-between">
                        <div className="d-md-flex justify-content-between align-items-center dt-layout-start col-md-auto me-auto">
                            <div className="dt-info">
                                {`Hiển thị ${startEntry} đến ${endEntry} của ${filteredEntries} mục`}
                                {filteredEntries !== totalEntries && ` (lọc từ ${totalEntries} tổng số)`}
                            </div>
                        </div>
                        <div className="d-md-flex justify-content-between align-items-center dt-layout-end col-md-auto ms-auto">
                            <div className="dt-paging">
                                <nav><ul className="pagination pagination-sm mb-0">
                                    <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}> <button className="page-link" onClick={() => goToPage(1)} disabled={currentPage === 1}> &laquo; </button> </li>
                                    <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}> <button className="page-link" onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1}> &lsaquo; </button> </li>
                                    {Array.from({ length: totalPages }, (_, i) => (<li key={i} className={`page-item ${currentPage === i + 1 ? 'active' : ''}`}> <button className="page-link" onClick={() => goToPage(i + 1)}> {i + 1} </button> </li>))}
                                    <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}> <button className="page-link" onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages}> &rsaquo; </button> </li>
                                    <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}> <button className="page-link" onClick={() => goToPage(totalPages)} disabled={currentPage === totalPages}> &raquo; </button> </li>
                                </ul></nav>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            {/* --- Modal --- */}
            {isModalOpen && reviewEpisodeState && renderReviewModal(reviewEpisodeState)}
        </>
    )
}

export default ListEpisode;