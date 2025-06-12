import { useEffect, useMemo } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { AppProvider, useAppContext } from "@contexts/AppContext";
import Footer from "@components/Layout/Footer";
import Header from "@components/Layout/Header";
import classNames from "@utils/classNames";
import FriendRequestsModal from "@components/Friend/FriendRequestsModal";
import "@assets/scss/core.scss";
import "@assets/scss/style.css";
import "@assets/scss/card-section.scss";
import "@assets/scss/video-card.scss";

const RootApp = () => {
    const { showFriendRequests, setShowFriendRequests } = useAppContext();
    const location = useLocation();
    const isAlbumPage = useMemo(() => location.pathname.includes('/album'), [location.pathname]);
    const isPlayPage = useMemo(() => location.pathname.includes('/play'), [location.pathname]);
    const isComicPage = useMemo(() => location.pathname.includes('/truyen-tranh'), [location.pathname]);
    const isOnComicReaderPage = useMemo(() => {
        const readerPattern = /^\/truyen\/[^/]+\/chap\/[^/]+$/;
        return readerPattern.test(location.pathname);
    }, [location.pathname]);

    useEffect(() => {
        if (isOnComicReaderPage) {
            document.body.classList.add('body-comic-reader-active');
        } else {
            document.body.classList.remove('body-comic-reader-active');
        }
        return () => {
            document.body.classList.remove('body-comic-reader-active');
        };
    }, [isOnComicReaderPage]);

    useEffect(() => {
        if (isComicPage) {
            document.body.classList.add('body-comic-page');
        } else {
            document.body.classList.remove('body-comic-page');
        }
        return () => {
            document.body.classList.remove('body-comic-page');
        };
    }, [isComicPage]);
    return (
        <>
            <Header />
            <main className={classNames("main-content", {
                'album-page': isAlbumPage,
                'play-page': isPlayPage,
                'comic-page': isComicPage,
                'reader-mode-main-content': isOnComicReaderPage
            })}>
                <Outlet />
            </main>
            <Footer />
            <FriendRequestsModal isOpen={showFriendRequests} onClose={() => setShowFriendRequests(false)} />
        </>
    )
}
const AppWithProvider = () => (
    <AppProvider>
        <RootApp />
    </AppProvider>
);

export default AppWithProvider;