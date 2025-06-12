import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import { Link, useSearchParams, useNavigate, useLocation, useParams } from 'react-router-dom';
import { toast } from "react-toastify";
import classNames from '@utils/classNames';
import {
    updateUser,
    getUserTimeline,
    updateUserPrivacySettings,
    setActiveItem,
    clearActiveItem
} from "@features/userSlice";
import {
    getFriends,
    acceptFriendRequest,
    rejectFriendRequest,
    cancelFriendRequest,
    removeFriend,
} from "@features/friendSlice";

import { useAppContext } from '@contexts/AppContext';
import authHeader from "@services/auth-header";
import { showErrorToast, showSuccessToast } from "@utils/errorUtils";

import ProfileHeader from "@components/Profile/ProfileHeader";
import ProfileInfoCard from "@components/Profile/ProfileInfoCard";
import SocialLinksCard from "@components/Profile/SocialLinksCard";
import TimelineSection from "@components/Profile/TimelineSection";
import FriendManagementSection from "@components/Profile/FriendManagementSection";
import CollectionCardUser from "@components/Profile/CollectionCardUser";
import CustomModal from "@components/CustomModal";
import UserAvatarDisplay from "@components/Common/UserAvatarDisplay";
import Pagination from "@components/Common/Pagination";

import '@assets/scss/pages/_profile-page.scss';

const LEVEL_THRESHOLDS = [
    { level: 1, points: 0 },
    { level: 2, points: 500 },
    { level: 3, points: 1500 },
    { level: 4, points: 3000 },
    { level: 5, points: 5000 },
    { level: 6, points: 7500 },
    { level: 7, points: 11000 },
    { level: 8, points: 15000 },
    { level: 9, points: 20000 },
    { level: 10, points: 26000 },
    { level: 11, points: 33000 },
    { level: 12, points: 41000 },
    { level: 13, points: 50000 },
    { level: 14, points: 60000 },
    { level: 15, points: 71000 },
    { level: 16, points: 83000 },
    { level: 17, points: 96000 },
    { level: 18, points: 110000 },
    { level: 19, points: 125000 },
    { level: 20, points: 141000 },
    { level: 21, points: 158000 },
    { level: 22, points: 176000 },
    { level: 23, points: 195000 },
    { level: 24, points: 215000 },
    { level: 25, points: 236000 },
    { level: 26, points: 258000 },
    { level: 27, points: 281000 },
    { level: 28, points: 305000 },
    { level: 29, points: 330000 },
    { level: 30, points: 356000 }
];

// --- Inventory Item Card Component ---
const InventoryItemCard = ({ invItem, onToggleActivation, isActivatingThis }) => {
    const itemDetails = invItem.itemDetails;
    if (!itemDetails) return <div className="inventory-card inventory-card--error">Vật phẩm lỗi</div>;

    const canBeActivated = ['AVATAR_FRAME', 'CHAT_COLOR', 'THEME_UNLOCK', 'PROFILE_BACKGROUND'].includes(itemDetails.type);
    const isConsumable = itemDetails.type === 'AD_SKIP_TICKET';
    const isExpired = invItem.expiresAt && new Date(invItem.expiresAt) < new Date();

    return (
        <div className={classNames("inventory-card", {
            'inventory-card--active': invItem.isActive && !isExpired,
            'inventory-card--expired': isExpired
        })}>
            <div className="inventory-card__top">
                {itemDetails.iconUrl && (
                    <div className="inventory-card__icon-wrapper">
                        <img
                            src={`${process.env.REACT_APP_API_URL}/${itemDetails.iconUrl}`}
                            alt={itemDetails.name}
                            className="inventory-card__icon"
                        />
                    </div>
                )}
                {!itemDetails.iconUrl && (
                    <div className="inventory-card__icon-placeholder">
                        <i className="fas fa-treasure-chest"></i>
                    </div>
                )}
                <div className="inventory-card__info">
                    <h5 className="inventory-card__name">{itemDetails.name}</h5>
                    {itemDetails.description && <p className="inventory-card__description">{itemDetails.description}</p>}
                    <div className="inventory-card__meta">
                        {isConsumable && <span className="inventory-card__quantity">Số lượng: {invItem.quantity}</span>}
                        {invItem.expiresAt && (
                            <span className={classNames("inventory-card__expires", { 'expired': isExpired })}>
                                Hết hạn: {new Date(invItem.expiresAt).toLocaleDateString('vi-VN')}
                            </span>
                        )}
                        {itemDetails.durationDays === null && !invItem.expiresAt && <span className="inventory-card__duration">Vĩnh viễn</span>}
                    </div>
                </div>
            </div>
            {canBeActivated && (
                <div className="inventory-card__bottom">
                    <button
                        className={classNames("inventory-card__action-btn", {
                            'btn-deactivate': invItem.isActive && !isExpired,
                            'btn-activate': !invItem.isActive && !isExpired,
                            'btn-disabled': isExpired
                        })}
                        onClick={() => !isExpired && onToggleActivation(invItem.id)}
                        disabled={isActivatingThis || isExpired}
                        title={isExpired ? "Vật phẩm đã hết hạn" : (invItem.isActive ? "Ngừng sử dụng" : "Sử dụng vật phẩm này")}
                    >
                        {isActivatingThis ? (
                            <span className="spinner--small"></span>
                        ) : isExpired ? (
                            'Hết hạn'
                        ) : invItem.isActive ? (
                            <> <i className="fas fa-times-circle icon-before"></i> Đang dùng</>
                        ) : (
                            <> <i className="fas fa-check-circle icon-before"></i> Dùng ngay</>
                        )}
                    </button>
                </div>
            )}
        </div>
    );
};

