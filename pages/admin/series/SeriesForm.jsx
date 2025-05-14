import React, { useState, useEffect } from 'react';
import axios from 'axios';
import authHeader from '../../../services/auth-header';

const SeriesForm = ({ series, onSeriesChange, onEdit }) => {
    const [title, setTitle] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (series) {
            setTitle(series.title);
        }
    }, [series]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        const seriesData = { title };

        try {
            if (onEdit) {
                await axios.put(`/api/series/${series.id}`, seriesData, {
                    headers: authHeader()
                });
            } else {
                await axios.post('/api/series', seriesData, {
                    headers: authHeader()
                });
            }
            onSeriesChange();
            setTitle('');
        } catch (err) {
            setError('Failed to submit series: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="card">
            <div className="card-header">
                <h4 className="card-title mb-0">{onEdit ? 'Sửa Series' : 'Tạo Series'}</h4>
            </div>
            <div className="card-body">
                <form onSubmit={handleSubmit}>
                    <div className="d-flex">
                        <input
                            className="form-control me-2"
                            type="text"
                            placeholder="Title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                            disabled={loading}
                        />
                        <button
                            className="btn btn-sm btn-primary"
                            type="submit"
                            disabled={loading}
                        >
                            {loading ? 'Processing...' : onEdit ? 'Update' : 'Create'}
                        </button>
                    </div>
                    {error && <p className="text-danger mt-2">{error}</p>}
                </form>
            </div>
        </div>
    );
};

export default SeriesForm;
