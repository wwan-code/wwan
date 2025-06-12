// src/components/Common/SingleFilmHorizontal.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import '@assets/scss/components/_single-item-horizontal.scss';
import { getQualityLabel } from '@utils/getQualityLabel';

const SingleFilmHorizontal = ({ movie, onRemove, showRemoveButton = false }) => {
    if (!movie) return null;
    const posterUrl = movie.posterURL ? (movie.posterURL.startsWith('http') ? movie.posterURL : `${process.env.REACT_APP_API_URL_IMAGE}/${movie.posterURL}`) : '/placeholder-movie.png';
    const lastEpisode = movie.Episodes && movie.Episodes.length > 0 ? movie.Episodes[0] : null;

    return (
        <div className="single-item-horizontal film-item-horizontal">
            <Link to={`/album/${movie.slug}`} className="single-item-horizontal__main-link">
                <img
                    src={posterUrl}
                    alt={movie.title}
                    className="single-item-horizontal__poster"
                    onError={(e) => { e.target.onerror = null; e.target.src = '/placeholder-movie.png' }}
                />
                <div className="single-item-horizontal__info">
                    <h6 className="single-item-horizontal__title" title={movie.title}>{movie.title}</h6>
                    <div className="single-item-horizontal__meta">
                        {movie.year && <span className="meta-year">{movie.year}</span>}
                        {movie.belongToCategory === 1 && lastEpisode && (
                            <span className="meta-episodes">Tập {lastEpisode.episodeNumber}</span>
                        )}
                        {movie.duration && movie.belongToCategory === 0 && (
                            <span className="meta-duration">{movie.duration}</span>
                        )}
                        {movie.quality && <span className="meta-quality">{
                            getQualityLabel(movie.quality)
                        }</span>}
                    </div>
                </div>
            </Link>
            {showRemoveButton && onRemove && (
                <button className="btn-icon btn-remove-item" onClick={onRemove} title="Xóa khỏi bộ sưu tập">
                    <i className="fas fa-times-circle"></i>
                </button>
            )}
        </div>
    );
};
export default SingleFilmHorizontal;