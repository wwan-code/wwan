// pages/CategoryManagement.js
import { useCategoryManagementLogic } from '@hooks/admin/useCategoryManagementLogic';
import CategoryForm from '@components/Admin/CategoryManagement/CategoryForm';
import CategoryTable from '@components/Admin/CategoryManagement/CategoryTable';
import TableControls from '@components/Admin/Common/TableControls';

const CategoryManagement = () => {
    const {
        editingCategoryData,
        isDataLoading,
        isSubmitting,
        handleSave,
        handleDelete,
        handleEdit,
        handleDiscard,
        handleSaveDraft,
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
    } = useCategoryManagementLogic();

    return (
        <>
            <div className="flex-grow-1 container-p-y container-fluid">
                <CategoryForm
                    initialData={editingCategoryData}
                    onSave={handleSave}
                    onDiscard={handleDiscard}
                    onSaveDraft={handleSaveDraft}
                    isSubmitting={isSubmitting}
                />

                <TableControls
                    searchTerm={searchTerm}
                    onSearchChange={handleSearch}
                    itemsPerPage={itemsPerPage}
                    onItemsPerPageChange={handleItemsPerPageChange}
                />
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
                                                &laquo;
                                            </button>
                                        </li>
                                        <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                                            <button className="page-link" onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1}>
                                                &lsaquo;
                                            </button>
                                        </li>
                                        {Array.from({ length: totalPages }, (_, i) => (
                                            <li key={i} className={`page-item ${currentPage === i + 1 ? 'active' : ''}`}>
                                                <button className="page-link" onClick={() => goToPage(i + 1)}>
                                                    {i + 1}
                                                </button>
                                            </li>
                                        ))}
                                        <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                                            <button className="page-link" onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages}>
                                                &rsaquo;
                                            </button>
                                        </li>
                                        <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                                            <button className="page-link" onClick={() => goToPage(totalPages)} disabled={currentPage === totalPages}>
                                                &raquo;
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