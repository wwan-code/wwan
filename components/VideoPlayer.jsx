import React, { useMemo } from "react";
import useDeviceType from "../hooks/useDeviceType";
import classNames from "../utils/classNames";
import { useVideo } from "../pages/PlayMovie";
import "../assets/scss/video-play.scss";
import "../assets/scss/interactive.scss";


const VideoPlayer = React.memo(() => {
    const deviceType = useDeviceType();
    const isMobile = useMemo(() => deviceType === "Mobile", [deviceType]);
    const { state: { data, totalFavoritesByEpisode, isFavorited, isFollowed, followLoading, favLoading }, handleFavoriteToggle, handleFollowToggle } = useVideo();
    if (!data || !data.episode || !data.episode.linkEpisode) {
        return (
            <div className="video-play__player">
                <div className={classNames('video-player', { 'video-player--mobile': isMobile })}>
                    <div className="video-player__wrapper">
                        <section className="video-player__main">
                            <div className="video-player__box d-flex justify-content-center align-items-center text-muted">
                                Đang tải hoặc không có link video...
                            </div>
                        </section>
                    </div>
                </div>
            </div>
        );
    }
    return (
        <div className="video-play__player">
            <div className={classNames('video-player', { 'video-player--mobile': isMobile })}>
                <div className="video-player__wrapper">
                    <section className="video-player__main">
                        <div className="video-player__box">
                            <div className="player-mobile">
                                <div className="player-mobile-area">
                                    <div className="player-mobile-dummy"></div>
                                    <div className="player-mobile-box">
                                        <div 
                                            className="player-mobile-video-wrap"
                                        >
                                            <iframe
                                                src={data.episode.linkEpisode} // Đảm bảo đây là URL nhúng đúng của abyss.to
                                                frameBorder="0"
                                                allowFullScreen
                                                allow="autoplay; encrypted-media; picture-in-picture" // Thêm allow autoplay, pip
                                                title={`video-player-${data.episode.id}`}
                                                className="player-mobile-video"
                                                loading="lazy"
                                            ></iframe>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>
            </div>
            {!isMobile && (
                <>
                    <section className={classNames("interactive", { 'interactive--mobile': isMobile })}>
                        <div className="interactive__actions">
                            <button
                                type='button'
                                className={classNames('interactive__btn interactive__like', { 'active': isFavorited })}
                                onClick={() => handleFavoriteToggle(isFavorited)}
                                disabled={favLoading}
                            >
                                <span className="interactive__text">{totalFavoritesByEpisode}</span>
                            </button>
                            <button
                                type='button'
                                className={classNames('interactive__btn interactive__bookmark', { 'active': isFollowed })}
                                onClick={() => handleFollowToggle(isFollowed)}
                                disabled={followLoading}
                            >
                                <span className="interactive__text">Theo dõi</span>
                            </button>
                        </div>
                    </section>
                </>
            )}

        </div>
    )
});

export default VideoPlayer;