import React, { useCallback, useMemo } from "react";
import { useCategory } from "../contexts/CategoryProvider";
import useDeviceType from "../hooks/useDeviceType";
import "../assets/scss/filters.scss";

const FilterComponent = () => {
     // Lấy state và hàm từ context - bỏ activeFilters, dùng groupedYears trực tiếp
    const { groupedYears, dataFiltersList, handleFilterClick, filters, filterLoading } = useCategory();

    const renderFilterItems = useCallback((items = [], category) => (
        items.map((item) => (
            <li key={item.id}
                onClick={() => !filterLoading && handleFilterClick(category, item.id)}
                className={`wstar-tab__item ${filters[category] === item.id ? 'active' : ''} ${filterLoading ? 'disabled' : ''}`}
            >
                {item.title}
            </li>
        ))
    ), [filters, handleFilterClick, filterLoading]);

    const deviceType = useDeviceType();
    const isMobile = useMemo(() => deviceType === "Mobile", [deviceType]);

    // Hiển thị skeleton hoặc loading cho filter options
    const renderLoadingOptions = (count = 5) => (
        Array.from({ length: count }).map((_, index) => (
            <li key={`loading-${index}`} className="wstar-tab__item is-loading">
                <span className="placeholder col-6"></span>
            </li>
        ))
    );

    return (
        <div className={`filters ${isMobile ? 'filters--mobile' : ''}`}>
            <label className={`filters__label ${isMobile ? 'filters__label--mobile' : ''}`}>Quốc gia</label>
            <ul className={`wstar-tab wstar-tab--solid filters__tab ${isMobile ? 'filters__tab--mobile' : ''}`}>
                <li className={`wstar-tab__item ${filters.region === null ? 'active' : ''} ${filterLoading ? 'disabled' : ''}`}
                    onClick={() => !filterLoading && handleFilterClick('region', null)}>Tất cả</li>
                {filterLoading ? renderLoadingOptions(5) : renderFilterItems(dataFiltersList.countries, 'region')}
            </ul>

            <label className={`filters__label ${isMobile ? 'filters__label--mobile' : ''}`}>Thể loại</label>
            <ul className={`wstar-tab wstar-tab--solid filters__tab ${isMobile ? 'filters__tab--mobile' : ''} `}>
                <li className={`wstar-tab__item ${filters.genre === null ? 'active' : ''} ${filterLoading ? 'disabled' : ''}`}
                    onClick={() => !filterLoading && handleFilterClick('genre', null)}>Tất cả</li>
                 {filterLoading ? renderLoadingOptions(10) : renderFilterItems(dataFiltersList.genres, 'genre')}
            </ul>

            <label className={`filters__label ${isMobile ? 'filters__label--mobile' : ''}`}>Năm</label>
            <ul className={`wstar-tab wstar-tab--solid filters__tab ${isMobile ? 'filters__tab--mobile' : ''} `}>
                <li className={`wstar-tab__item ${filters.year === null ? 'active' : ''} ${filterLoading ? 'disabled' : ''}`}
                    onClick={() => !filterLoading && handleFilterClick('year', null)}>Tất cả</li>
                 {filterLoading ? renderLoadingOptions(5) : groupedYears.map((yearRange, index) => (
                    <li key={index}
                        onClick={() => !filterLoading && handleFilterClick('year', yearRange)}
                        className={`wstar-tab__item ${filters.year === yearRange ? 'active' : ''} ${filterLoading ? 'disabled' : ''}`}>
                        {yearRange}
                    </li>
                ))}
            </ul>

            <label className={`filters__label ${isMobile ? 'filters__label--mobile' : ''}`}>Quý</label>
            <ul className={`wstar-tab wstar-tab--solid filters__tab ${isMobile ? 'filters__tab--mobile' : ''} `}>
                <li className={`wstar-tab__item ${filters.season === null ? 'active' : ''}`}
                    onClick={() => handleFilterClick('season', null)}>Tất cả</li>
                {['Xuân', 'Hạ', 'Thu', 'Đông'].map((season, index) => (
                    <li key={index}
                        onClick={() => handleFilterClick('season', season)}
                        className={`wstar-tab__item ${filters.season === season ? 'active' : ''}`}>
                        {season}
                    </li>
                ))}
            </ul>

            <label className={`filters__label ${isMobile ? 'filters__label--mobile' : ''}`}>Sắp xếp theo</label>
            <ul className={`wstar-tab wstar-tab--solid filters__tab ${isMobile ? 'filters__tab--mobile' : ''} `}>
                {['Hot', 'Mới nhất'].map((order, index) => (
                    <li key={index}
                        onClick={() => handleFilterClick('order', order)}
                        className={`wstar-tab__item ${filters.order === order ? 'active' : ''}`}>
                        {order}
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default FilterComponent;