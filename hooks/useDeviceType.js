import { useCallback, useEffect, useState } from 'react';

const isMobileDevice = () => {
    return /Mobi|Android/i.test(navigator.userAgent);
};

const useDeviceType = () => {
    const [deviceType, setDeviceType] = useState('Desktop');

    const handleChange = useCallback((e) => {
        setDeviceType((e?.matches || isMobileDevice()) ? 'Mobile' : 'Desktop');
    }, []);

    useEffect(() => {
        const mediaQuery = window.matchMedia('(max-width: 992px)');

        // Thiết lập trạng thái ban đầu với kiểm tra đồng bộ
        setDeviceType(mediaQuery.matches || isMobileDevice() ? 'Mobile' : 'Desktop');

        // Lắng nghe sự kiện thay đổi
        const listener = (e) => handleChange(e);
        mediaQuery.addEventListener('change', listener);

        return () => {
            mediaQuery.removeEventListener('change', listener);
        };
    }, [handleChange]);

    return deviceType;
};

export default useDeviceType;