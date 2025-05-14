import React, { useState } from 'react';
import axios from 'axios';
import SectionForm from './SectionForm';

const MovieInThisSeriesList = ({ movies, onHandleShowListSeries, seriesId }) => {
    const [editingMovie, setEditingMovie] = useState(null);
    const [isAddingSection, setIsAddingSection] = useState({});

    const handleSectionChange = async () => {
        setEditingMovie(null);
        onHandleShowListSeries(seriesId);
    };

    const handleAddSection = (movie) => {
        setIsAddingSection((prev) => ({ ...prev, [movie.id]: true })); // Cập nhật trạng thái
        setEditingMovie(movie);
    };

    const handleCancelAddSection = (movie) => {
        setIsAddingSection((prev) => ({ ...prev, [movie.id]: false })); // Cập nhật trạng thái
        setEditingMovie(null);
    };

    const handleDeleteSection = (movie, section) => {
        // Xóa phần cho một phim
        axios.delete(`/api/movies/${movie.id}/sections/${section.id}`)
            .then(() => {
                onHandleShowListSeries(seriesId);
            })
            .catch((error) => {
                console.error(error);
            });
    };

    return (
        <div>
            <ul className="list-group">
                {movies.length > 0 ? (
                    movies.map((movie) => (
                        <li className="list-group-item pt-1 pb-1" key={movie.id}>
                            <div className="row">
                                <div className="col-9">
                                    <span>{movie.title}</span>
                                    {movie.sections ? (
                                        <span className="ml-2">({movie.sections.title})</span>
                                    ) : null}
                                </div>
                                <div className="col-3">
                                    {(!movie.sections || movie.sections.length === 0) && (
                                        isAddingSection[movie.id] ? (
                                            <button className="btn btn-sm btn-outline-secondary" onClick={() => handleCancelAddSection(movie)}>Hủy thêm section</button>
                                        ) : (
                                            <button className="btn btn-sm btn-outline-secondary" onClick={() => handleAddSection(movie)}>Thêm section</button>
                                        )
                                    )}
                                    {movie.sections && (
                                        <button className="btn btn-sm btn-outline-danger" onClick={() => handleDeleteSection(movie, movie.sections[0])}>Xóa section</button>
                                    )}
                                </div>
                            </div>
                            {isAddingSection[movie.id] && (
                                <SectionForm onSectionChange={handleSectionChange} movie={movie} seriesId={seriesId} />
                            )}
                        </li>
                    ))
                ) : (
                    <p>No movies found for this series</p>
                )}
            </ul>
        </div>
    );
};

export default MovieInThisSeriesList;