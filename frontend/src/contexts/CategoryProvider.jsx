import { createContext, useContext, useCallback, useEffect, useState, useMemo } from "react";
import axios from "axios";
import NProgress from 'nprogress';
import { handleApiError } from "../utils/handleApiError";

const CategoryContext = createContext();

export const CategoryProvider = ({ children }) => {
    const [filters, setFilters] = useState({
        region: null,
        genre: null,
        year: null,
        season: null,
        order: 'Hot',
    });
    const [dataFiltersList, setDataFiltersList] = useState({ countries: [], genres: [], years: [] });
    const [dataList, setDataList] = useState([]);

    const [loading, setLoading] = useState(false);
    const [filterLoading, setFilterLoading] = useState(false);

    const handleFilterClick = useCallback((category, value) => {
        setFilters((prevFilters) => ({
            ...prevFilters,
            [category]: value,
        }));
    }, []);

    useEffect(() => {
        const fetchFilteredAnime = async () => {
            setLoading(true);
            NProgress.start();
            try {
                if (Object.values(filters).every((v, i) => i === 4 || v === null) && filters.order === 'Hot') {
                    console.log("Default filters, potentially skip API call or fetch default list.");
                }
                const response = await axios.post('/api/filter', filters);
                setDataList(response.data.movies || []);
            } catch (error) {
                handleApiError(error, 'lọc phim');
                setDataList([]);
            } finally {
                setLoading(false);
                NProgress.done();
            }
        };
        fetchFilteredAnime();
    }, [filters, handleApiError]);

    useEffect(() => {
        const getDataFilters = async () => {
            setFilterLoading(true);
            try {
                const response = await axios.get('/api/filters');
                const fetchedFilters = response.data || {};
                setDataFiltersList({
                    countries: Array.isArray(fetchedFilters.countries) ? fetchedFilters.countries : [],
                    genres: Array.isArray(fetchedFilters.genres) ? fetchedFilters.genres : [],
                    years: Array.isArray(fetchedFilters.years) ? fetchedFilters.years.sort((a, b) => b - a) : [],
                });
            } catch (error) {
                handleApiError(error, 'tải các tùy chọn bộ lọc');
                setDataFiltersList({ countries: [], genres: [], years: [] });
            } finally {
                setFilterLoading(false);
            }
        };
        getDataFilters();
    }, [handleApiError]);

    const calculatedGroupedYears = useMemo(() => {
        const years = dataFiltersList.years || [];
        if (years.length === 0) return [];

        const grouped = [];
        let i = 0;
        while (i < years.length) {
            const currentYear = years[i];
            const startYear = currentYear;
            let endYear = currentYear;
            let groupEndIndex = i;

            while (groupEndIndex + 1 < years.length && startYear - years[groupEndIndex + 1] < 5) {
                groupEndIndex++;
            }
            endYear = years[groupEndIndex];

            grouped.push(startYear === endYear ? `${startYear}` : `${endYear}-${startYear}`);

            i = groupEndIndex + 1;
        }
        return grouped.reverse();
    }, [dataFiltersList.years]);


    const contextValue = useMemo(() => ({
        filters,
        setFilters,
        dataFiltersList,
        dataList,
        groupedYears: calculatedGroupedYears,
        handleFilterClick,
        loading,
        filterLoading
    }), [
        filters, setFilters, dataFiltersList, dataList, calculatedGroupedYears,
        handleFilterClick, loading, filterLoading
    ]);

    return (
        <CategoryContext.Provider value={contextValue}>
            {children}
        </CategoryContext.Provider>
    );
};

// Hook để sử dụng Context
export const useCategory = () => { // Thêm export nếu cần
    return useContext(CategoryContext);
};