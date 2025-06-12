// src/components/Admin/ShopItemManagement/ShopItemForm.jsx
import { useState, useEffect } from 'react';
import { SHOP_ITEM_TYPES } from '@hooks/admin/useShopItemManagementLogic';
import { toast } from 'react-toastify';

const initialFormState = {
    name: "",
    description: "",
    type: SHOP_ITEM_TYPES[0]?.value || '',
    value: "",
    price: 0,
    iconUrl: "",
    durationDays: "",
    isActive: true,
    stock: "",
    requiredLevel: 1,
};

const ShopItemForm = ({ initialData, onSave, onDiscard, isSubmitting }) => {
    const [item, setItem] = useState(initialFormState);
    const [editingItemId, setEditingItemId] = useState(null);

    useEffect(() => {
        if (initialData) {
            setItem({
                name: initialData.name || "",
                description: initialData.description || "",
                type: initialData.type || SHOP_ITEM_TYPES[0]?.value,
                value: initialData.value || "",
                price: initialData.price || 0,
                iconUrl: initialData.iconUrl || "",
                durationDays: initialData.durationDays || "",
                isActive: initialData.isActive === undefined ? true : !!initialData.isActive,
                stock: initialData.stock === null || initialData.stock === undefined ? "" : initialData.stock,
                requiredLevel: initialData.requiredLevel || 1,
            });
            setEditingItemId(initialData.id || null);
        } else {
            setItem({
                name: "",
                description: "",
                type: SHOP_ITEM_TYPES[0]?.value || '', // Lấy giá trị đầu tiên làm mặc định
                value: "",
                price: 0,
                iconUrl: "",
                durationDays: "", // Để trống cho vĩnh viễn
                isActive: true,
                stock: "", // Để trống cho không giới hạn
                requiredLevel: 1,
            });
            setEditingItemId(null);
        }
    }, [initialData]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setItem(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleFormSave = (e) => {
        e.preventDefault();
        if (!item.name.trim() || !item.type.trim()) {
            toast.warn("Tên vật phẩm và Loại vật phẩm là bắt buộc.");
            return;
        }
        if (isNaN(parseInt(item.price, 10)) || parseInt(item.price, 10) < 0) {
            toast.warn("Giá vật phẩm phải là một số không âm.");
            return;
        }
        onSave(item, editingItemId);
    };

    return (
        <div className="card mb-4">
            <div className="card-header">
                <h5 className="card-title mb-0">{editingItemId ? "Chỉnh sửa Vật phẩm" : "Thêm Vật phẩm mới"}</h5>
            </div>
            <div className="card-body">
                <form onSubmit={handleFormSave}>
                    <div className="row">
                        <div className="col-md-6 mb-3">
                            <label htmlFor="itemName" className="form-label">Tên vật phẩm <span className="text-danger">*</span></label>
                            <input type="text" className="form-control" id="itemName" name="name" value={item.name} onChange={handleChange} required disabled={isSubmitting} />
                        </div>
                        <div className="col-md-6 mb-3">
                            <label htmlFor="itemType" className="form-label">Loại vật phẩm <span className="text-danger">*</span></label>
                            <select className="form-select" id="itemType" name="type" value={item.type} onChange={handleChange} required disabled={isSubmitting}>
                                {SHOP_ITEM_TYPES.map(typeOpt => (
                                    <option key={typeOpt.value} value={typeOpt.value}>{typeOpt.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="mb-3">
                        <label htmlFor="itemDescription" className="form-label">Mô tả</label>
                        <textarea className="form-control" id="itemDescription" name="description" value={item.description} onChange={handleChange} rows="3" disabled={isSubmitting}></textarea>
                    </div>

                    <div className="row">
                        <div className="col-md-6 mb-3">
                            <label htmlFor="itemValue" className="form-label">Giá trị/Dữ liệu</label>
                            <input type="text" className="form-control" id="itemValue" name="value" value={item.value} onChange={handleChange} placeholder="VD: #FF0000, ten_khung_avatar, ten_theme" disabled={isSubmitting} />
                            <small className="form-text text-muted">Mã màu, tên class CSS, URL icon, số lượng (cho vé), v.v.</small>
                        </div>
                        <div className="col-md-6 mb-3">
                            <label htmlFor="itemIconUrl" className="form-label">URL Icon (tùy chọn)</label>
                            <input type="text" className="form-control" id="itemIconUrl" name="iconUrl" value={item.iconUrl} onChange={handleChange} placeholder="Đường dẫn đến ảnh icon" disabled={isSubmitting} />
                        </div>
                    </div>

                    <div className="row">
                        <div className="col-md-4 mb-3">
                            <label htmlFor="itemPrice" className="form-label">Giá (điểm) <span className="text-danger">*</span></label>
                            <input type="number" className="form-control" id="itemPrice" name="price" value={item.price} onChange={handleChange} required min="0" disabled={isSubmitting} />
                        </div>
                        <div className="col-md-4 mb-3">
                            <label htmlFor="itemRequiredLevel" className="form-label">Cấp độ yêu cầu</label>
                            <input type="number" className="form-control" id="itemRequiredLevel" name="requiredLevel" value={item.requiredLevel} onChange={handleChange} min="1" disabled={isSubmitting} />
                        </div>
                        <div className="col-md-4 mb-3">
                            <label htmlFor="itemDurationDays" className="form-label">Thời hạn (ngày)</label>
                            <input type="number" className="form-control" id="itemDurationDays" name="durationDays" value={item.durationDays} onChange={handleChange} placeholder="Để trống nếu vĩnh viễn" min="1" disabled={isSubmitting} />
                        </div>
                    </div>

                    <div className="row">
                        <div className="col-md-6 mb-3">
                            <label htmlFor="itemStock" className="form-label">Tồn kho</label>
                            <input type="number" className="form-control" id="itemStock" name="stock" value={item.stock} onChange={handleChange} placeholder="Để trống nếu không giới hạn" min="0" disabled={isSubmitting} />
                        </div>
                        <div className="col-md-6 mb-3 d-flex align-items-center mt-3 pt-1">
                            <div className="form-check form-switch">
                                <input className="form-check-input" type="checkbox" role="switch" id="itemIsActive" name="isActive" checked={item.isActive} onChange={handleChange} disabled={isSubmitting} />
                                <label className="form-check-label" htmlFor="itemIsActive">Đang bán trong cửa hàng</label>
                            </div>
                        </div>
                    </div>

                    <div className="d-flex justify-content-end gap-2">
                        {editingItemId && (
                            <button className="btn btn-outline-secondary" onClick={onDiscard} disabled={isSubmitting}>
                                Hủy
                            </button>
                        )}
                        <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                            {isSubmitting ? <i className="fas fa-spinner fa-spin me-2"></i> : (editingItemId ? 'Cập nhật Vật phẩm' : 'Thêm Vật phẩm')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ShopItemForm;