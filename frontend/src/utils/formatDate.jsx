export const formatDate = (dateString, zone='vi-VN') => {
    if (!dateString) return '';
    try {
        return new Date(dateString).toLocaleDateString(zone, {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        });
    } catch (e) {
        return dateString;
    }
};