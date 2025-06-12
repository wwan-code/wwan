import { useCallback, useEffect, useState } from 'react';

const useDeviceType = () => {
    const getIsMobile = useCallback(() => {
        if (typeof window === 'undefined') return false;
        return window.matchMedia('(max-width: 992px)').matches;
    }, []);

    const [isMobile, setIsMobile] = useState(getIsMobile);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const mediaQuery = window.matchMedia('(max-width: 992px)');

        const handleChange = (e) => {
            setIsMobile(e.matches);
        };

        // Lắng nghe sự kiện thay đổi
        mediaQuery.addEventListener('change', handleChange);

        // Cập nhật trạng thái lần đầu
        setIsMobile(mediaQuery.matches);

        return () => {
            mediaQuery.removeEventListener('change', handleChange);
        };
    }, [getIsMobile]);

    return isMobile ? 'Mobile' : 'Desktop';
};

export default useDeviceType;
