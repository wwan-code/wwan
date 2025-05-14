// components/GenreManagement/GenreTable.js
import React from 'react';

// Helper để định dạng ngày tháng
const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
        return new Date(dateString).toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        });
    } catch (e) {
        return dateString; // Trả về nguyên gốc nếu không parse được
    }
};


const GenreTable = ({
    displayedData,
    onEdit,
    onDelete,
    requestSort,
    sortConfig,
    isDataLoading, // Nhận thêm prop này
    isSubmitting, // Nhận thêm để disable nút khi đang xử lý
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

    return (
        <div className="table-responsive dt-layout-full">
            <table className="table dataTable">
                <thead>
                    <tr>
                        <th onClick={() => requestSort('title')} style={getHeaderStyle('title')}>
                            Thể loại {getSortIcon('title')}
                        </th>
                        <th onClick={() => requestSort('slug')} style={getHeaderStyle('slug')} className="text-nowrap text-sm-end">
                            URL slug {getSortIcon('slug')}
                        </th>
                        <th onClick={() => requestSort('createdAt')} style={getHeaderStyle('createdAt')} className="text-nowrap text-sm-end">
                            Ngày tạo {getSortIcon('createdAt')}
                        </th>
                        <th className="text-lg-center">Hành động</th>
                    </tr>
                </thead>
                <tbody>
                    {isDataLoading ? (
                        <tr>
                            <td colSpan="4" className="text-center p-5">
                                <i className="fas fa-spinner fa-spin fa-2x"></i>
                            </td>
                        </tr>
                    ) : displayedData.length === 0 ? (
                         <tr>
                            <td colSpan="4" className="text-center p-5">Không tìm thấy thể loại nào.</td>
                        </tr>
                    ) : (
                        displayedData.map((item) => (
                            <tr key={item.id} className="hover-effect">
                                <td>{item.title}</td>
                                <td className="text-nowrap text-sm-end">{item.slug}</td>
                                <td className="text-nowrap text-sm-end">{formatDate(item.createdAt)}</td>
                                <td>
                                    <div className="d-flex align-items-sm-center justify-content-sm-center">
                                        <button
                                            className="btn btn-icon btn-edit"
                                            onClick={() => onEdit(item)}
                                            title="Chỉnh sửa"
                                             disabled={isSubmitting} // Disable khi đang có thao tác khác
                                        >
                                            <i className="icon-base fa-regular fa-edit text-info"></i>
                                        </button>
                                        <button
                                            className="btn btn-icon btn-delete"
                                            onClick={() => onDelete(item.id)}
                                            title="Xóa"
                                            disabled={isSubmitting} // Disable khi đang có thao tác khác
                                        >
                                            <i className="icon-base fa-regular fa-trash text-danger"></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default GenreTable;