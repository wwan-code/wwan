// components/Admin/Movie/MovieDetailsModal.js
import { useState, useEffect } from 'react';
import { Modal, Button } from "react-bootstrap";
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { formatViewCount } from '@utils/formatViewCount';
import { getQualityLabel } from '@utils/getQualityLabel';

const EpisodeAddForm = ({ movieId, maxEpisodes, currentCount, onSubmit, isSubmitting }) => {
    const [formData, setFormData] = useState({
        linkEpisode: '',
        views: 0,
        episodeNumber: '',
        duration: '00:00',
    });

    useEffect(() => {
        setFormData({ linkEpisode: '', views: 0, episodeNumber: '' });
    }, [movieId]);

    const handleChange = (e) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'number' ? parseInt(value, 10) || 0 : value
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.linkEpisode.trim() || !formData.episodeNumber) {
            toast.warn('Vui lòng điền link và chọn số tập.');
            return;
        }
        onSubmit(formData);
    };

    const episodeOptions = [];
    const maxEp = typeof maxEpisodes === 'number' && maxEpisodes > 0 ? maxEpisodes : 0;
    const isOngoing = maxEpisodes === Infinity || maxEpisodes === 0 || typeof maxEpisodes !== 'number';

    if (!isOngoing) {
        for (let i = 1; i <= maxEp; i++) {
            episodeOptions.push(<option key={i} value={i}>{i}</option>);
        }
    }


    return (
        <form onSubmit={handleSubmit} className='card p-3 shadow-sm mt-3'>
            <div className="justify-content-between align-items-center d-flex">
                <h6 className='mb-3'>Thêm tập mới (Hiện có: {currentCount}/{maxEpisodes === Infinity ? '???' : maxEpisodes})</h6>
                    <Button type="submit" variant="outline-success" size="sm" disabled={isSubmitting}>
                        {isSubmitting ? 'Đang thêm...' : 'Thêm tập'}
                    </Button>
            </div>
            
            <div className="row g-2">
                <div className="col-12 mb-2">
                    <label htmlFor={`linkEpisode-${movieId}`} className="form-label form-label-sm">Link phim</label>
                    <textarea
                        id={`linkEpisode-${movieId}`}
                        name="linkEpisode"
                        value={formData.linkEpisode}
                        onChange={handleChange}
                        className="form-control form-control-sm"
                        rows="2"
                        required
                        disabled={isSubmitting}
                    />
                </div>
                <div className="col-12 col-md-4 mb-2">
                    <label htmlFor={`episodeNumber-${movieId}`} className="form-label form-label-sm">Số tập</label>
                    {isOngoing ? (
                        <input
                            id={`episodeNumber-${movieId}`}
                            name="episodeNumber"
                            type="number"
                            value={formData.episodeNumber}
                            onChange={handleChange}
                            className="form-control form-control-sm"
                            placeholder="Nhập số tập"
                            required
                            disabled={isSubmitting}
                        />
                    ) : (
                        <select
                            id={`episodeNumber-${movieId}`}
                            name="episodeNumber"
                            value={formData.episodeNumber}
                            onChange={handleChange}
                            className="form-select form-select-sm"
                            required
                            disabled={isSubmitting || maxEp === 0}
                        >
                            <option value="" disabled>Chọn tập</option>
                            {episodeOptions}
                        </select>
                    )}

                </div>
                <div className="col-6 col-md-4 mb-2">
                    <label htmlFor={`views-${movieId}`} className="form-label form-label-sm">Lượt xem (Mặc định)</label>
                    <input
                        id={`views-${movieId}`}
                        name="views"
                        type="number"
                        value={formData.views}
                        onChange={handleChange}
                        className="form-control form-control-sm"
                        disabled={isSubmitting}
                    />
                </div>
                <div className="col-6 col-md-4 mb-2">
                    <label htmlFor={`duration-${movieId}`} className="form-label form-label-sm">Thời lượng</label>
                    <input
                        id={`duration-${movieId}`}
                        name="duration"
                        type="text"
                        value={formData.duration}
                        onChange={handleChange}
                        className="form-control form-control-sm"
                        placeholder="00:00"
                        required
                        disabled={isSubmitting}
                    />
                </div>
            </div>
        </form>
    );
};

