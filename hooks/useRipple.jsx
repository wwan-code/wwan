import { useCallback } from 'react';

const useRipple = () => {

    const createRipple = useCallback((event) => {
        const button = event.currentTarget;

        const existingRipple = button.querySelector(".ripple");
        if (existingRipple) {
            existingRipple.remove();
        }

        const circle = document.createElement("span");
        circle.classList.add("ripple");

        const rect = button.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = event.clientX - rect.left - size / 2;
        const y = event.clientY - rect.top - size / 2;

        circle.style.width = circle.style.height = `${size}px`;
        circle.style.left = `${x}px`;
        circle.style.top = `${y}px`;

        button.appendChild(circle);

        circle.addEventListener("animationend", () => {
            circle.remove();
        });
    }, []);

    return { createRipple };
};

export default useRipple;
