import { useState, useMemo, useEffect, useRef, useCallback } from "react";

const useTableData = (initialData = [], defaultItemsPerPage = 10) => {
    const [searchTerm, setSearchTerm] = useState("");
    const [debouncedValue, setDebouncedValue] = useState("");
    const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(defaultItemsPerPage);

    const isInitialMount = useRef(true);

    // --- Debounce search term ---
    useEffect(() => {
        const timeoutId = setTimeout(() => setDebouncedValue(searchTerm), 200);
        return () => clearTimeout(timeoutId);
    }, [searchTerm]);

    // --- Handle Search Input ---
    const handleSearch = useCallback((event) => {
        setSearchTerm(event?.target?.value || "");
    }, []);

    // --- Filter Data ---
    const filteredData = useMemo(() => {
        const data = Array.isArray(initialData) ? initialData : [];
        if (!debouncedValue) return data;

        const term = debouncedValue.toLowerCase();
        return data.filter(item => {
            const values = Object.values(item).flat(Infinity);
            return values.some(value =>
                typeof value === "string" && value.toLowerCase().includes(term)
            );
        });
    }, [initialData, debouncedValue]);

    // --- Sort Data ---
    const sortedData = useMemo(() => {
        const data = Array.isArray(filteredData) ? [...filteredData] : [];
        const { key, direction } = sortConfig;

        if (!key) return data;

        const getValue = (obj, keyPath) => {
            return keyPath.split('.').reduce((acc, curr) => acc?.[curr], obj);
        };

        return data.sort((a, b) => {
            const aVal = getValue(a, key);
            const bVal = getValue(b, key);

            if (aVal == null && bVal == null) return 0;
            if (aVal == null) return direction === "asc" ? -1 : 1;
            if (bVal == null) return direction === "asc" ? 1 : -1;

            if (typeof aVal === "number" && typeof bVal === "number") {
                return direction === "asc" ? aVal - bVal : bVal - aVal;
            }

            return direction === "asc"
                ? String(aVal).localeCompare(String(bVal), undefined, { numeric: true, sensitivity: "base" })
                : String(bVal).localeCompare(String(aVal), undefined, { numeric: true, sensitivity: "base" });
        });
    }, [filteredData, sortConfig]);

    // --- Reset Page on Filter/Sort Change ---
    useEffect(() => {
        if (isInitialMount.current) {
            isInitialMount.current = false;
            return;
        }
        setCurrentPage(1);
    }, [debouncedValue, sortConfig]);

    // --- Pagination ---
    const paginatedData = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return sortedData.slice(start, start + itemsPerPage);
    }, [sortedData, currentPage, itemsPerPage]);

    const totalEntries = useMemo(() => Array.isArray(initialData) ? initialData.length : 0, [initialData]);
    const filteredEntries = filteredData.length;
    const totalPages = useMemo(() => Math.ceil(filteredEntries / itemsPerPage), [filteredEntries, itemsPerPage]);

    // --- Adjust current page if out of range ---
    useEffect(() => {
        if (currentPage > totalPages && totalPages > 0) {
            setCurrentPage(totalPages);
        }
    }, [currentPage, totalPages]);

    const startEntry = useMemo(() => filteredEntries > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0, [currentPage, itemsPerPage, filteredEntries]);
    const endEntry = useMemo(() => filteredEntries > 0 ? Math.min(currentPage * itemsPerPage, filteredEntries) : 0, [currentPage, itemsPerPage, filteredEntries]);

    // --- Request Sort ---
    const requestSort = useCallback((key) => {
        if (!key) return;
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc"
        }));
    }, []);

    // --- Items Per Page ---
    const handleItemsPerPageChange = useCallback((event) => {
        const value = Number(event.target.value);
        if (value > 0) {
            setItemsPerPage(value);
            setCurrentPage(1);
        }
    }, []);

    // --- Go To Specific Page ---
    const goToPage = useCallback((pageNumber) => {
        const newPage = Math.max(1, Math.min(pageNumber, totalPages || 1));
        setCurrentPage(newPage);
    }, [totalPages]);

    return {
        data: paginatedData,
        totalPages,
        currentPage,
        searchTerm,
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
