import React from 'react';
import { useCountryManagementLogic } from '../../hooks/useCountryManagementLogic';
import CountryForm from '../../components/CountryManagement/CountryForm';
import CountryTable from '../../components/CountryManagement/CountryTable';
import TableControls from '../../components/CountryManagement/TableControls';

const CountryManagement = () => {
    const {
        editingCountryData,
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
    } = useCountryManagementLogic(); // Gọi hook mới

    return (
        <>
            <div className="flex-grow-1 container-p-y container-fluid">
                <CountryForm
                    initialData={editingCountryData}
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
                {/* Sử dụng CountryTable */}
                <CountryTable
                    displayedData={displayedData}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    requestSort={requestSort}
                    sortConfig={sortConfig}
                    isDataLoading={isDataLoading}
                    isSubmitting={isSubmitting}
                />
                {/* Pagination Info and Controls */}
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

export default CountryManagement;