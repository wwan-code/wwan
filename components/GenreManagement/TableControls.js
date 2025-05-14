import React from 'react';

const TableControls = ({
    searchTerm,
    handleSearch,
    itemsPerPage,
    handleItemsPerPageChange
}) => {
    return (
        <div className="row m-3 justify-content-between">
            <div className="d-md-flex justify-content-between align-items-center dt-layout-start col-md-auto me-auto">
                <div className="dt-search">
                    <input
                        type="text"
                        placeholder="Tìm kiếm..."
                        className="form-control form-control-sm"
                        value={searchTerm}
                        onChange={handleSearch}
                    />
                </div>
            </div>
            <div className="d-md-flex justify-content-between align-items-center dt-layout-end col-md-auto ms-auto">
                <div className="dt-length d-flex align-items-center">
                    <span className="me-2 text-nowrap">Hiển thị:</span>
                    <select value={itemsPerPage} className="form-select form-select-sm" onChange={handleItemsPerPageChange}>
                        <option value={10}>10</option>
                        <option value={15}>15</option>
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                    </select>
                </div>
            </div>
        </div>
    );
};

export default TableControls;