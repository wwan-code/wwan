// components/Admin/Movie/MovieCard.js
import React from 'react';
import { Link } from 'react-router-dom';

// Helper functions (có thể chuyển ra file utils)
const getQualityLabel = (quality) => {
    const qualityLabels = ['Trailer', 'Cam', 'HDCam', 'HD', 'FullHD'];
    return qualityLabels[quality] || 'N/A';
};
const formatViewCount = (number) => {
    if (typeof number !== 'number') return '0'; // Xử lý nếu không phải số
    if (number >= 1e9) return (number / 1e9).toFixed(1).replace(/\.0$/, '') + 'B';
    if (number >= 1e6) return (number / 1e6).toFixed(1).replace(/\.0$/, '') + 'M';
    if (number >= 1e3) return (number / 1e3).toFixed(1).replace(/\.0$/, '') + 'K';
    return number.toString();
};


const MovieCard = ({ movie, onShowModal, onShowOffcanvas, dropdownProps }) => {
    const { openDropdownId, toggleDropdown, dropdownRefCallback } = dropdownProps;

    if (!movie) return null;
    const posterUrl = movie.poster ? `/${movie.poster}` : '/path/to/default/poster.jpg';
    const categoryTitle = movie.categories?.title || 'N/A';
    const countryTitle = movie.countries?.title || 'N/A';
    const currentEpisodeCount = movie.Episodes?.length || 0;
    const totalEpisodes = movie.totalEpisodes || '?';
    const isSeries = movie.belongToCategory === 1;
    const hasSeriesLink = !!movie.series;
    return (
        <div className="col-sm-6 col-md-4 col-lg-3 col-xxl-2">
            <div className="card h-100 shadow-sm movie-card">
                {/* Phần ảnh */}
                <div className="position-relative movie-card-img-container">
                    <Link to={`/album/${movie.slug}`} title={`Xem phim ${movie.title}`}>
                        <img className="card-img-top" src={posterUrl} alt={movie.title} loading="lazy" />
                    </Link>
                    {/* Overlay thông tin */}
                    <div className="movie-card-overlay">
                        <span className="badge bg-dark m-1">{getQualityLabel(movie.quality)}</span>
                        {isSeries && <span className="badge bg-info m-1">Tập {currentEpisodeCount}/{totalEpisodes}</span>}
                        <span className="badge bg-warning m-1">{movie.year}</span>
                    </div>
                    {/* Nút dropdown actions */}
                    <div className="dropdown movie-card-actions position-absolute top-0 end-0 m-1" ref={(el) => dropdownRefCallback(el, movie.id)}>
                        <button
                            className="btn btn-sm btn-icon btn-light rounded-circle opacity-75" // Style nút dropdown
                            type="button"
                            onClick={(e) => { e.stopPropagation(); toggleDropdown(movie.id, e); }}
                            aria-expanded={openDropdownId === movie.id}
                        >
                            <i className="fas fa-ellipsis-v"></i>
                        </button>
                        <ul className={`dropdown-menu dropdown-menu-end shadow-lg ${openDropdownId === movie.id ? "show" : ""}`}>
                            <li>
                                <button className="dropdown-item" onClick={() => onShowModal(movie)}>
                                    <i className="fas fa-info-circle me-2"></i>Chi tiết / Tập phim
                                </button>
                            </li>
                            <li>
                                <Link className="dropdown-item" to={`/admin/movie/edit/${movie.id}`}>
                                    <i className="fas fa-edit me-2"></i>Chỉnh sửa phim
                                </Link>
                            </li>
                            {!hasSeriesLink && ( // Chỉ hiện nếu chưa có series
                                <li>
                                    <button className="dropdown-item" onClick={() => onShowOffcanvas(movie)}>
                                        <i className="fas fa-plus-circle me-2"></i>Thêm vào Series
                                    </button>
                                </li>
                            )}
                            {/* Có thể thêm nút Xóa ở đây nếu muốn */}
                            <li><hr className="dropdown-divider" /></li>
                            <li>
                                <button className="dropdown-item text-danger" onClick={() => { /* Gọi hàm xóa từ cha nếu cần */ }}>
                                    <i className="fas fa-trash-alt me-2"></i>Xóa phim
                                </button>
                            </li>
                        </ul>
                    </div>
                </div>
                {/* Phần nội dung card */}
                <div className="card-body p-2">
                    <h6 className="card-title text-truncate mb-1" title={movie.title}>
                        {movie.title}
                    </h6>
                    <p className="card-text text-muted small text-truncate mb-1" title={movie.subTitle || movie.title}>
                        {movie.subTitle || movie.title}
                    </p>
                    <div className="d-flex justify-content-between align-items-center small">
                        <span className="text-muted">{categoryTitle}</span>
                        <span className="text-muted">{countryTitle}</span>
                        <span className="text-warning">
                            <i className="fas fa-eye me-1"></i>
                            {formatViewCount(movie.views)}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MovieCard;