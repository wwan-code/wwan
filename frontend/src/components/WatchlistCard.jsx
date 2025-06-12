// src/components/WatchlistCard.jsx
import { Accordion, Button, ListGroup, Badge } from "react-bootstrap";
import { Link } from "react-router-dom";
import { toast } from 'react-toastify';

const WatchlistCard = ({ watchlist, onRemoveMovie, onDeleteWatchlist, onEditWatchlist }) => {
    const typeLabel = watchlist.type === 'movie' ? 'Phim' : watchlist.type === 'comic' ? 'Truyện' : 'Tổng hợp';
    const itemCount = watchlist.movies?.length || watchlist.comics?.length || 0; 
    return (
         <Accordion.Item eventKey={String(watchlist.id)} className="mb-2 user-collection-card">
            <Accordion.Header>
                <div className="d-flex justify-content-between w-100 align-items-center pe-2">
                    <div className="d-flex align-items-center">
                        <span className="fw-bold me-2">{watchlist.name}</span>
                        <Badge pill bg={watchlist.isPublic ? "success" : "secondary"} className="me-2">
                            {watchlist.isPublic ? "Công khai" : "Riêng tư"}
                        </Badge>
                        <Badge pill bg="info" text="dark">{typeLabel}</Badge>
                    </div>
                    <span className="badge bg-light text-dark">{itemCount} mục</span>
                </div>
            </Accordion.Header>
            <Accordion.Body>
                {watchlist.description && <p className="text-muted small mb-2">{watchlist.description}</p>}
                {watchlist.isPublic && watchlist.slug && (
                    <div className="mb-2">
                        <small className="text-muted">Link chia sẻ: </small>
                        <Link to={`/collections/${watchlist.slug}`} target="_blank" className="small me-2 text-decoration-none">
                            /collections/{watchlist.slug}
                        </Link>
                        <Button
                            variant="link"
                            size="sm"
                            className="p-0"
                            onClick={() => {
                                navigator.clipboard.writeText(`${window.location.origin}/collections/${watchlist.slug}`);
                                toast.success("Đã sao chép link chia sẻ!");
                            }}
                            title="Sao chép link"
                        >
                            <i className="fas fa-copy"></i>
                        </Button>
                    </div>
                )}
                <div className="mb-2">
                    <Button variant="outline-secondary" size="sm" onClick={() => onEditWatchlist(watchlist)} className="me-2">
                        <i className="fas fa-edit me-1"></i> Sửa tên/mô tả
                    </Button>
                    <Button variant="outline-danger" size="sm" onClick={() => onDeleteWatchlist(watchlist.id)}>
                        <i className="fas fa-trash me-1"></i> Xóa danh sách
                    </Button>
                </div>
                {watchlist.movies && watchlist.movies.length > 0 ? (
                    <ListGroup variant="flush">
                        {watchlist.movies.map(movie => (
                            <ListGroup.Item key={movie.id} className="d-flex justify-content-between align-items-center px-0 py-2">
                                <div className="d-flex align-items-center">
                                    <img src={movie.bannerURL ? `${process.env.REACT_APP_API_URL_IMAGE}/${movie.bannerURL}` : '/placeholder.jpg'} alt={movie.title} width="40" height="60" className="me-2 rounded object-fit-cover" />
                                    <div>
                                        <Link to={`/album/${movie.slug}`} className="text-decoration-none fw-medium">{movie.title}</Link>
                                        <small className="d-block text-muted">{movie.year}</small>
                                    </div>
                                </div>
                                <Button variant="outline-danger" size="sm" onClick={() => onRemoveMovie(watchlist.id, movie.id)}>
                                    <i className="fas fa-times"></i>
                                </Button>
                            </ListGroup.Item>
                        ))}
                    </ListGroup>
                ) : (
                    <p className="text-muted text-center small">Danh sách này chưa có phim nào.</p>
                )}
            </Accordion.Body>
        </Accordion.Item>
    );
};

export default WatchlistCard;