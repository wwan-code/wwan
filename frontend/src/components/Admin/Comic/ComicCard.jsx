// src/components/Admin/Comic/ComicCard.jsx
import { Link } from 'react-router-dom';
import { formatViewCount } from '@utils/formatViewCount';

const formatComicStatus = (status) => {
    const statusMap = {
        ongoing: { text: 'Đang tiến hành', class: 'bg-info text-white' },
        completed: { text: 'Hoàn thành', class: 'bg-success text-white' },
        paused: { text: 'Tạm dừng', class: 'bg-warning text-dark' },
        dropped: { text: 'Đã drop', class: 'bg-secondary text-white' },
    };
    return <span className={`badge ${statusMap[status]?.class || 'bg-light text-dark'}`}>{statusMap[status]?.text || status}</span>;
};

const ComicCard = ({ comic, onDeleteComic, dropdownProps }) => {
    const { openDropdownId, toggleDropdown, dropdownRefCallback } = dropdownProps;

    if (!comic) return null;

    const coverImageUrl = comic.coverImage
        ? (comic.coverImage.startsWith('http') ? comic.coverImage : `${process.env.REACT_APP_API_URL_IMAGE}/${comic.coverImage}`)
        : '/placeholder-comic.png';

    const chaptersCount = comic.chaptersCount || comic.chapters?.length || 0;
    const lastUpdated = comic.lastChapterUpdatedAt ? new Date(comic.lastChapterUpdatedAt).toLocaleDateString('vi-VN') : 'N/A';

    return (
        <div className="col-custom-card">
            <div className="admin-content-card comic-admin-card h-100">
                <div className="card-image-container">
                    <Link to={`/admin/comics/${comic.id}/chapters`} title={`Quản lý chương: ${comic.title}`}>
                        <img
                            src={coverImageUrl}
                            alt={comic.title}
                            className="card-img-top"
                        />
                    </Link>
                    <div className="card-overlay-info">
                        <span className="badge bg-dark m-1">{comic.year || 'N/A'}</span>
                        {formatComicStatus(comic.status)}
                    </div>
                    <div className="admin-card-actions dropdown" ref={(el) => dropdownRefCallback(el, comic.id)}>
                        <button
                            className="btn btn-sm btn-icon rounded-circle"
                            type="button"
                            onClick={(e) => { e.stopPropagation(); toggleDropdown(comic.id, e); }}
                            aria-expanded={openDropdownId === comic.id}
                            title="Tùy chọn"
                        >
                            <i className="fas fa-ellipsis-v"></i>
                        </button>
                        <ul className={`dropdown-menu dropdown-menu-end shadow-lg ${openDropdownId === comic.id ? "show" : ""}`}>
                            <li>
                                <Link className="dropdown-item" to={`/admin/comics/${comic.id}/chapters`}>
                                    <i className="fas fa-list-ol me-2"></i>Quản lý Chương
                                </Link>
                            </li>
                            <li>
                                <Link className="dropdown-item" to={`/admin/comics/edit/${comic.id}`}>
                                    <i className="fas fa-edit me-2"></i>Chỉnh sửa Truyện
                                </Link>
                            </li>
                            <li><hr className="dropdown-divider my-1" /></li>
                            <li>
                                <button className="dropdown-item text-danger" onClick={() => onDeleteComic(comic.id)}>
                                    <i className="fas fa-trash-alt me-2"></i>Xóa Truyện
                                </button>
                            </li>
                        </ul>
                    </div>
                </div>
                <div className="card-content-body">
                    <h6 className="card-title-main text-truncate mb-1" title={comic.title}>
                        <Link to={`/admin/comics/${comic.id}/chapters`} className="text-decoration-none">
                            {comic.title}
                        </Link>
                    </h6>
                    <p className="card-subtitle-text text-muted small text-truncate mb-1" title={comic.subTitle || comic.title}>
                        {comic.subTitle || comic.author || 'N/A'}
                    </p>
                    <div className="card-meta-info small">
                        <span><i className="fas fa-book-open me-1"></i> {chaptersCount} chương</span>
                        <span className="mx-1">|</span>
                        <span><i className="fas fa-eye me-1"></i> {formatViewCount(comic.views)}</span>
                    </div>
                     <div className="card-meta-info small text-muted mt-1">
                        Cập nhật: {lastUpdated}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ComicCard;