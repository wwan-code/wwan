import React from 'react';
import { useGenreManagementLogic } from '../../hooks/useGenreManagement';
import GenreForm from '../../components/GenreManagement/GenreForm';
import GenreTable from '../../components/GenreManagement/GenreTable';
import TableControls from '../../components/GenreManagement/TableControls';

const GenreManagement = () => {
    const {
        editingGenreData,
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
    } = useGenreManagementLogic();

    return (
        <>
            <div className="flex-grow-1 container-p-y container-fluid">
                {/* Phần Form */}
                <GenreForm
                    initialData={editingGenreData} // Truyền dữ liệu đang edit/draft vào form
                    onSave={handleSave}
                    onDiscard={handleDiscard}
                    onSaveDraft={handleSaveDraft}
                    isSubmitting={isSubmitting} // Truyền trạng thái loading submit
                />


                {/* Điều khiển bảng */}
                <TableControls
                    searchTerm={searchTerm}
                    handleSearch={handleSearch}
                    itemsPerPage={itemsPerPage}
                    handleItemsPerPageChange={handleItemsPerPageChange}
                />
                {/* Bảng dữ liệu */}
                <GenreTable
                    displayedData={displayedData}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    requestSort={requestSort}
                    sortConfig={sortConfig}
                    isDataLoading={isDataLoading} // Loading cho cả bảng
                    isSubmitting={isSubmitting} // Disable nút edit/delete khi đang submit form
                />
                {/* Pagination Info and Controls */}
                {(totalPages > 0) && ( // Chỉ hiển thị nếu có dữ liệu
                    <div className="row mx-3 mb-3 justify-content-between">
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

export default GenreManagement;