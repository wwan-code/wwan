import { useState, useMemo, useEffect, useRef } from "react"; // Thêm useRef

const useTableData = (initialData = [], defaultItemsPerPage = 10) => {
    const [searchTerm, setSearchTerm] = useState("");
    const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(defaultItemsPerPage);
    const [debouncedValue, setDebouncedValue] = useState("");

    // --- Debounce search term ---
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            setDebouncedValue(searchTerm);
        }, 200); // Thời gian debounce có thể điều chỉnh

        return () => {
            clearTimeout(timeoutId);
        };
    }, [searchTerm]);

    const handleSearch = event => {
        const term = event.target.value || "";
        setSearchTerm(term);
        // Không reset page ở đây, chờ debounce
    };

    // --- Lọc dữ liệu (Đã đơn giản hóa) ---
    const filteredData = useMemo(() => {
        // Đảm bảo initialData luôn là mảng
        const dataToFilter = Array.isArray(initialData) ? initialData : [];
        if (!debouncedValue) return dataToFilter;

        const lowercasedSearchTerm = debouncedValue.toLowerCase();

        return dataToFilter.filter(item => {
            // Lấy tất cả giá trị và làm phẳng mảng lồng nhau (nếu có)
            const values = Object.values(item).flat(Infinity);

            // Kiểm tra xem có giá trị string nào chứa search term không
            return values.some(value =>
                typeof value === 'string' && value.toLowerCase().includes(lowercasedSearchTerm)
            );
            // Không cần check Array.isArray(value) nữa sau khi đã flat
        });
    }, [initialData, debouncedValue]);

    // --- Sắp xếp dữ liệu ---
    const sortedData = useMemo(() => {
        const dataToSort = Array.isArray(filteredData) ? filteredData : [];
        if (!sortConfig.key) return dataToSort;

        // Tạo bản sao để không thay đổi mảng gốc
        const sortableData = [...dataToSort];

        sortableData.sort((a, b) => {
            // Hàm lấy giá trị, hỗ trợ nested key
            const getValue = (obj, key) => {
                 if (!obj || typeof key !== 'string') return undefined; // Thêm kiểm tra đầu vào
                const keys = key.split('.');
                let value = obj;
                for (const k of keys) {
                    // Kiểm tra từng bước để tránh lỗi nếu key trung gian không tồn tại
                    if (value === null || typeof value === 'undefined') return undefined;
                    value = value[k];
                }
                return value;
            };

            const valueA = getValue(a, sortConfig.key);
            const valueB = getValue(b, sortConfig.key);

            // Xử lý giá trị undefined hoặc null
             if (valueA == null && valueB == null) return 0;
             if (valueA == null) return sortConfig.direction === "asc" ? -1 : 1; // null/undefined lên đầu khi asc
             if (valueB == null) return sortConfig.direction === "asc" ? 1 : -1; // null/undefined xuống cuối khi desc

            // Sắp xếp số
            if (typeof valueA === "number" && typeof valueB === "number") {
                return sortConfig.direction === "asc" ? valueA - valueB : valueB - valueA;
            }

             // Sắp xếp chuỗi (bao gồm natural sort cho số trong chuỗi)
             // Chuyển đổi giá trị không phải chuỗi thành chuỗi để so sánh an toàn
             const stringA = String(valueA);
             const stringB = String(valueB);

            return sortConfig.direction === "asc"
                ? stringA.localeCompare(stringB, undefined, { numeric: true, sensitivity: 'base' })
                : stringB.localeCompare(stringA, undefined, { numeric: true, sensitivity: 'base' });
        });

        return sortableData;
    }, [filteredData, sortConfig]);

     // --- Tự động Reset Trang về 1 khi Lọc hoặc Sắp xếp thay đổi ---
     const isInitialMount = useRef(true); // Dùng ref để bỏ qua lần render đầu tiên

     useEffect(() => {
         // Bỏ qua lần chạy đầu tiên của useEffect
         if (isInitialMount.current) {
             isInitialMount.current = false;
             return;
         }
         // Nếu không phải lần đầu, reset về trang 1
         if (currentPage !== 1) {
            setCurrentPage(1);
         }
         // eslint-disable-next-line react-hooks/exhaustive-deps
     }, [debouncedValue, sortConfig]); // Chỉ reset khi filter hoặc sort thay đổi (sau lần đầu)


    // --- Phân trang dữ liệu ---
    const paginatedData = useMemo(() => {
        const dataToPaginate = Array.isArray(sortedData) ? sortedData : [];
        const startIndex = (currentPage - 1) * itemsPerPage;
        return dataToPaginate.slice(startIndex, startIndex + itemsPerPage);
    }, [sortedData, currentPage, itemsPerPage]);

    // --- Tính toán các giá trị hiển thị ---
    const totalEntries = useMemo(() => (Array.isArray(initialData) ? initialData.length : 0), [initialData]);
    const filteredEntries = useMemo(() => (Array.isArray(filteredData) ? filteredData.length : 0), [filteredData]);
    const totalPages = useMemo(() => Math.ceil(filteredEntries / itemsPerPage), [filteredEntries, itemsPerPage]);

     // Điều chỉnh lại trang hiện tại nếu nó vượt quá tổng số trang (ví dụ khi số mục/trang tăng lên)
     useEffect(() => {
        if(totalPages > 0 && currentPage > totalPages) {
            setCurrentPage(totalPages);
        }
     }, [currentPage, totalPages]);

    // Tính toán startEntry và endEntry an toàn hơn
    const startEntry = useMemo(() => filteredEntries > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0, [currentPage, itemsPerPage, filteredEntries]);
    const endEntry = useMemo(() => filteredEntries > 0 ? Math.min(currentPage * itemsPerPage, filteredEntries) : 0, [currentPage, itemsPerPage, filteredEntries]);

    // --- Xử lý sắp xếp ---
    const requestSort = (key) => {
         if (!key) return; // Không làm gì nếu key không hợp lệ
        let direction = "asc";
        if (sortConfig.key === key && sortConfig.direction === "asc") {
            direction = "desc";
        }
        setSortConfig({ key, direction });
        // Reset page đã được xử lý bởi useEffect ở trên
    };

    // --- Xử lý thay đổi số mục trên mỗi trang ---
    const handleItemsPerPageChange = event => {
        const value = Number(event.target.value);
        if (value > 0) {
            setItemsPerPage(value);
            setCurrentPage(1); // Reset về trang 1 khi thay đổi số mục
        }
    };

    // --- Đi tới trang cụ thể ---
    const goToPage = (pageNumber) => {
         // Đảm bảo pageNumber nằm trong khoảng hợp lệ
         const newPage = Math.max(1, Math.min(pageNumber, totalPages || 1));
         setCurrentPage(newPage);
    };


    // Trả về các giá trị và hàm
    return {
        data: paginatedData,
        totalPages,
        currentPage,
        searchTerm, // Vẫn trả về searchTerm gốc để hiển thị trên input
        handleSearch,
        requestSort,
        goToPage,
        sortConfig,
        itemsPerPage,
        handleItemsPerPageChange,
        totalEntries,
        filteredEntries,
        startEntry,
        endEntry,
    };
};

export default useTableData;