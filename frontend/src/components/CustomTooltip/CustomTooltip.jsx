// src/components/CustomTooltip/CustomTooltip.jsx
import { forwardRef } from 'react';
import PropTypes from 'prop-types';
import classNames from '@utils/classNames';

const CustomTooltip = forwardRef(
    ({ id, children, placement, arrowProps, style, className, role = 'tooltip', show, ...popperAttributes }, ref) => {
        return (
            <div
                ref={ref}
                id={id}
                role={role}
                className={classNames(
                    'custom-tooltip',
                    'fade',
                    { 'show': show },
                    placement && `bs-tooltip-${placement.split('-')[0]}`,
                    className
                )}
                style={style}
                {...popperAttributes}
            >
                <div
                    className="custom-tooltip-arrow"
                    ref={arrowProps?.ref}
                    style={arrowProps?.style}
                    data-popper-arrow
                />
                <div className="custom-tooltip-inner">
                    {children}
                </div>
            </div>
        );
    }
);

CustomTooltip.propTypes = {
    id: PropTypes.string,
    children: PropTypes.node.isRequired,
    placement: PropTypes.string,
    arrowProps: PropTypes.shape({
        ref: PropTypes.oneOfType([
            PropTypes.func,
            PropTypes.shape({ current: PropTypes.instanceOf(Element) })
        ]),
        style: PropTypes.object,
    }),
    style: PropTypes.object,
    className: PropTypes.string,
    role: PropTypes.string,
    show: PropTypes.bool,
};

CustomTooltip.displayName = 'CustomTooltip';

export default CustomTooltip;