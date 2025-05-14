import { Link } from "react-router-dom";
import { forwardRef, useMemo } from "react";
import classNames from "../utils/classNames";
import useDeviceType from "../hooks/useDeviceType";
import useLastEpisode from "../hooks/useLastEpisode";
import "../assets/scss/series.scss";

const SeriesCard = forwardRef(({ serie, handleClick }, ref) => {
    const deviceType = useDeviceType();
    const isMobile = useMemo(() => deviceType === "Mobile", [deviceType]);
    const lastEpisode = useLastEpisode(serie.Episodes);
    const formatViewCount = (number) => {
        if (number >= 1e9) return (number / 1e9).toFixed(1) + 'B';
        if (number >= 1e6) return (number / 1e6).toFixed(1) + 'M';
        if (number >= 1e3) return (number / 1e3).toFixed(1) + 'K';
        return number.toString();
    };
    const getQualityLabel = (quality) => {
        const qualityLabels = ['Trailer', 'Cam', 'HDCam', 'HD', 'FullHD'];
        return qualityLabels[quality] || 'Unknown';
    };
    return (
        <div className="series__card" ref={ref} onClick={handleClick}>
            <div className={classNames("video-card video-card--ogv", {"video-card--column":!isMobile, "video-card--row":isMobile})}>
                <div className={classNames("video-card__cover-wrap", {"video-card__cover-wrap--mobile": isMobile})}>
                    <div className="video-card__cover video-card__cover--small" style={{ width: '147.2px', height: '82.8px', paddingTop: '0' }}>
                        <Link to={'/play/'+serie.slug+'?t='+lastEpisode.episodeNumber}  className="video-card__cover-link">
                            <picture className="wstar-image video-card__cover-img">
                                <source srcSet={"/" + serie.poster} type="image/webp" />
                                <img className="wstar-image__img" src={"/" + serie.poster} alt={serie.title} loading="lazy" />
                            </picture>
                        </Link>
                        <div className="video-card__cover-mask">
                            <span className="video-card__cover-mask-text video-card__cover-mask-text--bold">Trọn bộ</span>
                        </div>
                        <span className="video-card__cover-label video-card__cover-label--small video-card__cover-label--type-text">
                            <span className="video-card__cover-label--text">{isMobile ? <><i className="fa fa-eye"/>{formatViewCount(serie.views)}</> : getQualityLabel(serie.quality)}</span>
                        </span>
                    </div>
                </div>
                <div className="video-card__text-wrap">
                    <div className={classNames("video-card__text", {"video-card__text--column":!isMobile, "video-card__text--row":isMobile})}>
                        {
                            isMobile ? <>
                            <div className="video-card__text-content">
                                <p className="video-card__title">{serie.title}</p>
                            </div>
                            </>:<>
                            <p className="video-card__title video-card__title--small video-card__title--bold">
                                <Link className="video-card__title-text" to={'/play/'+serie.slug+'?t='+lastEpisode.episodeNumber} target="_self">{serie.title}</Link>
                            </p>
                            <p className="video-card__desc video-card__desc--small">{lastEpisode.episodeNumber}/{serie.totalEpisodes} tập</p>
                            <p className="video-card__desc video-card__desc--small video-card__text--column-subdesc">{formatViewCount(serie.views)} Lượt xem</p>
                            </>
                        }
                        
                    </div>
                </div>
            </div>
        </div>
    )
})
export default SeriesCard;