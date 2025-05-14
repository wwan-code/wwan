// hooks/useUIPreferences.js
import { useState, useEffect, useCallback, useMemo } from "react";

// --- Các hằng số và hàm helper có thể đặt ở ngoài ---
const DEFAULT_ACCENT_COLOR = '#0d9394';
const DEFAULT_THEME = 'system';
const DEFAULT_FONT_SIZE = 'medium';
const DEFAULT_BORDER_RADIUS = 'medium';

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
    if (!hex) return [13, 147, 148]; // Default nếu hex là null/undefined
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [
        parseInt(result[1], 16),
        parseInt(result[2], 16),
        parseInt(result[3], 16)
    ] : [13, 147, 148];
};

// Hàm tính toán màu phụ trợ (cần tinh chỉnh % cho phù hợp)
// Trả về mảng [r, g, b]
function calculateDarkenedRgb(rgbArray, percent) {
    return rgbArray.map(channel => Math.max(0, Math.floor(channel * (1 - percent / 100))));
}

function calculateLightenedRgb(rgbArray, percent) {
    return rgbArray.map(channel => Math.min(255, Math.floor(channel + (255 - channel) * (percent / 100))));
}

function darkenColor(hex, percent, currentThemeIsDark) {
    // Nếu theme là dark, có thể bạn muốn làm sáng màu gốc thay vì làm tối hơn nữa
    if (currentThemeIsDark && percent > 0) { // Giả sử percent > 0 là làm tối
        return lightenColor(hex, percent / 2); // Ví dụ: làm sáng nhẹ hơn
    }
    let [r, g, b] = hexToRgbArray(hex);
    r = Math.max(0, Math.floor(r * (1 - percent / 100)));
    g = Math.max(0, Math.floor(g * (1 - percent / 100)));
    b = Math.max(0, Math.floor(b * (1 - percent / 100)));
    return `rgb(${r}, ${g}, ${b})`;
}

function lightenColor(hex, percent, currentThemeIsDark) {
    // Nếu theme là light, có thể bạn muốn làm tối màu gốc thay vì làm sáng hơn nữa cho một số trường hợp (text-emphasis)
    if (!currentThemeIsDark && percent > 50) { // Giả sử percent > 50 là làm sáng nhiều
        return darkenColor(hex, percent / 4); // Ví dụ
    }
    let [r, g, b] = hexToRgbArray(hex);
    r = Math.min(255, Math.floor(r + (255 - r) * (percent / 100)));
    g = Math.min(255, Math.floor(g + (255 - g) * (percent / 100)));
    b = Math.min(255, Math.floor(b + (255 - b) * (percent / 100)));
    return `rgb(${r}, ${g}, ${b})`;
}
// ----------------------------------------------------

