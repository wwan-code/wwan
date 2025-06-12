import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useSelector, useDispatch } from 'react-redux';
import authHeader from '@services/auth-header';
import { toast } from 'react-toastify';
import { updateUserPointsAndLevel } from '@features/userSlice';
import { Link } from 'react-router-dom';
import classNames from '@utils/classNames';

const ShopPage = () => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [purchasingId, setPurchasingId] = useState(null);

    const { user: currentUser, isLoggedIn } = useSelector((state) => state.user);
    const dispatch = useDispatch();

    const fetchShopItems = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await axios.get('/api/shop/items', { headers: authHeader() });
            if (response.data.success) {
                setItems(response.data.items || []);
            } else {
                throw new Error(response.data.message || "Không thể tải vật phẩm cửa hàng.");
            }
        } catch (err) {
            setError(err.message);
            toast.error(err.message || "Lỗi tải vật phẩm.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchShopItems();
    }, [fetchShopItems]);

    const handlePurchase = async (itemId, price, itemName, itemType) => {
        if (!isLoggedIn) {
            toast.info("Vui lòng đăng nhập để mua vật phẩm.");
            return;
        }
        if (price > 0 && currentUser.points < price) {
            toast.warn("Bạn không đủ điểm để mua vật phẩm này.");
            return;
        }
        if (!window.confirm(`Bạn có chắc muốn mua "${itemName}" ${itemType === 'AD_SKIP_TICKET' ? '' : 'vĩnh viễn '}với giá ${price} điểm?`)) {
            return;
        }

        setPurchasingId(itemId);
        try {
            const response = await axios.post(`/api/shop/items/${itemId}/purchase`, {}, { headers: authHeader() });
            if (response.data.success) {
                toast.success(response.data.message);
                dispatch(updateUserPointsAndLevel({ points: response.data.userPoints }));
                // Tải lại danh sách vật phẩm để cập nhật stock và ẩn item vừa mua nếu nó không cộng dồn
                fetchShopItems();
            } else {
                throw new Error(response.data.message || "Mua vật phẩm thất bại.");
            }
        } catch (err) {
            toast.error(err.response?.data?.message || err.message || "Lỗi khi mua vật phẩm.");
        } finally {
            setPurchasingId(null);
        }
    };

    if (loading) {
        return (
            <div className="shop-page-container">
                <div className="loading-placeholder" style={{textAlign: 'center', padding: '2rem'}}>
                    <div className="spinner" style={{width: '3rem', height: '3rem', borderWidth: '.3em', color: 'var(--w-primary)', margin: '0 auto .5rem auto'}}></div>
                    <p>Đang tải cửa hàng...</p>
                </div>
            </div>
        );
    }
    if (error) {
         return (
            <div className="shop-page-container">
                 <div className="alert-message alert-danger" style={{textAlign: 'center', padding: '1rem', backgroundColor: 'var(--w-danger-bg-subtle)', color: 'var(--w-danger-text-emphasis)', border: '1px solid var(--w-danger-border-subtle)'}}>Lỗi: {error}</div>
            </div>
        );
    }

    return (
        <div className="shop-page-container container">
            <h2 className="shop-page-title">Cửa Hàng Vật Phẩm</h2>
            {items.length === 0 && !loading ? (
                <div className="alert-message alert-info" style={{textAlign: 'center', padding: '1rem', backgroundColor: 'var(--w-info-bg-subtle)', color: 'var(--w-info-text-emphasis)', border: '1px solid var(--w-info-border-subtle)'}}>
                    Cửa hàng hiện không có vật phẩm nào phù hợp với bạn hoặc tất cả vật phẩm đã được bạn sở hữu.
                </div>
            ) : (
                <div className="shop-items-grid">
                    {items.map(item => {
                        const userRoles = currentUser?.roles || [];
                        let canPurchaseByRole = true;
                        let purchaseDisabledMessage = '';

                        if (item.value === 'assets/icons/frames/admin.png' && !userRoles.includes('ROLE_ADMIN')) {
                            canPurchaseByRole = false;
                            purchaseDisabledMessage = 'Chỉ Admin';
                        } else if (item.value === 'assets/icons/frames/editor.png' && !userRoles.includes('ROLE_EDITOR') && !userRoles.includes('ROLE_ADMIN')) {
                            canPurchaseByRole = false;
                            purchaseDisabledMessage = 'Chỉ Editor/Admin';
                        }

                        const meetsLevelRequirement = currentUser ? currentUser.level >= item.requiredLevel : false;
                        const hasSufficientPoints = currentUser ? (item.price === 0 || currentUser.points >= item.price) : false;
                        const inStock = item.stock === null || item.stock > 0;

                        let buttonText = 'Mua Ngay';
                        let buttonDisabled = purchasingId === item.id || !isLoggedIn;

                        if (!isLoggedIn) {
                            buttonText = 'Đăng nhập để mua';
                        } else if (!canPurchaseByRole) {
                            buttonText = purchaseDisabledMessage;
                            buttonDisabled = true;
                        } else if (!meetsLevelRequirement) {
                            buttonText = `Cần cấp ${item.requiredLevel}`;
                            buttonDisabled = true;
                        } else if (!inStock) {
                            buttonText = 'Hết hàng';
                            buttonDisabled = true;
                        } else if (!hasSufficientPoints && item.price > 0) {
                            buttonText = `Cần ${item.price} điểm`;
                            buttonDisabled = true;
                        }

                        if (purchasingId === item.id) {
                            buttonText = <span className="spinner--small"></span>;
                        }

                        return (
                            <div key={item.id} className="shop-item-card-wrapper">
                                 <div className={classNames("shop-item-card", { 'item-unavailable': buttonDisabled && isLoggedIn })}>
                                    <div className="shop-item-card__top">
                                        {item.iconUrl ? (
                                            <div className="shop-item-card__image-container">
                                                <img
                                                    src={process.env.REACT_APP_API_URL + '/' + item.iconUrl}
                                                    alt={item.name}
                                                    className="shop-item-card__image"
                                                />
                                            </div>
                                        ) : (
                                            <div className="shop-item-card__image-placeholder">
                                                <i className="fas fa-gift fa-3x"></i>
                                            </div>
                                        )}
                                        <div className="shop-item-card__body">
                                            <h5 className="shop-item-card__title">{item.name}</h5>
                                            <p className="shop-item-card__description">
                                                {item.description}
                                                {item.durationDays && <><br /><em>Thời hạn: {item.durationDays} ngày</em></>}
                                                {item.requiredLevel > 1 && <><br /><em>Yêu cầu: Cấp {item.requiredLevel}</em></>}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="shop-item-card__bottom">
                                        <div className="shop-item-card__meta">
                                            <span className="item-price">{item.price === 0 ? "Miễn phí" : `${item.price} điểm`}</span>
                                            {item.stock !== null && <span className="item-stock">Còn: {item.stock}</span>}
                                        </div>
                                        <button
                                            type="button"
                                            className="btn btn--primary btn--full-width"
                                            onClick={() => handlePurchase(item.id, item.price, item.name, item.type)}
                                            disabled={buttonDisabled}
                                        >
                                            {buttonText}
                                        </button>
                                    </div>
                                </div>

                            </div>
                        );
                    })}
                </div>
            )}
            {isLoggedIn &&
                <div className="shop-page__actions">
                    <Link to="/profile?tab=inventory" className="btn btn--outline-primary">
                        Xem Kho Đồ Của Bạn
                    </Link>
                </div>
            }
        </div>
    );
};

export default ShopPage;