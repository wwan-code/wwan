// components/RecommendsList.js
import RecommendsCard from '@components/RecommendsCard';

const RecommendsList = ({ recommendedMovies = [] }) => {
    if (!recommendedMovies || recommendedMovies.length === 0) {
        return null;
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
                    <RecommendsCard key={movie.id} recommend={movie} />
                ))}
            </div>
        </section>
    );
};

export default RecommendsList;