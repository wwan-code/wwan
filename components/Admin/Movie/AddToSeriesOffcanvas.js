// components/Admin/Movie/AddToSeriesOffcanvas.js
import React, { useState, useEffect } from 'react';
import { Offcanvas, Button } from "react-bootstrap";
import { toast } from 'react-toastify'; // Import toast

const AddToSeriesOffcanvas = ({ show, onHide, movie, seriesList = [], onAddToSeries, isSubmitting }) => {
    const [selectedSeries, setSelectedSeries] = useState('');

    // Reset selection khi mở offcanvas hoặc movie thay đổi
    useEffect(() => {
        if (show) {
            setSelectedSeries('');
        }
    }, [show]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!selectedSeries) {
            toast.warn('Vui lòng chọn một series.');
            return;
        }
        onAddToSeries(selectedSeries); // Gửi seriesId đã chọn lên cha
    };

    return (
        <Offcanvas show={show} onHide={onHide} placement="end">
            <Offcanvas.Header closeButton>
                <Offcanvas.Title>Thêm "{movie?.title}" vào Series</Offcanvas.Title>
            </Offcanvas.Header>
            <Offcanvas.Body>
                {seriesList.length > 0 ? (
                    <form onSubmit={handleSubmit}>
                        <div className='form-group mb-3'>
                            <label htmlFor={`seriesSelect-${movie?.id}`} className="form-label">Chọn Series có sẵn:</label>
                            <select
                                id={`seriesSelect-${movie?.id}`}
                                className='form-select'
                                value={selectedSeries}
                                onChange={(e) => setSelectedSeries(e.target.value)}
                                required
                            >
                                <option value="" disabled>-- Chọn Series --</option>
                                {seriesList.map((series) => (
                                    <option key={series.id} value={series.id}>
                                        {series.title}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <Button variant="primary" type="submit" disabled={isSubmitting || !selectedSeries}>
                            {isSubmitting ? 'Đang thêm...' : 'Thêm vào Series'}
                        </Button>
                    </form>
                ) : (
                     <p className="text-muted">Không có series nào. Vui lòng tạo series trước.</p>
                    // Có thể thêm nút để điều hướng đến trang tạo series
                )}
            </Offcanvas.Body>
        </Offcanvas>
    );
};

export default AddToSeriesOffcanvas;