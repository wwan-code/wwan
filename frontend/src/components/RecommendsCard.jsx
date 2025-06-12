import { useMemo } from "react";
import { Link } from "react-router-dom";
import "@assets/scss/recommends.scss";
import useDeviceType from "@hooks/useDeviceType";
import useLastEpisode from "@hooks/useLastEpisode";
import classNames from "@utils/classNames";
import { formatViewCount } from "@utils/formatViewCount";
import { getQualityLabel } from "@utils/getQualityLabel";

const RecommendsCard = ({ recommend }) => {
    const deviceType = useDeviceType();
    const isMobile = useMemo(() => deviceType === "Mobile", [deviceType]);
    const lastEpisode = useLastEpisode(recommend.Episodes);

    return (
        <div className="recommends__card">
            <div className="video-card video-card--ogv video-card--column">
                <div className={classNames("video-card__cover-wrap", { "video-card__cover-wrap--mobile": isMobile })}>
                    <div className="video-card__cover video-card__cover--small" style={{ width: '147.2px ', height: '82.8px', paddingTop: '0' }}>
                        <Link to={'/play/' + recommend.slug + '?t=' + lastEpisode.episodeNumber} className="video-card__cover-link">
                            <picture className="wstar-image video-card__cover-img">
                                <source srcSet={process.env.REACT_APP_API_URL_IMAGE + "/" + recommend.bannerURL} type="image/webp" />
                                <img className="wstar-image__img" src={process.env.REACT_APP_API_URL_IMAGE + "/" + recommend.bannerURL} alt={recommend.title} loading="lazy" />
                            </picture>
                        </Link>
                        <div className="video-card__cover-mask">
                            <span className="video-card__cover-mask-text video-card__cover-mask-text--bold">Trọn bộ</span>
                        </div>
                        <span className="video-card__cover-label video-card__cover-label--small video-card__cover-label--type-text">
                            <span className="video-card__cover-label--text">{getQualityLabel(recommend.quality)}</span>
                        </span>
                    </div>
                </div>
                <div className={classNames("video-card__text-wrap", { "position-relative": isMobile })}>
                    <div className='video-card__text video-card__text--column'>
                        {
                            isMobile ? <>
                                <p className="video-card__title">{recommend.title}</p>
                                <p className="video-card__type-tag">
                                    {
                                        Array.isArray(recommend.genres) && recommend.genres.slice(0, 2).map((genre, index) => (
                                            <span key={index} className="video-card__type-tag-item">{genre.title}</span>
                                        ))
                                    }
                                </p>
                                <p className={classNames("video-card__desc", { "position-absolute start-0 bottom-0": isMobile })}>
                                    <span className="icon-views"><i className="icon-views__icon-views"></i>{formatViewCount(recommend.views)}</span>
                                </p>
                            </> : <>
                                <p className="video-card__title video-card__title--small video-card__title--bold">
                                    <Link className="video-card__title-text" to={'/play/' + recommend.slug + '?t=' + lastEpisode.episodeNumber} target="_self">{recommend.title}</Link>
                                </p>
                                <p className="video-card__desc video-card__desc--small">{lastEpisode.episodeNumber}/{recommend.totalEpisodes} tập</p>
                                <p className="video-card__desc video-card__desc--small video-card__text--column-subdesc">{formatViewCount(recommend.views)} Lượt xem</p>
                            </>
                        }

                    </div>
                </div>
            </div>
        </div>
    )
};

export default RecommendsCard;