const Profile = () => {
    const { uuid } = useParams();
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const activeTab = searchParams.get('tab') || 'info';

    // Redux state
    const { user: loggedInUser, isLoggedIn, loading: userLoadingStatus } = useSelector((state) => state.user);
    const { friends, friendRequests, sentFriendRequests, loading: friendsLoading } = useSelector((state) => state.friends);
    const { uiPreferences, setUIPreference, AVAILABLE_ACCENT_COLORS } = useAppContext();

    // State chung
    const [userTimeline, setUserTimeline] = useState([]);
    const [loadingTimeline, setLoadingTimeline] = useState(false);
    const [collections, setCollections] = useState([]);
    const [loadingCollections, setLoadingCollections] = useState(false);
    const [userBadges, setUserBadges] = useState([]);
    const [loadingBadges, setLoadingBadges] = useState(true);

    // State cho public profile
    const [profileUser, setProfileUser] = useState(null);
    const [loadingPublic, setLoadingPublic] = useState(false);
    const [errorPublic, setErrorPublic] = useState(null);
    const [profileTimeline, setProfileTimeline] = useState([]);
    const [profileFriends, setProfileFriends] = useState([]);
    const [loadingExtra, setLoadingExtra] = useState(false);
    const [profileBadges, setProfileBadges] = useState([]);

    // State khác
    const [showCreateCollectionModal, setShowCreateCollectionModal] = useState(false);
    const [showEditCollectionModal, setShowEditCollectionModal] = useState(false);
    const [collectionToEdit, setCollectionToEdit] = useState(null);
    const [newCollectionForm, setNewCollectionForm] = useState({ name: "", description: "", type: 'movie', isPublic: false });
    const [submitCollectionLoading, setSubmitCollectionLoading] = useState(false);

    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [profileEditData, setProfileEditData] = useState({ name: '', phoneNumber: '', email: '', avatarFile: null, avatarPreview: null, socialLinks: { github: '', twitter: '', instagram: '', facebook: '' } });
    const [infoSavingLoading, setInfoSavingLoading] = useState(false);

    const [privacySettingsForm, setPrivacySettingsForm] = useState({
        showFriendsList: loggedInUser?.privacySettings?.showFriendsList || 'public',
        showTimeline: loggedInUser?.privacySettings?.showTimeline || 'public',
    });

    const [isSavingPrivacy, setIsSavingPrivacy] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [inventory, setInventory] = useState([]);
    const [loadingInventory, setLoadingInventory] = useState(false);
    const [activatingItemId, setActivatingItemId] = useState(null);

    const [showInventoryGroupModal, setShowInventoryGroupModal] = useState(false);
    const [inventoryGroupType, setInventoryGroupType] = useState('');
    const [inventoryGroupItems, setInventoryGroupItems] = useState([]);

    // Xác định chế độ xem
    const isViewingOwnProfile = !uuid || (loggedInUser && uuid === loggedInUser.uuid);

    // --- useEffects để fetch dữ liệu ---
    useEffect(() => {
        if (!isViewingOwnProfile) return;
        if (!isLoggedIn) {
            navigate("/login", { replace: true });
        }
    }, [isLoggedIn, isViewingOwnProfile, navigate]);

    useEffect(() => {
        if (!isViewingOwnProfile || !loggedInUser) return;
        document.title = `${loggedInUser.name} - Hồ Sơ | WWAN Film`;
        setProfileEditData({
            name: loggedInUser.name || "",
            phoneNumber: loggedInUser.phoneNumber || "",
            email: loggedInUser.email || "",
            avatarFile: null,
            avatarPreview: loggedInUser.avatar
                ? (loggedInUser.avatar.startsWith('http') ? loggedInUser.avatar : `/${loggedInUser.avatar}`)
                : null,
            socialLinks: loggedInUser.socialLinks || { github: '', twitter: '', instagram: '', facebook: '' },
        });
        setPrivacySettingsForm(loggedInUser.privacySettings || { showFriendsList: 'public', showTimeline: 'public' });
    }, [isViewingOwnProfile, loggedInUser]);
   
    useEffect(() => {
        if (!isViewingOwnProfile || !loggedInUser) return;
        
        switch (activeTab) {
            case 'timeline':
                if (loggedInUser.uuid) {
                    setLoadingTimeline(true);
                    dispatch(getUserTimeline(loggedInUser.uuid)).unwrap()
                        .then(data => setUserTimeline(data || []))
                        .catch(err => showErrorToast(err, "Lỗi tải dòng thời gian"))
                        .finally(() => setLoadingTimeline(false));
                }
                break;
            case 'collections':
                fetchUserCollections();
                break;
            case 'friends':
                if (loggedInUser.id) {
                    dispatch(getFriends(loggedInUser.id)).unwrap()
                        .catch(err => showErrorToast(err, "Lỗi tải danh sách bạn bè"));
                }
                break;
            case 'inventory':
                fetchUserInventory();
                break;
            default:
                break;
        }
    }, [
        isViewingOwnProfile,
        loggedInUser,
        activeTab,
        dispatch
    ]);

    useEffect(() => {
        if (isViewingOwnProfile) return;
        if (!uuid) return;
        setLoadingPublic(true);
        setErrorPublic(null);
        setProfileUser(null);
        setProfileBadges([]);
        setProfileTimeline([]);
        setProfileFriends([]);
        axios.get(`/api/profile-user/${uuid}`, { headers: authHeader() })
            .then(res => {
                if (res.data.success) {
                    setProfileUser(res.data.user);
                    document.title = `${res.data.user.name} | WWAN Film`;
                    return axios.get(`/api/m/users/${uuid}/badges`, { headers: authHeader() });
                } else {
                    throw new Error(res.data.message || "Không tìm thấy người dùng.");
                }
            })
            .then(badgesRes => {
                setProfileBadges(badgesRes.data.badges || []);
            })
            .catch(err => {
                setErrorPublic(err.response?.data?.message || err.message || "Lỗi tải thông tin người dùng.");
            })
            .finally(() => setLoadingPublic(false));
    }, [uuid, isViewingOwnProfile]);

    useEffect(() => {
        if (isViewingOwnProfile || !profileUser) return;
        setLoadingExtra(true);
        const promises = [];
        if (profileUser.canViewFriends) {
            promises.push(axios.get(`/api/users/${profileUser.id}/friends`, { headers: authHeader() }));
        } else {
            promises.push(Promise.resolve({ data: { success: true, data: { friends: [] } } }));
        }
        if (profileUser.canViewTimeline) {
            promises.push(axios.get(`/api/auth/timeline/${profileUser.uuid}`, { headers: authHeader() }));
        } else {
            promises.push(Promise.resolve({ data: [] }));
        }
        Promise.all(promises)
            .then(([friendsRes, timelineRes]) => {
                setProfileFriends(friendsRes.data.data?.friends || []);
                setProfileTimeline(timelineRes.data || []);
            })
            .finally(() => setLoadingExtra(false));
    }, [profileUser, isViewingOwnProfile]);

    const fetchUserBadges = useCallback(async () => {
        if (!loggedInUser?.uuid) return;
        setLoadingBadges(true);
        try {
            const response = await axios.get(`/api/m/users/${loggedInUser?.uuid}/badges`, { headers: authHeader() });
            if (response.data?.success) {
                setUserBadges(response.data.badges || []);
            }
        } catch (err) {
            setUserBadges([]);
        } finally {
            setLoadingBadges(false);
        }
    }, [loggedInUser?.uuid]);

    useEffect(() => {
        fetchUserBadges();
    }, [fetchUserBadges]);

    const fetchUserCollections = useCallback(async () => {
        setLoadingCollections(true);
        try {
            const response = await axios.get(`/api/watchlists?includeItems=true`, { headers: authHeader() });
            if (response.data.success) {
                setCollections(response.data.watchlists || []);
            }
        } catch (error) {
            showErrorToast(error, "Lỗi tải bộ sưu tập");
        } finally {
            setLoadingCollections(false);
        }
    }, []);

    const fetchUserInventory = useCallback(async () => {
        setInventory([]);
        setLoadingInventory(true);
        try {
            const response = await axios.get('/api/user/inventory', { headers: authHeader() });
            if (response.data.success) {
                const fetchedInventory = response.data.inventory || [];
                setInventory(fetchedInventory);
            } else {
                throw new Error(response.data.message || "Không thể tải kho đồ.");
            }
        } catch (error) {
            showErrorToast(error, "Lỗi tải kho đồ");
            setInventory([]);
        } finally {
            setLoadingInventory(false);
        }
    }, []);

    const calculateProgress = useCallback(() => {
        const user = isViewingOwnProfile ? loggedInUser : profileUser;
        if (!user || typeof user.points !== 'number' || typeof user.level !== 'number') {
            return { nextLevelPoints: 100 };
        }
        const currentLevelInfo = LEVEL_THRESHOLDS.find(lt => lt.level === user.level);
        const nextLevelInfo = LEVEL_THRESHOLDS.find(lt => lt.level === user.level + 1);
        const currentLevelPoints = currentLevelInfo ? currentLevelInfo.points : 0;
        const nextLevelPoints = nextLevelInfo ? nextLevelInfo.points : (currentLevelPoints + (LEVEL_THRESHOLDS[1]?.points || 100));
        return { nextLevelPoints };
    }, [loggedInUser, profileUser, isViewingOwnProfile]);
    const { nextLevelPoints } = calculateProgress();

    const handleShowCreateCollectionModal = () => {
        setCollectionToEdit(null);
        setNewCollectionForm({ name: "", description: "", type: 'movie', isPublic: false });
        setShowCreateCollectionModal(true);
    };
    const handleShowEditCollectionModal = (collection) => {
        setCollectionToEdit(collection);
        setNewCollectionForm({
            name: collection.name,
            description: collection.description || "",
            type: collection.type || 'movie',
            isPublic: !!collection.isPublic,
        });
        setShowEditCollectionModal(true);
    };
    const handleCollectionFormChange = (e) => {
        const { name, value, type, checked } = e.target;
        setNewCollectionForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };
    const handleSaveCollection = async (e) => {
        e.preventDefault();
        if (!newCollectionForm.name.trim()) { toast.warn("Tên bộ sưu tập không được để trống."); return; }
        setSubmitCollectionLoading(true);

        const url = collectionToEdit ? `/api/watchlists/${collectionToEdit.id}` : "/api/watchlists";
        const method = collectionToEdit ? "put" : "post";
        try {
            await axios({ method, url, data: newCollectionForm, headers: authHeader() });
            toast.success(collectionToEdit ? "Cập nhật bộ sưu tập thành công!" : "Tạo bộ sưu tập thành công!");
            if (collectionToEdit) setShowEditCollectionModal(false); else setShowCreateCollectionModal(false);
            fetchUserCollections();
        } catch (error) {
            showErrorToast(error, collectionToEdit ? "Lỗi cập nhật" : "Lỗi tạo mới");
        } finally { setSubmitCollectionLoading(false); }
    };
    const handleDeleteCollection = async (collectionId) => {
        if (!window.confirm("Bạn chắc chắn muốn xóa bộ sưu tập này?")) return;
        try {
            await axios.delete(`/api/watchlists/${collectionId}`, { headers: authHeader() });
            toast.success("Đã xóa bộ sưu tập.");
            fetchUserCollections();
        } catch (error) { showErrorToast(error, "Lỗi xóa bộ sưu tập"); }
    };
    const handleRemoveItemFromCollection = async (collectionId, itemId, itemType) => {
        if (!window.confirm(`Bạn chắc chắn muốn xóa mục này khỏi bộ sưu tập?`)) return;
        try {
            const apiUrl = itemType === 'movie' ? `/api/watchlists/${collectionId}/movies/${itemId}` : `/api/watchlists/${collectionId}/comics/${itemId}`;
            await axios.delete(apiUrl, { headers: authHeader() });
            toast.success("Đã xóa mục khỏi bộ sưu tập.");
            fetchUserCollections();
        } catch (error) { showErrorToast(error, "Lỗi xóa mục"); }
    };

    const handleProfileEditToggle = () => {
        setIsEditingProfile(!isEditingProfile);
        if (!isEditingProfile && loggedInUser) {
            setProfileEditData({
                name: loggedInUser.name || "",
                phoneNumber: loggedInUser.phoneNumber || "",
                email: loggedInUser.email || "",
                avatarFile: null,
                avatarPreview: loggedInUser.avatar ? (loggedInUser.avatar.startsWith('http') ? loggedInUser.avatar : `/${loggedInUser.avatar}`) : null,
                socialLinks: loggedInUser.socialLinks || { github: '', twitter: '', instagram: '', facebook: '' },
            });
        }
    };
    const handleProfileDataChange = (e) => {
        const { name, value } = e.target;
        setProfileEditData(prev => ({ ...prev, [name]: value }));
    };
    const handleProfileAvatarChange = (e) => {
        const file = e.target.files[0];
        if (file && file.type.startsWith('image/')) {
            setProfileEditData(prev => ({ ...prev, avatarFile: file, avatarPreview: URL.createObjectURL(file) }));
        } else { if (file) toast.warn("Vui lòng chọn file ảnh."); }
    };
    const handleRemoveProfileAvatar = () => {
        setProfileEditData(prev => ({ ...prev, avatarFile: null, avatarPreview: null }));
        const fileInput = document.getElementById('profileAvatarFile');
        if (fileInput) fileInput.value = "";
    };
    const handleProfileSocialLinkChange = (e) => {
        const { name, value } = e.target;
        setProfileEditData(prev => ({ ...prev, socialLinks: { ...(prev.socialLinks || {}), [name]: value } }));
    };
    const handleProfileSaveChanges = async (e) => {
        e.preventDefault();
        if (!profileEditData.name.trim()) { toast.warn("Tên không được để trống."); return; }
        setInfoSavingLoading(true);
        const formData = new FormData();
        formData.append('name', profileEditData.name.trim());
        if (profileEditData.phoneNumber) formData.append('phoneNumber', profileEditData.phoneNumber.trim());
        if (profileEditData.avatarFile) {
            formData.append('avatar', profileEditData.avatarFile);
        } else if (!profileEditData.avatarPreview && loggedInUser?.avatar) {
            formData.append('removeAvatar', 'true');
        }
        formData.append('socialLinks', JSON.stringify(profileEditData.socialLinks || {}));

        try {
            await dispatch(updateUser(formData)).unwrap();
            showSuccessToast("Cập nhật thông tin thành công!");
            setIsEditingProfile(false);
        } catch (error) {
            showErrorToast(error, "Lỗi cập nhật thông tin");
        } finally { setInfoSavingLoading(false); }
    };

    const handlePrivacySettingChange = (e) => {
        const { name, value } = e.target;
        setPrivacySettingsForm(prev => ({ ...prev, [name]: value }));
    };
    const handleSavePrivacy = async (e) => {
        e.preventDefault();
        setIsSavingPrivacy(true);
        try {
            const response = await axios.put('/api/users/me/privacy-settings', privacySettingsForm, { headers: authHeader() });
            if (response.data.success) {
                toast.success(response.data.message);
                await dispatch(updateUserPrivacySettings(response.data.privacySettings));
            } else {
                throw new Error(response.data.message || "Lỗi cập nhật cài đặt.");
            }
        } catch (error) {
            showErrorToast(error, "Lỗi lưu cài đặt riêng tư");
        } finally { setIsSavingPrivacy(false); }
    };

    const handleToggleItemActivation = async (inventoryEntryId) => {
        if (!isLoggedIn || !loggedInUser) return;
        setActivatingItemId(inventoryEntryId);
        try {
            const response = await axios.put(`/api/user/inventory/${inventoryEntryId}/activate`, {}, { headers: authHeader() });
            if (response.data.success) {
                toast.success(response.data.message);
                const toggledItem = response.data.inventoryItem;
                if (toggledItem && toggledItem.itemDetails) {
                    const { type, value } = toggledItem.itemDetails;
                    const exclusiveTypes = ['AVATAR_FRAME', 'CHAT_COLOR', 'THEME_UNLOCK', 'PROFILE_BACKGROUND'];
                    if (exclusiveTypes.includes(type)) {
                        if (toggledItem.isActive) {
                            dispatch(setActiveItem({ itemType: type, itemValue: value }));
                        } else {
                            dispatch(clearActiveItem({ itemType: type }));
                        }
                    }
                }
            } else {
                throw new Error(response.data.message || "Thao tác thất bại.");
            }
        } catch (error) {
            showErrorToast(error, "Lỗi thao tác vật phẩm");
        } finally {
            setActivatingItemId(null);
        }
    };

    const handleFriendAction = async (actionThunk, targetId, successMsg, errorMsgPrefix) => {
        if (!loggedInUser || actionLoading) return;
        setActionLoading(true);
        try {
            await dispatch(actionThunk(targetId)).unwrap();
            showSuccessToast(successMsg);
            dispatch(getFriends(loggedInUser.id));
        } catch (error) {
            showErrorToast(error, errorMsgPrefix);
        } finally {
            setActionLoading(false);
        }
    };
    const handleAcceptRequest = (requesterId) => handleFriendAction(acceptFriendRequest, requesterId, "Đã chấp nhận lời mời!", "Lỗi chấp nhận");
    const handleRejectRequest = (requesterId) => handleFriendAction(rejectFriendRequest, requesterId, "Đã từ chối lời mời.", "Lỗi từ chối");
    const handleCancelRequest = (recipientId) => handleFriendAction(cancelFriendRequest, recipientId, "Đã hủy lời mời.", "Lỗi hủy lời mời");
    const handleRemoveFriendAction = (friendId) => {
        if (!window.confirm("Bạn chắc chắn muốn hủy kết bạn?")) return;
        handleFriendAction(removeFriend, friendId, "Đã hủy kết bạn.", "Lỗi hủy bạn");
    };

    const handleOpenInventoryGroup = (type, items) => {
        setInventoryGroupType(type);
        setInventoryGroupItems(items);
        setShowInventoryGroupModal(true);
    };

    // ----- JSX RENDERING CHO MODAL COLLECTION -----
    const renderCollectionFormModal = (isEditingMode) => {
        const modalTitle = isEditingMode ? "Chỉnh Sửa Bộ Sưu Tập" : "Tạo Bộ Sưu Tập Mới";
        const submitButtonText = isEditingMode ? "Lưu Thay Đổi" : "Tạo Mới";
        const formId = isEditingMode ? `editCollectionForm-${collectionToEdit?.id}` : "createCollectionForm";
        return (
            <CustomModal
                show={isEditingMode ? showEditCollectionModal : showCreateCollectionModal}
                onHide={() => isEditingMode ? setShowEditCollectionModal(false) : setShowCreateCollectionModal(false)}
                title={modalTitle}
                submitting={submitCollectionLoading}
                modalId={`${formId}-modal`}
                footer={
                    <>
                        <button type="button" className="btn-custom btn--secondary" onClick={() => isEditingMode ? setShowEditCollectionModal(false) : setShowCreateCollectionModal(false)} disabled={submitCollectionLoading}>Hủy</button>
                        <button type="submit" form={formId} className="btn-custom btn--primary" disabled={submitCollectionLoading}>
                            {submitCollectionLoading ? <span className="spinner--small"></span> : submitButtonText}
                        </button>
                    </>
                }
            >
                <form onSubmit={handleSaveCollection} id={formId} className="custom-form collection-form">
                    <div className="form-group">
                        <label htmlFor={`${formId}-name`} className="form-label">Tên bộ sưu tập <span className="text-danger">*</span></label>
                        <input
                            type="text"
                            id={`${formId}-name`}
                            name="name"
                            className="form-control"
                            placeholder="Ví dụ: Anime Isekai Hay Nhất"
                            value={newCollectionForm.name}
                            onChange={handleCollectionFormChange}
                            required
                            disabled={submitCollectionLoading}
                            autoFocus
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor={`${formId}-description`} className="form-label">Mô tả (tùy chọn)</label>
                        <textarea
                            id={`${formId}-description`}
                            name="description"
                            className="form-control"
                            rows="3"
                            placeholder="Một vài dòng giới thiệu về bộ sưu tập của bạn..."
                            value={newCollectionForm.description}
                            onChange={handleCollectionFormChange}
                            disabled={submitCollectionLoading}
                        ></textarea>
                    </div>
                    <div className="form-group">
                        <label htmlFor={`${formId}-type`} className="form-label">Loại nội dung</label>
                        <select
                            id={`${formId}-type`}
                            name="type"
                            className="form-select"
                            value={newCollectionForm.type}
                            onChange={handleCollectionFormChange}
                            disabled={submitCollectionLoading || (isEditingMode && collectionToEdit && (collectionToEdit.movies?.length > 0 || collectionToEdit.comics?.length > 0))}
                        >
                            <option value="movie">Chỉ Phim</option>
                            <option value="comic">Chỉ Truyện Tranh</option>
                        </select>
                        {(isEditingMode && collectionToEdit && (collectionToEdit.movies?.length > 0 || collectionToEdit.comics?.length > 0)) &&
                            <small className="form-text text-muted">Không thể thay đổi loại khi bộ sưu tập đã có mục.</small>}
                    </div>
                    <div className="form-check form-switch mt-3">
                        <input
                            className="form-check-input"
                            type="checkbox"
                            role="switch"
                            id={`${formId}-isPublic`}
                            name="isPublic"
                            checked={newCollectionForm.isPublic}
                            onChange={handleCollectionFormChange}
                            disabled={submitCollectionLoading}
                        />
                        <label className="form-check-label" htmlFor={`${formId}-isPublic`}>
                            Công khai bộ sưu tập này?
                        </label>
                    </div>
                    {isEditingMode && collectionToEdit?.isPublic && collectionToEdit?.slug && (
                        <div className="form-group mt-2">
                            <label htmlFor={`shareLink-${collectionToEdit.id}`} className="form-label">Link chia sẻ</label>
                            <div className="input-group-custom">
                                <input type="text" id={`shareLink-${collectionToEdit.id}`} className="form-control form-control-sm" readOnly value={`${window.location.origin}/collections/${collectionToEdit.slug}`} />
                                <button type="button" className="btn-copy-link" onClick={() => {
                                    navigator.clipboard.writeText(`${window.location.origin}/collections/${collectionToEdit.slug}`);
                                    toast.info("Đã sao chép link!");
                                }} title="Sao chép link">
                                    <i className="fas fa-copy"></i>
                                </button>
                            </div>
                        </div>
                    )}
                </form>
            </CustomModal>
        );
    };

    const renderInventoryTypeTitle = (type) => {
        switch (type) {
            case 'AVATAR_FRAME': return <><i className="fas fa-square-full me-2"></i>Khung Avatar</>;
            case 'CHAT_COLOR': return <><i className="fas fa-palette me-2"></i>Màu Chat</>;
            case 'THEME_UNLOCK': return <><i className="fas fa-brush me-2"></i>Chủ Đề</>;
            case 'PROFILE_BACKGROUND': return <><i className="fas fa-image me-2"></i>Ảnh Nền Hồ Sơ</>;
            case 'AD_SKIP_TICKET': return <><i className="fas fa-ticket-alt me-2"></i>Vé Bỏ Qua Quảng Cáo</>;
            default: return <>{type}</>;
        }
    };

    // Lấy user đang xem (của mình hoặc người khác)
    const viewingUser = isViewingOwnProfile ? loggedInUser : profileUser;
    const viewingBadges = isViewingOwnProfile ? userBadges : profileBadges;
    const viewingTimeline = isViewingOwnProfile ? userTimeline : profileTimeline;
    const viewingTimelineLoading = isViewingOwnProfile ? loadingTimeline : loadingExtra;
    const viewingFriends = isViewingOwnProfile ? friends : profileFriends;
    const viewingFriendsLoading = isViewingOwnProfile ? friendsLoading : loadingExtra;
    const socialLinks = viewingUser?.socialLinks || {};
    const hasGithub = typeof socialLinks.github === 'string' && socialLinks.github.trim() !== '';
    const hasTwitter = typeof socialLinks.twitter === 'string' && socialLinks.twitter.trim() !== '';
    const hasInstagram = typeof socialLinks.instagram === 'string' && socialLinks.instagram.trim() !== '';
    const hasFacebook = typeof socialLinks.facebook === 'string' && socialLinks.facebook.trim() !== '';
    const hasAnySocialLink = hasGithub || hasTwitter || hasInstagram || hasFacebook;

    // Nếu đang tải hoặc lỗi khi xem profile người khác
    if (!isViewingOwnProfile) {
        if (loadingPublic) {
            return (
                <div className="loader-overlay">
                    <div id="container-loader">
                        <div className="loader-box" id="loader1"></div>
                        <div className="loader-box" id="loader2"></div>
                        <div className="loader-box" id="loader3"></div>
                        <div className="loader-box" id="loader4"></div>
                        <div className="loader-box" id="loader5"></div>
                    </div>
                </div>
            );
        }
        if (errorPublic) {
            return (
                <div className="alert-message alert-danger" style={{ textAlign: 'center', padding: '1rem' }}>
                    Lỗi: {errorPublic}
                </div>
            );
        }
        if (!profileUser) {
            return <div className="user-profile-loading"><h4>Loading user profile...</h4></div>;
        }
    }

    // Nếu chưa đăng nhập và là profile của mình
    if (userLoadingStatus && !loggedInUser && isViewingOwnProfile) return <div className="page-loader"><div className="spinner-eff"></div></div>;
    if (!isLoggedIn && isViewingOwnProfile) return <div className="container text-center py-5"><p>Vui lòng <Link to="/login">đăng nhập</Link> để xem trang này.</p></div>;

    // --- JSX CHÍNH ---
    return (
        <div className={classNames("profile-page-wrapper")}>
            <div className="container profile-page-container">
                <nav aria-label="breadcrumb" className="profile-breadcrumb">
                    <ol className="breadcrumb-custom">
                        <li className="breadcrumb-item-custom"><Link to="/">Trang chủ</Link></li>
                        <li className="breadcrumb-item-custom active" aria-current="page">
                            {isViewingOwnProfile ? "Hồ sơ của tôi" : `Hồ sơ: ${viewingUser?.name || ""}`}
                        </li>
                    </ol>
                </nav>

                <div className="profile-grid">
                    <aside className="profile-sidebar">
                        <ProfileHeader profileUser={viewingUser} />
                        <div className="profile-section-card card-profile">
                            <h5 className="profile-section-card__title">
                                <i className="fas fa-medal text-info icon-before"></i>Thành Tích
                            </h5>
                            <div className="az3">
                                <small>Cấp độ: {viewingUser?.level} ({viewingUser?.points} / {nextLevelPoints})</small>
                                <div className="progress mb-1" style={{ height: '10px' }}>
                                    <div
                                        className="progress-bar progress-bar-wave"
                                        role="progressbar"
                                        style={{ width: `${(viewingUser?.points / (nextLevelPoints || 1)) * 100}%` }}
                                        aria-valuenow={viewingUser?.points}
                                        aria-valuemin="0"
                                        aria-valuemax={nextLevelPoints}
                                    ></div>
                                </div>
                            </div>
                        </div>
                        {isViewingOwnProfile && (
                            <SocialLinksCard socialLinks={isEditingProfile ? profileEditData.socialLinks : loggedInUser.socialLinks} isEditing={isEditingProfile} onSocialLinkChange={handleProfileSocialLinkChange} />
                        )}
                        {!isViewingOwnProfile && hasAnySocialLink && (
                            <SocialLinksCard
                                socialLinks={viewingUser.socialLinks}
                                isEditing={false}
                            />
                        )}
                        <div className="profile-section-card card-profile">
                            <h5 className="profile-section-card__title">
                                <i className="fas fa-trophy text-warning icon-before"></i>Huy Hiệu
                            </h5>
                            <div className="profile-badges row g-2">
                                {isViewingOwnProfile && loadingBadges ? (
                                    <div className="loading-placeholder--small"><span className="spinner--small"></span></div>
                                ) : viewingBadges && viewingBadges.length > 0 ? (
                                    viewingBadges.map(badge => (
                                        <div key={badge.id} className="profile-badge col-4 col-md-6 text-center mb-2">
                                            {badge.iconUrl ? (
                                                <i className={badge.iconUrl}></i>
                                            ) : (
                                                <div className="avatar avatar-md" title={`${badge.name}: ${badge.description}`}>
                                                    <span className="profile-badge__image avatar-initial rounded-circle bg-secondary">
                                                        <i className="fas fa-medal"></i>
                                                    </span>
                                                </div>
                                            )}
                                            <small className="profile-badge__name d-block text-muted mt-1 text-truncate" title={badge.name}>{badge.name}</small>
                                        </div>
                                    ))
                                ) : (
                                    <p className="no-content-message text-center">{isViewingOwnProfile ? "Bạn chưa có huy hiệu nào." : "Chưa có huy hiệu nào."}</p>
                                )}
                            </div>
                        </div>
                    </aside>

                    <main className="profile-main-content">
                        <nav className="profile-tabs-nav">
                            <button className={classNames("profile-tab-link", { "active": activeTab === 'info' })} onClick={() => setSearchParams({ tab: 'info' })}><i className="fas fa-address-card icon-before"></i>Hồ Sơ</button>
                            {isViewingOwnProfile && (
                                <>
                                    <button className={classNames("profile-tab-link", { "active": activeTab === 'collections' })} onClick={() => setSearchParams({ tab: 'collections' })}><i className="fas fa-layer-group icon-before"></i>Bộ Sưu Tập</button>
                                    <button className={classNames("profile-tab-link", { "active": activeTab === 'inventory' })} onClick={() => setSearchParams({ tab: 'inventory' })}><i className="fas fa-gem icon-before"></i>Kho Đồ</button>
                                </>
                            )}
                            <button className={classNames("profile-tab-link", { "active": activeTab === 'friends' })} onClick={() => setSearchParams({ tab: 'friends' })}><i className="fas fa-users icon-before"></i>Bạn Bè</button>
                            <button className={classNames("profile-tab-link", { "active": activeTab === 'timeline' })} onClick={() => setSearchParams({ tab: 'timeline' })}><i className="fas fa-history icon-before"></i>Hoạt Động</button>
                            {isViewingOwnProfile && (
                                <>
                                    <button className={classNames("profile-tab-link", { "active": activeTab === 'settings' })} onClick={() => setSearchParams({ tab: 'settings' })}><i className="fas fa-user-cog icon-before"></i>Cài Đặt</button>
                                </>
                            )}
                        </nav>

                        <div className="profile-tab-content">
                            {activeTab === 'info' && (
                                <ProfileInfoCard
                                    currentUser={viewingUser}
                                    profileEditData={profileEditData}
                                    isEditing={isViewingOwnProfile && isEditingProfile}
                                    onEditToggle={isViewingOwnProfile ? handleProfileEditToggle : undefined}
                                    onProfileDataChange={isViewingOwnProfile ? handleProfileDataChange : undefined}
                                    onAvatarChange={isViewingOwnProfile ? handleProfileAvatarChange : undefined}
                                    onRemoveAvatar={isViewingOwnProfile ? handleRemoveProfileAvatar : undefined}
                                    onSaveChanges={isViewingOwnProfile ? handleProfileSaveChanges : undefined}
                                    isLoading={isViewingOwnProfile ? infoSavingLoading : false}
                                />
                            )}
                            {isViewingOwnProfile && activeTab === 'collections' && (
                                <div className="profile-content-section" id="profile-collections-section">
                                    <div className="profile-content-section__header">
                                        <h4 className="profile-content-section__title"><i className="fas fa-layer-group icon-before"></i>Bộ Sưu Tập Của Tôi</h4>
                                        <button className="btn btn-primary btn-sm" onClick={handleShowCreateCollectionModal}>
                                            <i className="fas fa-plus me-2"></i> Tạo Mới
                                        </button>
                                    </div>
                                    {loadingCollections ? <div className="loading-placeholder--small"><span className="spinner--small"></span></div> :
                                        collections.length === 0 ? <p className="no-content-message text-center">Bạn chưa có bộ sưu tập nào.</p> :
                                            <div className="collections-user-list">
                                                {collections.map(collection => (<CollectionCardUser key={collection.id} collection={collection} onRemoveItem={handleRemoveItemFromCollection} onDeleteCollection={handleDeleteCollection} onEditCollection={handleShowEditCollectionModal} />))}
                                            </div>
                                    }
                                </div>
                            )}
                            {isViewingOwnProfile && activeTab === 'inventory' && (
                                <div className="profile-content-section" id="profile-inventory-section">
                                    <div className="profile-content-section__header">
                                        <h4 className="profile-content-section__title"><i className="fas fa-gem icon-before"></i>Kho Đồ</h4>
                                        <Link to="/shop" className="btn btn-outline-primary btn-sm"> <i className="fas fa-store me-2"></i> Đến Cửa Hàng </Link>
                                    </div>
                                    {loadingInventory ? (
                                        <div className="loading-placeholder--small"><span className="spinner--small"></span></div>
                                    ) : inventory.length === 0 ? (
                                        <div className="no-content-message text-center"><i className="fas fa-box-open icon-empty"></i><p>Kho đồ trống trơn!</p></div>
                                    ) : (
                                        Object.entries(
                                            inventory.reduce((acc, item) => {
                                                const type = item.itemDetails?.type || 'Khác';
                                                if (!acc[type]) acc[type] = [];
                                                acc[type].push(item);
                                                return acc;
                                            }, {})
                                        ).map(([type, items]) => (
                                            <div key={type} className="inventory-type-group iventory-type mb-4">
                                                <div
                                                    className="inventory-type-title mb-2 iventory-type__title"
                                                    tabIndex={0}
                                                    role="button"
                                                    onClick={() => handleOpenInventoryGroup(type, items)}
                                                >
                                                    {renderInventoryTypeTitle(type)}
                                                    <span className="iventory-type__count">({items.length})</span>
                                                    <i className="fas fa-chevron-right iventory-type__chevron"></i>
                                                </div>
                                                <div className="inventory-grid">
                                                    {items.slice(0, 2).map(invItem => (
                                                        <InventoryItemCard
                                                            key={invItem.id}
                                                            invItem={invItem}
                                                            onToggleActivation={handleToggleItemActivation}
                                                            isActivatingThis={activatingItemId === invItem.id}
                                                        />
                                                    ))}
                                                    {/* {items.length > 2 && (
                                                        <div className="inventory-card inventory-card--more">
                                                            <button
                                                                className="btn btn-outline-primary btn-sm"
                                                                onClick={() => handleOpenInventoryGroup(type, items)}
                                                            >
                                                                Xem tất cả {items.length} vật phẩm
                                                            </button>
                                                        </div>
                                                    )} */}
                                                </div>
                                            </div>
                                        ))
                                    )}

                                </div>
                            )}
                            {activeTab === 'friends' && (
                                <div className="profile-content-section" id="profile-friends-section">
                                    <FriendManagementSection
                                        friends={viewingFriends}
                                        friendRequests={isViewingOwnProfile ? friendRequests : []}
                                        sentFriendRequests={isViewingOwnProfile ? sentFriendRequests : []}
                                        loading={viewingFriendsLoading}
                                        onAcceptRequest={isViewingOwnProfile ? handleAcceptRequest : undefined}
                                        onRejectRequest={isViewingOwnProfile ? handleRejectRequest : undefined}
                                        onCancelRequest={isViewingOwnProfile ? handleCancelRequest : undefined}
                                        onRemoveFriend={isViewingOwnProfile ? handleRemoveFriendAction : undefined}
                                        isPublicView={!isViewingOwnProfile}
                                        profileUserUuid={!isViewingOwnProfile ? profileUser?.uuid : undefined}
                                    />
                                </div>
                            )}
                            {activeTab === 'timeline' && (
                                <div className="profile-content-section" id="profile-timeline-section">
                                    <TimelineSection timeline={viewingTimeline} loading={viewingTimelineLoading} isPublicView={!isViewingOwnProfile} />
                                </div>
                            )}

                            {activeTab === 'settings' && (
                                <div className="profile-settings-tab">
                                    <div className="profile-content-section" id="privacy-settings-section">
                                        <div className="profile-content-section__header">
                                            <h4 className="profile-content-section__title"><i className="fas fa-user-shield icon-before"></i>Cài Đặt Riêng Tư</h4>
                                        </div>
                                        <form onSubmit={handleSavePrivacy} className="custom-form privacy-settings-form">
                                            <div className="form-group">
                                                <label htmlFor="showFriendsList" className="form-label">Ai xem được danh sách bạn bè?</label>
                                                <select id="showFriendsList" name="showFriendsList" className="form-select" value={privacySettingsForm.showFriendsList} onChange={handlePrivacySettingChange} disabled={isSavingPrivacy}>
                                                    <option value="public">Mọi người</option>
                                                    <option value="friends">Chỉ bạn bè</option>
                                                    <option value="private">Chỉ mình tôi</option>
                                                </select>
                                            </div>
                                            <div className="form-group">
                                                <label htmlFor="showTimeline" className="form-label">Ai xem được dòng thời gian?</label>
                                                <select id="showTimeline" name="showTimeline" className="form-select" value={privacySettingsForm.showTimeline} onChange={handlePrivacySettingChange} disabled={isSavingPrivacy}>
                                                    <option value="public">Mọi người</option>
                                                    <option value="friends">Chỉ bạn bè</option>
                                                    <option value="private">Chỉ mình tôi</option>
                                                </select>
                                            </div>
                                            <button type="submit" className="btn btn--primary mt-3" disabled={isSavingPrivacy}>
                                                {isSavingPrivacy ? <span className="spinner--small"></span> : "Lưu Riêng Tư"}
                                            </button>
                                        </form>
                                    </div>

                                    <div className="profile-content-section mt-3" id="theme-settings-section">
                                        <div className="profile-content-section__header">
                                            <h4 className="profile-content-section__title"><i className="fas fa-palette icon-before"></i>Tùy Chỉnh Giao Diện</h4>
                                        </div>
                                        <div className="theme-settings-form">
                                            <div className="form-group">
                                                <label className="form-label">Chế độ hiển thị:</label>
                                                <div className="theme-options-group">
                                                    {['light', 'dark', 'system'].map(themeOpt => (
                                                        <div key={themeOpt} className="form-check-custom">
                                                            <input type="radio" id={`theme-${themeOpt}`} name="theme" value={themeOpt} checked={uiPreferences.theme === themeOpt} onChange={(e) => setUIPreference('theme', e.target.value)} />
                                                            <label htmlFor={`theme-${themeOpt}`}>{themeOpt.charAt(0).toUpperCase() + themeOpt.slice(1)}</label>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="form-group">
                                                <label className="form-label">Màu nhấn chủ đạo:</label>
                                                <div className="accent-color-picker">
                                                    {AVAILABLE_ACCENT_COLORS.map(color => (
                                                        <button key={color.value} type="button"
                                                            className={classNames("btn btn-sm color-option", { "selected": uiPreferences.accentColor === color.value })}
                                                            style={{ backgroundColor: color.value }}
                                                            onClick={() => setUIPreference('accentColor', color.value)}
                                                            aria-label={`Chọn màu ${color.name}`}
                                                            title={color.name}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="form-group">
                                                <label className="form-label">Kích thước chữ:</label>
                                                <select className="form-select" value={uiPreferences.fontSize} onChange={(e) => setUIPreference('fontSize', e.target.value)}>
                                                    <option value="small">Nhỏ</option>
                                                    <option value="medium">Vừa (Mặc định)</option>
                                                    <option value="large">Lớn</option>
                                                </select>
                                            </div>
                                            <div className="form-group">
                                                <label className="form-label">Kích thước viền:</label>
                                                <select className="form-select" value={uiPreferences.borderRadius} onChange={(e) => setUIPreference('borderRadius', e.target.value)}>
                                                    <option value="none">Vuông (0px)</option>
                                                    <option value="small">Nhỏ (0.25rem)</option>
                                                    <option value="medium">Vừa (0.375rem - Mặc định)</option>
                                                    <option value="large">Lớn (0.5rem)</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </main>
                </div>
            </div>
            {isViewingOwnProfile && renderCollectionFormModal(false)}
            {isViewingOwnProfile && collectionToEdit && renderCollectionFormModal(true)}
            {isViewingOwnProfile && activeTab === 'inventory' &&
                <CustomModal
                    show={showInventoryGroupModal}
                    size="lg"
                    onHide={() => setShowInventoryGroupModal(false)}
                    title={renderInventoryTypeTitle(inventoryGroupType)}
                    modalId="inventory-group-modal"
                    footer={null}
                >
                    <div className="inventory-grid">
                        {inventoryGroupItems.map(invItem => (
                            <InventoryItemCard
                                key={invItem.id}
                                invItem={invItem}
                                onToggleActivation={handleToggleItemActivation}
                                isActivatingThis={activatingItemId === invItem.id}
                            />
                        ))}
                    </div>
                </CustomModal>
            }
        </div>
    );
};

export default Profile;