export const getQualityLabel = (quality) => {
    const qualityLabels = ['Trailer', 'Cam', 'HDCam', 'HD', 'FullHD'];
    return qualityLabels[quality] || 'N/A';
};