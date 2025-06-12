export const formatViewCount = (number) => {
    if (typeof number !== 'number') return '0';
    if (number >= 1e9) return (number / 1e9).toFixed(1).replace(/\.0$/, '') + 'B';
    if (number >= 1e6) return (number / 1e6).toFixed(1).replace(/\.0$/, '') + 'M';
    if (number >= 1e3) return (number / 1e3).toFixed(1).replace(/\.0$/, '') + 'K';
    return number.toString();
};