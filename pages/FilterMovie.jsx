import { useEffect } from "react";
import FilterComponent from "../components/FilterComponent";
import { CategoryProvider, useCategory } from "../contexts/CategoryProvider";
import SingleFilm from "../components/SingleFilm";

const FilterMovie = () => {
    useEffect(() => {
        document.title = "Filter Movies - WWAN Film";
    }, []);
    return (
        <CategoryProvider>
            <Filter />
        </CategoryProvider>
    )
}
const Filter = () => {
    const { dataList, loading } = useCategory();
    return (
        <section>
            <div className='container'>
                <div className="category__operate">
                    <FilterComponent />
                </div>
                {loading ? <div className="loading-indicator">
                    <div className="loading-spinner"></div>
                </div> : <div className="card-section category__list mt-4">
                    <ul className="section-list section-list__multi section-list__column">
                        {
                            dataList && dataList.length > 0 ? dataList.map((movie, i) => (
                                <li key={movie.id} className="section-list__item">
                                        <SingleFilm movie={movie} />
                                </li>
                            )) : (
                                <li className="no-results">Không có phim</li>
                            )
                        }
                    </ul>
                </div>
                }

            </div>
        </section>
    )
}
export default FilterMovie;