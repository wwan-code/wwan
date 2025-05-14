import { Accordion, Button, ListGroup } from "react-bootstrap";
import { Link } from "react-router-dom";

const WatchlistCard = ({ watchlist, onRemoveMovie, onDeleteWatchlist, onEditWatchlist }) => {
    return (
        <Accordion.Item eventKey={String(watchlist.id)} className="mb-2">
            <Accordion.Header>
                <div className="d-flex justify-content-between w-100 align-items-center pe-2">
                    <span className="fw-bold">{watchlist.name}</span>
                    <span className="badge bg-secondary">{watchlist.movies?.length || 0} phim</span>
                </div>
            </Accordion.Header>
            <Accordion.Body>
                {watchlist.description && <p className="text-muted small mb-2">{watchlist.description}</p>}
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
                                    <img src={movie.poster ? `/${movie.poster}` : '/placeholder.jpg'} alt={movie.title} width="40" height="60" className="me-2 rounded object-fit-cover" />
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