// pages/CategoryManagement.js
import React from 'react';
// Import hook và các component con mới
import { useCategoryManagementLogic } from '../../hooks/useCategoryManagementLogic';
import CategoryForm from '../../components/CategoryManagement/CategoryForm';
import CategoryTable from '../../components/CategoryManagement/CategoryTable';
import TableControls from '../../components/CategoryManagement/TableControls'; // Sử dụng lại

const CategoryManagement = () => {
    // Sử dụng hook mới
    const {
        editingCategoryData, // Đổi tên
        isDataLoading,
        isSubmitting,
        handleSave,
        handleDelete,
        handleEdit,
        handleDiscard,
        handleSaveDraft,
        // Props cho bảng và controls (giữ nguyên tên)
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
    } = useCategoryManagementLogic(); // Gọi hook mới

    return (
        <>
            <div className="flex-grow-1 container-p-y container-fluid">
                {/* Sử dụng CategoryForm */}
                <CategoryForm
                    initialData={editingCategoryData}
                    onSave={handleSave}
                    onDiscard={handleDiscard}
                    onSaveDraft={handleSaveDraft}
                    isSubmitting={isSubmitting}
                />

                {/* Sử dụng lại TableControls */}
                <TableControls
                    searchTerm={searchTerm}
                    handleSearch={handleSearch}
                    itemsPerPage={itemsPerPage}
                    handleItemsPerPageChange={handleItemsPerPageChange}
                />
                {/* Sử dụng CategoryTable */}
                <CategoryTable
                    displayedData={displayedData}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    requestSort={requestSort}
                    sortConfig={sortConfig}
                    isDataLoading={isDataLoading}
                    isSubmitting={isSubmitting}
                />
                {(totalPages > 0) && (
                    <div className="row justify-content-between">
                        <div className="d-md-flex justify-content-between align-items-center dt-layout-start col-md-auto me-auto">
                            <div className="dt-info">
                                {`Hiển thị ${startEntry} đến ${endEntry} của ${filteredEntries} mục`}
                                {filteredEntries !== totalEntries && ` (lọc từ ${totalEntries} tổng số)`}
                            </div>
                        </div>
                        <div className="d-md-flex justify-content-between align-items-center dt-layout-end col-md-auto ms-auto">
                            <div className="dt-paging">
                                <nav>
                                    <ul className="pagination pagination-sm mb-0">
                                        <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                                            <button className="page-link" onClick={() => goToPage(1)} disabled={currentPage === 1}>
                                                &laquo; {/* First */}
                                            </button>
                                        </li>
                                        <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                                            <button className="page-link" onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1}>
                                                &lsaquo; {/* Previous */}
                                            </button>
                                        </li>
                                        {/* Logic hiển thị các trang số - có thể phức tạp hơn để chỉ hiện vài trang */}
                                        {Array.from({ length: totalPages }, (_, i) => (
                                            <li key={i} className={`page-item ${currentPage === i + 1 ? 'active' : ''}`}>
                                                <button className="page-link" onClick={() => goToPage(i + 1)}>
                                                    {i + 1}
                                                </button>
                                            </li>
                                        ))}
                                        <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                                            <button className="page-link" onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages}>
                                                &rsaquo; {/* Next */}
                                            </button>
                                        </li>
                                        <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                                            <button className="page-link" onClick={() => goToPage(totalPages)} disabled={currentPage === totalPages}>
                                                &raquo; {/* Last */}
                                            </button>
                                        </li>
                                    </ul>
                                </nav>
                            </div>
                        </div>
                    </div>
                )}
            </div>

        </>
    );
};

export default CategoryManagement;