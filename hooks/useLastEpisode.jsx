import { useMemo } from 'react';

const useLastEpisode = (episodes) => {
  return useMemo(() => {
    // Kiểm tra nếu không có tập hoặc không phải là mảng
    if (!Array.isArray(episodes) || episodes.length === 0) {
      return 0;
    }

    // Tìm episode cuối cùng có `episodeNumber` lớn nhất
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
