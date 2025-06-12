// src/components/Admin/Badges/BadgeTable.jsx
import React from 'react';

const BadgeTable = ({ displayedData, onEdit, onDelete, requestSort, sortConfig, isDataLoading, isSubmittingAction }) => {
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
        <div className="table-responsive">
            <table className="table table-hover align-middle">
                <thead>
                    <tr>
                        <th onClick={() => requestSort('iconUrl')} style={{width: '80px', ...getHeaderStyle('iconUrl')}}>Icon</th>
                        <th onClick={() => requestSort('name')} style={getHeaderStyle('name')}>Tên Huy hiệu {getSortIcon('name')}</th>
                        <th onClick={() => requestSort('type')} style={getHeaderStyle('type')}>Loại {getSortIcon('type')}</th>
                        <th>Điều kiện (Tóm tắt)</th>
                        <th className="text-center">Hành động</th>
                    </tr>
                </thead>
                <tbody>
                    {isDataLoading ? (
                        <tr><td colSpan="5" className="text-center p-5"><div className="spinner-eff"></div></td></tr>
                    ) : displayedData.length === 0 ? (
                        <tr><td colSpan="5" className="text-center p-5 no-content-message">Không có huy hiệu nào.</td></tr>
                    ) : (
                        displayedData.map((badge) => (
                            <tr key={badge.id}>
                                <td className="text-center">
                                    {badge.iconUrl ? (
                                        badge.iconUrl.startsWith('fa') ?
                                        <i className={`${badge.iconUrl} fa-2x`} title={badge.iconUrl}></i> :
                                        <img src={badge.iconUrl.startsWith('http') ? badge.iconUrl : `/${badge.iconUrl}`} alt={badge.name} width="40" height="40" className="rounded" />
                                    ) : (
                                        <i className="fas fa-medal fa-2x text-muted"></i>
                                    )}
                                </td>
                                <td>
                                    <span className="fw-medium">{badge.name}</span>
                                    <small className="d-block text-muted" title={badge.description || ''}>
                                        {(badge.description || '').substring(0,70)}{(badge.description || '').length > 70 ? '...' : ''}
                                    </small>
                                </td>
                                <td><span className="badge-custom badge-info">{badge.criteriaType}</span></td>
                                <td>
                                    <pre className="criteria-preview">{JSON.stringify(badge.criteriaValue, null, 1).substring(0,100)}{JSON.stringify(badge.criteriaValue || {}).length > 100 ? '...' : ''}</pre>
                                </td>
                                <td className="text-center">
                                    <button className="btn btn-icon btn-edit" onClick={() => onEdit(badge.id)} disabled={isSubmittingAction} title="Sửa">
                                        <i className="fas fa-edit text-warning"></i>
                                    </button>
                                    <button className="btn btn-icon btn-delete" onClick={() => onDelete(badge.id)} disabled={isSubmittingAction} title="Xóa">
                                        <i className="fas fa-trash text-danger"></i>
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
export default BadgeTable;