const MovieDetailsModal = ({
    show,
    onHide,
    movie,
    episodes = [],
    loadingEpisodes,
    onAddEpisode,
    onDeleteMovie,
    isAddingEpisode,
    onToggleAddEpisodeForm,
    episodeCount,
    maxEpisodes,
    isSubmitting,
}) => {

    if (!movie) return null;

    return (
        <Modal show={show} onHide={onHide} size="lg" centered>
            <Modal.Header closeButton className="p-3">
                <Modal.Title>{movie.title}</Modal.Title>
            </Modal.Header>
            <Modal.Body className="p-3">
                {/* Phần thông tin phim */}
                <div className="row g-3 mb-3">
                    <div className="col-md-4 d-flex justify-content-center align-items-start">
                        {movie.posterURL ? (
                            <img className="img-fluid rounded shadow-sm" src={`${process.env.REACT_APP_API_URL_IMAGE}/${movie.posterURL}`} alt={movie.title} style={{ maxHeight: '250px', objectFit: 'cover' }} />
                        ) : (
                            <div className="border rounded d-flex justify-content-center align-items-center bg-secondary text-white" style={{ height: '250px', width: '100%' }}>Ảnh không có</div>
                        )}
                    </div>
                    <div className="col-md-8">
                        <table className='table table-sm table-borderless mb-2'>
                            <tbody>
                                <tr><th style={{ width: '100px' }}>Tập:</th><td>{episodeCount}/{maxEpisodes === Infinity ? '???' : maxEpisodes}</td></tr>
                                <tr><th>Thời lượng:</th><td>{movie.duration || 'N/A'}</td></tr>
                                <tr><th>Chất lượng:</th><td>{getQualityLabel(movie.quality)}</td></tr>
                                <tr><th>Phụ đề:</th><td>{movie.subtitles || 'N/A'}</td></tr>
                                <tr><th>Công chiếu:</th><td>{movie.releaseDate ? new Date(movie.releaseDate).toLocaleDateString('vi-VN') : 'N/A'}</td></tr>
                                <tr><th>Năm:</th><td>{movie.year || 'N/A'}</td></tr>
                                <tr><th>Quốc gia:</th><td>{movie.countries?.title || 'N/A'}</td></tr>
                                <tr><th>Danh mục:</th><td>{movie.categories?.title || 'N/A'}</td></tr>
                                <tr><th>Lượt xem:</th><td>{formatViewCount(movie.views)}</td></tr>
                                <tr><th>Thể loại:</th>
                                    <td>
                                        {movie.genres?.length > 0
                                            ? movie.genres.map(g => <span key={g.id} className="badge bg-primary me-1 mb-1">{g.title}</span>)
                                            : 'N/A'}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                        <p className="small text-muted">{movie.description || 'Không có mô tả.'}</p>
                    </div>
                </div>

                {/* Phần thêm tập phim */}
                {isAddingEpisode && (
                    <EpisodeAddForm
                        movieId={movie.id}
                        maxEpisodes={maxEpisodes}
                        currentCount={episodeCount}
                        onSubmit={onAddEpisode}
                        isSubmitting={isSubmitting}
                    />
                )}

                <div className='mt-3'>
                    <h6>Danh sách tập đã thêm ({episodes.length})</h6>
                    {loadingEpisodes ? (
                        <div className='text-center'><i className="fas fa-spinner fa-spin"></i> Đang tải tập...</div>
                    ) : episodes.length > 0 ? (
                        <ul className="list-group list-group-flush" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                            {episodes.map(ep => (
                                <li key={ep.id} className="list-group-item list-group-item-action d-flex justify-content-between align-items-center py-1 px-2">
                                    <span>Tập {ep.episodeNumber}</span>
                                    <small className="text-muted">{new Date(ep.createdAt).toLocaleDateString()}</small>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className='text-muted small'>Chưa có tập nào được thêm.</p>
                    )}
                </div>

            </Modal.Body>
            <Modal.Footer className="p-2 justify-content-between">
                <div>
                    <Button variant="outline-danger" size="sm" onClick={() => onDeleteMovie(movie.id)} disabled={isSubmitting}>
                        <i className="fas fa-trash-alt me-1"></i> Xóa Phim
                    </Button>
                    <Link className="btn btn-outline-secondary btn-sm ms-2" to={`/admin/movie/edit/${movie.id}`}>
                        <i className="fas fa-edit me-1"></i> Sửa Phim
                    </Link>
                </div>
                <div>
                    <Button variant="outline-primary" size="sm" onClick={onToggleAddEpisodeForm} disabled={isSubmitting}>
                        {isAddingEpisode ? 'Đóng Form' : <><i className="fas fa-plus me-1"></i> Thêm Tập</>}
                    </Button>
                    <Button variant="secondary" size="sm" onClick={onHide} className="ms-2">
                        Đóng
                    </Button>
                </div>
            </Modal.Footer>
        </Modal>
    );
};

export default MovieDetailsModal;