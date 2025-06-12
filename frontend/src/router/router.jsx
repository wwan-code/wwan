import {
    createBrowserRouter,
    createRoutesFromElements,
    Link,
    Route
} from "react-router-dom";
import { AppProvider } from "@contexts/AppContext";
import AppWithProvider from "@/App";
import HomePage from "@pages/HomePage";
import RootAdmin from "@/RootAdmin";
import Dashboard from "@pages/admin/Dashboard";
import Login from "@components/Login";
import GenreManagement from "@pages/admin/GenreManagement";
import CountryManagement from "@pages/admin/CountryManagement";
import CategoryManagement from "@pages/admin/CategoryManagement";
import AddMovie from "@pages/admin/movie/AddMovie";
import MovieList from "@pages/admin/movie/MovieList";
import EditMovie from "@pages/admin/movie/EditMovie";
import SeriesManagement from "@pages/admin/series/SeriesManagement";
import CommentManagement from "@pages/admin/CommentManagement";

import AlbumMovie from "@pages/AlbumMovie";
import Profile from "@pages/Profile";
import { PlayMovie } from "@pages/PlayMovie";
import ListEpisode from "@pages/admin/episode/ListEpisode";
import DodgeGame from "@pages/DodgeGame";
import AnimePage from "@pages/AnimePage";
import FilterMovie from "@pages/FilterMovie";
import GenreMoviesPage from "@pages/GenreMoviesPage";

import AdminRoute from "@components/AdminRoute";
import TrendingAnimePage from "@pages/TrendingAnimePage";
import LeaderboardPage from "@pages/LeaderboardPage";
import ContentReportsPage from "@pages/admin/ContentReportsPage";
import AddComic from "@pages/admin/comics/AddComic";
import EditComic from "@pages/admin/comics/EditComic";
import ComicManagement from "@pages/admin/comics/ComicManagement";
import ChapterManagementPage from "@pages/admin/comics/chapters/ChapterManagementPage";
import ComicPageManagement from "@pages/admin/comics/chapters/ComicPageManagement";
import ComicsPageWithProvider from "@pages/ComicsPage";
import ComicDetailPage from "@pages/ComicDetailPage";
import ComicReaderPage from "@pages/ComicReaderPage";
import ShopPage from "@pages/ShopPage";
import ShopItemManagement from "@pages/admin/ShopItemManagement";
import NotificationsPage from "@pages/NotificationsPage";
import CollectionsPage from '@pages/CollectionsPage';
import CollectionDetailPage from '@pages/CollectionDetailPage'; 
import BadgeManagementPage from "@pages/admin/BadgeManagementPage";
import ComicRankingInterface from "@pages/ComicRankingInterface";
import GamesPage from "@pages/GamesPage";

const UnauthorizedPage = () => <div style={{ padding: '50px', textAlign: 'center' }}><h1>403 - Không có quyền truy cập</h1><Link to="/">Quay lại trang chủ</Link></div>;
const NotFoundPage = () => <div style={{ padding: '50px', textAlign: 'center' }}><h1>404 - Không tìm thấy trang</h1><Link to="/">Quay lại trang chủ</Link></div>;

const router = createBrowserRouter(
    createRoutesFromElements(
        <>
            <Route path="/" element={<AppWithProvider />} >
                <Route index element={<HomePage />} />
                <Route path="muc-luc" element={<FilterMovie />} />
                <Route path="anime" element={<AnimePage />} />
                <Route path="album/:slug" element={<AlbumMovie />} />
                <Route path="play/:slug" element={<PlayMovie />} />
                <Route path="thinh-hanh" element={<TrendingAnimePage />} />
                <Route path="the-loai/:slug" element={<GenreMoviesPage />} />
                <Route path="profile" element={<Profile />} />
                <Route path="profile/:uuid" element={<Profile />} /> 
                <Route path="bang-xep-hang" element={<LeaderboardPage />} />
                <Route path="truyen-tranh" element={<ComicsPageWithProvider />} />
                <Route path="truyen/:comicSlug" element={<ComicDetailPage />} />
                <Route path="truyen/:comicSlug/chap/:chapterId" element={<ComicReaderPage />} />
                <Route path="shop" element={<ShopPage />} />
                <Route path="notifications" element={<NotificationsPage/>} />
                <Route path="collections" element={<CollectionsPage />} />
                <Route path="collections/:slug" element={<CollectionDetailPage />} />
                <Route path="comic-ratings" element={<ComicRankingInterface />} />
                <Route path="games" element={<GamesPage />} />
                <Route path="minigame/ne-chuong-ngai-vat" element={<DodgeGame />} />
            </Route>
            <Route path="/login" element={<Login />} />
            <Route
                path="/admin/"
                element={
                    <AppProvider>
                        <AdminRoute>
                            <RootAdmin />
                        </AdminRoute>
                    </AppProvider>

                }
            >
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="genre" element={<GenreManagement />} />
                <Route path="category" element={<CategoryManagement />} />
                <Route path="country" element={<CountryManagement />} />
                <Route path="movie/add" element={<AddMovie />} />
                <Route path="movie/list" element={<MovieList />} />
                <Route path="movie/edit/:id" element={<EditMovie />} />
                <Route path="movie/edit/:id" element={<EditMovie />} />
                <Route path="series" element={<SeriesManagement />} />
                <Route path="episode/list" element={<ListEpisode />} />
                <Route path="comments" element={<CommentManagement />} />
                <Route path="reports" element={<ContentReportsPage />} />
                <Route path="comics" element={<ComicManagement />} />
                <Route path="comics/add" element={<AddComic />} />
                <Route path="comics/edit/:comicId" element={<EditComic />} />
                <Route path="comics/:comicId/chapters" element={<ChapterManagementPage />} />
                <Route path="comics/chapters/:chapterId/pages" element={<ComicPageManagement />} />
                <Route path="shop-items" element={<ShopItemManagement />} />
                <Route path="badges" element={<BadgeManagementPage />} />
            </Route>
            {/* --- Error Routes --- */}
            <Route path="/error-not-authorized" element={<UnauthorizedPage />} />
            <Route path="*" element={<NotFoundPage />} /> {/* Route bắt lỗi 404 */}
        </>
    )
);

export default router;