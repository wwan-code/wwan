// hooks/useUIPreferences.jsx
import { useState, useEffect, useCallback }
//Không cần useMemo ở đây nếu không có tính toán phức tạp cần ghi nhớ
from "react";

// --- Các hằng số và hàm helper ---
const DEFAULT_ACCENT_COLOR = '#0d9394';
const DEFAULT_THEME_MODE = 'system';
const DEFAULT_FONT_SIZE = 'medium';
const DEFAULT_BORDER_RADIUS = 'medium';
const DEFAULT_CUSTOM_THEME = null;
const DEFAULT_READER_MODE = 'scroll';

export const ACCENT_COLORS = [
    { name: 'Mặc định (Teal)', value: '#0d9394', className: 'accent-default' },
    { name: 'Xanh dương', value: '#0d6efd', className: 'accent-blue' },
    { name: 'Hồng', value: '#d63384', className: 'accent-pink' },
    { name: 'Cam', value: '#fd7e14', className: 'accent-orange' },
    { name: 'Tím', value: '#6f42c1', className: 'accent-purple' },
    { name: 'Đỏ', value: '#dc3545', className: 'accent-red' },
    { name: 'Xanh lá', value: '#198754', className: 'accent-green' },
    { name: 'Xanh lạnh', value: '#0dcaf0', className: 'accent-cyan' },
    { name: 'Vàng', value: '#ffc107', className: 'accent-yellow' }
];

const hexToRgbArray = (hex) => {
    if (!hex) return [13, 147, 148];
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [
        parseInt(result[1], 16),
        parseInt(result[2], 16),
        parseInt(result[3], 16)
    ] : [13, 147, 148];
};

function calculateDarkenedRgb(rgbArray, percent) {
    return rgbArray.map(channel => Math.max(0, Math.floor(channel * (1 - percent / 100))));
}

function calculateLightenedRgb(rgbArray, percent) {
    return rgbArray.map(channel => Math.min(255, Math.floor(channel + (255 - channel) * (percent / 100))));
}

