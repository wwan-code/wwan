import { useState, useEffect } from 'react';
import axios from 'axios';
import { useSearchParams } from 'react-router-dom';
import '@assets/scss/components/_comic-filter.scss';

const ComicFilter = ({ onFilterApply }) => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [filterOptions, setFilterOptions] = useState({
        genres: [],
        countries: [],
        statuses: [
            { id: '', title: 'Tất cả trạng thái' },
            { id: 'ongoing', title: 'Đang tiến hành' },
            { id: 'completed', title: 'Hoàn thành' },
            { id: 'paused', title: 'Tạm dừng' },
            { id: 'dropped', title: 'Đã drop' },
        ],
        years: [],
        sortOptions: [
            { id: 'lastChapterUpdatedAt_desc', title: 'Mới cập nhật chương' },
            { id: 'views_desc', title: 'Xem nhiều nhất' },
            { id: 'createdAt_desc', title: 'Truyện mới đăng' },
            { id: 'year_desc', title: 'Năm (Mới nhất)' },
            { id: 'year_asc', title: 'Năm (Cũ nhất)' },
            { id: 'title_asc', title: 'Tên A-Z' },
            { id: 'title_desc', title: 'Tên Z-A' },
        ]
    });
    const [isLoadingOptions, setIsLoadingOptions] = useState(true);
    const [isExpanded, setIsExpanded] = useState(true);

    // Bỏ trường q (tìm kiếm) khỏi filter vì đã có ở HeaderBanner
    const [currentFilters, setCurrentFilters] = useState({
        genre: searchParams.get('genre') || '',
        country: searchParams.get('country') || '',
        status: searchParams.get('status') || '',
        year: searchParams.get('year') || '',
        sort: searchParams.get('sort') || 'lastChapterUpdatedAt_desc'
    });

    useEffect(() => {
        const fetchOptions = async () => {
            setIsLoadingOptions(true);
            try {
                const response = await axios.get('/api/comics/filters');
                if (response.data.success) {
                    const data = response.data.data;
                    const currentYear = new Date().getFullYear();
                    const years = [{ id: '', title: 'Tất cả năm' }];
                    for (let y = currentYear; y >= 2000; y--) {
                        years.push({ id: String(y), title: String(y) });
                    }
                    setFilterOptions(prev => ({
                        ...prev,
                        genres: [{ id: '', title: 'Tất cả thể loại' }, ...(data.genres || [])],
                        countries: [{ id: '', title: 'Tất cả quốc gia' }, ...(data.countries || [])],
                        years: years,
                    }));
                }
            } catch (error) {
                // eslint-disable-next-line no-console
                console.error("Lỗi tải tùy chọn bộ lọc:", error);
            } finally {
                setIsLoadingOptions(false);
            }
        };
        fetchOptions();
    }, []);

    useEffect(() => {
        setCurrentFilters({
            genre: searchParams.get('genre') || '',
            country: searchParams.get('country') || '',
            status: searchParams.get('status') || '',
            year: searchParams.get('year') || '',
            sort: searchParams.get('sort') || 'lastChapterUpdatedAt_desc'
        });
    }, [searchParams]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setCurrentFilters(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmitFilters = (e) => {
        e.preventDefault();
        const newParams = {};
        if (currentFilters.genre) newParams.genre = currentFilters.genre;
        if (currentFilters.country) newParams.country = currentFilters.country;
        if (currentFilters.status && currentFilters.status !== 'all' && currentFilters.status !== '') newParams.status = currentFilters.status;
        if (currentFilters.year) newParams.year = currentFilters.year;
        if (currentFilters.sort) newParams.sort = currentFilters.sort;
        newParams.page = '1';
        setSearchParams(prev => {
            const params = new URLSearchParams(prev);
            Object.keys(newParams).forEach(key => params.set(key, newParams[key]));
            // Xóa các filter không dùng nữa
            ['genre', 'country', 'status', 'year', 'sort'].forEach(key => {
                if (!newParams[key]) params.delete(key);
            });
            return params;
        }, { replace: true });
        if (onFilterApply) onFilterApply(currentFilters);
    };

    const handleResetFilters = () => {
        const defaultSort = 'lastChapterUpdatedAt_desc';
        setCurrentFilters({
            genre: '', country: '', status: '', year: '', sort: defaultSort
        });
        setSearchParams({ sort: defaultSort, page: '1' }, { replace: true });
        if (onFilterApply) onFilterApply({ sort: defaultSort });
    };

    return (
        <aside className={`comic-filter-sidebar ${isExpanded ? 'expanded' : ''}`}>
            <button className="filter-sidebar__toggle-btn" onClick={() => setIsExpanded(!isExpanded)}>
                <i className={`fas ${isExpanded ? 'fa-times' : 'fa-filter'}`}></i>
                <span>{isExpanded ? 'Đóng Lọc' : 'Mở Bộ Lọc'}</span>
            </button>
            <div className="filter-sidebar__content">
                <form onSubmit={handleSubmitFilters}>
                    {isLoadingOptions ? (
                        <div className="filter-block-loading"><div className="spinner-eff-small"></div></div>
                    ) : (
                        <>
                            <div className="filter-block">
                                <h5 className="filter-block__title">Sắp Xếp</h5>
                                <select name="sort" value={currentFilters.sort} onChange={handleInputChange} className="filter-block__select">
                                    {filterOptions.sortOptions.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
                                </select>
                            </div>
                            <div className="filter-block">
                                <h5 className="filter-block__title">Trạng Thái</h5>
                                <select name="status" value={currentFilters.status} onChange={handleInputChange} className="filter-block__select">
                                    {filterOptions.statuses.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
                                </select>
                            </div>
                            <div className="filter-block">
                                <h5 className="filter-block__title">Thể Loại</h5>
                                <select name="genre" value={currentFilters.genre} onChange={handleInputChange} className="filter-block__select">
                                    {filterOptions.genres.map(g => <option key={g.id || 'all-genres'} value={g.id}>{g.title}</option>)}
                                </select>
                            </div>
                            <div className="filter-block">
                                <h5 className="filter-block__title">Quốc Gia</h5>
                                <select name="country" value={currentFilters.country} onChange={handleInputChange} className="filter-block__select">
                                    {filterOptions.countries.map(c => <option key={c.id || 'all-countries'} value={c.id}>{c.title}</option>)}
                                </select>
                            </div>
                            <div className="filter-block">
                                <h5 className="filter-block__title">Năm</h5>
                                <select name="year" value={currentFilters.year} onChange={handleInputChange} className="filter-block__select">
                                    {filterOptions.years.map(y => <option key={y.id} value={y.id}>{y.title}</option>)}
                                </select>
                            </div>
                        </>
                    )}

                    <div className="filter-actions">
                        <button type="submit" className="btn btn-primary btn-apply-filter" disabled={isLoadingOptions}>
                            <i className="fas fa-check me-2"></i>Áp Dụng
                        </button>
                        <button type="button" onClick={handleResetFilters} className="btn btn-secondary btn-reset-filter" disabled={isLoadingOptions}>
                            <i className="fas fa-undo me-2"></i>Xóa Lọc
                        </button>
                    </div>
                </form>
            </div>
        </aside>
    );
};
export default ComicFilter;