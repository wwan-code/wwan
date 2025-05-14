import { useState, useEffect, useRef, useMemo } from "react";

const useThemeChange = () => {
    const defaultTheme = "light";
    const storageKey = "theme";

    const initialTheme = useMemo(() => {
        try {
            return localStorage.getItem(storageKey) || defaultTheme;
        } catch (error) {
            console.warn("LocalStorage is unavailable:", error);
            return defaultTheme;
        }
    }, []);

    const [activeTheme, setActiveTheme] = useState(initialTheme);
    const themeRef = useRef(initialTheme);

    const applyTheme = useRef((theme) => {
        try {
            localStorage.setItem(storageKey, theme);
        } catch (error) {
            console.warn("Failed to save theme to localStorage:", error);
        }

        const appliedTheme =
            theme === "system"
                ? window.matchMedia("(prefers-color-scheme: dark)").matches
                    ? "dark"
                    : "light"
                : theme;

        document.documentElement.setAttribute("data-ww-theme", appliedTheme);
        setActiveTheme(theme);
        updateThemeVisuals.current(theme, appliedTheme);
        themeRef.current = theme;
    });

    const updateThemeVisuals = useRef((theme, appliedTheme) => {
        const themeIcon = document.querySelector(".theme-icon-active");
        const themeText = document.querySelector("#nav-theme-text");
        const themeButton = document.querySelector(`[data-ww-theme-value="${theme}"]`);

        if (!themeIcon || !themeText || !themeButton) return;

        document.querySelectorAll("[data-ww-theme-value]").forEach((btn) => {
            btn.classList.remove("active");
            btn.setAttribute("aria-pressed", "false");
        });

        themeButton.classList.add("active");
        themeButton.setAttribute("aria-pressed", "true");

        const iconClass = appliedTheme === "dark" ? "fa-moon" : "fa-sun";
        requestAnimationFrame(() => {
            themeIcon.className = `fa ${iconClass} icon-base icon-md theme-icon-active`;
            themeText.setAttribute("aria-label", `Theme: ${appliedTheme}`);
        });
    });

    useEffect(() => {
        const currentTheme = initialTheme;
        document.documentElement.setAttribute("data-ww-theme", currentTheme);
    }, [initialTheme]);

    useEffect(() => {
        const storedTheme = themeRef.current;
        applyTheme.current(storedTheme);

        const mediaQueryList = window.matchMedia("(prefers-color-scheme: dark)");
        const systemThemeChangeHandler = () => {
            if (localStorage.getItem(storageKey) === "system") {
                applyTheme.current("system");
            }
        };

        mediaQueryList.addEventListener("change", systemThemeChangeHandler);

        return () => {
            mediaQueryList.removeEventListener("change", systemThemeChangeHandler);
        };
    }, []);

    return { activeTheme, changeTheme: applyTheme.current };
};

export default useThemeChange;
