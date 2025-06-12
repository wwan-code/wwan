// components/CategoryManagement/CategoryTable.js

import { formatDate } from "@utils/formatDate";

const CategoryTable = ({
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

    return (
        <div className="table-responsive dt-layout-full">
            <table className="table">
                <thead>
                    <tr>
                        <th onClick={() => requestSort('title')} style={getHeaderStyle('title')}>
                            Danh mục {getSortIcon('title')}
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
                        <tr><td colSpan="4" className="text-center p-5"><i className="fas fa-spinner fa-spin fa-2x"></i></td></tr>
                    ) : displayedData.length === 0 ? (
                        <tr><td colSpan="4" className="text-center p-5">Không tìm thấy danh mục nào.</td></tr>
                    ) : (
                        displayedData.map((item) => (
                            <tr key={item.id} className="hover-effect">
                                <td>{item.title}</td>
                                <td className="text-nowrap text-sm-end">{item.slug}</td>
                                <td className="text-nowrap text-sm-end">{formatDate(item.createdAt)}</td>
                                <td className="text-center">
                                    <button
                                        className="btn btn-icon btn-edit"
                                        onClick={() => onEdit(item)}
                                        title="Chỉnh sửa"
                                        disabled={isSubmitting}
                                    >
                                        <i className="fa-regular fa-edit text-warning"></i>
                                    </button>
                                    <button
                                        className="btn btn-icon btn-delete"
                                        onClick={() => onDelete(item.id)}
                                        title="Xóa"
                                        disabled={isSubmitting}
                                    >
                                        <i className="fa-regular fa-trash text-danger"></i>
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

export default CategoryTable;