import { useMemo } from 'react';

function useTimeAgo(inputDate) {
    return useMemo(() => {
        const timestamp = new Date(inputDate).getTime();
        const now = Date.now();
        const diffInSeconds = (now - timestamp) / 1000;

        if (diffInSeconds > 2592000) { // 30 days * 24 hours * 60 minutes * 60 seconds
            const [year, month, day] = inputDate.substring(0, 10).split("-");
            return `${day}-${month}-${year}`;
        }

        const timeIntervals = [
            { threshold: 604800, label: "tuần trước" }, // 7 days * 24 hours * 60 minutes * 60 seconds
            { threshold: 86400, label: "ngày trước" },  // 24 hours * 60 minutes * 60 seconds
            { threshold: 3600, label: "giờ trước" },    // 60 minutes * 60 seconds
            { threshold: 60, label: "phút trước" },     // 60 seconds
        ];

        for (const interval of timeIntervals) {
            if (diffInSeconds > interval.threshold) {
                const value = Math.floor(diffInSeconds / interval.threshold);
                return `${value} ${interval.label}`;
            }
        }

        return `${Math.floor(diffInSeconds)} giây trước`;
    }, [inputDate]);
}

export default useTimeAgo;
