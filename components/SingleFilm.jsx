import { Link } from "react-router-dom";
import useLastEpisode from "../hooks/useLastEpisode";

const SingleFilm = (props) => {
    const { movie } = props;

    const formatViewCount = (number = "") => {
        if (number >= 1000000000) {
            return (number / 1000000000).toFixed(1) + 'B'; // tỷ
        } else if (number >= 1000000) {
            return (number / 1000000).toFixed(1) + 'M'; // triệu
        } else if (number >= 1000) {
            return (number / 1000).toFixed(1) + 'K'; // nghìn
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
                            <source srcSet={"/" + movie?.poster} type="image/webp" />
                            <img
                                src={"/" + movie?.poster}
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
                                    {lastEpisode.episodeNumber === parseInt(movie.totalEpisodes) ? 'Full' : `Tập ${lastEpisode.episodeNumber} đã cập nhật`}
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
}

export default SingleFilm;