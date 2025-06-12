import { useCallback, useMemo } from "react";
import { useCategory } from "@contexts/CategoryProvider";
import { useAppContext } from "@contexts/AppContext";
import "@assets/scss/filters.scss";

const FilterComponent = () => {
    const { groupedYears, dataFiltersList, handleFilterClick, filters, filterLoading } = useCategory();
    const { isMobile } = useAppContext();

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

    const renderLoadingOptions = useCallback((count = 5) => (
        Array.from({ length: count }).map((_, index) => (
            <li key={`loading-${index}`} className="wstar-tab__item is-loading">
                <span className="placeholder"></span>
            </li>
        ))
    ), []);

    const renderFilterBlock = (label, category, items, loadingCount = 5) => (
        <div className="filters__block">
            <label className={`filters__label ${isMobile ? 'filters__label--mobile' : ''}`}>{label}</label>
            <ul className={`wstar-tab wstar-tab--solid filters__tab ${isMobile ? 'filters__tab--mobile' : ''}`}>
                <li className={`wstar-tab__item ${filters[category] === null ? 'active' : ''} ${filterLoading ? 'disabled' : ''}`}
                    onClick={() => !filterLoading && handleFilterClick(category, null)}>Tất cả</li>
                {filterLoading ? renderLoadingOptions(loadingCount) : renderFilterItems(items, category)}
            </ul>
        </div>
    );

    return (
        <div className={`filters ${isMobile ? 'filters--mobile' : ''}`}>
            {renderFilterBlock('Quốc gia', 'region', dataFiltersList.countries, 5)}
            {renderFilterBlock('Thể loại', 'genre', dataFiltersList.genres, 10)}

            <div className="filters__block">
                <label className={`filters__label ${isMobile ? 'filters__label--mobile' : ''}`}>Năm</label>
                <ul className={`wstar-tab wstar-tab--solid filters__tab ${isMobile ? 'filters__tab--mobile' : ''}`}>
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
            </div>

            <div className="filters__block">
                <label className={`filters__label ${isMobile ? 'filters__label--mobile' : ''}`}>Quý</label>
                <ul className={`wstar-tab wstar-tab--solid filters__tab ${isMobile ? 'filters__tab--mobile' : ''}`}>
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
            </div>

            <div className="filters__block">
                <label className={`filters__label ${isMobile ? 'filters__label--mobile' : ''}`}>Sắp xếp theo</label>
                <ul className={`wstar-tab wstar-tab--solid filters__tab ${isMobile ? 'filters__tab--mobile' : ''}`}>
                    {['Hot', 'Mới nhất'].map((order, index) => (
                        <li key={index}
                            onClick={() => handleFilterClick('order', order)}
                            className={`wstar-tab__item ${filters.order === order ? 'active' : ''}`}>
                            {order}
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default FilterComponent;
