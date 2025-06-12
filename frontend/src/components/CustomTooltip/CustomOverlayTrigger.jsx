// src/components/CustomTooltip/CustomOverlayTrigger.jsx
import React, { cloneElement, isValidElement, useCallback } from 'react';
import PropTypes from 'prop-types';
import { createPortal } from 'react-dom';
import { usePopperTooltip } from '@hooks/usePopperTooltip';
import CustomTooltip from './CustomTooltip';

const CustomOverlayTrigger = ({
    children,
    tooltip,
    tooltipId,
    placement = 'top',
    trigger = ['hover', 'focus'],
    delay = { show: 0, hide: 0 },
    offset = [0, 8],
    flip = true,
    container = document.body, // Cho phép tùy chỉnh container của portal
    show: controlledShow, // Prop để điều khiển từ bên ngoài
    onToggle, // Callback khi visibility thay đổi
    ...popperProps // Các props khác cho usePopperTooltip
}) => {
    const handlePopperFirstUpdate = useCallback((state) => {
        // Có thể làm gì đó khi popper được định vị lần đầu
        // console.log('Popper first updated:', state);
    }, []);

    const {
        visible,
        reference,
        popper,
        arrow,
        styles: popperCalculatedStyles, // Styles đã được Popper tính toán
        arrowStyles: popperArrowStyles,
        attributes: popperAttributes,
    } = usePopperTooltip({
        placement,
        trigger: controlledShow !== undefined ? [] : trigger, // Vô hiệu hóa trigger nội tại nếu đang được kiểm soát từ bên ngoài
        delay,
        offset,
        modifiers: [
            { name: 'flip', enabled: flip },
            { name: 'preventOverflow', options: { padding: 8 } } // Ví dụ thêm modifier
        ],
        onFirstUpdate: handlePopperFirstUpdate,
        ...popperProps,
    });

    const actualVisible = controlledShow !== undefined ? controlledShow : visible;

    // Thông báo thay đổi visibility nếu có callback
    React.useEffect(() => {
        onToggle?.(actualVisible);
    }, [actualVisible, onToggle]);


    if (!isValidElement(children)) {
        console.error("CustomOverlayTrigger: Children must be a single valid React element.");
        return children;
    }

    const triggerElement = cloneElement(children, {
        ref: reference,
        'aria-describedby': actualVisible ? tooltipId : undefined,
    });

    // Tạo bản sao để tránh lỗi "Cannot freeze"
    const tooltipStyle = popperCalculatedStyles ? { ...popperCalculatedStyles } : {};
    const arrowFinalStyle = popperArrowStyles ? { ...popperArrowStyles } : {};

    const tooltipComponent = (
        <CustomTooltip
            id={tooltipId}
            ref={popper}
            style={tooltipStyle}
            placement={popperAttributes?.['data-popper-placement'] || placement}
            arrowProps={{ ref: arrow, style: arrowFinalStyle }}
            show={actualVisible} // Prop để điều khiển class 'show'
            {...popperAttributes} // Các attributes khác từ Popper
        >
            {tooltip}
        </CustomTooltip>
    );

    return (
        <>
            {triggerElement}
            {/* Render tooltip vào DOM (có thể ẩn bằng CSS) khi trigger tồn tại, 
               và chỉ thực sự hiển thị (thêm class .show) khi actualVisible là true.
               Hoặc chỉ render khi actualVisible để tối ưu hơn nếu không cần giữ tooltip trong DOM.
               createPortal giúp tooltip không bị ảnh hưởng bởi overflow:hidden của parent
            */}
            {actualVisible && container && createPortal(tooltipComponent, container)}
            {!container && actualVisible && tooltipComponent /* Render inline nếu không có container (ít dùng) */}
        </>
    );
};

CustomOverlayTrigger.propTypes = {
    children: PropTypes.element.isRequired,
    tooltip: PropTypes.node.isRequired,
    tooltipId: PropTypes.string.isRequired,
    placement: PropTypes.oneOf([
        'auto', 'auto-start', 'auto-end',
        'top', 'top-start', 'top-end',
        'bottom', 'bottom-start', 'bottom-end',
        'right', 'right-start', 'right-end',
        'left', 'left-start', 'left-end',
    ]),
    trigger: PropTypes.oneOfType([
        PropTypes.oneOf(['hover', 'focus', 'click']),
        PropTypes.arrayOf(PropTypes.oneOf(['hover', 'focus', 'click'])),
    ]),
    delay: PropTypes.oneOfType([
        PropTypes.number,
        PropTypes.shape({ show: PropTypes.number, hide: PropTypes.number }),
    ]),
    offset: PropTypes.arrayOf(PropTypes.number),
    flip: PropTypes.bool,
    container: PropTypes.instanceOf(Element), // Hoặc null
    show: PropTypes.bool, // Prop để điều khiển từ bên ngoài
    onToggle: PropTypes.func, // Callback khi visibility thay đổi
};

export default CustomOverlayTrigger;