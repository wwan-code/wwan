// src/components/Admin/ComicForms/ComicMetaForm.jsx
import { useState, useEffect, useRef, useCallback } from 'react';
import classNames from '@utils/classNames';

const ComicMetaForm = ({
    data,
    onInputChange,
    genres = [],
    countries = [],
    categories = [],
    selectedGenres = [],
    onSelectedGenresChange,
    onShowAddItemOffcanvas,
    isSubmitting
}) => {
    const dropdownRef = useRef(null);
    const searchInputRef = useRef(null);
    const [isOpenSelect, setIsOpenSelect] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredGenres, setFilteredGenres] = useState(genres);

    useEffect(() => {
        setFilteredGenres(
            searchTerm === ''
                ? genres
                : genres.filter(g => g.title.toLowerCase().includes(searchTerm.toLowerCase()))
        );
    }, [searchTerm, genres]);

    useEffect(() => { setFilteredGenres(genres); }, [genres]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpenSelect(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [dropdownRef]);

    const handleInnerClick = useCallback(() => {
        searchInputRef.current?.focus();
        setIsOpenSelect(true);
    }, []);

    const handleSearch = (e) => setSearchTerm(e.target.value);

    const handleOptionClick = useCallback((genre) => {
        onSelectedGenresChange(prevSelected =>
            prevSelected.some(sg => sg.id === genre.id)
                ? prevSelected.filter(sg => sg.id !== genre.id)
                : [...prevSelected, genre]
        );
    }, [onSelectedGenresChange]);

    const handleRemoveItem = useCallback((id) => {
        onSelectedGenresChange(prevSelected => prevSelected.filter(sg => sg.id !== id));
    }, [onSelectedGenresChange]);


    return (
        <div className="card mb-4">
            <div className="card-header">
                <h5 className="card-title mb-0">Thông tin bổ sung</h5>
            </div>
            <div className="card-body">
                <div className="row">
                    <div className="col-md-6 mb-3">
                        <label htmlFor="comicAuthorMeta" className="form-label">Tác giả</label>
                        <input type="text" id="comicAuthorMeta" name="author" className="form-control" value={data.author} onChange={onInputChange} disabled={isSubmitting} />
                    </div>
                    <div className="col-md-6 mb-3">
                        <label htmlFor="comicArtistMeta" className="form-label">Họa sĩ</label>
                        <input type="text" id="comicArtistMeta" name="artist" className="form-control" value={data.artist} onChange={onInputChange} disabled={isSubmitting} />
                    </div>
                </div>

                <div className="row">
                    <div className="col-md-6 mb-3">
                        <label htmlFor="comicYearMeta" className='form-label'>Năm phát hành</label>
                        <input type="number" id="comicYearMeta" name="year" className="form-control" value={data.year} onChange={onInputChange} disabled={isSubmitting} placeholder="VD: 2024" />
                    </div>
                    <div className="col-md-6 mb-3">
                        <label htmlFor="comicStatusMeta" className="form-label">Trạng thái</label>
                        <select id="comicStatusMeta" name="status" className="form-select" value={data.status} onChange={onInputChange} disabled={isSubmitting}>
                            <option value="ongoing">Đang tiến hành</option>
                            <option value="completed">Hoàn thành</option>
                            <option value="paused">Tạm dừng</option>
                            <option value="dropped">Đã drop</option>
                        </select>
                    </div>
                </div>

                <div className="row">
                    <div className="col-md-6 mb-3">
                        <label className="d-flex flex-wrap align-items-center mb-1">
                            <span className="form-label mb-0 me-auto">Phân loại</span>
                            <button type="button" className="btn btn-link btn-sm p-0" onClick={() => onShowAddItemOffcanvas('category')} disabled={isSubmitting}>
                                <i className="fas fa-plus-circle me-1"></i>Thêm
                            </button>
                        </label>
                        <select id="comicCategoryMeta" name="categoryId" value={data.categoryId} onChange={onInputChange} className='form-select' disabled={isSubmitting}>
                            <option value="">-- Chọn phân loại --</option>
                            {categories.map((category) => (
                                <option key={category.id} value={category.id}>{category.title}</option>
                            ))}
                        </select>
                    </div>
                    <div className="col-md-6 mb-3">
                        <label className="d-flex flex-wrap align-items-center mb-1">
                            <span className="form-label mb-0 me-auto">Quốc gia</span>
                            <button type="button" className="btn btn-link btn-sm p-0" onClick={() => onShowAddItemOffcanvas('country')} disabled={isSubmitting}>
                                 <i className="fas fa-plus-circle me-1"></i>Thêm
                            </button>
                        </label>
                        <select id="comicCountryMeta" name="countryId" value={data.countryId} onChange={onInputChange} className='form-select' disabled={isSubmitting}>
                            <option value="">-- Chọn quốc gia --</option>
                            {countries.map((country) => (
                                <option key={country.id} value={country.id}>{country.title}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="mb-3">
                    <label htmlFor="genres-select-comic" className="d-flex flex-wrap align-items-center mb-1">
                        <span className="form-label mb-0 me-auto">Thể loại <span className="text-danger">*</span></span>
                        <button type="button" className="btn btn-link btn-sm p-0" onClick={() => onShowAddItemOffcanvas('genre')} disabled={isSubmitting}>
                            <i className="fas fa-plus-circle me-1"></i>Thêm
                        </button>
                    </label>
                    <div id="genres-select-comic" className='form-floating form-floating-advance-select'>
                        <div ref={dropdownRef} className={`form-multi-select ${isOpenSelect ? 'show' : ''}`} data-type="select-multiple">
                            <div className="form-multi-select-input-group" onClick={handleInnerClick}>
                                <ul className="form-multi-select-selection form-multi-select-selection-tags">
                                    {selectedGenres.map((el) => (
                                        <li key={el.id} className="form-multi-select-tag">
                                            {el.title}
                                            <button type="button" className="form-multi-select-tag-delete" onClick={(e) => { e.stopPropagation(); handleRemoveItem(el.id); }} disabled={isSubmitting}></button>
                                        </li>
                                    ))}
                                    <input
                                        type="search"
                                        className="form-multi-select-search"
                                        autoComplete="off"
                                        value={searchTerm}
                                        onChange={handleSearch}
                                        ref={searchInputRef}
                                        placeholder={selectedGenres.length === 0 ? "Chọn thể loại..." : ""}
                                        disabled={isSubmitting}
                                    />
                                </ul>
                            </div>
                            <div className="form-multi-select-dropdown" aria-expanded={isOpenSelect}>
                                <div className="form-multi-select-options" role="listbox">
                                    {filteredGenres.length > 0 ? filteredGenres.map((genre) => (
                                        <div
                                            key={genre.id}
                                            className={classNames("form-multi-select-option form-multi-select-option-with-checkbox", {
                                                "form-multi-selected": selectedGenres.some((selected) => selected.id === genre.id)
                                            })}
                                            onClick={() => !isSubmitting && handleOptionClick({ id: genre.id, title: genre.title })}
                                            role="option"
                                            aria-selected={selectedGenres.some((selected) => selected.id === genre.id)}
                                        >
                                            {genre.title}
                                        </div>
                                    )) : <div className="form-multi-select-option text-muted">Không tìm thấy thể loại.</div>}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ComicMetaForm;