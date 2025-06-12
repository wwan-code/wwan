// src/components/Search.jsx
import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import Mark from 'mark.js';
import debounce from 'lodash.debounce';
import classNames from '@utils/classNames';
import { handleApiError } from '@utils/handleApiError';
import {
    getSearchHistory,
    addSearchHistory,
    removeSearchHistoryItem,
    clearSearchHistory
} from '@utils/searchHistoryUtils';

const SEARCH_LIMIT = 12;

const Search = () => {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [selectedIndex, setSelectedIndex] = useState(null);
    const [isResultVisible, setIsResultVisible] = useState(false);
    const [searchHistory, setSearchHistory] = useState(getSearchHistory()); // State cho lịch sử

    const searchRef = useRef(null); // Ref cho toàn bộ component Search
    const searchBoxRef = useRef(null); // Ref cho search-box (bao gồm input)
    const searchResultRef = useRef(null); // Ref cho khu vực hiển thị kết quả/lịch sử
    const resultRefs = useRef([]);

    const navigate = useNavigate();

    const fetchResults = useMemo(() => debounce(async (searchTerm) => {
        if (!searchTerm.trim()) {
            setResults([]); // Xóa kết quả tìm kiếm
            setError(null);
            // setIsResultVisible(false); // Sẽ hiển thị lịch sử thay vì đóng
            return;
        }
        setLoading(true);
        setError(null);
        //setIsResultVisible(true); // Đã được set bởi onFocus
        try {
            const response = await axios.get(`/api/search/multi`, { // Hoặc API endpoint của bạn
                params: { q: searchTerm, limit: SEARCH_LIMIT }
            });
            setResults(response.data.results || []);
        } catch (err) {
            setError(handleApiError(err));
            setResults([]);
        } finally {
            setLoading(false);
        }
    }, 300), []);

    const handleInputChange = (e) => {
        const newQuery = e.target.value;
        setQuery(newQuery);
        if (newQuery.trim()) {
            fetchResults(newQuery);
        } else {
            // Nếu query rỗng, xóa kết quả tìm kiếm hiện tại để có thể hiển thị lịch sử
            setResults([]);
            setError(null);
            // isResultVisible vẫn là true nếu đang focus
        }
        setSelectedIndex(null);
    };

    // Khi focus vào input
    const handleFocus = () => {
        setIsResultVisible(true);
        if (!query.trim()) { // Nếu input rỗng khi focus
            setSearchHistory(getSearchHistory()); // Cập nhật lịch sử
        }
    };

    // Đóng search result khi click ra ngoài
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setIsResultVisible(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);


    // Hàm thực hiện tìm kiếm và lưu lịch sử
    const performSearchAndSaveHistory = (searchTerm) => {
        if (!searchTerm || !searchTerm.trim()) return;
        setQuery(searchTerm); // Cập nhật input với từ khóa này
        fetchResults(searchTerm); // Thực hiện tìm kiếm
        const updatedHistory = addSearchHistory(searchTerm); // Lưu vào lịch sử
        setSearchHistory(updatedHistory); // Cập nhật state lịch sử
        setIsResultVisible(true); // Đảm bảo kết quả/lịch sử hiển thị
    };


    const handleResultClick = (item) => {
        performSearchAndSaveHistory(item.title); // Lưu tiêu đề của item được click làm từ khóa
        if (item.itemType === 'movie') {
            navigate(`/album/${item.slug}`);
        } else if (item.itemType === 'comic') {
            navigate(`/truyen/${item.slug}`);
        }
        // setQuery(''); // Có thể không cần xóa query nếu người dùng muốn xem lại
        // setResults([]);
        setIsResultVisible(false);
    };

    const handleSearchHistoryItemClick = (historyTerm) => {
        performSearchAndSaveHistory(historyTerm);
    };

    const handleRemoveHistoryItem = (e, termToRemove) => {
        e.stopPropagation(); // Ngăn việc click vào nút xóa trigger click vào item lịch sử
        const updatedHistory = removeSearchHistoryItem(termToRemove);
        setSearchHistory(updatedHistory);
    };

    const handleClearAllHistory = (e) => {
        e.stopPropagation();
        const updatedHistory = clearSearchHistory();
        setSearchHistory(updatedHistory);
    };

    // Xử lý nhấn phím
    useEffect(() => {
        const handleKeyDown = (event) => {
            if (!isResultVisible) return;

            const currentList = results.length > 0 ? results : (query.trim() === "" ? searchHistory : []);
            const isHistoryList = results.length === 0 && query.trim() === "" && searchHistory.length > 0;

            if (event.key === 'ArrowDown') {
                event.preventDefault();
                setSelectedIndex(prev => (prev === null || prev === currentList.length - 1 ? 0 : prev + 1));
            } else if (event.key === 'ArrowUp') {
                event.preventDefault();
                setSelectedIndex(prev => (prev === null || prev === 0 ? currentList.length - 1 : prev - 1));
            } else if (event.key === 'Enter') {
                if (selectedIndex !== null && currentList[selectedIndex]) {
                    event.preventDefault();
                    if (isHistoryList) {
                        handleSearchHistoryItemClick(currentList[selectedIndex]);
                    } else {
                        handleResultClick(currentList[selectedIndex]);
                    }
                    // searchBoxRef.current?.querySelector('input')?.blur(); // Blur input sau khi Enter
                } else if (query.trim()) { // Nếu không có item nào được chọn nhưng có query -> thực hiện tìm kiếm
                    event.preventDefault();
                    performSearchAndSaveHistory(query.trim());
                    // searchBoxRef.current?.querySelector('input')?.blur();
                }
            } else if (event.key === 'Escape') {
                setIsResultVisible(false);
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isResultVisible, results, searchHistory, query, selectedIndex, handleResultClick, handleSearchHistoryItemClick, performSearchAndSaveHistory]);


    useEffect(() => {
        resultRefs.current = resultRefs.current.slice(0, Math.max(results.length, searchHistory.length));
    }, [results, searchHistory]);

    useEffect(() => {
        if (selectedIndex !== null && resultRefs.current[selectedIndex]) {
            resultRefs.current[selectedIndex].scrollIntoView({
                behavior: 'smooth',
                block: 'nearest'
            });
        }
    }, [selectedIndex]);


    useEffect(() => {
        if (results.length > 0 && query.trim() && searchResultRef.current && isResultVisible) {
            const instance = new Mark(searchResultRef.current.querySelectorAll(".result-item-title, .result-item-subTitle"));
            instance.unmark({
                done: () => {
                    try {
                        instance.mark(query.trim());
                    } catch (e) {
                        // console.error("Mark.js error:", e);
                    }
                }
            });
        }
    }, [query, results, isResultVisible]);

    const handleFormSubmit = (e) => {
        e.preventDefault();
        performSearchAndSaveHistory(query.trim());
    }

    const renderSearchContent = () => {
        if (loading) {
            return <div className="search-loading p-3 text-center text-muted">Đang tìm kiếm...</div>;
        }
        if (error) {
            return <div className="search-error p-3 text-center text-danger">{error}</div>;
        }
        if (query.trim() !== "") { // Ưu tiên hiển thị kết quả tìm kiếm nếu có query
            if (results.length > 0) {
                return (
                    <ul className="search-results-list">
                        {results.map((item, index) => (
                            <li
                                key={`${item.itemType}-${item.id}`}
                                className={classNames("result-item", { 'selected': selectedIndex === index })}
                                onClick={() => handleResultClick(item)}
                                ref={el => resultRefs.current[index] = el}
                            >
                                <Link to={item.itemType === 'movie' ? `/album/${item.slug}` : `/truyen/${item.slug}`} className="result-item-link">
                                    <div className="result-item-thumbnail flex-shrink-0">
                                        <div className="result-item-img-wrapper">
                                            <img
                                                src={
                                                    (item.itemType === 'movie' && item.posterURL) ? `${process.env.REACT_APP_API_URL_IMAGE}/${item.posterURL}` :
                                                    (item.itemType === 'comic' && item.coverImage) ? `${process.env.REACT_APP_API_URL_IMAGE}/${item.coverImage}` :
                                                    ''
                                                }
                                                alt={item.title}
                                                className="result-item-img"
                                                loading="lazy"
                                            />
                                        </div>
                                    </div>
                                    <div className="result-item-meta">
                                        <div className="result-item-title">{item.title}</div>
                                        <div className="result-item-subTitle">
                                            {item.itemType === 'movie' && item.subTitle && `${item.subTitle}`}
                                            {item.itemType === 'movie' && item.year && ` (${item.year})`}
                                            {item.itemType === 'comic' && item.status && `Tình trạng: ${item.status}`}
                                        </div>
                                        <span className={`item-type-badge ms-auto badge bg-${item.itemType === 'movie' ? 'primary' : 'success'}`}>
                                            {item.itemType === 'movie' ? 'Phim' : 'Truyện'}
                                        </span>
                                    </div>
                                </Link>
                            </li>
                        ))}
                    </ul>
                );
            }
            // query có giá trị nhưng không có results (sau khi đã fetch)
            return <div className="search-noitem p-3 text-center text-muted">Không tìm thấy kết quả nào cho "{query}".</div>;
        }
        // query rỗng, hiển thị lịch sử hoặc thông báo
        if (searchHistory.length > 0) {
            return (
                <div className="search-history-section">
                    <div className="history-header">
                        <span className="history-title">Lịch sử tìm kiếm</span>
                        <button onClick={handleClearAllHistory} className="btn-clear-history">Xóa tất cả</button>
                    </div>
                    <ul className="search-history-list">
                        {searchHistory.map((term, index) => (
                            <li
                                key={index}
                                className={classNames("history-item", { 'selected': selectedIndex === index })}
                                onClick={() => handleSearchHistoryItemClick(term)}
                                ref={el => resultRefs.current[index] = el}
                            >
                                <span className="history-term">{term}</span>
                                <button
                                    className="btn-remove-history-item"
                                    onClick={(e) => handleRemoveHistoryItem(e, term)}
                                    aria-label={`Xóa "${term}" khỏi lịch sử`}
                                >
                                    &times;
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            );
        }
        // Không có query và không có lịch sử
        return <div className="search-noitem p-3 text-center text-muted">Hãy nhập từ khóa bất kì để tìm kiếm!</div>;
    };

    return (
        <div className={classNames("header-search", { 'is-focused': isResultVisible })} ref={searchRef}>
            <form onSubmit={handleFormSubmit} className="search-box" ref={searchBoxRef}>
                <input
                    type="search"
                    className="search-input"
                    placeholder="Tìm kiếm phim, truyện tranh..."
                    value={query}
                    onChange={handleInputChange}
                    onFocus={handleFocus}
                    aria-expanded={isResultVisible}
                    aria-controls="search-result-dropdown"
                />
                <span className="search-btn">
                    <i className="fas fa-search"></i>
                </span>
            </form>
            {isResultVisible && (
                <div
                    id="search-result-dropdown"
                    className={classNames("search-result", { 'activated': isResultVisible })}
                    ref={searchResultRef}
                >
                    {renderSearchContent()}
                </div>
            )}
        </div>
    );
};

export default Search;