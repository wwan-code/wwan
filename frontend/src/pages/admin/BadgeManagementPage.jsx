// src/pages/admin/BadgeManagementPage.jsx
import React from 'react';
import useBadgeManagementLogic from '@hooks/admin/useBadgeManagementLogic';
import BadgeForm from '@components/Admin/Badges/BadgeForm';
import BadgeTable from '@components/Admin/Badges/BadgeTable';
import TableControls from '@components/Admin/Common/TableControls';
import Pagination from '@components/Common/Pagination';

const BadgeManagementPage = () => {
    const {
        editingBadge, isDataLoading, isSubmitting,
        handleSaveBadge, handleDeleteBadge, handleEditBadge, handleDiscardEdit,
        displayedData, totalPages, currentPage, searchTerm, handleSearch,
        requestSort, goToPage, sortConfig, itemsPerPage, handleItemsPerPageChange,
    } = useBadgeManagementLogic();

    return (
        <div className="container-fluid flex-grow-1 container-p-y">
            <h4 className="py-3 mb-4">
                <i className="fas fa-medal icon-before"></i> Quản lý Huy hiệu
            </h4>
            <BadgeForm
                initialData={editingBadge}
                onSave={handleSaveBadge}
                onDiscard={handleDiscardEdit}
                isSubmitting={isSubmitting}
            />

            <div className="card mt-4">
                <div className="card-header">
                    <h5 className="card-title mb-0">Danh sách Huy hiệu</h5>
                    <TableControls
                        searchTerm={searchTerm}
                        onSearchChange={handleSearch}
                        itemsPerPage={itemsPerPage}
                        onItemsPerPageChange={handleItemsPerPageChange}
                    />
                </div>
                <div className="card-body">
                    <BadgeTable
                        displayedData={displayedData}
                        onEdit={handleEditBadge}
                        onDelete={handleDeleteBadge}
                        requestSort={requestSort}
                        sortConfig={sortConfig}
                        isDataLoading={isDataLoading}
                        isSubmittingAction={isSubmitting}
                    />
                </div>
                {totalPages > 0 && (
                    <div className="card-footer">
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={goToPage}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default BadgeManagementPage;