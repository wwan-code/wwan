// src/pages/HomePage.jsx
import { useEffect, useState, useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
import axios from "axios";
import NProgress from 'nprogress';
import { Alert } from 'react-bootstrap';
import { useRef } from "react";
import { handleApiError } from "@utils/handleApiError";
import MovieArea from "@components/MovieArea";
import SingleFilm from "@components/SingleFilm";
import SingleComic from "@components/Comics/SingleComic";
import Pagination from "@components/Common/Pagination";
import RecommendedMovies from "@components/RecommendedMovies";
import RecommendedComics from "@components/RecommendedComics";
import TypewriterText from "@components/Effects/TypewriterText";
import InteractiveDotGrid from "@components/Effects/InteractiveDotGrid";
import "@assets/scss/pages/_home-page.scss";

const ITEMS_PER_MAIN_LIST = 20;
const ITEMS_FOR_SIDEBAR_FEATURED = 12;
const ITEMS_FOR_COMICS_SECTION = 12;
const ITEMS_FOR_ANIME_SECTION = 12;
const ITEMS_PER_SECTION_DEFAULT = {
    topSingleMovies: 6,
    topSingleComics: 6,
}

const SidebarSkeletonLoader = ({ itemCount = 5, title }) => (
    <section className="film-sidebar__section">
        {title && <div className="film-sidebar__title placeholder-title"></div>}
        <ul className="film-sidebar__list">
            {Array.from({ length: itemCount }).map((_, index) => (
                <li key={`skel-sidebar-${index}`} className="film-sidebar__item is-loading">
                    <div className="skeleton-sidebar-item">
                        <div className="skeleton-sidebar-title placeholder col-8"></div>
                        <div className="skeleton-sidebar-meta placeholder col-4 mt-1"></div>
                    </div>
                </li>
            ))}
        </ul>
    </section>
);

const MainListSkeletonLoader = ({ itemCount = 8 }) => (
    <div className="row g-3">
        {Array.from({ length: itemCount }).map((_, index) => (
            <div key={`skel-main-${index}`} className="col-6 col-md-4 col-lg-4 col-xl-3">
                <div className="skeleton-card">
                    <div className="skeleton-image"></div>
                    <div className="skeleton-title"></div>
                    <div className="skeleton-meta"></div>
                </div>
            </div>
        ))}
    </div>
);

const SectionSkeletonLoader = ({ itemCount = 4, itemType = "film", title }) => (
    <div className="card-section mt-5 skeleton-section">
        <div className="container">
            {title && (
                <div className="section-title d-flex justify-content-between align-items-center">
                    <h3>{title}</h3>
                    <span className="btn-view-more placeholder col-2"></span>
                </div>
            )}
            <div className="row g-3">
                {Array.from({ length: itemCount }).map((_, index) => (
                    <div key={`skeleton-${title?.replace(/\s+/g, '-').toLowerCase() || 'item'}-${index}`} className={`col-6 ${itemType === "comic" ? "col-sm-4 col-md-3 col-lg-2" : "col-sm-6 col-md-4 col-lg-3 col-xl-2"}`}>
                        <div className="skeleton-card">
                            <div className="skeleton-image"></div>
                            <div className="skeleton-title"></div>
                            <div className="skeleton-meta"></div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    </div>
);

const ContentSection = ({
    title,
    items,
    itemType = "film",
    icon,
    isLoading,
    viewMoreLink,
    sectionId,
    loadingItemCount,
    layout = "grid"
}) => {
    const displayItemCount = loadingItemCount || (itemType === "comic" ? 5 : 4);

    if (isLoading && (!items || items.length === 0)) {
        return <SectionSkeletonLoader itemCount={displayItemCount} itemType={itemType} title={title} />;
    }

    if (!isLoading && (!items || items.length === 0)) {
        return null;
    }

    const getItemColClass = () => {
        if (layout === 'scrollable-row') {
            return itemType === "comic" ? 'comic-card-scroll-item' : 'film-card-scroll-item';
        }
        return `col-6 ${itemType === "comic" ? "col-sm-4 col-md-3 col-lg-2" : "col-sm-6 col-md-4 col-lg-3 col-xl-2"}`;
    };

    return (
        <div className={`card-section mt-5 section-layout-${layout}`} id={sectionId}>
            <div className="container">
                <div className="section-title d-flex justify-content-between align-items-center">
                    <h3>{icon}{title}</h3>
                    {viewMoreLink && <Link to={viewMoreLink} className="btn-view-more">Xem tất cả <i className="fas fa-chevron-right ms-1"></i></Link>}
                </div>
                {layout === 'scrollable-row' ? (
                    <div className="scrollable-row-container">
                        <div className="scrollable-row-content">
                            {items.map((item) => (
                                <div key={`${itemType}-${item.id}`} className={getItemColClass()}>
                                    {itemType === "film" ? <SingleFilm movie={item} /> : <SingleComic comic={item} />}
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="row g-3">
                        {items.map((item) => (
                            <div key={`${itemType}-${item.id}`} className={getItemColClass()}>
                                {itemType === "film" ? <SingleFilm movie={item} /> : <SingleComic comic={item} />}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

const HomePage = () => {
    const [featuredForHero, setFeaturedForHero] = useState([]);
    const [featuredForSidebar, setFeaturedForSidebar] = useState([]);
    const [latestComics, setLatestComics] = useState([]);
    const [trendingAnime, setTrendingAnime] = useState([]);
    const [topSeriesMovies, setTopSeriesMovies] = useState([]);
    const [topSingleMovies, setTopSingleMovies] = useState([]);

    const [mainMovieList, setMainMovieList] = useState([]);
    const [mainMoviePagination, setMainMoviePagination] = useState({
        totalItems: 0, totalPages: 1, currentPage: 1, itemsPerPage: ITEMS_PER_MAIN_LIST,
    });

    const [loadingStates, setLoadingStates] = useState({
        hero: true,
        sidebarFeatured: true,
        latestComics: true,
        trendingAnime: true,
        mainMovies: true,
    });
    const [overallError, setOverallError] = useState(null);
    const [searchParams, setSearchParams] = useSearchParams();
    const mainListRef = useRef(null);

    const currentPageForMainList = parseInt(searchParams.get('page') || '1', 10);
    const currentSortForMainList = searchParams.get('sort') || 'latest';

    useEffect(() => {
        const fetchHomePageData = async () => {
            NProgress.start();
            setLoadingStates(prev => ({
                ...prev,
                hero: true,
                sidebarFeatured: true,
                latestComics: true,
                trendingAnime: true,
            }));
            setOverallError(null);

            try {
                const response = await axios.get('/api/page/home-layout', {
                    params: {
                        limitHero: 5,
                        limitSidebar: ITEMS_FOR_SIDEBAR_FEATURED,
                        limitComics: ITEMS_FOR_COMICS_SECTION,
                        limitAnime: ITEMS_FOR_ANIME_SECTION,
                    }
                });

                if (response.data?.success) {
                    const data = response.data.data;
                    setFeaturedForHero(data.featuredForHero || []);
                    setFeaturedForSidebar(data.featuredForSidebar || []);
                    setLatestComics(data.latestComics || []);
                    setTrendingAnime(data.trendingAnime || []);
                    setTopSeriesMovies(data.topSeriesMovies || []);
                    setTopSingleMovies(data.topSingleMovies || []);
                } else {
                    throw new Error(response.data?.message || 'Không thể tải dữ liệu trang chủ.');
                }
            } catch (err) {
                handleApiError(err, "dữ liệu trang chủ");
            } finally {
                setLoadingStates(prev => ({
                    ...prev,
                    hero: false, sidebarFeatured: false, latestComics: false, trendingAnime: false,
                }));
                NProgress.done();
            }
        };
        fetchHomePageData();
    }, [handleApiError]);

    useEffect(() => {
        const fetchMainMoviesList = async (page, sort) => {
            setLoadingStates(prev => ({ ...prev, mainMovies: true }));
            NProgress.start();
            try {
                const response = await axios.get('/api/movies/list', {
                    params: {
                        page: page,
                        limit: ITEMS_PER_MAIN_LIST,
                        sortBy: sort === 'popular' ? 'views' : 'createdAt',
                        sortOrder: 'DESC',
                    }
                });
                if (response.data?.success) {
                    setMainMovieList(response.data.movies || []);
                    setMainMoviePagination(response.data.pagination || {
                        totalItems: 0, totalPages: 1, currentPage: page, itemsPerPage: ITEMS_PER_MAIN_LIST
                    });
                } else {
                    throw new Error(response.data?.message || 'Lỗi tải danh sách phim.');
                }
            } catch (err) {
                handleApiError(err, `danh sách phim (${sort})`);
                setMainMovieList([]);
            } finally {
                setLoadingStates(prev => ({ ...prev, mainMovies: false }));
                NProgress.done();
            }
        };

        fetchMainMoviesList(currentPageForMainList, currentSortForMainList);
        if (currentPageForMainList !== 1) {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }, [currentPageForMainList, currentSortForMainList, handleApiError]);

    const handleMainListFilterChange = (e, newSort) => {
        if (newSort !== currentSortForMainList) {
            setSearchParams({ sort: newSort, page: '1' });
        }
    };

    const handleMainListPageChange = (newPage) => {
        if (newPage !== currentPageForMainList && newPage >= 1 && newPage <= mainMoviePagination.totalPages) {
            setSearchParams({ sort: currentSortForMainList, page: newPage.toString() });
        }
    };

    useEffect(() => {
        document.title = "Trang chủ - WWAN";
    }, []);

    const heroTaglines = [
        "Khám phá hàng ngàn bộ phim.",
        "Đọc truyện tranh yêu thích.",
        "Tham gia cộng đồng WWAN.",
        "Trải nghiệm giải trí đỉnh cao!"
    ];

    if (overallError && !loadingStates.hero && !loadingStates.sidebarFeatured) {
        return (
            <div className="container text-center py-5 mt-5">
                <Alert variant="danger"><h4>Lỗi tải trang chủ</h4><p>{overallError}</p></Alert>
            </div>
        );
    }

    return (
        <>
            <InteractiveDotGrid
                width="100%"
                height="100%"
                dotSpacing={12}
                containerClassName="hero-background-canvas-container"
            />
            <MovieArea data={{ featuredMovies: featuredForHero }} loading={loadingStates.hero} />
            <section className="hero-section" style={{ textAlign: 'center', padding: '30px 20px' }}>
                <h1>
                    <TypewriterText
                        text="Chào mừng đến với WWAN"
                        speed={100}
                        loop={false}
                        cursorChar=""
                    />
                </h1>
                <h2 style={{ marginTop: '20px' }}>
                    <TypewriterText
                        text={heroTaglines}
                        speed={75}
                        loop={true}
                        delayAfterLoop={2000}
                        cursorChar="_"
                    />
                </h2>
            </section>
            <RecommendedMovies />
            <RecommendedComics />
            <ContentSection
                title="Truyện Mới Đăng"
                items={latestComics}
                itemType="comic"
                loading={loadingStates.latestComics}
                sectionId="latest-comics-section"
                viewMoreLink="/truyen-tranh?sort=createdAt_desc"
                loadingItemCount={ITEMS_FOR_COMICS_SECTION}
                icon={<i className="fa-regular fa-book-reader"></i>}
            />

            <ContentSection
                title="Anime Thịnh Hành"
                items={trendingAnime}
                itemType="film"
                loading={loadingStates.trendingAnime}
                sectionId="trending-anime-section"
                viewMoreLink="/anime?sort=popular"
                loadingItemCount={ITEMS_FOR_ANIME_SECTION}
                icon={<i className="fas fa-fire"></i>}
            />

            <div className="film-area pt-60">
                <div className="container">
                    <div className="row">
                        <div className="col-lg-9">
                            <div className="row flexbox-center mb-3">
                                <div className="col-lg-6 text-center text-lg-start">
                                    <div className="section-title">
                                        <h3><i className="fa-regular fa-rectangle-list me-2"></i>
                                            {currentSortForMainList === 'popular' ? "Phim Phổ Biến" : "Phim Mới Nhất"}
                                        </h3>
                                    </div>
                                </div>
                                <div className="col-lg-6 text-center text-lg-end">
                                    <ul className="film-menu">
                                        <li
                                            className={currentSortForMainList === 'latest' ? 'active' : ''}
                                            onClick={(e) => handleMainListFilterChange(e, 'latest')}
                                            disabled={loadingStates.mainMovies}>
                                            Mới nhất
                                        </li>
                                        <li
                                            className={currentSortForMainList === 'popular' ? 'active' : ''}
                                            onClick={(e) => handleMainListFilterChange(e, 'popular')}
                                            disabled={loadingStates.mainMovies}>
                                            Phổ biến
                                        </li>
                                    </ul>
                                </div>
                            </div>
                            <hr className="mb-4" />
                            {loadingStates.mainMovies && mainMovieList.length === 0 ? (
                                <MainListSkeletonLoader itemCount={ITEMS_PER_MAIN_LIST / 2} />
                            ) : !loadingStates.mainMovies && mainMovieList.length === 0 ? (
                                <Alert variant="info" className="text-center">Không có phim nào để hiển thị.</Alert>
                            ) : (
                                <>
                                    <div className="row film-item g-3" id={`film-${currentSortForMainList}`} ref={mainListRef}>
                                        {mainMovieList.map((movie) => (
                                            <div key={`main-list-${movie.id}`} className="col-6 col-md-4 col-lg-4 col-xl-3">
                                                <SingleFilm movie={movie} />
                                            </div>
                                        ))}
                                    </div>
                                    {mainMoviePagination.totalPages > 1 && (
                                        <Pagination
                                            currentPage={mainMoviePagination.currentPage}
                                            totalPages={mainMoviePagination.totalPages}
                                            onPageChange={handleMainListPageChange}
                                        />
                                    )}
                                </>
                            )}
                        </div>

                        <div className="col-lg-3">
                            <div className="film-sidebar">
                                {loadingStates.sidebarFeatured ? (
                                    <SidebarSkeletonLoader itemCount={ITEMS_FOR_SIDEBAR_FEATURED / 2} title="Phim nổi bật tuần" />
                                ) : featuredForSidebar.length > 0 ? (
                                    <section className="film-sidebar__section">
                                        <div className="film-sidebar__title">
                                            Phim nổi bật tuần
                                        </div>
                                        <ul className="film-sidebar__list">
                                            {featuredForSidebar.map((movie) => {
                                                const lastEpisodeNumber = movie.Episodes?.[0]?.episodeNumber || (movie.belongToCategory === 1 ? '?' : '');
                                                return (
                                                    <li className="film-sidebar__item" key={`sidebar-${movie.id}`}>
                                                        <Link to={`/album/${movie.slug}`} className="film-sidebar__link" title={movie.title}>
                                                            <div>
                                                                <span className="film-sidebar__name">{movie.title}</span>
                                                            </div>
                                                            {movie.belongToCategory === 1 && (
                                                                <span className="film-sidebar__episode">Tập {lastEpisodeNumber}</span>
                                                            )}
                                                        </Link>
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    </section>
                                ) : (
                                    <p className="text-muted small p-2">Không có phim nổi bật.</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <ContentSection
                title="Phim Lẻ Hot"
                items={topSingleMovies}
                isLoading={loadingStates.sections}
                viewMoreLink="/muc-luc?category=phim-le&sort=views_desc"
                sectionId="top-single-movies"
                loadingItemCount={ITEMS_PER_SECTION_DEFAULT.topSingleMovies}
                layout="scrollable-row"
            />

            <ContentSection
                title="Phim Bộ Hot"
                items={topSeriesMovies}
                isLoading={loadingStates.sections}
                viewMoreLink="/muc-luc?category=phim-bo&sort=views_desc"
                sectionId="top-series-movies"
                loadingItemCount={ITEMS_PER_SECTION_DEFAULT.topSeriesMovies}
                layout="scrollable-row"
            />
        </>
    );
}

export default HomePage;