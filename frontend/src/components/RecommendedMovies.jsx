// src/components/RecommendedMovies.jsx
import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import authHeader from '@services/auth-header';
import SingleFilm from '@components/SingleFilm';
import { useSelector } from 'react-redux';

const RecommendedMovies = ({ title = "Đề xuất cho bạn" }) => {
    const [recommendations, setRecommendations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { isLoggedIn } = useSelector(state => state.user);

    const fetchRecommendations = useCallback(async () => {
        if (!isLoggedIn) {
            setLoading(false);
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const response = await axios.get('/api/users/me/movie-recommendations', {
                headers: authHeader(),
                params: { limit: 12 }
            });
            if (response.data?.success) {
                setRecommendations(response.data.recommendations || []);
            } else {
                throw new Error(response.data?.message || "Không thể tải đề xuất");
            }
        } catch (err) {
            console.error("Error fetching recommendations:", err);
            setError("Không thể tải phim đề xuất lúc này.");
            setRecommendations([]);
        } finally {
            setLoading(false);
        }
    }, [isLoggedIn]);

    useEffect(() => {
        fetchRecommendations();
    }, [fetchRecommendations]);

    if (!isLoggedIn || (!loading && recommendations.length === 0 && !error)) {
        return null;
    }

    return (
        <section className="recommended-movies-section mt-5 mb-5">
            <div className="container">
                <div className="section-title">
                    <h3>{title}</h3>
                </div>

                {loading && (
                    <div className="text-center py-3"><div className="spinner-border text-primary"></div></div>
                )}
                {error && !loading && (
                    <div className="alert alert-warning">{error}</div>
                )}
                {!loading && !error && recommendations.length > 0 && (
                    <div className="row g-3">
                        {recommendations.map(movie => (
                            <div key={movie.id} className="col-6 col-md-4 col-lg-3">
                                <SingleFilm movie={movie} />
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
};

export default RecommendedMovies;