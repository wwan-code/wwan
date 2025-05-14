// components/RecommendsList.js
import React from 'react';
import RecommendsCard from './RecommendsCard'; // Import card recommend

const RecommendsList = ({ recommendedMovies = [] }) => {
    if (!recommendedMovies || recommendedMovies.length === 0) {
        return null; // Không render nếu không có phim đề xuất
    }

    return (
        <section className="recommends">
            <div className="recommends-header">
                <h3 className="recommends-header-title">
                    Phim đề xuất
                </h3>
            </div>
            <div className="recommends__list">
                {recommendedMovies.map((movie) => (
                    <RecommendsCard key={movie.id} recommend={movie} /> // Dùng ID làm key
                ))}
            </div>
        </section>
    );
};

export default RecommendsList;