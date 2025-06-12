import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '@services/api';
import "@assets/scss/pages/_comic-ranking.scss";

const categories = [
  { id: 'new', name: 'Truyện tranh mới', color: 'text-blue-500', params: {} },
  { id: 'ranking', name: 'Xếp hạng truyện tranh', color: 'text-blue-500', params: { sortBy: 'views' } },
  { id: 'chinese', name: 'Truyện tranh Trung Quốc', params: { country: 'trung-quoc' } },
  { id: 'japanese', name: 'Truyện tranh Nhật Bản', params: { country: 'nhat-ban' } },
  { id: 'korean', name: 'Truyện tranh Hàn Quốc', params: { country: 'han-quoc' } },
  { id: 'complete', name: 'Bảng đã hoàn thành', params: { status: 'completed' } },
];

const ComicRankingInterface = () => {
  const [activeCategory, setActiveCategory] = useState(categories[0].id);
  const [comics, setComics] = useState([]);
  const [loading, setLoading] = useState(false);

  const getApiParams = (categoryId) => {
    const cat = categories.find(c => c.id === categoryId);
    return cat ? cat.params : {};
  };

  useEffect(() => {
    const fetchComics = async () => {
      setLoading(true);
      try {
        const params = getApiParams(activeCategory);
        const res = await api.get('/api/comics', { params: { ...params, limit: 20 } });
        setComics(res.data.comics || []);
      } catch (err) {
        setComics([]);
      }
      setLoading(false);
    };
    fetchComics();
  }, [activeCategory]);

  const getRankColor = (rank) => {
    if (rank === 1) return 'text-yellow-500';
    if (rank === 2) return 'text-gray-400';
    if (rank === 3) return 'text-orange-400';
    return 'text-gray-600';
  };

  const getRankStyle = (rank) => {
    if (rank <= 3) {
      return 'comic-ranking__rank--top';
    }
    return '';
  };

  return (
    <section className="comic-ranking">
      <div className="comic-ranking__container">
        {/* Sidebar */}
        <div className="comic-ranking__sidebar">
          <div className="comic-ranking__header">
            <span className="comic-ranking__title">Danh sách truyện tranh</span>
            <span className="comic-ranking__subtitle">Tổng hợp 7 ngày mới, chỉ định các truyện tranh ra mắt/tháng 4, 5, 6 hoặc đã hoàn thành</span>
          </div>
          <nav className="comic-ranking__nav">
            {categories.map((category) => (
              <button
                key={category.id}
                className={`comic-ranking__nav-item ${
                  activeCategory === category.id ? 'comic-ranking__nav-item--active' : ''
                } ${category.color || ''}`}
                onClick={() => setActiveCategory(category.id)}
              >
                {category.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Main Content */}
        <div className="comic-ranking__main">
          <div className="comic-ranking__grid">
            {loading ? (
              <div>Đang tải...</div>
            ) : comics.length === 0 ? (
              <div>Không có truyện nào.</div>
            ) : (
              comics.map((comic, idx) => (
                <div key={comic.id} className="comic-ranking__item">
                  <div className={`comic-ranking__rank ${getRankColor(idx + 1)} ${getRankStyle(idx + 1)}`}>
                    {idx + 1 < 10 ? `0${idx + 1}` : idx + 1}
                  </div>
                  <div className="comic-ranking__cover">
                    <img 
                      src={comic.coverImage ? (comic.coverImage.startsWith('http') ? comic.coverImage : `${process.env.REACT_APP_API_URL_IMAGE}/${comic.coverImage}`) : 'https://via.placeholder.com/80x100?text=No+Image'} 
                      alt={comic.title}
                      className="comic-ranking__cover-image"
                    />
                  </div>
                  <div className="comic-ranking__info">
                    <Link to={`/truyen/${comic.slug}`} className="comic-ranking__title-text">{comic.title}</Link>
                    <p className="comic-ranking__views">{comic.views} lượt xem</p>
                    {comic.genres && comic.genres.length > 0 && (
                      <span className="comic-ranking__genre">{comic.genres.slice(0, 2).map(g => g.title).join(', ')}</span>
                    )}
                    <p className="comic-ranking__chapters">
                      {comic.chapters && comic.chapters.length > 0
                        ? `Ch.${comic.chapters[0].chapterNumber}`
                        : ''}
                    </p>
                  </div>
                  {
                    comic.trending && (
                      <div className="comic-ranking__trending">
                        {comic.trending === 'up' && (
                          <span className="comic-ranking__trending-up">▲</span>
                        )}
                        {comic.trending === 'down' && (
                          <span className="comic-ranking__trending-down">▼</span>
                        )}
                      </div>
                    )
                  }
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ComicRankingInterface;