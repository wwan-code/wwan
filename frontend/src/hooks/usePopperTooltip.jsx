// src/hooks/usePopperTooltip.js
import { useState, useCallback, useRef, useEffect } from 'react';
import { createPopper } from '@popperjs/core';

const PLACEMENTS = [
    'auto', 'auto-start', 'auto-end',
    'top', 'top-start', 'top-end',
    'bottom', 'bottom-start', 'bottom-end',
    'right', 'right-start', 'right-end',
    'left', 'left-start', 'left-end',
];
const TRIGGERS = ['hover', 'focus', 'click'];

export function usePopperTooltip({
    placement = 'top',
    trigger = 'hover',
    delay: delayProp = 0,
    offset = [0, 8],
    strategy = 'absolute',
    modifiers: customModifiers = [],
    onFirstUpdate,
} = {}) {
    const [visible, setVisible] = useState(false);
    const [referenceElement, setReferenceElement] = useState(null);
    const [popperElement, setPopperElement] = useState(null);
    const [arrowElement, setArrowElement] = useState(null);

    const popperInstanceRef = useRef(null);
    const showTimeoutRef = useRef(null);
    const hideTimeoutRef = useRef(null);

    const clearTimeouts = useCallback(() => {
        if (showTimeoutRef.current) clearTimeout(showTimeoutRef.current);
        if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    }, []);

    const getDelay = useCallback((type) => {
        if (typeof delayProp === 'number') {
            return delayProp;
        }
        return delayProp?.[type] || 0;
    }, [delayProp]);

    const showTooltip = useCallback(() => {
        clearTimeouts();
        const showDelay = getDelay('show');
        if (showDelay > 0) {
            showTimeoutRef.current = setTimeout(() => setVisible(true), showDelay);
        } else {
            setVisible(true);
        }
    }, [clearTimeouts, getDelay]);

    const hideTooltip = useCallback(() => {
        clearTimeouts();
        const hideDelay = getDelay('hide');
        if (hideDelay > 0) {
            hideTimeoutRef.current = setTimeout(() => setVisible(false), hideDelay);
        } else {
            setVisible(false);
        }
    }, [clearTimeouts, getDelay]);

    const toggleTooltip = useCallback(() => {
        setVisible(v => !v);
    }, []);

    useEffect(() => {
        if (referenceElement && popperElement) {
            const modifiers = [
                { name: 'arrow', options: { element: arrowElement, padding: 5 } },
                { name: 'offset', options: { offset } },
                ...customModifiers,
            ];

            if (popperInstanceRef.current) {
                popperInstanceRef.current.destroy();
            }

            popperInstanceRef.current = createPopper(referenceElement, popperElement, {
                placement,
                strategy,
                modifiers,
                onFirstUpdate,
            });
        }

        return () => {
            if (popperInstanceRef.current) {
                popperInstanceRef.current.destroy();
                popperInstanceRef.current = null;
            }
            clearTimeouts();
        };
    }, [referenceElement, popperElement, arrowElement, placement, strategy, offset, customModifiers, onFirstUpdate, clearTimeouts]);

    useEffect(() => {
        if (!referenceElement) return;

        const triggers = Array.isArray(trigger) ? trigger : [trigger];
        const eventHandlers = {};
        let isMouseDownOnRef = false;

        if (triggers.includes('hover')) {
            eventHandlers.mouseenter = showTooltip;
            eventHandlers.mouseleave = hideTooltip;
        }
        if (triggers.includes('focus')) {
            eventHandlers.focus = showTooltip;
            eventHandlers.blur = hideTooltip;
        }
        if (triggers.includes('click')) {
            eventHandlers.mousedown = () => { isMouseDownOnRef = true; };
            eventHandlers.click = (e) => {
                e.stopPropagation(); // Optional, might interfere with global click listeners
                if (isMouseDownOnRef) {
                    toggleTooltip();
                }
                isMouseDownOnRef = false;
            };
        }

        Object.entries(eventHandlers).forEach(([eventName, handler]) => {
            referenceElement.addEventListener(eventName, handler);
        });

        return () => {
            Object.entries(eventHandlers).forEach(([eventName, handler]) => {
                if (referenceElement) {
                    referenceElement.removeEventListener(eventName, handler);
                }
            });
        };
    }, [referenceElement, trigger, showTooltip, hideTooltip, toggleTooltip]);

    // Click outside listener for 'click' trigger
    useEffect(() => {
        if (!visible || !trigger.includes('click') || !popperElement) return;

        const handleClickOutside = (event) => {
            if (
                popperElement && !popperElement.contains(event.target) &&
                referenceElement && !referenceElement.contains(event.target)
            ) {
                setVisible(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [visible, trigger, popperElement, referenceElement]);

    return {
        visible,
        reference: setReferenceElement,
        popper: setPopperElement,
        arrow: setArrowElement,
        styles: popperInstanceRef.current?.state?.styles?.popper,
        arrowStyles: popperInstanceRef.current?.state?.styles?.arrow,
        attributes: popperInstanceRef.current?.state?.attributes?.popper,
        update: popperInstanceRef.current?.update,
        show: showTooltip,
        hide: hideTooltip,
        toggle: toggleTooltip,
    };
}