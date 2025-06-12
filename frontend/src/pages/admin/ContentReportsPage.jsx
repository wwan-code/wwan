// pages/admin/ContentReportsPage.jsx
import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Table, Pagination, Spinner, Alert, Form, Button, Badge, Modal } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import authHeader from '@services/auth-header';
import { toast } from 'react-toastify';
import useTableData from '@hooks/useTableData';

const ContentReportsPage = () => {
    const [reports, setReports] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const [showUpdateModal, setShowUpdateModal] = useState(false);
    const [currentReport, setCurrentReport] = useState(null);
    const [newStatus, setNewStatus] = useState('');
    const [adminNotes, setAdminNotes] = useState('');
    const [isSubmittingUpdate, setIsSubmittingUpdate] = useState(false);

    const {
        data: displayedReports,
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
    } = useTableData(reports, 20);

    const [filterStatus, setFilterStatus] = useState('');


    const fetchReports = useCallback(async (page = 1, limit = 20, status = '', sortBy = 'createdAt', sortOrder = 'DESC') => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await axios.get('/api/admin/content-reports', {
                headers: authHeader(),
                params: { page, limit, status, sortBy, sortOrder }
            });
            if (response.data?.success) {
                setReports(response.data.reports || []);
            } else {
                throw new Error(response.data?.message || "Không thể tải danh sách báo cáo.");
            }
        } catch (err) {
            console.error("Lỗi tải báo cáo:", err);
            setError(err.response?.data?.message || err.message || "Lỗi không xác định.");
            setReports([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchReports(currentPage, itemsPerPage, filterStatus, sortConfig.key, sortConfig.direction);
    }, [currentPage, itemsPerPage, filterStatus, sortConfig, fetchReports]);


    const handleShowUpdateModal = (report) => {
        setCurrentReport(report);
        setNewStatus(report.status);
        setAdminNotes(report.adminNotes || '');
        setShowUpdateModal(true);
    };

    const handleUpdateReport = async (e) => {
        e.preventDefault();
        if (!currentReport || !newStatus) return;
        setIsSubmittingUpdate(true);
        try {
            await axios.put(`/api/admin/content-reports/${currentReport.id}/status`,
                { status: newStatus, adminNotes },
                { headers: authHeader() }
            );
            toast.success("Cập nhật báo cáo thành công!");
            setShowUpdateModal(false);
            fetchReports(currentPage, itemsPerPage, filterStatus, sortConfig.key, sortConfig.direction);
        } catch (error) {
            toast.error(error.response?.data?.message || "Lỗi cập nhật báo cáo.");
        } finally {
            setIsSubmittingUpdate(false);
        }
    };

    const handleDeleteReport = async (reportId) => {
        if (!window.confirm("Bạn chắc chắn muốn xóa báo cáo này?")) return;
        try {
            await axios.delete(`/api/admin/content-reports/${reportId}`, { headers: authHeader() });
            toast.success("Đã xóa báo cáo.");
            fetchReports(currentPage, itemsPerPage, filterStatus, sortConfig.key, sortConfig.direction);
        } catch (error) {
            toast.error(error.response?.data?.message || "Lỗi khi xóa báo cáo.");
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'pending': return <Badge bg="warning" text="dark">Chờ xử lý</Badge>;
            case 'acknowledged': return <Badge bg="info">Đã ghi nhận</Badge>;
            case 'resolved': return <Badge bg="success">Đã giải quyết</Badge>;
            case 'ignored': return <Badge bg="secondary">Bỏ qua</Badge>;
            default: return <Badge bg="light" text="dark">{status}</Badge>;
        }
    };

    const reportTypeLabels = {
        'video_error': 'Lỗi Video',
        'audio_error': 'Lỗi Âm thanh',
        'subtitle_error': 'Lỗi Phụ đề',
        'content_issue': 'Vấn đề Nội dung',
        'other': 'Khác'
    };


    return (
        <div className="flex-grow-1 container-p-y container-fluid">
            <h4 className="py-3 mb-4">
                <i className="fas fa-bullhorn icon-before"></i> Báo cáo Nội dung
            </h4>
             <Form className="mb-3 d-flex justify-content-end">
                <Form.Group controlId="filterStatus" className="me-2" style={{maxWidth: '200px'}}>
                    <Form.Select size="sm" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                        <option value="">Tất cả trạng thái</option>
                        <option value="pending">Chờ xử lý</option>
                        <option value="acknowledged">Đã ghi nhận</option>
                        <option value="resolved">Đã giải quyết</option>
                        <option value="ignored">Bỏ qua</option>
                    </Form.Select>
                </Form.Group>
            </Form>


            {isLoading && <div className="text-center py-5"><Spinner animation="border" /></div>}
            {error && !isLoading && <Alert variant="danger">{error}</Alert>}

            {!isLoading && !error && (
                <>
                    <Table striped bordered hover responsive="lg" size="sm">
                        <thead>
                            <tr>
                                <th onClick={() => requestSort('id')} style={{cursor: 'pointer'}}>ID</th>
                                <th onClick={() => requestSort('reporter.name')} style={{cursor: 'pointer'}}>Người báo cáo</th>
                                <th>Phim/Tập</th>
                                <th onClick={() => requestSort('reportType')} style={{cursor: 'pointer'}}>Loại lỗi</th>
                                <th>Mô tả</th>
                                <th onClick={() => requestSort('timestamp')} style={{cursor: 'pointer'}}>Thời điểm (s)</th>
                                <th onClick={() => requestSort('status')} style={{cursor: 'pointer'}}>Trạng thái</th>
                                <th onClick={() => requestSort('createdAt')} style={{cursor: 'pointer'}}>Ngày báo cáo</th>
                                <th>Hành động</th>
                            </tr>
                        </thead>
                        <tbody>
                            {displayedReports.map(report => (
                                <tr key={report.id}>
                                    <td>{report.id}</td>
                                    <td>{report.reporter?.name || 'N/A'}</td>
                                    <td>
                                        <Link to={`/album/${report.reportedMovie?.slug}`} target="_blank">
                                            {report.reportedMovie?.title}
                                        </Link>
                                        {report.reportedEpisode && ` - Tập ${report.reportedEpisode.episodeNumber}`}
                                    </td>
                                    <td>{reportTypeLabels[report.reportType] || report.reportType}</td>
                                    <td title={report.description} style={{maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>
                                        {report.description}
                                    </td>
                                    <td>{report.timestamp !== null ? report.timestamp : '-'}</td>
                                    <td>{getStatusBadge(report.status)}</td>
                                    <td>{new Date(report.createdAt).toLocaleString('vi-VN')}</td>
                                    <td>
                                        <Button variant="outline-primary" size="sm" onClick={() => handleShowUpdateModal(report)} className="me-1 py-0 px-1">
                                            <i className="fas fa-edit"></i>
                                        </Button>
                                        <Button variant="outline-danger" size="sm" onClick={() => handleDeleteReport(report.id)} className="py-0 px-1">
                                            <i className="fas fa-trash"></i>
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                    {totalPages > 1 && (
                        <Pagination className="justify-content-center">
                            {/* ... (Pagination items như LeaderboardPage) ... */}
                             <Pagination.First onClick={() => goToPage(1)} disabled={currentPage === 1} />
                            <Pagination.Prev onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1} />
                            {[...Array(totalPages).keys()].map(num => (
                                <Pagination.Item key={num + 1} active={num + 1 === currentPage} onClick={() => goToPage(num + 1)}>
                                    {num + 1}
                                </Pagination.Item>
                            ))}
                            <Pagination.Next onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages} />
                            <Pagination.Last onClick={() => goToPage(totalPages)} disabled={currentPage === totalPages} />
                        </Pagination>
                    )}
                     {displayedReports.length === 0 && <Alert variant="info">Không có báo cáo nào phù hợp.</Alert>}
                </>
            )}

             {/* Modal Cập nhật Trạng thái */}
            <Modal show={showUpdateModal} onHide={() => setShowUpdateModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Cập nhật Báo cáo #{currentReport?.id}</Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleUpdateReport}>
                    <Modal.Body>
                        <p><strong>Phim:</strong> {currentReport?.reportedMovie?.title}</p>
                        {currentReport?.reportedEpisode && <p><strong>Tập:</strong> {currentReport.reportedEpisode.episodeNumber}</p>}
                        <p><strong>Mô tả lỗi:</strong> {currentReport?.description}</p>
                        <hr/>
                        <Form.Group className="mb-3" controlId="updateStatusSelect">
                            <Form.Label>Trạng thái mới</Form.Label>
                            <Form.Select value={newStatus} onChange={e => setNewStatus(e.target.value)}>
                                <option value="pending">Chờ xử lý</option>
                                <option value="acknowledged">Đã ghi nhận</option>
                                <option value="resolved">Đã giải quyết</option>
                                <option value="ignored">Bỏ qua</option>
                            </Form.Select>
                        </Form.Group>
                        <Form.Group controlId="adminNotesTextarea">
                            <Form.Label>Ghi chú của Admin (tùy chọn)</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={3}
                                value={adminNotes}
                                onChange={e => setAdminNotes(e.target.value)}
                            />
                        </Form.Group>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowUpdateModal(false)} disabled={isSubmittingUpdate}>Hủy</Button>
                        <Button variant="primary" type="submit" disabled={isSubmittingUpdate}>
                            {isSubmittingUpdate ? <Spinner as="span" size="sm" /> : "Cập nhật"}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>

        </div>
    );
};

export default ContentReportsPage;