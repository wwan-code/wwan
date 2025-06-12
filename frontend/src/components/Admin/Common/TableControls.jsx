// src/components/Admin/Common/TableControls.jsx
import React from 'react';
import '@assets/scss/admin/_admin-table.scss';

const TableControls = React.memo(({ searchTerm, onSearchChange, itemsPerPage, onItemsPerPageChange, children }) => {
    return (
        <div className="table-controls-wrapper">
            <div className="table-controls-search">
                <input
                    type="search"
                    className="form-control form-control-sm"
                    placeholder="Tìm kiếm..."
                    value={searchTerm}
                    onChange={onSearchChange}
                />
            </div>
            <div className="table-controls-perpage">
                <select
                    className="form-select form-select-sm"
                    value={itemsPerPage}
                    onChange={onItemsPerPageChange}
                    aria-label="Số mục mỗi trang"
                >
                    {[5, 10, 20, 50, 100].map(num => (
                        <option key={num} value={num}>Hiển thị {num}</option>
                    ))}
                </select>
            </div>
            {children && <div className="table-controls-extra">{children}</div>}
        </div>
    );
});
export default TableControls;