// components/ConfirmDeleteModal.js
import React from 'react';

const ConfirmDeleteModal = ({ show, item, onConfirm, onCancel }) => {
    if (!show) {
        return null;
    }

    return (
        <div className="confirm-delete-popup show"> {/* Giữ class show để CSS hoạt động */}
            <div className="confirm-delete-popup__container">
                <div className="confirm-delete-popup__content">
                    <h2>Xác nhận xóa</h2>
                    <p>Bạn có chắc chắn muốn xóa {item?.type === 'comment' ? 'bình luận này' : 'phản hồi này'}?</p>
                </div>
                <div className="confirm-delete-popup__footer">
                    <button className="confirm-delete-popup__no" onClick={onCancel}>Hủy</button>
                    <button className="confirm-delete-popup__yes" onClick={() => onConfirm(item)}>Đồng ý</button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmDeleteModal;