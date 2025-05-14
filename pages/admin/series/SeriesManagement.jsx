import axios from "axios";
import { useEffect, useState } from "react";
import SeriesForm from "./SeriesForm";
import MovieSeriesForm from "./MovieSeriesForm";
import ListSeries from "./ListSeries";
import authHeader from "../../../services/auth-header";

const SeriesManagement = () => {
    const [series, setSeries] = useState([]);
    const [selectedSeriesEdit, setSelectedSeriesEdit] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [movies, setMovies] = useState({});

    const fetchSeries = async () => {
        setLoading(true);
        try {
            const res = await axios.get('/api/series', {
                headers: authHeader()
            });
            setSeries(res.data);
        } catch (err) {
            setError('Failed to fetch series');
        } finally {
            setLoading(false);
        }
    };

    const fetchMoviesForSeries = async (seriesId) => {
        try {
            const res = await axios.get(`/api/movies/series/${seriesId}`);
            setMovies(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleSeriesChange = async () => {
        await fetchSeries();
        setSelectedSeriesEdit(null);
    };

    const handleShowListSeries = (seriesId) => {
        fetchMoviesForSeries(seriesId);
    };

    useEffect(() => {
        fetchSeries();
    }, []);
    return (
        <div className="flex-grow-1 container-p-y container-fluid">
            {loading && (
                <div className="d-flex justify-content-center align-items-center">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                </div>
            )}
            {error && (
                <div className="alert alert-danger" role="alert">
                    {error}
                </div>
            )}
            {!loading && !error && (
                <div>
                    <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4 row-gap-4">
                        <div className="d-flex flex-column justify-content-center">
                            <h4 className="mb-1">Thêm dữ liệu mới</h4>
                        </div>
                        <div className="d-flex align-content-center flex-wrap gap-4">
                            <div className="d-flex gap-4">
                                <button
                                    className="btn btn-label-secondary"
                                >
                                    Discard
                                </button>
                                <button
                                    className="btn btn-label-info"
                                >
                                    Save draft
                                </button>
                            </div>
                            <button className="btn btn-primary">
                                Cập nhật dữ liệu
                            </button>
                        </div>
                    </div>
                    <div className="row g-4">
                        <div className="col-12">
                            <SeriesForm
                                onSeriesChange={handleSeriesChange}
                                series={selectedSeriesEdit}
                                onEdit={!!selectedSeriesEdit}
                            />
                        </div>
                        <div className="col-12">
                            <MovieSeriesForm series={series} />
                        </div>
                        <div className="col-12">
                            <ListSeries series={series} movies={movies} onShowListSeries={handleShowListSeries} />
                        </div>
                    </div>
                </div>
            )}

        </div>
    )
}
export default SeriesManagement;