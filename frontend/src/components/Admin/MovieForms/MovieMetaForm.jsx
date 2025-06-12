// components/Admin/MovieForms/MovieMetaForm.js
import { useState, useEffect, useRef, useCallback } from 'react';
import classNames from '@utils/classNames';

const MovieMetaForm = ({
    data,
    onInputChange,
    genres = [],
    countries = [],
    categories = [],
    selectedGenres = [],
    onSelectedGenresChange,
    onShowAddItemOffcanvas,
}) => {
    const dropdownRef = useRef(null);
    const searchInputRef = useRef(null);
    const [isOpenSelect, setIsOpenSelect] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredGenres, setFilteredGenres] = useState(genres);

    useEffect(() => {
        if (searchTerm === '') {
            setFilteredGenres(genres);
        } else {
            setFilteredGenres(
                genres.filter((genre) =>
                    genre.title.toLowerCase().includes(searchTerm.toLowerCase())
                )
            );
        }
    }, [searchTerm, genres]);

    useEffect(() => {
        setFilteredGenres(genres);
    }, [genres]);


    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpenSelect(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [dropdownRef]);

    const handleInnerClick = useCallback(() => {
        if (searchInputRef.current) {
            searchInputRef.current.focus();
        }
        setIsOpenSelect(true);
    }, []);

    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
    };

    const handleOptionClick = useCallback((genre) => {
        let newSelectedGenres;
        if (selectedGenres.some((selected) => selected.id === genre.id)) {
            newSelectedGenres = selectedGenres.filter((selected) => selected.id !== genre.id);
        } else {
            newSelectedGenres = [...selectedGenres, genre];
        }
        onSelectedGenresChange(newSelectedGenres);
    }, [selectedGenres, onSelectedGenresChange]);

    const handleRemoveItem = useCallback((id) => {
        const newSelectedGenres = selectedGenres.filter((genre) => genre.id !== id);
        onSelectedGenresChange(newSelectedGenres);
    }, [selectedGenres, onSelectedGenresChange]);


    return (
        <>
            <div className="card mb-4">
                <div className="card-header">
                    <h5 className="card-tile mb-0">Thông tin bổ sung</h5>
                </div>
                <div className="card-body">
                    <div className="mb-3">
                        <label htmlFor="genres-select" className="d-flex flex-wrap align-items-center mb-1">
                            <span className="form-label mb-0 me-auto">Thể loại <span className="text-danger">*</span></span>
                            <span role="button" className="text-primary fw-bold fs-8" onClick={() => onShowAddItemOffcanvas('genre')}>
                                (+) Thêm thể loại
                            </span>
                        </label>
                        <div id="genres-select" className='form-floating form-floating-advance-select'>
                             <div ref={dropdownRef} className={`form-multi-select ${isOpenSelect ? 'show' : ''}`} data-type="select-multiple">
                                <div className="form-multi-select-input-group" onClick={handleInnerClick}>
                                    <ul className="form-multi-select-selection form-multi-select-selection-tags">
                                        {selectedGenres.map((el) => (
                                            <li key={el.id} className="form-multi-select-tag">
                                                {el.title}
                                                <button type="button" className="form-multi-select-tag-delete" onClick={(e) => { e.stopPropagation(); handleRemoveItem(el.id); }}></button>
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
                                                onClick={() => handleOptionClick({ id: genre.id, title: genre.title })}
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
                    <div className="row">
                        <div className="mb-3 col-6">
                            <label className="d-flex flex-wrap align-items-center mb-1">
                                <span className="form-label mb-0 me-auto">Danh mục <span className="text-danger">*</span></span>
                                <span role="button" className="text-primary fw-bold fs-8" onClick={() => onShowAddItemOffcanvas('category')}>
                                     (+) Thêm
                                </span>
                            </label>
                            <select
                                name="categoryId"
                                value={data.categoryId}
                                onChange={onInputChange}
                                className='form-select'
                                required
                            >
                                 <option value="" disabled>Chọn danh mục</option>
                                {categories.map((category) => (
                                    <option key={category.id} value={category.id}>
                                        {category.title}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="mb-3 col-6">
                            <div className="d-flex flex-wrap align-items-center mb-1">
                                <span className="form-label mb-0 me-auto">Quốc gia <span className="text-danger">*</span></span>
                                <span role="button" className="text-primary fw-bold fs-8" onClick={() => onShowAddItemOffcanvas('country')}>
                                     (+) Thêm
                                </span>
                            </div>
                            <select
                                name="countryId"
                                value={data.countryId}
                                onChange={onInputChange}
                                className='form-select'
                                required
                            >
                                 <option value="" disabled>Chọn quốc gia</option>
                                {countries.map((country) => (
                                    <option key={country.id} value={country.id}>
                                        {country.title}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="mb-3 col-6">
                            <label className='form-label'>Năm sản xuất</label>
                            <input
                                type="number"
                                name="year"
                                className="form-control"
                                value={data.year}
                                onChange={onInputChange}
                                placeholder="Nhập năm"
                            />
                        </div>
                        <div className="mb-3 col-6">
                            <label htmlFor="releaseDate" className="form-label">Ngày công chiếu</label>
                            <input
                                id="releaseDate"
                                type="date"
                                name="releaseDate"
                                className="form-control"
                                value={data.releaseDate}
                                onChange={onInputChange}
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="card mb-4">
                <div className="card-header">
                    <h5 className="card-title mb-0">Metadata & Chi tiết</h5>
                </div>
                <div className="card-body">
                     <div className="row">
                         <div className="mb-3 col-md-6">
                            <label className="form-label">Thời lượng (phút) <span className="text-danger">*</span></label>
                            <input
                                type="text"
                                name="duration"
                                className="form-control"
                                value={data.duration}
                                onChange={onInputChange}
                                placeholder="VD: 120"
                                required
                            />
                        </div>
                         <div className="mb-3 col-md-6">
                            <label className="form-label">Phân loại độ tuổi <span className="text-danger">*</span></label>
                            <input
                                type="text"
                                name="classification"
                                className="form-control"
                                value={data.classification}
                                onChange={onInputChange}
                                placeholder="VD: P, C13, C16, C18"
                                required
                            />
                        </div>
                        <div className="mb-3 col-md-6">
                            <label className="form-label">Chất lượng</label>
                            <select
                                name="quality"
                                className="form-select"
                                value={data.quality}
                                onChange={onInputChange}
                            >
                                <option value={4}>FullHD</option>
                                <option value={3}>HD</option>
                                <option value={2}>HDCam</option>
                                <option value={1}>Cam</option>
                                <option value={0}>Trailer</option>
                            </select>
                        </div>
                        <div className="mb-3 col-md-6">
                            <label className="form-label">Phụ đề</label>
                            <input
                                type="text"
                                name="subtitles"
                                className="form-control"
                                value={data.subtitles}
                                onChange={onInputChange}
                                placeholder="VD: Vietsub, Thuyết minh"
                            />
                        </div>
                         <div className="mb-3 col-md-6">
                            <label className="form-label">Tổng số tập</label>
                            <input
                                type="text"
                                name="totalEpisodes"
                                className="form-control"
                                value={data.totalEpisodes}
                                onChange={onInputChange}
                                placeholder="Để trống nếu là phim lẻ"
                                />
                        </div>
                        <div className="mb-3 col-md-6">
                            <label className="form-label">Lượt xem (Mặc định)</label>
                            <input
                                type="number"
                                name="views"
                                className="form-control"
                                value={data.views}
                                onChange={onInputChange}
                            />
                        </div>
                        <div className="mb-3 col-md-6">
                            <label className="form-label">
                                Tags
                            </label>
                            <input
                                type="text"
                                name="tags"
                                className="form-control"
                                value={data.tags}
                                onChange={onInputChange}
                            />
                        </div>
                        <div className="mb-3 col-md-6">
                            <label className="form-label">Loại</label>
                            <input
                                type="text"
                                name="type"
                                className="form-control"
                                value={data.type}
                                onChange={onInputChange}
                            />
                        </div>
                        <div className="mb-3 col-md-12">
                            <label className="form-label">Trailer</label>
                            <textarea
                                type="text"
                                name="trailerUrl"
                                className="form-control"
                                value={data.trailerUrl}
                                onChange={onInputChange}
                            />
                        </div>
                    </div>
                    <hr className='my-3'/>
                    <div className="row">
                        <div className="mb-3 col-md-4">
                            <div className="form-label">Loại phim</div>
                            <div className="form-check form-switch">
                                <input name="belongToCategory" className="form-check-input" type="checkbox" role="switch" id="belongToCategory" checked={data.belongToCategory === 1} onChange={onInputChange} />
                                <label className="form-check-label" htmlFor="belongToCategory">Phim bộ</label>
                            </div>
                        </div>
                         <div className="mb-3 col-md-4">
                             <div className="form-label">Có phần tiếp?</div>
                            <div className="form-check form-switch">
                                <input name="hasSection" className="form-check-input" type="checkbox" role="switch" id="hasSection" checked={data.hasSection === 1} onChange={onInputChange} />
                                <label className="form-check-label" htmlFor="hasSection">Có</label>
                            </div>
                        </div>
                        <div className="mb-3 col-md-4">
                            <div className="form-label">Trạng thái</div>
                            <div className="form-check form-switch">
                                <input name="status" className="form-check-input" type="checkbox" role="switch" id="status" checked={data.status === 1} onChange={onInputChange} />
                                <label className="form-check-label" htmlFor="status">Hiển thị</label>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default MovieMetaForm;