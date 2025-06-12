import React from "react";
import { Link } from "react-router-dom";
import useLastEpisode from "@hooks/useLastEpisode";
import "@assets/scss/_single-film.scss";

const SingleFilm = React.memo(({ movie }) => {
    const formatViewCount = (number = "") => {
        if (number >= 1000000000) {
            return (number / 1000000000).toFixed(1) + 'B';
        } else if (number >= 1000000) {
            return (number / 1000000).toFixed(1) + 'M';
        } else if (number >= 1000) {
            return (number / 1000).toFixed(1) + 'K';
        } else {
            return number.toString();
        }
    };
    const lastEpisode = useLastEpisode(movie.Episodes);
    return (
        <div className="single-film">
            <div className="single-film__cover-wrap">
                <div className="single-film__cover">
                    <Link to={`/album/${movie.slug}`} className="single-film__cover-link">
                        <picture className="single-film__cover-img">
                            <source srcSet={process.env.REACT_APP_API_URL_IMAGE + "/" + movie.bannerURL} type="image/webp" />
                            <img
                                src={process.env.REACT_APP_API_URL_IMAGE + "/" + movie.bannerURL}
                                alt={movie.title}
                                loading="lazy"
                            />
                        </picture>
                        <div className="single-film__cover-play single-film__cover-fav--hover">
                            <span className="fas fa-play card-play-icon"></span>
                        </div>
                    </Link>
                    {
                        movie.belongToCategory !== 0 && movie.categoryId !== 3 ? (
                            <div className="single-film__cover-mask">
                                <span className="single-film__cover-mask-text">
                                    {lastEpisode.episodeNumber ? lastEpisode.episodeNumber === parseInt(movie.totalEpisodes) ? 'Full' : `Tập ${lastEpisode.episodeNumber} đã cập nhật` : 'Chưa có tập phim'}
                                </span>
                            </div>
                        ) : null
                    }
                    <span className="single-film__cover-label single-film__cover-label--small single-film__cover-label--type-text">
                        <span className="single-film__cover-label--text">{movie.duration}</span>
                    </span>
                </div>
            </div>

            <Link to={`/album/${movie.slug}`} className="single-film__content">
                <p className="single-film__content-title">{movie.title}</p>
                <div className="single-film__playinfo">
                    <span className="single-film__playinfo-text single-film__playinfo-text--views">
                        {formatViewCount(movie.views)}
                    </span>
                </div>
            </Link>
        </div>
    )
});

export default SingleFilm;