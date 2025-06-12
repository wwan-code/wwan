import { useMemo } from 'react';

const useLastEpisode = (episodes) => {
  return useMemo(() => {
    if (!Array.isArray(episodes) || episodes.length === 0) {
      return 0;
    }

    const lastEpisode = episodes.reduce((max, episode) => {
      if (
        typeof episode.episodeNumber === 'number' &&
        (!max || episode.episodeNumber > max.episodeNumber)
      ) {
        return episode;
      }
      return max;
    }, null);

    return lastEpisode || null;
  }, [episodes]);
};

export default useLastEpisode;
