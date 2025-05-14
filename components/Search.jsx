import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom'; // Import useNavigate
import Mark from 'mark.js';
import debounce from 'lodash.debounce'; // Đảm bảo đã cài đặt lodash
import { toast, Bounce } from 'react-toastify'; // Import toast
import classNames from '../utils/classNames'; // Giả sử có helper này

// Giới hạn kết quả tìm kiếm
const SEARCH_LIMIT = 12;

const Search = () => {
    const [query, setQuery] = useState(""); // Bỏ lazy init nếu không cần thiết
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [selectedIndex, setSelectedIndex] = useState(null); // Chỉ số item đang chọn bằng bàn phím
    const [isResultVisible, setIsResultVisible] = useState(false); // State quản lý hiển thị dropdown

    // Refs
    const searchRef = useRef(null); // Ref cho container chính
    const searchBoxRef = useRef(null); // Ref cho input
    const searchResultRef = useRef(null); // Ref cho dropdown kết quả
    const resultRefs = useRef([]); // Ref cho từng result item để scrollIntoView

    const navigate = useNavigate(); // Hook điều hướng SPA

    // --- Hàm xử lý lỗi API ---
    const handleApiError = useCallback((err, operation = "tìm kiếm") => {
        console.error(`Error ${operation}:`, err);
        let message = `Không thể ${operation}. Vui lòng thử lại.`;
        if (err.response?.data?.message) {
            message = err.response.data.message;
        } else if (err.message) {
            message = err.message;
        }
        setError(message); // Vẫn set lỗi để hiển thị trong dropdown nếu cần
        toast.error(message, {
            theme: document.documentElement.getAttribute("data-ww-theme") || "light",
            transition: Bounce,
        });
    }, []);

    // --- Debounced Fetch ---
    const fetchResults = useMemo(() => debounce(async (searchTerm) => {
        if (!searchTerm.trim()) {
            setResults([]);
            setError(null);
            setIsResultVisible(false); // Ẩn dropdown nếu query rỗng
            return;
        }
        setLoading(true);
        setError(null);
        setIsResultVisible(true); // Hiển thị dropdown khi bắt đầu fetch
        try {
            const response = await axios.get(`/api/search-movie`, { // API endpoint từ controller trước
                params: { q: searchTerm, limit: SEARCH_LIMIT }
            });
            // Kiểm tra cấu trúc response
            const movies = response.data?.movies || response.data || []; // Linh hoạt với cấu trúc trả về
            setResults(Array.isArray(movies) ? movies : []);
            if (!Array.isArray(movies) || movies.length === 0) {
                // setError("Không tìm thấy kết quả nào."); // Có thể không cần set lỗi ở đây
            }
        } catch (err) {
            handleApiError(err, 'tìm kiếm phim');
            setResults([]);
        } finally {
            setLoading(false);
        }
    }, 300), [handleApiError]); // Giảm debounce xuống 300ms ?

    // Gọi fetch khi query thay đổi
    useEffect(() => {
        fetchResults(query);
        setSelectedIndex(null); // Reset lựa chọn khi query thay đổi
        return () => {
            fetchResults.cancel(); // Hủy debounce call khi unmount
        };
    }, [query, fetchResults]);

    // --- Highlighting với Mark.js ---
    // Ref cho instance Mark.js để cleanup
    const markInstanceRef = useRef(null);
    useEffect(() => {
        // Chỉ highlight khi có kết quả và query không rỗng
        if (searchResultRef.current && results.length > 0 && query.trim()) {
            const context = searchResultRef.current; // Context là toàn bộ dropdown
            const keyword = query.trim().replace(/[&/\\#,+()$~@$^%.'"*?<>{}]/g, " ");
            const options = {
                separateWordSearch: false, // Tìm chính xác cụm từ hơn
                accuracy: "partially", // Tìm gần đúng
                className: 'search-highlight' // Class cho từ được highlight
            };

            // Tạo instance mới nếu chưa có hoặc context thay đổi
            if (!markInstanceRef.current) {
                markInstanceRef.current = new Mark(context);
            }

            // Clear highlight cũ và highlight mới
            markInstanceRef.current.unmark({
                done: () => {
                    markInstanceRef.current?.mark(keyword, options);
                }
            });
        } else if (markInstanceRef.current) {
            // Clear highlight nếu không có kết quả hoặc query rỗng
            markInstanceRef.current.unmark();
        }

        // Cleanup Mark.js instance khi component unmount (quan trọng)
        // return () => {
        //     markInstanceRef.current?.unmark(); // Có thể gây lỗi nếu context đã bị xóa
        // };
    }, [results, query]); // Chạy lại khi results hoặc query thay đổi


    // --- Keyboard Navigation ---
    const handleKeyDown = useCallback((e) => {
        const resultsCount = results.length;
        if (!resultsCount) return; // Không làm gì nếu không có kết quả

        switch (e.key) {
            case "ArrowDown":
                e.preventDefault(); // Ngăn cuộn trang
                setSelectedIndex(prev => (prev === null || prev + 1 >= resultsCount ? 0 : prev + 1));
                break;
            case "ArrowUp":
                e.preventDefault(); // Ngăn cuộn trang
                setSelectedIndex(prev => (prev === null || prev - 1 < 0 ? resultsCount - 1 : prev - 1));
                break;
            case "Enter":
                if (selectedIndex !== null && results[selectedIndex]) {
                    e.preventDefault();
                    // --- SỬ DỤNG useNavigate ---
                    navigate(`/album/${results[selectedIndex].slug}`);
                    // Reset search sau khi navigate
                    setQuery('');
                    setResults([]);
                    setIsResultVisible(false);
                    searchBoxRef.current?.blur(); // Mất focus khỏi input
                }
                break;
            case "Escape":
                e.preventDefault();
                setQuery('');
                setResults([]);
                setIsResultVisible(false);
                searchBoxRef.current?.blur();
                break;
            default:
                break;
        }
    }, [selectedIndex, results, navigate]); // Thêm navigate dependency

    // --- Scroll vào item được chọn ---
    useEffect(() => {
        if (selectedIndex !== null && resultRefs.current[selectedIndex]) {
            resultRefs.current[selectedIndex].scrollIntoView({
                behavior: 'smooth',
                block: 'nearest' // Cuộn ít nhất có thể
            });
        }
    }, [selectedIndex]);


    // --- Xử lý Focus / Blur để Hiện / Ẩn Dropdown ---
    const handleFocus = useCallback(() => {
        // Chỉ hiện dropdown nếu có query hoặc kết quả cũ
        if (query.trim() || results.length > 0) {
            setIsResultVisible(true);
        }
    }, [query, results.length]);

    // Click ra ngoài để ẩn dropdown
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setIsResultVisible(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);


    // --- Render ---
    return (
        <div
            className="search"
            ref={searchRef}
        // onBlur không cần thiết nữa nếu dùng click outside
        // tabIndex="-1" // Không cần thiết
        >
            <div className="search-box">
                {/* Thêm ARIA cho input */}
                <input
                    ref={searchBoxRef}
                    className="search-input"
                    required
                    placeholder="Tìm kiếm phim..."
                    autoComplete="off"
                    type="text" // type="search" cũng được
                    name="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onFocus={handleFocus}
                    role="combobox" // ARIA role
                    aria-autocomplete="list" // ARIA autocomplete
                    aria-expanded={isResultVisible && results.length > 0} // ARIA expanded
                    aria-controls="search-result-list" // ARIA controls
                    aria-activedescendant={selectedIndex !== null ? `result-item-${results[selectedIndex]?.id}` : undefined} // ARIA active descendant
                />
                <span className="search-btn" type="button" id="searchButton"> {/* Đổi thành button nếu có action click */}
                    {loading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fa-regular fa-magnifying-glass"></i>}
                </span>
            </div>
            {/* Dropdown Kết quả */}
            <div
                ref={searchResultRef}
                // Dùng classNames helper để quản lý class 'activated'
                className={classNames('search-result', { 'activated': isResultVisible && (results.length > 0 || error || loading) })}
                id="search-result" // Giữ id nếu CSS cần
            >
                {/* Loading Indicator */}
                {loading && <div className="search-loading p-3 text-center text-muted">Đang tìm kiếm...</div>}

                {/* Error Message */}
                {error && !loading && <div className="search-error p-3 text-center text-danger">{error}</div>}

                {/* Result List */}
                {!loading && !error && results.length > 0 && (
                    // Thêm ARIA cho list
                    <ul className="result-body list-unstyled mb-0" role="listbox" id="search-result-list">
                        {results.map((movie, index) => (
                            <li
                                key={movie.id}
                                ref={el => resultRefs.current[index] = el} // Gán ref cho từng item
                                className={classNames("result-item", { selected: selectedIndex === index })}
                                role="option" // ARIA role
                                id={`result-item-${movie.id}`} // ID cho aria-activedescendant
                                aria-selected={selectedIndex === index} // ARIA selected
                                // Thêm onMouseDown để ngăn blur khi click vào item
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => { // Xử lý click trực tiếp vào item
                                    navigate(`/album/${movie.slug}`);
                                    setQuery('');
                                    setResults([]);
                                    setIsResultVisible(false);
                                }}
                            >
                                {/* Link không cần target blank nếu dùng SPA navigation */}
                                <Link to={`/album/${movie.slug}`} className="d-flex align-items-center text-decoration-none text-body">
                                    <div className="result-item-thumbnail flex-shrink-0">
                                        <img src={movie.poster ? `/${movie.poster}` : '/placeholder.jpg'} alt={movie.title} loading="lazy" />
                                    </div>
                                    <div className="result-item-meta ms-2">
                                        {/* Render text và để Mark.js xử lý highlight */}
                                        <div className="result-item-title fw-bold">{movie.title}</div>
                                        <div className="result-item-subTitle small text-muted">{movie.subTitle}</div>
                                    </div>
                                </Link>
                            </li>
                        ))}
                    </ul>
                )}

                {/* No Results */}
                {!loading && !error && results.length === 0 && query.trim() && (
                    <div className="search-noitem p-3 text-center text-muted">Không tìm thấy kết quả nào.</div>
                )}
            </div>
        </div>
    );
};

export default Search;