// src/pages/admin/ShopItemManagement.jsx
import { useShopItemManagementLogic } from '@hooks/admin/useShopItemManagementLogic';
import ShopItemForm from '@components/Admin/ShopItemManagement/ShopItemForm';
import ShopItemTable from '@components/Admin/ShopItemManagement/ShopItemTable';
import TableControls from '@components/Admin/Common/TableControls';

const ShopItemManagement = () => {
    const {
        editingItemData,
        isDataLoading,
        isSubmitting,
        handleSave,
        handleDelete,
        handleEdit,
        handleDiscard,
        displayedData,
        totalPages,
        currentPage,
        searchTerm,
        handleSearch,
        requestSort,
        goToPage,
        sortConfig,
        itemsPerPage,
        handleItemsPerPageChange,
        totalEntries,
        filteredEntries,
        startEntry,
        endEntry,
    } = useShopItemManagementLogic();

    return (
        <div className="container-fluid flex-grow-1 container-p-y">
            <h4 className="py-3 mb-4">
                <i className="fas fa-store icon-before"></i> Quản lý Cửa hàng Vật phẩm
            </h4>

            <ShopItemForm
                initialData={editingItemData}
                onSave={handleSave}
                onDiscard={handleDiscard}
                isSubmitting={isSubmitting}
            />

            <div className="card mt-4">
                <div className="card-header">
                    <h5 className="card-title mb-0">Danh sách Vật phẩm</h5>
                </div>
                <div className="card-body">
                    <TableControls
                        searchTerm={searchTerm}
                        onSearchChange={handleSearch}
                        itemsPerPage={itemsPerPage}
                        onItemsPerPageChange={handleItemsPerPageChange}
                    />
                    <ShopItemTable
                        displayedData={displayedData}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        requestSort={requestSort}
                        sortConfig={sortConfig}
                        isDataLoading={isDataLoading}
                        isSubmitting={isSubmitting}
                    />
                    {(totalPages > 0) && (
                        <div className="row mt-3 mx-0 justify-content-between align-items-center">
                            <div className="col-sm-12 col-md-5">
                                <div className="dt-info">
                                    {`Hiển thị ${startEntry} đến ${endEntry} của ${filteredEntries} mục`}
                                    {filteredEntries !== totalEntries && ` (lọc từ ${totalEntries} tổng số)`}
                                </div>
                            </div>
                            <div className="col-sm-12 col-md-7">
                                <div className="dt-paging d-flex justify-content-end">
                                    <nav>
                                        <ul className="pagination pagination-sm mb-0">
                                            <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                                                <button className="page-link" onClick={() => goToPage(1)} disabled={currentPage === 1}>&laquo;</button>
                                            </li>
                                            <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                                                <button className="page-link" onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1}>&lsaquo;</button>
                                            </li>
                                            {Array.from({ length: totalPages }, (_, i) => (
                                                <li key={i} className={`page-item ${currentPage === i + 1 ? 'active' : ''}`}>
                                                    <button className="page-link" onClick={() => goToPage(i + 1)}>{i + 1}</button>
                                                </li>
                                            ))}
                                            <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                                                <button className="page-link" onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages}>&rsaquo;</button>
                                            </li>
                                            <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                                                <button className="page-link" onClick={() => goToPage(totalPages)} disabled={currentPage === totalPages}>&raquo;</button>
                                            </li>
                                        </ul>
                                    </nav>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ShopItemManagement;