const useUIPreferences = () => {
    const [preferences, setPreferences] = useState(() => {
        try {
            return {
                theme: localStorage.getItem('theme') || DEFAULT_THEME_MODE,
                accentColor: localStorage.getItem('accentColor') || DEFAULT_ACCENT_COLOR,
                fontSize: localStorage.getItem('fontSize') || DEFAULT_FONT_SIZE,
                borderRadius: localStorage.getItem('borderRadius') || DEFAULT_BORDER_RADIUS,
                activeCustomTheme: localStorage.getItem('activeCustomTheme') || DEFAULT_CUSTOM_THEME,
                readerMode: localStorage.getItem('readerMode') || DEFAULT_READER_MODE
            };
        } catch (e) {
            console.warn("localStorage is unavailable, using default preferences.");
            return {
                theme: DEFAULT_THEME_MODE,
                accentColor: DEFAULT_ACCENT_COLOR,
                fontSize: DEFAULT_FONT_SIZE,
                borderRadius: DEFAULT_BORDER_RADIUS,
                activeCustomTheme: DEFAULT_CUSTOM_THEME,
                readerMode: DEFAULT_READER_MODE
            };
        }
    });

    // Hàm áp dụng tất cả các tùy chọn UI
    const applyAllPreferences = useCallback(() => {
        const root = document.documentElement;

        // 1. Áp dụng Theme Sáng/Tối (theme)
        const currentSystemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        const themeToApply = preferences.theme === 'system' ? currentSystemTheme : preferences.theme;
        root.setAttribute('data-ww-theme', themeToApply); // data-ww-theme cho light/dark

        // 2. Áp dụng Theme Tùy Chỉnh
        // Xóa các class custom theme cũ trước khi thêm class mới
        root.classList.forEach(className => {
            if (className.startsWith('custom-theme-')) {
                root.classList.remove(className);
            }
        });
        if (preferences.activeCustomTheme && preferences.activeCustomTheme !== "null") { // Kiểm tra "null" string
            root.classList.add(`custom-theme-${preferences.activeCustomTheme}`);
        }

        // 3. Áp dụng Accent Color
        if (preferences.accentColor) {
            const primaryRgbArray = hexToRgbArray(preferences.accentColor);
            root.style.setProperty('--w-primary-rgb', primaryRgbArray.join(', '));
            root.style.setProperty('--w-primary', preferences.accentColor);

            const isEffectiveDark = themeToApply === 'dark'; // Dùng theme đã được giải quyết

            const textEmphasisRgb = isEffectiveDark
                ? calculateLightenedRgb(primaryRgbArray, 60)
                : calculateDarkenedRgb(primaryRgbArray, 60);
            root.style.setProperty('--w-primary-text-emphasis-rgb', textEmphasisRgb.join(', '));
            root.style.setProperty('--w-primary-text-emphasis', `rgb(${textEmphasisRgb.join(', ')})`);

            const bgSubtleRgb = isEffectiveDark
                ? calculateDarkenedRgb(primaryRgbArray, 40)
                : calculateLightenedRgb(primaryRgbArray, 42);
            root.style.setProperty('--w-primary-bg-subtle-rgb', bgSubtleRgb.join(', '));
            root.style.setProperty('--w-primary-bg-subtle', `rgb(${bgSubtleRgb.join(', ')})`);

            const borderSubtleRgb = isEffectiveDark
                ? calculateDarkenedRgb(primaryRgbArray, 65)
                : calculateLightenedRgb(primaryRgbArray, 80);
            root.style.setProperty('--w-primary-border-subtle-rgb', borderSubtleRgb.join(', '));
            root.style.setProperty('--w-primary-border-subtle', `rgb(${borderSubtleRgb.join(', ')})`);
        }

        // 4. Áp dụng Font Size
        if (preferences.fontSize) {
            let baseFontSize = '1rem'; // medium
            if (preferences.fontSize === 'small') baseFontSize = '0.875rem';
            else if (preferences.fontSize === 'large') baseFontSize = '1.125rem';
            root.style.setProperty('--w-body-font-size', baseFontSize);
        }

        // 5. Áp dụng Border Radius
        if (preferences.borderRadius) {
            let radiusValue = '0.375rem'; // medium
            let radiusSmValue = '0.25rem';
            let radiusLgValue = '0.5rem';
            if (preferences.borderRadius === 'none') {
                radiusValue = '0';
                radiusSmValue = '0';
                radiusLgValue = '0';
             }
            else if (preferences.borderRadius === 'small') { 
                radiusValue = '0.25rem';
                radiusSmValue = '0.25rem';
                radiusLgValue = '0.5rem';
             }
            else if (preferences.borderRadius === 'large') { 
                radiusValue = '0.5rem';
                radiusSmValue = '0.5rem';
                radiusLgValue = '0.75rem';
             }
            root.style.setProperty('--w-border-radius', radiusValue);
            root.style.setProperty('--w-border-radius-sm', radiusSmValue);
            root.style.setProperty('--w-border-radius-lg', radiusLgValue);
        }
        
    }, [preferences]);

    useEffect(() => {
        applyAllPreferences();
    }, [applyAllPreferences]);

    useEffect(() => {
        const mediaQueryList = window.matchMedia('(prefers-color-scheme: dark)');
        const systemThemeChangeHandler = () => {
            if (preferences.theme === 'system') {
                applyAllPreferences();
            }
        };
        mediaQueryList.addEventListener('change', systemThemeChangeHandler);
        return () => mediaQueryList.removeEventListener('change', systemThemeChangeHandler);
    }, [preferences.theme, applyAllPreferences]);

    // Hàm để cập nhật một tùy chọn cụ thể và lưu vào localStorage
    const setSinglePreference = useCallback((key, value) => {
        setPreferences(prevPrefs => {
            const newPrefs = { ...prevPrefs, [key]: value };
            try {
                if (value === null || value === undefined) {
                    localStorage.removeItem(key);
                } else {
                    localStorage.setItem(key, String(value));
                }
            } catch (e) {
                console.warn(`Failed to save preference '${key}' to localStorage.`, e);
            }
            return newPrefs;
        });
    }, []);


    return {
        preferences,
        setSinglePreference,
        ACCENT_COLORS,
    };
};

export default useUIPreferences;