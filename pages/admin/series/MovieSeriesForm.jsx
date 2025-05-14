import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Bounce, toast } from 'react-toastify';
import authHeader from '../../../services/auth-header';

const MovieSeriesForm = ({ series }) => {
    const [movies, setMovies] = useState([]);
    const [selectedMovie, setSelectedMovie] = useState('');
    const [selectedSeries, setSelectedSeries] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchMoviesAndSeries = async () => {
            try {
                const movieRes = await axios.get('/api/movies', {
                    headers: authHeader()
                });
                const moviesWithoutSeries = movieRes.data.movies.filter(movie => !movie.seriesId);
                setMovies(moviesWithoutSeries);
            } catch (err) {
                console.error('Failed to fetch movies', err);
            }
        };
        fetchMoviesAndSeries();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await axios.post('/api/movies/add-to-series', {
                movieId: selectedMovie,
                seriesId: selectedSeries,
            });
            toast.success('Movie added to series successfully', {
                position: "top-right",
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
                theme: "dark",
                transition: Bounce,
            })
        } catch (error) {
            setError('Failed to add movie to series: ' + error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className='card'>
            <div className="card-header">
                <h4 className='card-title'>Thêm phim vào series</h4>
            </div>
            <div className="card-body">
                <form onSubmit={handleSubmit}>
                    <div className='form-group'>
                        <label className='form-label'>Select Movie:</label>
                        <select className='form-select' value={selectedMovie} onChange={(e) => setSelectedMovie(e.target.value)} required>
                            <option value="">-- Select Movie --</option>
                            {movies && movies.map(movie => (
                                <option key={movie.id} value={movie.id}>
                                    {movie.title}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className='form-group'>
                        <label className='form-label'>Select Series:</label>
                        <select className='form-select' value={selectedSeries} onChange={(e) => setSelectedSeries(e.target.value)} required>
                            <option value="">-- Select Series --</option>
                            {series.map(s => (
                                <option key={s.id} value={s.id}>
                                    {s.title}
                                </option>
                            ))}
                        </select>
                    </div>
                    <button
                        className="btn btn-sm btn-primary"
                        type="submit"
                        disabled={loading}
                    >
                        {loading ? 'Processing...' : 'Thêm'}
                    </button>
                    {error && <p className="text-danger mt-2">{error}</p>}
                </form>
            </div>
        </div>
    );
};

export default MovieSeriesForm;
