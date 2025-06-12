import React from "react";

const InventoryItemCard = React.memo(({ invItem, onToggleActivation, isActivatingThis }) => {
    const itemDetails = invItem.itemDetails;
    if (!itemDetails) return null;

    const canBeActivated = ['AVATAR_FRAME', 'CHAT_COLOR', 'THEME_UNLOCK', 'PROFILE_BACKGROUND'].includes(itemDetails.type);
    const isConsumable = itemDetails.type === 'AD_SKIP_TICKET';

    return (
        <div className={`inventory-card ${invItem.isActive ? 'inventory-card--active' : ''}`}>
            <div className="inventory-card__top">
                {itemDetails.iconUrl && (
                    <div className="inventory-card__icon-wrapper">
                        <img
                            src={`${process.env.REACT_APP_API_URL}/${itemDetails.iconUrl}`}
                            alt={itemDetails.name}
                            className="inventory-card__icon"
                        />
                    </div>
                )}
                <div className="inventory-card__info">
                    <h5 className="inventory-card__name">{itemDetails.name}</h5>
                    <p className="inventory-card__description">{itemDetails.description}</p>
                    <div className="inventory-card__meta">
                        {isConsumable && <span className="inventory-card__quantity">Số lượng: {invItem.quantity}</span>}
                        {invItem.expiresAt && (
                            <span className={`inventory-card__expires ${new Date(invItem.expiresAt) < new Date() ? 'expired' : ''}`}>
                                Hết hạn: {new Date(invItem.expiresAt).toLocaleDateString('vi-VN')}
                            </span>
                        )}
                        {itemDetails.durationDays === null && !invItem.expiresAt && <span className="inventory-card__duration">Vĩnh viễn</span>}
                    </div>
                </div>
            </div>
            <div className="inventory-card__bottom">
                {canBeActivated && (
                    <button
                        className={`inventory-card__action-btn ${invItem.isActive ? 'btn-deactivate' : 'btn-activate'}`}
                        onClick={() => onToggleActivation(invItem.id)}
                        disabled={isActivatingThis || (invItem.expiresAt && new Date(invItem.expiresAt) < new Date())}
                    >
                        {isActivatingThis ? (
                            <span className="spinner--small"></span>
                        ) : invItem.isActive ? (
                            <> <i className="fas fa-times-circle icon-before"></i></>
                        ) : (invItem.expiresAt && new Date(invItem.expiresAt) < new Date()) ? (
                            'Đã hết hạn'
                        ) : (
                            <> <i className="fas fa-check-circle icon-before"></i></>
                        )}
                    </button>
                )}
            </div>
        </div>
    );
});

export default InventoryItemCard;