const useUIPreferences = () => {
    // Đọc từ localStorage khi khởi tạo state
    const [preferences, setPreferences] = useState(() => {
        try {
            return {
                theme: localStorage.getItem('theme') || DEFAULT_THEME,
                accentColor: localStorage.getItem('accentColor') || DEFAULT_ACCENT_COLOR,
                fontSize: localStorage.getItem('fontSize') || DEFAULT_FONT_SIZE,
                borderRadius: localStorage.getItem('borderRadius') || DEFAULT_BORDER_RADIUS,
            };
        } catch (e) {
            console.warn("localStorage is unavailable, using default preferences.");
            return {
                theme: DEFAULT_THEME,
                accentColor: DEFAULT_ACCENT_COLOR,
                fontSize: DEFAULT_FONT_SIZE,
                borderRadius: DEFAULT_BORDER_RADIUS,
            };
        }
    });

    const applyPreferences = useCallback((newPrefs) => {
        const root = document.documentElement;
        const currentSystemTheme = typeof window !== "undefined" && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        const themeToApply = newPrefs.theme === 'system' ? currentSystemTheme : newPrefs.theme;

        root.setAttribute('data-ww-theme', themeToApply);
        if (typeof window !== "undefined") localStorage.setItem('theme', newPrefs.theme);
        // 2. Accent Color
        if (newPrefs.accentColor) {
            const primaryRgbArray = hexToRgbArray(newPrefs.accentColor);
            if (primaryRgbArray) {
                root.style.setProperty('--w-primary-rgb', primaryRgbArray.join(', '));
                root.style.setProperty('--w-primary', newPrefs.accentColor);

                const isEffectiveDark = themeToApply === 'dark';

                const textEmphasisRgb = isEffectiveDark
                    ? calculateLightenedRgb(primaryRgbArray, 60) // Sáng hơn cho text trên nền tối
                    : calculateDarkenedRgb(primaryRgbArray, 60);  // Tối hơn cho text trên nền sáng
                root.style.setProperty('--w-primary-text-emphasis-rgb', textEmphasisRgb.join(', '));
                root.style.setProperty('--w-primary-text-emphasis', `rgb(${textEmphasisRgb.join(', ')})`);


                const bgSubtleRgb = isEffectiveDark
                    ? calculateDarkenedRgb(primaryRgbArray, 40)   // Tối hơn nhiều cho nền subtle tối
                    : calculateLightenedRgb(primaryRgbArray, 42); // Sáng hơn nhiều (gần trắng) cho nền subtle sáng
                root.style.setProperty('--w-primary-bg-subtle-rgb', bgSubtleRgb.join(', '));
                root.style.setProperty('--w-primary-bg-subtle', `rgb(${bgSubtleRgb.join(', ')})`);


                const borderSubtleRgb = isEffectiveDark
                    ? calculateDarkenedRgb(primaryRgbArray, 65)
                    : calculateLightenedRgb(primaryRgbArray, 80);
                root.style.setProperty('--w-primary-border-subtle-rgb', borderSubtleRgb.join(', '));
                root.style.setProperty('--w-primary-border-subtle', `rgb(${borderSubtleRgb.join(', ')})`);

                const primaryDark = isEffectiveDark
                    ? calculateDarkenedRgb(primaryRgbArray, 40)
                    : calculateLightenedRgb(primaryRgbArray, 40)
                root.style.setProperty('--w-primary-dark-rgb', primaryDark.join(', '));
                root.style.setProperty('--w-primary-dark', `rgb(${primaryDark.join(', ')})`);

                const primaryLight = isEffectiveDark
                    ? calculateLightenedRgb(primaryRgbArray, 40)
                    : calculateDarkenedRgb(primaryRgbArray, 40)
                root.style.setProperty('--w-primary-light-rgb', primaryLight.join(', '));
                root.style.setProperty('--w-primary-light', `rgb(${primaryLight.join(', ')})`);
            }
            if (typeof window !== "undefined") localStorage.setItem('accentColor', newPrefs.accentColor);
        }

        // 3. Font Size
        if (newPrefs.fontSize) {
            let baseFontSize = '1rem';
            if (newPrefs.fontSize === 'small') baseFontSize = '0.875rem';
            else if (newPrefs.fontSize === 'large') baseFontSize = '1.125rem';
            root.style.setProperty('--w-body-font-size', baseFontSize);
            if (typeof window !== "undefined") localStorage.setItem('fontSize', newPrefs.fontSize);
        }

        // 4. Border Radius
        if (newPrefs.borderRadius) {
            let radiusValue = '0.375rem'; // medium
            let radiusSmValue = '0.25rem';
            let radiusLgValue = '0.5rem';

            if (newPrefs.borderRadius === 'none') {
                radiusValue = '0px'; radiusSmValue = '0px'; radiusLgValue = '0px';
            } else if (newPrefs.borderRadius === 'small') {
                radiusValue = '0.25rem'; radiusSmValue = '0.125rem'; radiusLgValue = '0.375rem';
            } else if (newPrefs.borderRadius === 'large') {
                radiusValue = '0.5rem'; radiusSmValue = '0.375rem'; radiusLgValue = '0.75rem';
            }
            root.style.setProperty('--w-border-radius', radiusValue);
            root.style.setProperty('--w-border-radius-sm', radiusSmValue);
            root.style.setProperty('--w-border-radius-lg', radiusLgValue);
            // Cập nhật các biến khác nếu cần: --w-border-radius-xl, --w-border-radius-xxl, --w-border-radius-pill
            if (typeof window !== "undefined") localStorage.setItem('borderRadius', newPrefs.borderRadius);
        }

        setPreferences(prev => ({ ...prev, ...newPrefs })); // Cập nhật state của hook
    }, []);


    // Áp dụng preferences khi component mount (sau khi script đồng bộ đã chạy)
    // và lắng nghe thay đổi theme hệ thống
    useEffect(() => {
        applyPreferences(preferences); // Áp dụng các giá trị đã load từ localStorage hoặc default

        const mediaQueryList = window.matchMedia('(prefers-color-scheme: dark)');
        const systemThemeChangeHandler = (e) => {
            // Chỉ áp dụng lại nếu theme đang là 'system'
            // Đọc lại từ localStorage vì state 'preferences' có thể chưa cập nhật ngay
            if (localStorage.getItem('theme') === 'system') {
                // Tạo một bản sao của preferences hiện tại và chỉ thay đổi theme
                // để đảm bảo các tùy chọn khác không bị ghi đè về mặc định
                const currentPrefs = {
                    theme: localStorage.getItem('theme') || DEFAULT_THEME,
                    accentColor: localStorage.getItem('accentColor') || DEFAULT_ACCENT_COLOR,
                    fontSize: localStorage.getItem('fontSize') || DEFAULT_FONT_SIZE,
                    borderRadius: localStorage.getItem('borderRadius') || DEFAULT_BORDER_RADIUS,
                };
                applyPreferences({ ...currentPrefs, theme: 'system' });
            }
        };
        mediaQueryList.addEventListener('change', systemThemeChangeHandler);
        return () => mediaQueryList.removeEventListener('change', systemThemeChangeHandler);
    }, []); // Chạy một lần sau khi script đồng bộ đã chạy

    const setSinglePreference = useCallback((key, value) => {
        const currentStoredPrefs = {
            theme: typeof window !== "undefined" ? localStorage.getItem('theme') || DEFAULT_THEME : DEFAULT_THEME,
            accentColor: typeof window !== "undefined" ? localStorage.getItem('accentColor') || DEFAULT_ACCENT_COLOR : DEFAULT_ACCENT_COLOR,
            fontSize: typeof window !== "undefined" ? localStorage.getItem('fontSize') || DEFAULT_FONT_SIZE : DEFAULT_FONT_SIZE,
            borderRadius: typeof window !== "undefined" ? localStorage.getItem('borderRadius') || DEFAULT_BORDER_RADIUS : DEFAULT_BORDER_RADIUS,
        };
        const newPrefs = { ...currentStoredPrefs, [key]: value };
        applyPreferences(newPrefs);
    }, [applyPreferences]);


    return { preferences, setSinglePreference, ACCENT_COLORS };
};

export default useUIPreferences;