import React, { useState } from 'react';
import axios from 'axios';
import authHeader from '../../../services/auth-header';

const SectionForm = ({ seriesId, movie, onSectionChange }) => {
    const [title, setTitle] = useState('');
    const [order, setOrder] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        const sectionData = { title, order, seriesId, movieId:  movie ? movie.id : '' };
        try {
            await axios.post('/api/sections', sectionData, {
                headers: authHeader()
            });
            onSectionChange()
        } catch (err) {
            setError('Failed to submit section');
        } finally {
            setLoading(false);
        }

        setTitle('');
        setOrder(1);
    };

    return (
        <div className="card my-2">
            <div className="card-body shadow-lg">
                <form onSubmit={handleSubmit}>
                    <div className="row g-2">
                        <div className="form-group col-6">
                            <label className="form-label">Title</label>
                            <input
                                className="form-control"
                                type="text"
                                placeholder="Title"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                required
                            />
                        </div>
                        <div className="form-group col-6">
                            <label className="form-label">Order</label>
                            <input
                                type="number"
                                className="form-control"
                                placeholder="Order"
                                value={order}
                                onChange={(e) => setOrder(parseInt(e.target.value))}
                                required
                            />
                        </div>
                    </div>
                    <button
                        className="btn btn-sm btn-primary"
                        type="submit"
                        disabled={loading}
                    >
                        {loading ? 'Processing...' : 'Add Section'}
                    </button>
                    {error && <p className="text-danger mt-2">{error}</p>}
                </form>
            </div>
        </div>
    );
};

export default SectionForm;
