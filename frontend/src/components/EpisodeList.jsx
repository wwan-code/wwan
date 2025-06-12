import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import classNames from '@utils/classNames';
import useCustomScrollbar from '@hooks/useCustomScrollbar';
import "@assets/scss/section.scss";
import "@assets/scss/ep-section.scss";

const EpisodeList = React.memo(({
    episodes = [],
    totalEpisodes = 0,
    currentEpisodeNumber,
    watchedEpisodeIds = [],
    movieSlug,
    onEpisodeClick
}) => {
    const [selectedGroupIndex, setSelectedGroupIndex] = useState(0);
    const { containerRef, scrollbarRef } = useCustomScrollbar();
    const epListRef = useRef(null);

    const getGroupSize = useCallback((totalEps, thresholds = { high: 200, large: 60, small: 12 }) => {
        const { high, large, small } = thresholds;
        if (totalEps === 0) return small;
        if (totalEps <= small) return totalEps;
        if (totalEps === 13 || (totalEps > small && totalEps < 20)) return totalEps;
        return totalEps > high ? large : (totalEps > large ? small : large);
    }, []);

    const groupEpisodes = useCallback((eps, groupSize) => {
        if (!eps || eps.length === 0 || groupSize <= 0) return [];
        return eps.reduce((grouped, episode, index) => {
            const groupIndex = Math.floor(index / groupSize);
            if (!grouped[groupIndex]) grouped[groupIndex] = [];
            grouped[groupIndex].push(episode);
            return grouped;
        }, []);
    }, []);

    const groupSize = useMemo(() => getGroupSize(totalEpisodes), [totalEpisodes, getGroupSize]);
    const groupedEpisodes = useMemo(() => groupEpisodes(episodes, groupSize), [episodes, groupSize, groupEpisodes]);

    useEffect(() => {
        const currentNum = parseInt(currentEpisodeNumber, 10);
        if (!isNaN(currentNum) && groupSize > 0) {
            const groupIndex = Math.floor((currentNum - 1) / groupSize);
            if (groupIndex !== selectedGroupIndex && groupIndex >= 0 && groupIndex < groupedEpisodes.length) {
                setSelectedGroupIndex(groupIndex);
            }
        } else if (groupedEpisodes.length > 0) {
            setSelectedGroupIndex(0);
        }
    }, [currentEpisodeNumber, groupSize, groupedEpisodes.length, selectedGroupIndex]);
    const handleGroupClick = (index) => {
        setSelectedGroupIndex(index);
    };

    if (!episodes || episodes.length === 0) {
        return <p className="text-muted p-3">Chưa có tập phim nào.</p>;
    }

    return (
        <section className="ep-section">
            <div className="ep-section__wrapper">
                <div className="section-title">
                    <h3 className="section-title__text">Danh sách tập</h3>
                </div>

                {groupedEpisodes.length > 1 && (
                    <section className="section-bar">
                        <div className="section-bar__main">
                            <ul className="section-bar__main-wrap">
                                {groupedEpisodes.map((group, index) => {
                                    const startEp = group[0]?.episodeNumber || (index * groupSize + 1);
                                    const endEp = group[group.length - 1]?.episodeNumber || Math.min((index + 1) * groupSize, totalEpisodes);
                                    return (
                                        <li
                                            key={index}
                                            className={classNames('section-bar__item', { 'active': selectedGroupIndex === index })}
                                            onClick={() => handleGroupClick(index)}
                                        >
                                            {`${startEp}-${endEp}`}
                                        </li>
                                    )
                                })}
                            </ul>
                        </div>
                    </section>
                )}

                <div className="wwan-scrollbar">
                    <div className="wwan-scrollbar__wrap wwan-scrollbar__wrap--hidden" ref={containerRef}>
                        <div className="wwan-scrollbar__view">
                            <div className="ep-list" ref={epListRef}>
                                {groupedEpisodes[selectedGroupIndex] && groupedEpisodes[selectedGroupIndex].map((episode) => (
                                    <Link
                                        key={episode.id}
                                        to={`/play/${movieSlug}?t=${episode.episodeNumber}`}
                                        className={classNames('ep-item', {
                                            'ep-item--active': String(currentEpisodeNumber) === String(episode.episodeNumber),
                                            'ep-item--watched': String(currentEpisodeNumber) !== String(episode.episodeNumber) && watchedEpisodeIds.includes(episode.id)
                                        })}
                                        onClick={() => onEpisodeClick(episode.id)}
                                    >
                                        {episode.title ? `Tập ${episode.episodeNumber}: ${episode.title}` : `Tập ${episode.episodeNumber}`}
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="wwan-scrollbar__bar is-vertical">
                        <div className="wwan-scrollbar__thumb" ref={scrollbarRef} style={{ height: '0px' }}></div>
                    </div>
                </div>
            </div>
        </section>
    );
});

export default EpisodeList;