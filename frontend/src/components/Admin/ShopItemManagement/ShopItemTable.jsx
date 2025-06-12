// src/components/Admin/ShopItemManagement/ShopItemTable.jsx
import { SHOP_ITEM_TYPES } from '@hooks/admin/useShopItemManagementLogic';

const ShopItemTable = ({
    displayedData,
    onEdit,
    onDelete,
    requestSort,
    sortConfig,
    isDataLoading,
    isSubmitting,
}) => {
    const getSortIcon = (key) => {
        if (sortConfig.key !== key) return null;
        return sortConfig.direction === 'asc' ? (
            <i className="fas fa-sort-up ms-1"></i>
        ) : (
            <i className="fas fa-sort-down ms-1"></i>
        );
    };

    const getHeaderStyle = (key) => ({
        cursor: 'pointer',
        color: sortConfig.key === key ? 'var(--bs-primary)' : 'var(--bs-heading-color)',
        transition: 'color 0.3s ease',
    });
    const getItemTypeLabel = (typeValue) => {
        const typeObj = SHOP_ITEM_TYPES.find(t => t.value === typeValue);
        return typeObj ? typeObj.label : typeValue;
    };

    return (
        <div className="table-responsive">
            <table className="table table-hover align-middle">
                <thead>
                    <tr>
                        <th onClick={() => requestSort('name')} style={getHeaderStyle('name')}>Tên Vật phẩm {getSortIcon('name')}</th>
                        <th onClick={() => requestSort('type')} style={getHeaderStyle('type')}>Loại {getSortIcon('type')}</th>
                        <th onClick={() => requestSort('price')} style={getHeaderStyle('price')} className="text-end">Giá (Điểm) {getSortIcon('price')}</th>
                        <th onClick={() => requestSort('requiredLevel')} style={getHeaderStyle('requiredLevel')} className="text-center">Cấp YC {getSortIcon('requiredLevel')}</th>
                        <th onClick={() => requestSort('stock')} style={getHeaderStyle('stock')} className="text-center">Tồn kho {getSortIcon('stock')}</th>
                        <th onClick={() => requestSort('isActive')} style={getHeaderStyle('isActive')} className="text-center">Trạng thái {getSortIcon('isActive')}</th>
                        <th className="text-center">Hành động</th>
                    </tr>
                </thead>
                <tbody>
                    {isDataLoading ? (
                        <tr><td colSpan="7" className="text-center p-5"><i className="fas fa-spinner fa-spin fa-2x"></i></td></tr>
                    ) : displayedData.length === 0 ? (
                        <tr><td colSpan="7" className="text-center p-5">Không có vật phẩm nào.</td></tr>
                    ) : (
                        displayedData.map((item) => (
                            <tr key={item.id}>
                                <td>
                                    {item.iconUrl && <img src={item.iconUrl.startsWith('http') ? item.iconUrl : `${process.env.REACT_APP_API_URL}/${item.iconUrl}`} alt="" width="24" height="24" className="me-2 rounded" />}
                                    {item.name}
                                    {item.value && <small className="d-block text-muted" title={item.value}>Giá trị: {item.value.length > 20 ? item.value.substring(0, 17) + '...' : item.value}</small>}
                                </td>
                                <td>{getItemTypeLabel(item.type)}</td>
                                <td className="text-end">{item.price.toLocaleString()}</td>
                                <td className="text-center">{item.requiredLevel}</td>
                                <td className="text-center">{item.stock === null ? <span className="badge bg-success-subtle">Không giới hạn</span> : item.stock}</td>
                                <td className="text-center">
                                    {item.isActive ? <span className="badge bg-primary">Đang bán</span> : <span className="badge bg-secondary">Ngừng bán</span>}
                                </td>
                                <td className="text-center">
                                    <button
                                        className="btn btn-icon btn-edit"
                                        onClick={() => onEdit(item)}
                                        title="Chỉnh sửa"
                                        disabled={isSubmitting}
                                    >
                                        <i className="icon-base fas fa-edit text-info"></i>
                                    </button>
                                    <button
                                        className="btn btn-icon btn-delete"
                                        onClick={() => onDelete(item.id)}
                                        title="Xóa"
                                        disabled={isSubmitting}
                                    >
                                        <i className="icon-base fas fa-trash text-danger"></i>
                                    </button>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default ShopItemTable;