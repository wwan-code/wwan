import React, { useCallback, useMemo, useRef, useState, useEffect } from "react";
import useDeviceType from "@hooks/useDeviceType";
import classNames from "@utils/classNames";
import { useVideo } from "@pages/PlayMovie";
import "@assets/scss/video-play.scss";
import "@assets/scss/interactive.scss";
import { useSelector } from "react-redux";
import watchHistoryService from "../services/watchHistoryService";

const PING_INTERVAL_SECONDS = 30;


const VideoPlayer = React.memo(() => {
    const deviceType = useDeviceType();
    const isMobile = useMemo(() => deviceType === "Mobile", [deviceType]);
    const { state: { data, totalFavoritesByEpisode, isFavorited, isFollowed, followLoading, favLoading }, handleFavoriteToggle, handleFollowToggle } = useVideo();
    const iframeRef = useRef(null);
    const { user: currentUser, isLoggedIn } = useSelector((state) => state.user);
    const [episodeDetails, setEpisodeDetails] = useState(null);
    const [totalDurationMs, setTotalDurationMs] = useState(0);
    const [isPageActive, setIsPageActive] = useState(!document.hidden);
    const [lastPingTime, setLastPingTime] = useState(Date.now());


    // Hàm gửi ping cập nhật thời gian xem (ước lượng)
    const sendWatchTimePing = useCallback(async (secondsSinceLastPing) => {
        if (!isLoggedIn || !episodeDetails || secondsSinceLastPing <= 0) return;

        try {
            await watchHistoryService.incrementWatchDuration({
                episodeId: episodeDetails.id,
                incrementSeconds: secondsSinceLastPing,
            });
        } catch (err) {
            console.error("Lỗi gửi ping thời gian xem:", err);
        }
    }, [isLoggedIn, episodeDetails, currentUser]);

    // Theo dõi trạng thái active của tab
    useEffect(() => {
        const handleVisibilityChange = () => {
            setIsPageActive(!document.hidden);
            if (document.hidden) {
                const now = Date.now();
                const secondsSinceLast = Math.floor((now - lastPingTime) / 1000);
                if (secondsSinceLast > 0) {
                    sendWatchTimePing(secondsSinceLast);
                }
                setLastPingTime(now);
            } else {
                setLastPingTime(Date.now());
            }
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);
        return () => {
            document.removeEventListener("visibilitychange", handleVisibilityChange);
            if (isPageActive) {
                const now = Date.now();
                const secondsSinceLast = Math.floor((now - lastPingTime) / 1000);
                if (secondsSinceLast > 0) {
                    sendWatchTimePing(secondsSinceLast);
                }
            }
        };
    }, [isPageActive, lastPingTime, sendWatchTimePing]);

    // Gửi ping định kỳ nếu trang đang active
    useEffect(() => {
        let intervalId;
        if (isPageActive && isLoggedIn && episodeDetails) {
            setLastPingTime(Date.now());
            intervalId = setInterval(() => {
                setLastPingTime((prevPingTime) => {
                    const now = Date.now();
                    const secondsSinceLast = Math.floor((now - prevPingTime) / 1000);
                    if (secondsSinceLast >= PING_INTERVAL_SECONDS) {
                        sendWatchTimePing(PING_INTERVAL_SECONDS);
                        return now - (secondsSinceLast % PING_INTERVAL_SECONDS * 1000);
                    }
                    return prevPingTime;
                });
            }, PING_INTERVAL_SECONDS * 1000);
        }
        return () => clearInterval(intervalId);
    }, [isPageActive, isLoggedIn, episodeDetails, sendWatchTimePing]);
    
    const parseDurationString = (durationStr) => {
        if (!durationStr) return 0;
        const parts = durationStr.split(':').map(Number);
        let hours = 0, minutes = 0, seconds = 0;
        if (parts.length === 3) [hours, minutes, seconds] = parts;
        else if (parts.length === 2) [minutes, seconds] = parts;
        else if (parts.length === 1) [seconds] = parts;
        else return 0;
        return (hours * 3600 + minutes * 60 + seconds) * 1000;
    };

    useEffect(() => {
        const fetchEpisodeAndHistory = async () => {
            if (data.episode && currentUser?.id) {
                try {
                    setEpisodeDetails(data.episode);
                    const durationMs = parseDurationString(data.episode.duration);
                    setTotalDurationMs(durationMs);
                } catch (error) {
                    console.error("Error fetching episode or history:", error);
                }
            }
        };
        fetchEpisodeAndHistory();
    }, [data.episode, currentUser?.id]);

    if (!data || !episodeDetails || !episodeDetails) {
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
                                            {/* <iframe
                                                ref={iframeRef}
                                                src={episodeDetails.linkEpisode}
                                                allowFullScreen
                                                allow="autoplay; encrypted-media; picture-in-picture"
                                                title={`video-player-${episodeDetails.id}`}
                                                className="player-mobile-video"
                                                loading="lazy"
                                            ></iframe> */}
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