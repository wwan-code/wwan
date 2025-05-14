/**
 * Hàm tính khoảng cách thời gian từ một mốc thời gian đến hiện tại.
 * @param {Date|string|number} date - Thời gian cần định dạng.
 * @param {Object} options - Các tùy chọn định dạng.
 * @param {boolean} options.addSuffix - Thêm hậu tố "trước" hoặc "sau".
 * @returns {string} Chuỗi thời gian đã định dạng.
 */
export const formatDistanceToNow = (date, options = { addSuffix: true }) => {
    const now = new Date();
    const targetDate = new Date(date);
    const diffInSeconds = Math.floor((now - targetDate) / 1000);

    if (diffInSeconds < 60) {
        return options.addSuffix ? `${diffInSeconds} giây trước` : `${diffInSeconds} giây`;
    }

    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
        return options.addSuffix ? `${diffInMinutes} phút trước` : `${diffInMinutes} phút`;
    }

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
        return options.addSuffix ? `${diffInHours} giờ trước` : `${diffInHours} giờ`;
    }

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 30) {
        return options.addSuffix ? `${diffInDays} ngày trước` : `${diffInDays} ngày`;
    }

    const diffInMonths = Math.floor(diffInDays / 30);
    if (diffInMonths < 12) {
        return options.addSuffix ? `${diffInMonths} tháng trước` : `${diffInMonths} tháng`;
    }

    const diffInYears = Math.floor(diffInMonths / 12);
    return options.addSuffix ? `${diffInYears} năm trước` : `${diffInYears} năm`;
};