import React, { useState, useCallback } from 'react';

import MovieInThisSeriesList from './MovieInThisSeriesList';
import { Accordion } from 'react-bootstrap';

const ListSeries = ({ series, movies, onShowListSeries }) => {
  const [activeAccordion, setActiveAccordion] = useState(null);

  const handleShowListSeries = useCallback((seriesId) => {
    onShowListSeries(seriesId);
    setActiveAccordion(seriesId);
  }, [onShowListSeries]);

  return (
    <Accordion>
      {series.map((singleSeries) => (
        <Accordion.Item key={singleSeries.id} eventKey={singleSeries.id}>
          <Accordion.Header onClick={() => handleShowListSeries(singleSeries.id)}>
            {singleSeries.title}
          </Accordion.Header>
          <Accordion.Body>
            {activeAccordion === singleSeries.id && (
              <MovieInThisSeriesList movies={singleSeries.movies} onHandleShowListSeries={onShowListSeries} seriesId={singleSeries.id}/>
            )}
          </Accordion.Body>
        </Accordion.Item>
      ))}
    </Accordion>
  );
};

export default ListSeries;