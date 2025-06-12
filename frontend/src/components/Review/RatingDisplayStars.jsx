import PropTypes from 'prop-types';

const RatingDisplayStars = ({ rating }) => {
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5;
    const emptyStars = 10 - fullStars - (halfStar ? 1 : 0);

    return (
        <div className="star-display d-inline-block" title={`${rating}/10`}>
            {[...Array(fullStars)].map((_, i) => <i key={`full-${i}`} className="fas fa-star text-warning"></i>)}
            {halfStar && <i key="half" className="fas fa-star-half-alt text-warning"></i>}
            {[...Array(emptyStars)].map((_, i) => <i key={`empty-${i}`} className="far fa-star text-warning"></i>)}
        </div>
    );
};

RatingDisplayStars.propTypes = {
  rating: PropTypes.number.isRequired,
};

export default RatingDisplayStars;