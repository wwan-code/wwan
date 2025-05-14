import { Link } from "react-router-dom";
import { useVideo } from "../pages/PlayMovie";
import React, { useMemo, useState } from "react";
import useDeviceType from "../hooks/useDeviceType";
import classNames from "../utils/classNames";
import "../assets/scss/video-detail.scss";

const VideoDetail = React.memo(() => {
    const [showFullDescription, setShowFullDescription] = useState(false);
    const deviceType = useDeviceType();
    const isMobile = useMemo(() => deviceType === "Mobile", [deviceType]);
    const { state } = useVideo();
    const { data } = state;

    const description = data.movie.description;
    const shortDescription = description.length > 200 ? description.substring(0, 200) : description;
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

    if (!data || !data.movie) {
        return <div>Error: data.movie is undefined</div>;
    }
    return (
        <div className="video-play__meta">
            <section className={classNames('video-detail', { 'video-detail--mobile': isMobile, 'video-detail--ogv': !isMobile })}>
                <header>
                    <h1 className="video-meta__title video-meta__ogv-title">
                        {data.movie.title}
                    </h1>
                    <div className="feedback-entry" >
                        <div className="video-tooltip">
                            <div className="video-tooltip__body-reference">
                                <i dclass="feedback-entry__icon"></i>
                            </div>
                        </div>
                    </div>
                </header>
                <>
                    <div className="video-meta__info">
                        <div className="video-meta__tips">
                            <div>
                                <p className="video-meta__tips-left">
                                    <span className="video-detail-text">{formatViewCount(data.movie.views)} Lượt xem</span>
                                    <span className="video-detail-text video-detail-vip">{getQualityLabel(data.movie.quality)}</span>
                                </p>
                            </div>
                        </div>
                        <div className="video-meta__tags">
                            {/* <Link className="video-detail-tag video-detail-tag--trending" target="_blank">Bảng Tổng Hạng 31</Link> */}
                            <Link className="video-detail-tag video-detail-tag--anime" target="_blank">{data.movie.categories.title}</Link>
                            {
                                data.movie.genres.map((genre, index) => {
                                    return <Link key={index} className="video-detail-tag video-detail-tag--default" to={`/the-loai/${genre.slug}`} target="_blank">{genre.title}</Link>
                                })
                            }
                        </div>
                    </div>
                    <main className="video-meta__main">
                        <section className="video-meta__main-left" >
                            <div className="video-meta__desc">
                                <p id="contentm" className="video-meta__desc-text">
                                    {showFullDescription ? description : shortDescription}
                                    {description.length > 200 && !showFullDescription && (
                                        <span type="button" className="text-body" onClick={() => setShowFullDescription(true)}>Xem thêm</span>
                                    )}
                                </p>
                            </div>
                            <div className="video-meta__extra">
                                <div className="video-meta__origin-name">
                                    <div className="video-meta__origin-name-label">Tên: </div><div className="video-meta__origin-name-content">
                                        {data.movie.title}
                                    </div>
                                </div>
                                <div className="video-meta__alias">
                                    <div className="video-meta__alias-label">Tên khác: </div>
                                    <div className="video-meta__alias-content">
                                        <div className="video-meta__alias-item">{data.movie.subTitle}</div>
                                    </div>
                                </div>
                                <div className="video-meta__type-area">
                                    <div className="video-meta__type">{data.movie.categories.title}</div>
                                    <div className="video-meta__area">{data.movie.countries.title}</div>
                                </div>
                                <div className="video-meta__create-time">Khởi chiếu: {data.movie.premiere}</div>
                            </div>
                        </section>
                    </main>
                </>
            </section>
        </div>
    )
})

export default VideoDetail;