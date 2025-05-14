import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";

import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { Bounce, toast } from "react-toastify";
import { Button, Form, Card, Modal, Accordion, Table, OverlayTrigger, Tooltip as BootstrapTooltip, Nav } from 'react-bootstrap';

import { updateUser, getUserTimeline } from "../features/userSlice";
import {
    acceptFriendRequest,
    rejectFriendRequest,
    cancelFriendRequest,
    removeFriend,
    getFriends,
} from "../features/friendSlice";
import { useAppContext } from '../AppContext';
import useDropdown from "../hooks/useDropdown";
import ProfileHeader from "../components/Profile/ProfileHeader";
import ProfileInfoCard from "../components/Profile/ProfileInfoCard";
import SocialLinksCard from "../components/Profile/SocialLinksCard";
import TimelineSection from "../components/Profile/TimelineSection";
import FriendManagementSection from "../components/Profile/FriendManagementSection";
import WatchlistCard from "../components/WatchlistCard";
import authHeader from "../services/auth-header";
import '../assets/scss/ProgressBarWave.scss';

const LEVEL_THRESHOLDS = [
    { level: 1, points: 0 },
    { level: 2, points: 100 },
    { level: 3, points: 300 },
    { level: 4, points: 600 },
    { level: 5, points: 1000 },
    { level: 6, points: 1500 },
    { level: 7, points: 2100 },
    { level: 8, points: 2800 },
    { level: 9, points: 3600 },
    { level: 10, points: 4500 },
    { level: 11, points: 5500 },
    { level: 12, points: 6600 },
    { level: 13, points: 7800 },
    { level: 14, points: 9100 },
    { level: 15, points: 10500 },
    { level: 16, points: 12000 },
    { level: 17, points: 13600 },
    { level: 18, points: 15300 },
    { level: 19, points: 17100 },
    { level: 20, points: 19000 }
];
const Profile = () => {
    const { user: currentUser, isLoggedIn } = useSelector((state) => state.user);
    const { uiPreferences, setUIPreference, AVAILABLE_ACCENT_COLORS } = useAppContext();

    const dispatch = useDispatch();
    const navigate = useNavigate();

    const [isEditing, setIsEditing] = useState(false);
    const [infoLoading, setInfoLoading] = useState(false);
    const [profile, setProfile] = useState(null);
    const [timeline, setTimeline] = useState([]);
    const [friends, setFriends] = useState([]);
    const [friendRequests, setFriendRequests] = useState([]);
    const [sentFriendRequests, setSentFriendRequests] = useState([]);
    const [loadingTimeline, setLoadingTimeline] = useState(false);
    const [loadingFriends, setLoadingFriends] = useState(false);
    const { openDropdown, toggleDropdown, dropdownRefCallback } = useDropdown();

    const [watchlists, setWatchlists] = useState([]);
    const [loadingUserWatchlists, setLoadingUserWatchlists] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [watchlistToEdit, setWatchlistToEdit] = useState(null); // Watchlist đang được sửa
    const [newWlName, setNewWlName] = useState("");
    const [newWlDesc, setNewWlDesc] = useState("");
    const [submitWlLoading, setSubmitWlLoading] = useState(false);

    const [userBadges, setUserBadges] = useState([]);
    const [loadingBadges, setLoadingBadges] = useState(true);

    const [activeSessions, setActiveSessions] = useState([]);
    const [loadingSessions, setLoadingSessions] = useState(true);
    const [activeKey, setActiveKey] = useState('info');

    // --- Chuyển hướng nếu chưa đăng nhập ---
    useEffect(() => {
        if (!isLoggedIn) {
            navigate("/login");
        }
    }, [isLoggedIn, navigate]);

    useEffect(() => {
        if (currentUser?.name) {
            document.title = `${currentUser.name} - WWAN Film`;
        }
    }, [currentUser?.name]);

    // --- Faster & more efficient way to show toasts ---
    const showSuccessToast = (message) =>
        toast.success(message, {
            position: "top-right",
            autoClose: 2000,
            theme: document.documentElement.getAttribute("data-ww-theme") || "light",
            transition: Bounce,
        });

    const showErrorToast = (error, prefix = "Lỗi") => {
        const message =
            error?.message ||
            (typeof error === "string"
                ? error
                : "Thao tác thất bại. Vui lòng thử lại.");
        console.error(`${prefix} Error:`, error);
        toast.error(`${prefix}: ${message}`, {
            position: "top-right",
            autoClose: 4000,
            theme: document.documentElement.getAttribute("data-ww-theme") || "light",
            transition: Bounce,
        });
    };

    // --- Fetch Dữ liệu Ban đầu & Khởi tạo Profile Edit State ---
    useEffect(() => {
        if (isLoggedIn && currentUser?.uuid) {
            setProfile({
                name: currentUser.name || "",
                email: currentUser.email || "",
                phoneNumber: currentUser.phoneNumber || "",
                uuid: currentUser.uuid,
                socialLinks: currentUser.socialLinks || {
                    github: "",
                    twitter: "",
                    instagram: "",
                    facebook: "",
                },
            });

            setLoadingTimeline(true);
            dispatch(getUserTimeline(currentUser.uuid))
                .unwrap()
                .then((timelineData) => setTimeline(timelineData || []))
                .catch((error) => showErrorToast(error, "Lỗi tải dòng thời gian"))
                .finally(() => setLoadingTimeline(false));

            setLoadingFriends(true);
            dispatch(getFriends(currentUser.id))
                .unwrap()
                .then((response) => {
                    setFriends(response?.friends || []);
                    setFriendRequests(response?.friendRequests || []);
                    setSentFriendRequests(response?.sentFriendRequests || []);
                })
                .catch((error) => showErrorToast(error, "Lỗi tải danh sách bạn bè"))
                .finally(() => setLoadingFriends(false));
            const fetchBadges = async () => {
                setLoadingBadges(true);
                try {
                    const response = await axios.get(`/api/users/${currentUser.uuid}/badges`, { headers: authHeader() });
                    if (response.data?.success) {
                        setUserBadges(response.data.badges || []);
                    }
                } catch (err) {
                    console.error("Lỗi tải huy hiệu:", err);
                    setUserBadges([]);
                } finally {
                    setLoadingBadges(false);
                }
            };
            fetchBadges();
        } else if (!isLoggedIn) {
            setProfile(null);
            setTimeline([]);
            setFriends([]);
            setFriendRequests([]);
            setSentFriendRequests([]);
        }
    }, [currentUser, isLoggedIn, dispatch]);

    // --- Fetch Watchlists của User ---
    const fetchWatchlists = useCallback(async () => {
        if (!isLoggedIn || !currentUser?.id) return;
        setLoadingUserWatchlists(true);
        try {
            const response = await axios.get("/api/watchlists?includeMovies=true", {
                headers: authHeader(),
            }); // Lấy cả phim
            if (response.data?.success) {
                setWatchlists(response.data.watchlists || []);
            } else {
                throw new Error("Lỗi tải danh sách xem sau.");
            }
        } catch (error) {
            console.error("Lỗi fetch watchlists trên profile:", error);
            setWatchlists([]);
            toast.error("Không thể tải danh sách xem sau.", {
                theme: document.documentElement.getAttribute("data-ww-theme") || "light",
                transition: Bounce
            });
        } finally {
            setLoadingUserWatchlists(false);
        }
    }, [isLoggedIn, currentUser?.id]);

    useEffect(() => {
        fetchWatchlists();
    }, [fetchWatchlists]);

    const fetchActiveSessions = useCallback(async () => {
        if (!isLoggedIn) return;
        setLoadingSessions(true);
        try {
            const response = await axios.get('/api/users/me/sessions', { headers: authHeader() });
            if (response.data?.success) {
                setActiveSessions(response.data.sessions || []);
            }
        } catch (error) {
            console.error("Lỗi tải phiên đăng nhập:", error);
            toast.error("Không thể tải danh sách phiên đăng nhập.");
        } finally {
            setLoadingSessions(false);
        }
    }, [isLoggedIn]);

    useEffect(() => {
        if (isLoggedIn && activeKey === 'sessions') {
            fetchActiveSessions();
        }
    }, [isLoggedIn, activeKey, fetchActiveSessions]);

    const handleRevokeSession = async (sessionId) => {
        if (!window.confirm("Bạn chắc chắn muốn đăng xuất khỏi thiết bị này?")) return;
        try {
            await axios.delete(`/api/users/me/sessions/${sessionId}`, { headers: authHeader() });
            toast.success("Đã đăng xuất khỏi thiết bị.");
            fetchActiveSessions(); // Tải lại danh sách
        } catch (error) {
            toast.error(error.response?.data?.message || "Lỗi khi đăng xuất thiết bị.");
        }
    };

    const handleRevokeOtherSessions = async () => {
        if (!window.confirm("Bạn chắc chắn muốn đăng xuất khỏi tất cả các thiết bị khác?")) return;
        try {
            await axios.delete('/api/users/me/sessions/others', { headers: authHeader() });
            toast.success("Đã đăng xuất khỏi các thiết bị khác.");
            fetchActiveSessions();
        } catch (error) {
            toast.error(error.response?.data?.message || "Lỗi khi đăng xuất các thiết bị khác.");
        }
    };

    const handleEditToggle = useCallback(() => {
        if (!isEditing && currentUser) {
            // Khi bắt đầu edit, đảm bảo state `profile` đồng bộ với `currentUser` mới nhất
            setProfile({
                name: currentUser.name || "",
                email: currentUser.email || "",
                phoneNumber: currentUser.phoneNumber || "",
                uuid: currentUser.uuid,
                socialLinks: {
                    ...(currentUser.socialLinks || {
                        github: "",
                        twitter: "",
                        instagram: "",
                        facebook: "",
                    }),
                },
            });
        }
        setIsEditing((prev) => !prev);
    }, [isEditing, currentUser]);

    const handleProfileChange = useCallback((e) => {
        const { name, value } = e.target;
        setProfile((prev) => ({ ...prev, [name]: value }));
    }, []);

    const handleSocialLinkChange = useCallback((e) => {
        const { name, value } = e.target;
        setProfile((prev) => ({
            ...prev,
            socialLinks: { ...prev.socialLinks, [name]: value },
        }));
    }, []);

    const areProfilesEqual = useCallback((profile1, profile2) => {
        if (!profile1 || !profile2) return true;
        return (
            profile1.name === profile2.name &&
            profile1.email === profile2.email &&
            profile1.phoneNumber === profile2.phoneNumber &&
            JSON.stringify(profile1.socialLinks) ===
            JSON.stringify(profile2.socialLinks || {})
        );
    }, []);

    const handleSaveChanges = useCallback(
        async (e) => {
            e.preventDefault();
            if (!profile || areProfilesEqual(profile, currentUser)) {
                setIsEditing(false);
                return;
            }
            setInfoLoading(true);
            try {
                await dispatch(updateUser(profile)).unwrap();
                showSuccessToast("Cập nhật thông tin thành công!"); // Gọi toast thành công trực tiếp
                setIsEditing(false); // Thoát edit mode sau khi thành công
            } catch (error) {
                showErrorToast(error, "Lỗi cập nhật thông tin"); // Gọi toast lỗi trực tiếp
            } finally {
                setInfoLoading(false);
                // setIsEditing(false); // Đã chuyển vào try nếu thành công, hoặc giữ ở đây nếu luôn muốn thoát edit
            }
        },
        [profile, currentUser, areProfilesEqual, dispatch]
    );

    // --- Xử lý Actions Bạn bè (với Rollback) ---
    // Hàm trợ giúp để cập nhật state cục bộ lạc quan và rollback
    const handleFriendAction = useCallback(
        async (
            actionCreator,
            payload,
            optimisticUpdate,
            rollbackUpdate,
            successMessage,
            errorMessagePrefix
        ) => {
            const originalState = {
                friends: [...friends],
                friendRequests: [...friendRequests],
                sentFriendRequests: [...sentFriendRequests],
            };

            optimisticUpdate(); // Cập nhật lạc quan

            try {
                await dispatch(actionCreator(payload)).unwrap();
                showSuccessToast(successMessage);
            } catch (error) {
                rollbackUpdate(originalState);
                showErrorToast(error, errorMessagePrefix);
            }
        },
        [dispatch, friends, friendRequests, sentFriendRequests]
    );

    const handleAcceptFriendRequest = (requesterId) => {
        handleFriendAction(
            acceptFriendRequest,
            requesterId,
            () => {
                // Lấy thông tin người gửi từ state hiện tại để thêm lạc quan (nếu cần)
                const requesterInfo = friendRequests.find(
                    (req) => req.id === requesterId
                );
                if (requesterInfo) {
                    setFriends((prev) => [...prev, requesterInfo]); // Thêm lạc quan (có thể thiếu info)
                }
                setFriendRequests((prev) =>
                    prev.filter((req) => req.id !== requesterId)
                );
            },
            (original) => {
                setFriends(original.friends);
                setFriendRequests(original.friendRequests);
            },
            "Đã chấp nhận lời mời!",
            "Lỗi chấp nhận lời mời"
        );
    };

    const handleRejectFriendRequest = (requesterId) => {
        handleFriendAction(
            rejectFriendRequest,
            requesterId,
            () =>
                setFriendRequests((prev) =>
                    prev.filter((req) => req.id !== requesterId)
                ),
            (original) => setFriendRequests(original.friendRequests),
            "Đã từ chối lời mời.",
            "Lỗi từ chối lời mời"
        );
    };

    const handleCancelFriendRequest = (recipientId) => {
        handleFriendAction(
            cancelFriendRequest,
            recipientId,
            () =>
                setSentFriendRequests((prev) =>
                    prev.filter((req) => req.id !== recipientId)
                ),
            (original) => setSentFriendRequests(original.sentFriendRequests),
            "Đã hủy lời mời.",
            "Lỗi hủy lời mời"
        );
    };

    const handleRemoveFriend = (friendId) => {
        if (!window.confirm("Bạn chắc chắn muốn hủy kết bạn?")) return;
        handleFriendAction(
            removeFriend,
            friendId,
            () => {
                setFriends((prev) => prev.filter((f) => f.id !== friendId));
            },
            (original) => {
                setFriends(original.friends);
            },
            "Đã hủy kết bạn.",
            "Lỗi hủy kết bạn"
        );
    };
    const handleCreateWatchlist = async (e) => {
        e.preventDefault();
        if (!newWlName.trim()) return;
        setSubmitWlLoading(true);
        try {
            await axios.post(
                "/api/watchlists",
                { name: newWlName, description: newWlDesc },
                { headers: authHeader() }
            );
            toast.success("Tạo danh sách thành công!", {
                theme: document.documentElement.getAttribute("data-ww-theme") || "light",
                transition: Bounce
            });
            setShowCreateModal(false);
            setNewWlName("");
            setNewWlDesc("");
            fetchWatchlists(); // Fetch lại danh sách
        } catch (error) {
            console.error("Lỗi tạo watchlist:", error);
            toast.error(error.response?.data?.message || "Lỗi tạo danh sách.", {
                theme: document.documentElement.getAttribute("data-ww-theme") || "light",
                transition: Bounce
            });
        } finally {
            setSubmitWlLoading(false);
        }
    };

    const handleEditWatchlist = (watchlist) => {
        setWatchlistToEdit(watchlist);
        setNewWlName(watchlist.name); // Điền tên cũ vào form edit
        setNewWlDesc(watchlist.description || ""); // Điền mô tả cũ
        setShowEditModal(true);
    };

    const handleUpdateWatchlist = async (e) => {
        e.preventDefault();
        if (!watchlistToEdit || !newWlName.trim()) return;
        setSubmitWlLoading(true);
        try {
            await axios.put(
                `/api/watchlists/${watchlistToEdit.id}`,
                { name: newWlName, description: newWlDesc },
                { headers: authHeader() }
            );
            toast.success("Cập nhật danh sách thành công!", {
                theme: document.documentElement.getAttribute("data-ww-theme") || "light",
                transition: Bounce
            });
            setShowEditModal(false);
            setWatchlistToEdit(null);
            fetchWatchlists(); // Fetch lại
        } catch (error) {
            console.error("Lỗi cập nhật watchlist:", error);
            toast.error(error.response?.data?.message || "Lỗi cập nhật danh sách.", {
                theme: document.documentElement.getAttribute("data-ww-theme") || "light",
                transition: Bounce
            });
        } finally {
            setSubmitWlLoading(false);
        }
    };

    const handleDeleteWatchlist = async (watchlistId) => {
        if (
            !window.confirm(
                "Bạn chắc chắn muốn xóa danh sách này và tất cả phim trong đó?"
            )
        )
            return;
        try {
            await axios.delete(`/api/watchlists/${watchlistId}`, {
                headers: authHeader(),
            });
            toast.success("Đã xóa danh sách.", {
                theme: document.documentElement.getAttribute("data-ww-theme") || "light",
                transition: Bounce
            });
            fetchWatchlists(); // Fetch lại
        } catch (error) {
            console.error("Lỗi xóa watchlist:", error);
            toast.error(error.response?.data?.message || "Lỗi xóa danh sách.", {
                theme: document.documentElement.getAttribute("data-ww-theme") || "light",
                transition: Bounce
            });
        }
    };

    const handleRemoveMovie = async (watchlistId, movieId) => {
        if (!window.confirm("Xóa phim này khỏi danh sách?")) return;
        try {
            await axios.delete(
                `/api/watchlists/${watchlistId}/movies/${movieId}`,
                { headers: authHeader() }
            );
            toast.success("Đã xóa phim khỏi danh sách.", {
                theme: document.documentElement.getAttribute("data-ww-theme") || "light",
                transition: Bounce
            });
            setWatchlists((prev) =>
                prev.map((wl) => {
                    if (wl.id === watchlistId) {
                        return { ...wl, movies: wl.movies.filter((m) => m.id !== movieId) };
                    }
                    return wl;
                })
            );
        } catch (error) {
            console.error("Lỗi xóa phim khỏi watchlist:", error);
            toast.error(error.response?.data?.message || "Lỗi xóa phim.", {
                theme: document.documentElement.getAttribute("data-ww-theme") || "light",
                transition: Bounce
            });
        }
    };

    const calculateProgress = useCallback(() => {
        if (!currentUser || typeof currentUser.points !== 'number' || typeof currentUser.level !== 'number') {
            return { levelProgress: 0, pointsProgress: 0, nextLevelPoints: 100, currentLevelPoints: 0 };
        }

        const currentLevelInfo = LEVEL_THRESHOLDS.find(lt => lt.level === currentUser.level);
        const nextLevelInfo = LEVEL_THRESHOLDS.find(lt => lt.level === currentUser.level + 1);

        const currentLevelPoints = currentLevelInfo ? currentLevelInfo.points : 0;
        const nextLevelPoints = nextLevelInfo ? nextLevelInfo.points : (currentLevelPoints + (LEVEL_THRESHOLDS[1]?.points || 100));

        return {
            nextLevelPoints
        };
    }, [currentUser]);

    const { nextLevelPoints } = calculateProgress();
    if (!isLoggedIn || !currentUser) {
        return (
            <div className="container text-center p-5">
                <i className="fas fa-spinner fa-spin fa-3x"></i>
            </div>
        );
    }

    return (
        <div className="container">
            <div className="main-body">
                <nav aria-label="breadcrumb" className="main-breadcrumb">
                    <ol className="breadcrumb">
                        <li className="breadcrumb-item">
                            <Link to={"/"}>Trang chủ</Link>
                        </li>
                        <li className="breadcrumb-item active" aria-current="page">
                            Hồ sơ người dùng
                        </li>
                    </ol>
                </nav>

                <div className="row gutters-sm">
                    <div className="col-md-4 mb-3">
                        <ProfileHeader
                            currentUser={currentUser}
                            profileData={profile}
                            dropdownProps={{
                                openDropdownId: openDropdown,
                                toggleDropdown,
                                dropdownRefCallback,
                            }}
                        />
                        <Card className="mt-3">
                            <Card.Body>
                                <h6 className="d-flex align-items-center mb-3">
                                    <i className="material-icons text-info mr-2">assignment</i>Thành Tích
                                </h6>
                                <small>Cấp độ: {currentUser.level} ({currentUser.points} / {nextLevelPoints})</small>
                                <div className="progress mb-1" style={{ height: '10px' }}>
                                    <div
                                        className="progress-bar progress-bar-wave" // Chỉ cần class này
                                        role="progressbar"
                                        style={{ width: `${(currentUser.points / nextLevelPoints) * 100}%` }}
                                        aria-valuenow={currentUser.points}
                                        aria-valuemin="0"
                                        aria-valuemax={nextLevelPoints}
                                    >
                                    </div>
                                </div>
                            </Card.Body>
                        </Card>
                        <Card className="mt-3" id="badges">
                            <Card.Body>
                                <h6 className="d-flex align-items-center mb-3">
                                    <i className="material-icons text-warning me-2">military_tech</i>Huy Hiệu
                                </h6>
                                {loadingBadges ? (
                                    <div className="text-center"><span className="spinner-border spinner-border-sm"></span></div>
                                ) : userBadges.length > 0 ? (
                                    <div className="row g-2">
                                        {userBadges.map(badge => (
                                            <div key={badge.id} className="col-4 col-md-6 text-center mb-2">
                                                {badge.iconUrl ? (
                                                    // <img src={badge.iconUrl} alt={badge.name} width="48" height="48" className="img-thumbnail" title={`${badge.name}: ${badge.description}`} />
                                                    <i className={badge.iconUrl}></i>
                                                ) : (
                                                    <div className="avatar avatar-md" title={`${badge.name}: ${badge.description}`}>
                                                        <span className="avatar-initial rounded-circle bg-secondary">
                                                            <i className="fas fa-medal"></i>
                                                        </span>
                                                    </div>
                                                )}
                                                <small className="d-block text-muted mt-1 text-truncate" title={badge.name}>{badge.name}</small>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-muted text-center small">Chưa có huy hiệu nào.</p>
                                )}
                            </Card.Body>
                        </Card>
                        <SocialLinksCard
                            socialLinks={
                                isEditing ? profile?.socialLinks : currentUser?.socialLinks
                            } // Lấy đúng dữ liệu
                            isEditing={isEditing}
                            onSocialLinkChange={handleSocialLinkChange} // Truyền hàm cập nhật state profile
                        />
                        <FriendManagementSection
                            friends={friends}
                            friendRequests={friendRequests}
                            sentFriendRequests={sentFriendRequests}
                            loading={loadingFriends}
                            onAcceptRequest={handleAcceptFriendRequest}
                            onRejectRequest={handleRejectFriendRequest}
                            onCancelRequest={handleCancelFriendRequest}
                            onRemoveFriend={handleRemoveFriend}
                        />
                    </div>

                    {/* Cột phải: Info Card, Timeline, Friends */}
                    <div className="col-md-8">
                        <ProfileInfoCard
                            currentUser={currentUser} // Dữ liệu gốc để hiển thị
                            profileData={profile} // Dữ liệu đang chỉnh sửa
                            isEditing={isEditing}
                            onEditToggle={handleEditToggle} // Truyền hàm bật/tắt edit
                            onProfileChange={handleProfileChange} // Truyền hàm cập nhật state profile
                            onSaveChanges={handleSaveChanges} // Truyền hàm lưu thay đổi
                            isLoading={infoLoading} // Truyền trạng thái loading
                        />
                        <Card className="mb-3">
                            <Card.Header>
                                <Nav variant="tabs" activeKey={activeKey} onSelect={(k) => setActiveKey(k)}>
                                    <Nav.Item>
                                        <Nav.Link eventKey="info">Thông tin cá nhân</Nav.Link>
                                    </Nav.Item>
                                    <Nav.Item>
                                        <Nav.Link eventKey="watchlists">Danh sách xem</Nav.Link>
                                    </Nav.Item>
                                    <Nav.Item>
                                        <Nav.Link eventKey="sessions">Phiên đăng nhập</Nav.Link>
                                    </Nav.Item>
                                    <Nav.Item>
                                        <Nav.Link eventKey="theme">Giao diện</Nav.Link>
                                    </Nav.Item>
                                </Nav>
                            </Card.Header>
                            <Card.Body>
                                {activeKey === 'info' && (
                                    <ProfileInfoCard currentUser={currentUser} /* ... */ />
                                )}
                                {activeKey === 'watchlists' && (
                                    <>
                                        <div className="d-flex justify-content-between align-items-center mb-2">
                                            <h5 className="mb-0">Danh sách xem sau</h5>
                                            <Button variant="outline-primary" size="sm" onClick={() => setShowCreateModal(true)}>
                                                <i className="fas fa-plus me-1"></i> Tạo danh sách mới
                                            </Button>
                                        </div>
                                        {loadingUserWatchlists ? (
                                            <div className="text-center py-3"><span className="spinner-border spinner-border-sm"></span></div>
                                        ) : watchlists.length > 0 ? (
                                            <Accordion>
                                                {watchlists.map(wl => (
                                                    <WatchlistCard
                                                        key={wl.id}
                                                        watchlist={wl}
                                                        onRemoveMovie={handleRemoveMovie}
                                                        onDeleteWatchlist={handleDeleteWatchlist}
                                                        onEditWatchlist={handleEditWatchlist}
                                                    />
                                                ))}
                                            </Accordion>
                                        ) : (
                                            <p className="text-muted text-center">Bạn chưa tạo danh sách nào.</p>
                                        )}
                                    </>
                                )}
                                {activeKey === 'sessions' && (
                                    <>
                                        <div className="d-flex justify-content-between align-items-center mb-3">
                                            <h5 className="mb-0">Quản lý phiên đăng nhập</h5>
                                            <Button variant="outline-warning" size="sm" onClick={handleRevokeOtherSessions} disabled={activeSessions.length <= 1}>
                                                Đăng xuất các thiết bị khác
                                            </Button>
                                        </div>
                                        {loadingSessions ? (
                                            <div className="text-center"><span className="spinner-border spinner-border-sm"></span></div>
                                        ) : activeSessions.length > 0 ? (
                                            <Table striped hover responsive size="sm">
                                                <thead>
                                                    <tr>
                                                        <th>Thiết bị</th>
                                                        <th>Trình duyệt/Ứng dụng</th>
                                                        <th>Hệ điều hành</th>
                                                        <th>IP</th>
                                                        <th>Hoạt động cuối</th>
                                                        <th>Hành động</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {activeSessions.map(session => (
                                                        <tr key={session.id} className={session.isCurrentSession ? 'table-info' : ''}>
                                                            <td>
                                                                {session.deviceInfo?.device || 'Không rõ'}
                                                                {session.isCurrentSession && <span className="badge bg-success ms-2">Hiện tại</span>}
                                                            </td>
                                                            <td>{session.deviceInfo?.client || 'Không rõ'}</td>
                                                            <td>{session.deviceInfo?.os || 'Không rõ'}</td>
                                                            <td>
                                                                <OverlayTrigger
                                                                    placement="top"
                                                                    overlay={<BootstrapTooltip id={`tooltip-ip-${session.id}`}>{session.deviceInfo?.ip || 'N/A'}</BootstrapTooltip>}
                                                                >
                                                                    <span><i className="fas fa-network-wired"></i></span>
                                                                </OverlayTrigger>
                                                            </td>
                                                            <td>{session.lastActivity ? new Date(session.lastActivity).toLocaleString('vi-VN') : 'Không rõ'}</td>
                                                            <td>
                                                                {!session.isCurrentSession && (
                                                                    <Button variant="outline-danger" size="sm" onClick={() => handleRevokeSession(session.id)}>
                                                                        Đăng xuất
                                                                    </Button>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </Table>
                                        ) : (
                                            <p className="text-muted">Không có phiên đăng nhập nào khác đang hoạt động.</p>
                                        )}
                                    </>
                                )}
                                {activeKey === 'theme' && (
                                    <>
                                        <h5 className="mb-3">Tùy chỉnh Giao diện</h5>
                                        <Form>
                                            {/* 1. Theme Sáng/Tối/Hệ thống */}
                                            <Form.Group className="mb-3">
                                                <Form.Label>Chế độ hiển thị</Form.Label>
                                                <div>
                                                    {['light', 'dark', 'system'].map(themeOption => (
                                                        <Form.Check
                                                            inline
                                                            type="radio"
                                                            label={themeOption.charAt(0).toUpperCase() + themeOption.slice(1)}
                                                            name="themeOption"
                                                            id={`theme-${themeOption}`}
                                                            checked={uiPreferences.theme === themeOption}
                                                            onChange={() => setUIPreference('theme', themeOption)}
                                                            key={themeOption}
                                                        />
                                                    ))}
                                                </div>
                                            </Form.Group>

                                            {/* 2. Màu chủ đạo */}
                                            <Form.Group className="mb-3">
                                                <Form.Label>Màu chủ đạo</Form.Label>
                                                <div className="d-flex flex-wrap">
                                                    {AVAILABLE_ACCENT_COLORS.map(color => (
                                                        <Button
                                                            key={color.value}
                                                            variant="light"
                                                            size="sm"
                                                            className={`me-2 mb-2 ${uiPreferences.accentColor === color.value ? 'active border-primary shadow-sm' : 'border'}`}
                                                            style={{ backgroundColor: color.value, width: '30px', height: '30px', padding: 0 }}
                                                            onClick={() => setUIPreference('accentColor', color.value)}
                                                            title={color.name}
                                                        >
                                                            {uiPreferences.accentColor === color.value && <i className="fas fa-check text-white"></i>}
                                                        </Button>
                                                    ))}
                                                </div>
                                            </Form.Group>

                                            {/* 3. Kích thước chữ */}
                                            <Form.Group className="mb-3">
                                                <Form.Label>Kích thước chữ</Form.Label>
                                                <Form.Select
                                                    value={uiPreferences.fontSize}
                                                    onChange={(e) => setUIPreference('fontSize', e.target.value)}
                                                    aria-label="Chọn kích thước chữ"
                                                >
                                                    <option value="small">Nhỏ</option>
                                                    <option value="medium">Vừa (Mặc định)</option>
                                                    <option value="large">Lớn</option>
                                                </Form.Select>
                                            </Form.Group>

                                            {/* 4. Độ bo góc */}
                                            <Form.Group className="mb-3">
                                                <Form.Label>Độ bo góc (Border Radius)</Form.Label>
                                                <Form.Select
                                                    value={uiPreferences.borderRadius}
                                                    onChange={(e) => setUIPreference('borderRadius', e.target.value)}
                                                    aria-label="Chọn độ bo góc"
                                                >
                                                    <option value="none">Vuông (0px)</option>
                                                    <option value="small">Nhỏ (0.25rem)</option>
                                                    <option value="medium">Vừa (0.375rem - Mặc định)</option>
                                                    <option value="large">Lớn (0.5rem)</option>
                                                </Form.Select>
                                            </Form.Group>
                                            {/* Thêm các tùy chọn khác ở đây */}
                                        </Form>
                                    </>
                                )}
                            </Card.Body>
                        </Card>
                        <TimelineSection timeline={timeline} loading={loadingTimeline} />
                    </div>
                </div>
            </div>
            <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Tạo danh sách xem mới</Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleCreateWatchlist}>
                    <Modal.Body>
                        <Form.Group className="mb-3" controlId="newWatchlistName">
                            <Form.Label>Tên danh sách <span className="text-danger">*</span></Form.Label>
                            <Form.Control
                                type="text"
                                value={newWlName}
                                onChange={(e) => setNewWlName(e.target.value)}
                                maxLength={100}
                                required
                                autoFocus
                            />
                        </Form.Group>
                        <Form.Group controlId="newWatchlistDesc">
                            <Form.Label>Mô tả (tùy chọn)</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={2}
                                value={newWlDesc}
                                onChange={(e) => setNewWlDesc(e.target.value)}
                            />
                        </Form.Group>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowCreateModal(false)}>Hủy</Button>
                        <Button variant="primary" type="submit" disabled={submitWlLoading}>
                            {submitWlLoading ? 'Đang tạo...' : 'Tạo danh sách'}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>

            {/* Modal Sửa Watchlist */}
            <Modal show={showEditModal} onHide={() => { setShowEditModal(false); setWatchlistToEdit(null); }} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Sửa danh sách</Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleUpdateWatchlist}>
                    <Modal.Body>
                        <Form.Group className="mb-3" controlId="editWatchlistName">
                            <Form.Label>Tên danh sách <span className="text-danger">*</span></Form.Label>
                            <Form.Control
                                type="text"
                                value={newWlName}
                                onChange={(e) => setNewWlName(e.target.value)}
                                maxLength={100}
                                required
                                autoFocus
                            />
                        </Form.Group>
                        <Form.Group controlId="editWatchlistDesc">
                            <Form.Label>Mô tả (tùy chọn)</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={2}
                                value={newWlDesc}
                                onChange={(e) => setNewWlDesc(e.target.value)}
                            />
                        </Form.Group>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => { setShowEditModal(false); setWatchlistToEdit(null); }}>Hủy</Button>
                        <Button variant="primary" type="submit" disabled={submitWlLoading}>
                            {submitWlLoading ? 'Đang lưu...' : 'Lưu thay đổi'}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>
        </div>

    );
};

export default Profile;
