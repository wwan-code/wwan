// src/components/SearchPopup.jsx
import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import debounce from 'lodash.debounce';
import Mark from 'mark.js';
import classNames from '@utils/classNames';
import { handleApiError } from '@utils/handleApiError';
import {
    getSearchHistory,
    addSearchHistory,
    removeSearchHistoryItem,
    clearSearchHistory
} from '@utils/searchHistoryUtils'; // Đảm bảo đường dẫn đúng

const SEARCH_LIMIT_POPUP = 8;

const SearchPopup = ({ show, onClose }) => {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [selectedIndex, setSelectedIndex] = useState(null);
    const [searchHistory, setSearchHistory] = useState([]); // State cho lịch sử

    // State isVisible và overlayRef cho animation (giữ nguyên từ lần sửa trước)
    const [isVisible, setIsVisible] = useState(false);
    const overlayRef = useRef(null);


    const navigate = useNavigate();
    const inputRef = useRef(null);
    const searchResultRef = useRef(null); // Ref cho phần body của popup chứa kết quả/lịch sử
    const resultRefs = useRef([]);

    // Animation logic (giữ nguyên)
    useEffect(() => {
        if (show) {
            const timer = setTimeout(() => setIsVisible(true), 10);
            return () => clearTimeout(timer);
        } else {
            setIsVisible(false);
        }
    }, [show]);

    // Focus input và load lịch sử khi popup mở
    useEffect(() => {
        if (show && inputRef.current) {
            inputRef.current.focus();
            // Load lịch sử khi popup mở và query rỗng
            if (!query.trim()) {
                setSearchHistory(getSearchHistory());
            }
        }
    }, [show, query]); // Thêm query vào dependencies

    // Đóng popup khi nhấn phím Escape
    useEffect(() => {
        const handleEsc = (event) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };
        if (show) {
            window.addEventListener('keydown', handleEsc);
        }
        return () => {
            window.removeEventListener('keydown', handleEsc);
        };
    }, [show, onClose]);


    const fetchResults = useMemo(() => debounce(async (searchTerm) => {
        if (!searchTerm.trim()) {
            setResults([]); // Xóa kết quả tìm kiếm
            setError(null);
            // Không đóng popup, sẽ hiển thị lịch sử nếu query rỗng
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const response = await axios.get(`/api/search/multi`, {
                params: { q: searchTerm, limit: SEARCH_LIMIT_POPUP }
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
            // Nếu query rỗng, xóa kết quả tìm kiếm hiện tại để hiển thị lịch sử
            setResults([]);
            setError(null);
            setSearchHistory(getSearchHistory()); // Cập nhật lại lịch sử khi input rỗng
        }
        setSelectedIndex(null);
    };

    // Hàm thực hiện tìm kiếm và lưu lịch sử
    const performSearchAndSaveHistory = (searchTerm) => {
        if (!searchTerm || !searchTerm.trim()) return;
        setQuery(searchTerm); // Cập nhật input với từ khóa này
        fetchResults(searchTerm); // Thực hiện tìm kiếm
        const updatedHistory = addSearchHistory(searchTerm); // Lưu vào lịch sử
        setSearchHistory(updatedHistory); // Cập nhật state lịch sử
    };


    const handleResultClick = (item) => {
        performSearchAndSaveHistory(item.title); // Lưu tiêu đề khi click kết quả
        if (item.itemType === 'movie') {
            navigate(`/album/${item.slug}`);
        } else if (item.itemType === 'comic') {
            navigate(`/truyen/${item.slug}`);
        }
        onCloseAndReset();
    };

    const handleSearchHistoryItemClick = (historyTerm) => {
        performSearchAndSaveHistory(historyTerm);
    };

    const handleRemoveHistoryItem = (e, termToRemove) => {
        e.stopPropagation();
        const updatedHistory = removeSearchHistoryItem(termToRemove);
        setSearchHistory(updatedHistory);
    };

    const handleClearAllHistory = (e) => {
        e.stopPropagation();
        const updatedHistory = clearSearchHistory();
        setSearchHistory(updatedHistory);
    };

    const onCloseAndReset = () => {
        onClose();
        // Reset trạng thái khi đóng popup để lần mở sau sạch sẽ
        setTimeout(() => { // Delay nhẹ để không thấy reset trước khi animation đóng xong
            setQuery('');
            setResults([]);
            setError(null);
            setLoading(false);
            setSelectedIndex(null);
            setSearchHistory([]); // Có thể không cần reset lịch sử ở đây, chỉ reset query
        }, 300); // Khớp với thời gian animation
    };


    // Xử lý nhấn phím
    useEffect(() => {
        if (!show) return;

        const handleKeyDown = (event) => {
            const isDisplayingHistory = query.trim() === "" && results.length === 0 && searchHistory.length > 0;
            const currentList = query.trim() !== "" && results.length > 0 ? results : (isDisplayingHistory ? searchHistory : []);

            if (currentList.length === 0 && event.key !== 'Escape' && event.key !== 'Enter') return;


            if (event.key === 'ArrowDown') {
                event.preventDefault();
                setSelectedIndex(prev => (prev === null || prev === currentList.length - 1 ? 0 : prev + 1));
            } else if (event.key === 'ArrowUp') {
                event.preventDefault();
                setSelectedIndex(prev => (prev === null || prev === 0 ? currentList.length - 1 : prev - 1));
            } else if (event.key === 'Enter') {
                if (selectedIndex !== null && currentList[selectedIndex]) {
                    event.preventDefault();
                    if (isDisplayingHistory) {
                        handleSearchHistoryItemClick(currentList[selectedIndex]);
                    } else {
                        handleResultClick(currentList[selectedIndex]);
                    }
                } else if (query.trim()) {
                    event.preventDefault();
                    performSearchAndSaveHistory(query.trim());
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [show, query, results, searchHistory, selectedIndex, handleResultClick, handleSearchHistoryItemClick, performSearchAndSaveHistory]);


    useEffect(() => {
        const currentListLength = Math.max(results.length, query.trim() === "" ? searchHistory.length : 0);
        resultRefs.current = resultRefs.current.slice(0, currentListLength);
    }, [results, searchHistory, query]);

    useEffect(() => {
        if (selectedIndex !== null && resultRefs.current[selectedIndex]) {
            resultRefs.current[selectedIndex].scrollIntoView({
                behavior: 'smooth',
                block: 'nearest'
            });
        }
    }, [selectedIndex]);

    useEffect(() => {
        if (results.length > 0 && query.trim() && searchResultRef.current && show) {
            const instance = new Mark(searchResultRef.current.querySelectorAll(".result-item-title, .result-item-subTitle"));
            instance.unmark({
                done: () => {
                    try {
                        instance.mark(query.trim());
                    } catch (e) {
                        console.error("Mark.js error in popup:", e);
                    }
                }
            });
        }
    }, [query, results, show]);


    const renderSearchContentInPopup = () => {
        if (loading) {
            return <div className="search-loading p-3 text-center text-muted">Đang tìm kiếm...</div>;
        }
        if (error) {
            return <div className="search-error p-3 text-center text-danger">{error}</div>;
        }

        if (query.trim() !== "") {
            if (results.length > 0) {
                return (
                    <ul className="search-popup-results-list">
                        {results.map((item, index) => (
                            <li
                                key={`${item.itemType}-${item.id}`}
                                className={classNames("result-item-popup", { 'selected': selectedIndex === index })}
                                onClick={() => handleResultClick(item)}
                                ref={el => resultRefs.current[index] = el}
                            >
                                <Link
                                    to={item.itemType === 'movie' ? `/album/${item.slug}` : `/truyen/${item.slug}`}
                                    className="result-item-link"
                                    onClick={onCloseAndReset}
                                >
                                    <div className="result-item-thumbnail-popup">
                                        <img
                                            src={
                                                (item.itemType === 'movie' && item.posterURL) ? `${process.env.REACT_APP_API_URL_IMAGE}/${item.posterURL}` :
                                                (item.itemType === 'comic' && item.coverImage) ? `${process.env.REACT_APP_API_URL_IMAGE}/${item.coverImage}` :
                                                ''
                                            }
                                            alt={item.title}
                                            loading="lazy"
                                        />
                                    </div>
                                    <div className="result-item-meta-popup">
                                        <div className="result-item-title fw-bold">
                                            {item.title}
                                            <span className={`item-type-badge ms-2 badge bg-${item.itemType === 'movie' ? 'primary' : 'success'}`}>
                                                {item.itemType === 'movie' ? 'Phim' : 'Truyện'}
                                            </span>
                                        </div>
                                        <div className="result-item-subTitle small text-muted">
                                            {item.itemType === 'movie' && item.subTitle && `${item.subTitle}`}
                                            {item.itemType === 'movie' && item.year && ` (${item.year})`}
                                            {item.itemType === 'comic' && item.status && `Tình trạng: ${item.status}`}
                                        </div>
                                    </div>
                                </Link>
                            </li>
                        ))}
                    </ul>
                );
            }
            return <div className="search-noitem p-3 text-center text-muted">Không tìm thấy kết quả nào cho "{query}".</div>;
        }

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
                                key={`${term}-${index}`}
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

        return <div className="search-noitem p-3 text-center text-muted">Hãy nhập từ khóa bất kì để tìm kiếm!</div>;
    };

    if (!isVisible && !show) {
        return null;
    }

    return (
        <div
            ref={overlayRef}
            className={classNames("search-popup-overlay", { "search-popup-visible": isVisible && show })}
            onClick={onCloseAndReset} // Đổi thành onCloseAndReset
        >
            <div className="search-popup-content" onClick={(e) => e.stopPropagation()}>
                <div className="search-popup-header">
                    <input
                        ref={inputRef}
                        type="text"
                        className="search-popup-input"
                        placeholder="Tìm kiếm phim, truyện..."
                        value={query}
                        onChange={handleInputChange}
                        aria-label="Search"
                    />
                    <button className="search-popup-close-btn" onClick={onCloseAndReset} aria-label="Đóng tìm kiếm">
                        <i className="fas fa-times"></i>
                    </button>
                </div>
                <div className="search-popup-body" ref={searchResultRef}>
                    {renderSearchContentInPopup()}
                </div>
            </div>
        </div>
    );
};

export default SearchPopup;