import { useEffect } from "react";
import classNames from '@utils/classNames';
// --- Custom Modal Component ---
const CustomModal = ({ show, onHide, title, children, footer, size = "md", submitting, modalId, classNameModal }) => {
    useEffect(() => {
        const handleEsc = (event) => {
            if (event.keyCode === 27 && show && !submitting) {
                onHide();
            }
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [show, onHide, submitting]);

    return (
        <div className={classNames("custom-modal-overlay", classNameModal, { "show": show })} onClick={!submitting ? onHide : undefined} role="dialog" aria-modal="true" aria-labelledby={modalId ? `${modalId}-title` : undefined}>
            <div className={classNames("custom-modal", `custom-modal-${size}`, { "show": show })} onClick={e => e.stopPropagation()}>
                <div className="custom-modal-header">
                    <h5 className="custom-modal-title" id={modalId ? `${modalId}-title` : undefined}>{title}</h5>
                    {!submitting && <button type="button" className="btn-close" onClick={onHide} aria-label="Close"></button>}
                </div>
                <div className="custom-modal-body">{children}</div>
                {footer && <div className="custom-modal-footer">{footer}</div>}
            </div>
        </div>
    );
};

export default CustomModal;