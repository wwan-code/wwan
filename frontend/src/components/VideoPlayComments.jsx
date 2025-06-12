import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import axios from "axios";
import { useVideo } from "@pages/PlayMovie";
import { Bounce, toast } from "react-toastify";
import classNames from "@utils/classNames";
import { sendFriendRequest, cancelFriendRequest, getFriends } from "@features/friendSlice";
import authHeader from "@services/auth-header";
import { getAvatarUrl } from "@utils/getAvatarUrl";
import { Link } from "react-router-dom";
import "@assets/scss/comment.scss";
import commentService from "../services/commentService";
import { formatDistanceToNow } from "../utils/dateUtils";
import CustomModal from "./CustomModal";
import UserAvatarDisplay from "./Common/UserAvatarDisplay";

const BANNED_WORDS = new Set([
    "địt", "lồn", "cặc", "địt mẹ", "ngu", "đéo", "đm", "vcl", "vl", "cc", "cmm", "dm"
]);

function containsBannedWord(text) {
    const normalized = text.normalize("NFD").toLowerCase();
    for (const word of BANNED_WORDS) {
        if (normalized.includes(word.normalize("NFD").toLowerCase())) {
            return true;
        }
    }
    return false;
}

const VideoPlayComments = React.memo(() => {
    const { user: currentUser } = useSelector((state) => state.user);
    const { state } = useVideo();
    const dispatch = useDispatch();
    const sortDropdownRef = useRef(null);
    const replyInputRef = useRef();
    const editInputRef = useRef();

    // State cho gửi mới
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [content, setContent] = useState("");
    const [isSpoiler, setIsSpoiler] = useState(false);
    const [sendCommentLoading, setSendCommentLoading] = useState(false);

    // State cho trả lời
    const [replyingTo, setReplyingTo] = useState(null); // {commentId, name}
    const [replyContent, setReplyContent] = useState("");
    const [replySpoiler, setReplySpoiler] = useState(false);

    // State cho chỉnh sửa comment
    const [editingCommentId, setEditingCommentId] = useState(null);
    const [editContent, setEditContent] = useState("");
    const [editSpoiler, setEditSpoiler] = useState(false);

    // State cho chỉnh sửa reply
    const [editingReply, setEditingReply] = useState(null); // {id, parentId, content, isSpoiler}

    // Các state khác
    const [friends, setFriends] = useState([]);
    const [sentFriendRequests, setSentFriendRequests] = useState([]);
    const [likeLoading, setLikeLoading] = useState({});
    const [currentSort, setCurrentSort] = useState('newest');
    const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
    const [showSpoilerComments, setShowSpoilerComments] = useState({});
    const [showSpoilerReplies, setShowSpoilerReplies] = useState({});
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);

    const [showReportModal, setShowReportModal] = useState(false);
    const [itemToReport, setItemToReport] = useState(null);
    const [reportReason, setReportReason] = useState("");

    // Fetch comments
    const fetchComments = useCallback(async (sortOption = 'newest') => {
        setLoading(true);
        try {
            const response = await commentService.getCommentsByContent('episode', state.data.episode?.id, 1, 10, sortOption);
            setComments(response.comments || []);
        } catch (error) {
            setComments([]);
        } finally {
            setLoading(false);
        }
    }, [state.data.episode?.id]);

    useEffect(() => {
        if (state.data.episode?.id) fetchComments(currentSort);
    }, [fetchComments, state.data.episode?.id, currentSort]);

    // Friends
    useEffect(() => {
        if (currentUser) {
            dispatch(getFriends(currentUser.id))
                .unwrap()
                .then((data) => {
                    setFriends(data?.friends?.map(friend => friend.id) || []);
                    setSentFriendRequests(data?.sentFriendRequests?.map(request => request.id) || []);
                })
                .catch(() => { });
        } else {
            setFriends([]);
            setSentFriendRequests([]);
        }
    }, [currentUser, dispatch]);

    // Sorting dropdown UX
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (sortDropdownRef.current && !sortDropdownRef.current.contains(event.target)) {
                setIsSortDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Like
    const isLikedByCurrentUser = useCallback((likesArray) => {
        if (!currentUser || !Array.isArray(likesArray)) return false;
        return likesArray.includes(currentUser.id);
    }, [currentUser]);

    const handleLikeClick = useCallback(async (commentId, parentId = null) => {
        if (!currentUser) {
            toast.info("Vui lòng đăng nhập để thích bình luận.", { transition: Bounce });
            return;
        }
        if (likeLoading[commentId]) return;
        setLikeLoading(prev => ({ ...prev, [commentId]: true }));
        setComments(prevComments => prevComments.map(c =>
            c.id === (parentId || commentId)
                ? parentId
                    ? { ...c, replies: c.replies.map(r => r.id === commentId ? { ...r, likes: isLikedByCurrentUser(r.likes) ? r.likes.filter(id => id !== currentUser.id) : [...(r.likes || []), currentUser.id] } : r) }
                    : { ...c, likes: isLikedByCurrentUser(c.likes) ? c.likes.filter(id => id !== currentUser.id) : [...(c.likes || []), currentUser.id] }
                : c
        ));
        try {
            await commentService.toggleLikeComment(commentId);
        } catch (error) {
            toast.error("Đã có lỗi xảy ra khi thích bình luận.", { transition: Bounce });
        } finally {
            setLikeLoading(prev => ({ ...prev, [commentId]: false }));
        }
    }, [currentUser, likeLoading, isLikedByCurrentUser]);

    // Gửi bình luận mới
    const handleCommentSubmit = async (e) => {
        e.preventDefault();
        if (!currentUser) {
            toast.warn("Vui lòng đăng nhập để bình luận", { transition: Bounce });
            return;
        }
        if (!content.trim()) return;
        if (containsBannedWord(content)) {
            toast.warn("Nội dung không hợp lệ", { transition: Bounce });
            return;
        }
        setSendCommentLoading(true);
        try {
            const response = await commentService.createComment({
                contentId: state.data.episode?.id,
                contentType: 'episode',
                text: content,
                isSpoiler
            });
            setComments((prev) => [response.comment, ...prev]);
            setContent("");
            setIsSpoiler(false);
        } catch (error) {
            toast.error("Lỗi khi gửi bình luận");
        } finally {
            setSendCommentLoading(false);
        }
    };

    // Trả lời
    const openReplyForm = (commentId, name) => {
        setReplyingTo({ commentId, name });
        setReplyContent("");
        setReplySpoiler(false);
        setEditingCommentId(null);
        setEditingReply(null);
    };

    const handleReplySubmit = async (e) => {
        e.preventDefault();
        if (!currentUser) {
            toast.warn("Vui lòng đăng nhập để trả lời", { transition: Bounce });
            return;
        }
        if (!replyContent.trim() || !replyingTo) return;
        if (containsBannedWord(replyContent)) {
            toast.warn("Nội dung không hợp lệ", { transition: Bounce });
            return;
        }
        try {
            const response = await commentService.createComment({
                contentId: state.data.episode?.id,
                contentType: 'episode',
                text: replyContent,
                parentId: replyingTo.commentId,
                isSpoiler: replySpoiler
            });
            setComments(prev =>
                prev.map(c =>
                    c.id === replyingTo.commentId
                        ? { ...c, replies: [...(c.replies || []), response.comment] }
                        : c
                )
            );
            setReplyingTo(null);
            setReplyContent("");
            setReplySpoiler(false);
        } catch (error) {
            toast.error("Lỗi khi gửi phản hồi");
        }
    };

    // Chỉnh sửa comment
    const handleEditComment = (comment) => {
        setEditingCommentId(comment.id);
        setEditContent(comment.text);
        setEditSpoiler(!!comment.isSpoiler);
        setReplyingTo(null);
        setEditingReply(null);
    };
    const handleEditCommentSubmit = async (e) => {
        e.preventDefault();
        if (!editContent.trim()) return;
        if (containsBannedWord(editContent)) {
            toast.warn("Nội dung không hợp lệ", { transition: Bounce });
            return;
        }
        try {
            await commentService.updateComment(editingCommentId, { text: editContent, isSpoiler: editSpoiler });
            setComments(prev =>
                prev.map(c =>
                    c.id === editingCommentId ? { ...c, text: editContent, isSpoiler: editSpoiler } : c
                )
            );
            setEditingCommentId(null);
            setEditContent("");
            setEditSpoiler(false);
        } catch (error) {
            toast.error("Lỗi khi sửa bình luận");
        }
    };

    // Chỉnh sửa reply
    const handleEditReply = (reply, parentId) => {
        setEditingReply({ id: reply.id, parentId, content: reply.text, isSpoiler: !!reply.isSpoiler });
        setReplyingTo(null);
        setEditingCommentId(null);
    };
    const handleEditReplySubmit = async (e) => {
        e.preventDefault();
        if (!editingReply.content.trim()) return;
        if (containsBannedWord(editingReply.content)) {
            toast.warn("Nội dung không hợp lệ", { transition: Bounce });
            return;
        }
        try {
            await commentService.updateComment(editingReply.id, { text: editingReply.content, isSpoiler: editingReply.isSpoiler });
            setComments(prev =>
                prev.map(c =>
                    c.id === editingReply.parentId
                        ? {
                            ...c,
                            replies: c.replies.map(r =>
                                r.id === editingReply.id ? { ...r, text: editingReply.content, isSpoiler: editingReply.isSpoiler } : r
                            )
                        }
                        : c
                )
            );
            setEditingReply(null);
        } catch (error) {
            toast.error("Lỗi khi sửa phản hồi");
        }
    };

    // Spoiler show
    const handleShowSpoilerComment = (commentId) => setShowSpoilerComments(prev => ({ ...prev, [commentId]: true }));
    const handleShowSpoilerReply = (replyId) => setShowSpoilerReplies(prev => ({ ...prev, [replyId]: true }));

    // Delete
    const confirmDelete = (item) => {
        setItemToDelete(item);
        setShowDeleteModal(true);
    };
    const handleDeleteConfirm = () => {
        if (itemToDelete?.type === 'comment') deleteCommentAPI(itemToDelete.id);
        else if (itemToDelete?.type === 'reply') deleteCommentAPI(itemToDelete.id, itemToDelete.parentId);
        setShowDeleteModal(false);
        setItemToDelete(null);
    };
    const handleDeleteCancel = () => {
        setShowDeleteModal(false);
        setItemToDelete(null);
    };
    const deleteCommentAPI = useCallback(async (commentOrReplyId, parentId = null) => {
        try {
            await commentService.deleteComment(commentOrReplyId);
            if (parentId) {
                setComments(prevComments =>
                    prevComments.map(c =>
                        c.id === parentId
                            ? { ...c, replies: c.replies.filter(rep => rep.id !== commentOrReplyId) }
                            : c
                    )
                );
            } else {
                setComments(prevComments => prevComments.filter(item => item.id !== commentOrReplyId));
            }
            toast.success("Đã xóa bình luận/phản hồi.");
        } catch (error) {
            toast.error("Xóa thất bại. Vui lòng thử lại.");
        }
    }, []);

    const openReportModal = (item) => {
        setItemToReport(item);
        setReportReason("");
        setShowReportModal(true);
    };
    const handleReportCancel = () => {
        setShowReportModal(false);
        setItemToReport(null);
        setReportReason("");
    };
    const handleReportSubmit = async () => {
        if (!reportReason.trim()) {
            toast.warn("Vui lòng nhập lý do báo cáo");
            return;
        }
        try {
            await commentService.reportComment(itemToReport.id, reportReason);
            toast.success("Đã gửi báo cáo!");
            setShowReportModal(false);
            setItemToReport(null);
            setReportReason("");
        } catch (error) {
            toast.error("Báo cáo thất bại!");
        }
    };

    // Friend request
    const handleSendFriendRequest = (userId) => {
        dispatch(sendFriendRequest(userId))
            .unwrap()
            .then(() => {
                setSentFriendRequests((prev) => [...prev, userId]);
                toast.info("Đã gửi lời mời kết bạn", { transition: Bounce });
            }).catch((error) => {
                toast.error(error.message || "Gửi lời mời thất bại", { transition: Bounce });
            });
    };
    const handleCancelFriendRequest = (userId) => {
        dispatch(cancelFriendRequest(userId)).unwrap()
            .then(() => {
                setSentFriendRequests((prev) => prev.filter((id) => id !== userId));
                toast.info("Đã hủy lời mời kết bạn", { transition: Bounce });
            }).catch((error) => {
                toast.error(error.message || "Hủy lời mời thất bại", { transition: Bounce });
            });
    };

    // Sorting
    const handleSortChange = (sortType) => {
        if (sortType !== currentSort) {
            setCurrentSort(sortType);
            setIsSortDropdownOpen(false);
        } else {
            setIsSortDropdownOpen(false);
        }
    };

    // Auto focus reply/edit form
    useEffect(() => {
        if (replyingTo && replyInputRef.current) replyInputRef.current.focus();
    }, [replyingTo]);
    useEffect(() => {
        if (editingCommentId && editInputRef.current) editInputRef.current.focus();
    }, [editingCommentId]);
    useEffect(() => {
        if (editingReply && editInputRef.current) editInputRef.current.focus();
    }, [editingReply]);

    // Render
    return (
        <div className="video-play__comments">
            <section className="comment-section">
                <div className="comment-section__send">
                    <div className="comment-send">
                        <img className="comment-send__avatar" src={getAvatarUrl(currentUser)} alt={currentUser ? currentUser.name : 'User Avatar'} />
                        <form className="comment-send__form" onSubmit={handleCommentSubmit}>
                            <div className="comment-send__textarea">
                                <div className="comment-send__textarea__inner">
                                    <textarea
                                        maxLength="1500"
                                        rows="2"
                                        placeholder="Để lại bình luận thân thiện(°▽°)~"
                                        value={content}
                                        onChange={e => setContent(e.target.value)}
                                        disabled={sendCommentLoading}
                                    />
                                </div>
                                <button
                                    type="submit"
                                    className={`comment-send__btn ${content ? '' : 'comment-send__btn--disable'}`}
                                    disabled={!content || sendCommentLoading}
                                >
                                    <span>Gửi</span>
                                </button>
                            </div>
                            <div className="form-switch">
                                <input
                                    className="form-check-input"
                                    type="checkbox"
                                    name="spoiler"
                                    id="spoiler"
                                    title="Đánh dấu nếu bình luận chứa nội dung tiết lộ"
                                    checked={isSpoiler}
                                    onChange={e => setIsSpoiler(e.target.checked)}
                                />
                                <label className="form-check-label" htmlFor="spoiler">Spoiler</label>
                            </div>
                        </form>
                    </div>
                </div>
                {!currentUser && <p className="text-center text-muted">Vui lòng <a href="/login">đăng nhập</a> để bình luận.</p>}
                <div className="d-flex justify-content-between align-items-center mb-3 mt-3">
                    <h5 className='mb-0'>Bình luận ({comments.length})</h5>
                    <div className="dropdown" ref={sortDropdownRef}>
                        <button
                            className="btn btn-sm btn-outline-secondary dropdown-toggle"
                            type="button"
                            onClick={() => setIsSortDropdownOpen(prev => !prev)}
                            aria-expanded={isSortDropdownOpen}
                        >
                            Sắp xếp: {currentSort === 'newest' ? 'Mới nhất' : 'Nhiều like nhất'}
                        </button>
                        <ul className={`dropdown-menu dropdown-menu-end shadow-md ${isSortDropdownOpen ? 'show' : ''}`}>
                            <li><button className={`dropdown-item ${currentSort === 'newest' ? 'active' : ''}`} onClick={() => handleSortChange('newest')}>Mới nhất</button></li>
                            <li><button className={`dropdown-item ${currentSort === 'mostLiked' ? 'active' : ''}`} onClick={() => handleSortChange('mostLiked')}>Nhiều like nhất</button></li>
                        </ul>
                    </div>
                </div>
                <ul className="main-comments flexcol">
                    {loading ? (
                        <div id="container-loader">
                            <div className="loader-box" id="loader1"></div>
                            <div className="loader-box" id="loader2"></div>
                            <div className="loader-box" id="loader3"></div>
                        </div>
                    ) : comments.length > 0 ? comments.map((comment) => {
                        const isCommentLiked = isLikedByCurrentUser(comment.likes);
                        const commentLikeCount = comment.likes?.length || 0;
                        const isReplying = replyingTo && replyingTo.commentId === comment.id;
                        const isEditingReply = editingReply && editingReply.parentId === comment.id;
                        return (
                            <li
                                key={comment.id}
                                className={classNames("comment", { "current-user": comment.user.id === currentUser?.id, "reply-status": isReplying || isEditingReply })}
                                data-id={comment.id}
                            >
                                <div className="comment__wrapper">
                                    <div className="comment__avatar">
                                        <Link to={`/profile/${comment.user?.uuid}`}>
                                            <UserAvatarDisplay userToDisplay={comment.user} size={"38"} />
                                        </Link>
                                    </div>
                                    <div className="comment__body">
                                        <div className="comment__header justify-content-between">
                                            <div className="comment__user">
                                                <Link to={`/profile/${comment.user?.uuid}`} className="comment__user-name-link" title={comment.user?.name}>
                                                    <span className={classNames("comment__user-name", comment.user.activeChatColor)}>
                                                        {comment.user?.name || 'Người dùng ẩn'}
                                                    </span>
                                                </Link>
                                                <div className="comment__user-role">
                                                    {comment.user?.roles?.filter(role => role.name !== 'user').map((role, i) => (
                                                        <span key={i} className={`comment__user-badge comment__user-badge--${role.name.trim().toLowerCase()}`}>{role.name}</span>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="comment__actions" data-comment-index={comment.id}>
                                                {currentUser && (
                                                    comment.user?.id === currentUser.id ? (
                                                        <>
                                                            <span className="comment__action comment__action--edit edit" onClick={() => handleEditComment(comment)} role="button">
                                                                <span className="comment__action-icon" title="Sửa"><i className="fa-regular fa-pen-to-square"></i></span>
                                                            </span>
                                                            <span className="comment__action comment__action--delete delete" onClick={() => confirmDelete({ type: 'comment', id: comment.id })} role="button">
                                                                <span className="comment__action-icon" title="Xóa"><i className="fa-regular fa-trash-xmark"></i></span>
                                                            </span>
                                                        </>
                                                    ) : (
                                                        <a href={`#formOfComment_${comment.id}`} className="comment__action comment__action--reply" onClick={() => openReplyForm(comment.id, comment.user.name)} role="button">
                                                            <span className="comment__action-icon" title="Phản hồi"><i className="fa-regular fa-reply"></i></span>
                                                        </a>
                                                    )
                                                )}
                                                {currentUser && comment.user.name !== currentUser.name && !friends.includes(comment.user.id) && (
                                                    <>
                                                        {sentFriendRequests.includes(comment.user.id) ? (
                                                            <button className="btn btn-sm btn-warning me-2" onClick={() => handleCancelFriendRequest(comment.user.id)}>Hủy gửi lời mời</button>
                                                        ) : (
                                                            <button className="btn btn-sm btn-info me-2" onClick={() => handleSendFriendRequest(comment.user.id)}>Kết bạn</button>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                        <div className="comment__content">
                                            {editingCommentId === comment.id ? (
                                                <form className="comment-edit-form" onSubmit={handleEditCommentSubmit}>
                                                    <textarea
                                                        ref={editInputRef}
                                                        value={editContent}
                                                        onChange={e => setEditContent(e.target.value)}
                                                        rows={2}
                                                    />
                                                    <label>
                                                        <input
                                                            type="checkbox"
                                                            checked={editSpoiler}
                                                            onChange={e => setEditSpoiler(e.target.checked)}
                                                        /> Spoiler
                                                    </label>
                                                    <div className="edit-actions">
                                                        <button type="submit">Lưu</button>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setEditingCommentId(null);
                                                                setEditContent("");
                                                                setEditSpoiler(false);
                                                            }}
                                                        >Hủy</button>
                                                    </div>
                                                </form>
                                            ) : comment.isSpoiler && !showSpoilerComments[comment.id] ? (
                                                <span className="spoiler-warning">
                                                    <i className="fa-solid fa-eye-slash"></i>
                                                    <span onClick={() => handleShowSpoilerComment(comment.id)}>
                                                        Bình luận này chứa spoiler. Nhấn để xem.
                                                    </span>
                                                </span>
                                            ) : (
                                                comment.text
                                            )}
                                        </div>
                                        <div className="comment__actions" data-comment-index={comment.id}>
                                            <p className="comment__action comment__timestamp">{formatDistanceToNow(comment.createdAt)}</p>
                                            <span
                                                className={classNames("comment__action comment__action--like", { 'active': isCommentLiked, 'disabled': likeLoading[comment.id] })}
                                                onClick={() => handleLikeClick(comment.id)}
                                                role="button"
                                            >
                                                <span className="comment__action-icon">
                                                    <i className={classNames("fa-thumbs-up", isCommentLiked ? "fa-solid" : "fa-regular")}></i>
                                                </span>
                                                <strong>{commentLikeCount}</strong>
                                            </span>
                                            {comment.replies && comment.replies.length > 0 ? (
                                                <span
                                                    className="comment__action comment__action--toggle-replies"
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        const commentElement = document.querySelector(`[data-id="${comment.id}"]`);
                                                        if (!commentElement) return;
                                                        const commentChildsList = commentElement.querySelector(".comment-childs");
                                                        if (commentChildsList) {
                                                            commentChildsList.classList.toggle("hidden");
                                                            const icon = e.currentTarget.querySelector("i");
                                                            if (icon) {
                                                                icon.classList.toggle("fa-caret-down", commentChildsList.classList.contains("hidden"));
                                                                icon.classList.toggle("fa-caret-up", !commentChildsList.classList.contains("hidden"));
                                                            }
                                                        }
                                                    }}
                                                    role="button"
                                                >
                                                    <span className="comment__action-icon"><i className="fa-solid fa-caret-down"></i></span>
                                                    <strong>{comment.replies.length} phản hồi</strong>
                                                </span>
                                            ) : null}
                                            {currentUser && comment.user?.id !== currentUser.id && (
                                                <span
                                                    className="comment__action comment__action--report"
                                                    onClick={() => openReportModal({ type: 'comment', id: comment.id })}
                                                    role="button"
                                                    title="Báo cáo bình luận"
                                                >
                                                    <span className="comment__action-icon"><i className="fa-regular fa-flag"></i></span>
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                {/* Reply form */}
                                {currentUser && replyingTo && replyingTo.commentId === comment.id && (
                                    <div className="reply-form" id={`formOfComment_${comment.id}`}>
                                        <div className="comment__avatar">
                                            <img src={getAvatarUrl(currentUser)} alt={currentUser.name} />
                                        </div>
                                        <form className="reply-form__form" onSubmit={handleReplySubmit}>
                                            <input
                                                ref={replyInputRef}
                                                value={replyContent}
                                                onChange={e => setReplyContent(e.target.value)}
                                                className="reply-form__input"
                                                placeholder={`Trả lời @${replyingTo.name}...`}
                                            />
                                            <button type="button" onClick={() => setReplyingTo(null)} className="reply-form__button"><i className="fa-solid fa-xmark"></i></button>
                                            <button type="submit" className="reply-form__button"><i className="fa-regular fa-paper-plane-top"></i></button>
                                            <label>
                                                <input
                                                    type="checkbox"
                                                    checked={replySpoiler}
                                                    onChange={e => setReplySpoiler(e.target.checked)}
                                                /> Spoiler
                                            </label>
                                        </form>
                                    </div>
                                )}
                                {/* Replies */}
                                {comment.replies && comment.replies.length > 0 && (
                                    <ul className="comment-childs hidden">
                                        {comment.replies.map(reply => {
                                            const isReplyLiked = isLikedByCurrentUser(reply.likes);
                                            const replyLikeCount = reply.likes?.length || 0;
                                            return (
                                                <li key={reply.id} className={classNames("comment comment-reply", { "current-user": reply.user.id === currentUser?.id })} data-reply-id={reply.id}>
                                                    <div className="comment__wrapper">
                                                        <div className="comment__avatar">
                                                            <Link to={`/profile/${reply.user?.uuid}`}>
                                                                <UserAvatarDisplay userToDisplay={reply.user} size={"38"} />
                                                            </Link>
                                                        </div>
                                                        <div className="comment__body">
                                                            <div className="comment__header justify-content-between">
                                                                <div className="comment__user">
                                                                    <Link to={`/profile/${reply.user?.uuid}`} className="comment__user-name-link">
                                                                        <span className={classNames("comment__user-name", reply.user.activeChatColor)}>
                                                                            {reply.user?.name || 'Người dùng ẩn'}
                                                                        </span>
                                                                    </Link>
                                                                </div>
                                                                <div className="comment__actions">
                                                                    {currentUser && reply.user?.id === currentUser.id && (
                                                                        <span className="comment__action comment__action--edit edit-reply" onClick={() => handleEditReply(reply, comment.id)} role="button">
                                                                            <span className="comment__action-icon" title="Sửa"><i className="fa-regular fa-pen-to-square"></i></span>
                                                                        </span>
                                                                    )}
                                                                    {currentUser && reply.user?.id === currentUser.id && (
                                                                        <span className="comment__action comment__action--delete delete" onClick={() => confirmDelete({ type: 'reply', id: reply.id, parentId: comment.id })} role="button">
                                                                            <span className="comment__action-icon" title="Xóa"><i className="fa-regular fa-trash-xmark"></i></span>
                                                                        </span>
                                                                    )}
                                                                    {currentUser && reply.user?.id !== currentUser.id && (
                                                                        <a href="#" className="comment__action comment__action--reply-to-reply" onClick={() => openReplyForm(comment.id, reply.user.name)} role="button">
                                                                            <span className="comment__action-icon" title="Phản hồi"><i className="fa-regular fa-reply"></i></span>
                                                                        </a>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <div className="comment__content">
                                                                {editingReply && editingReply.id === reply.id ? (
                                                                    <form onSubmit={handleEditReplySubmit} className="comment-edit-form">
                                                                        <textarea
                                                                            ref={editInputRef}
                                                                            value={editingReply.content}
                                                                            onChange={e => setEditingReply(prev => ({ ...prev, content: e.target.value }))}
                                                                            rows={2}
                                                                        />
                                                                        <label>
                                                                            <input
                                                                                type="checkbox"
                                                                                checked={editingReply.isSpoiler}
                                                                                onChange={e => setEditingReply(prev => ({ ...prev, isSpoiler: e.target.checked }))}
                                                                            /> Spoiler
                                                                        </label>
                                                                        <div className="edit-actions">
                                                                            <button type="submit">Lưu</button>
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => setEditingReply(null)}
                                                                            >Hủy</button>
                                                                        </div>
                                                                    </form>
                                                                ) : reply.isSpoiler && !showSpoilerReplies[reply.id] ? (
                                                                    <span className="spoiler-warning">
                                                                        <i className="fa-solid fa-eye-slash"></i>
                                                                        <span onClick={() => handleShowSpoilerReply(reply.id)}>
                                                                            Phản hồi này chứa spoiler. Nhấn để xem.
                                                                        </span>
                                                                    </span>
                                                                ) : (
                                                                    <>
                                                                        {reply.text}
                                                                    </>
                                                                )}
                                                            </div>
                                                            <div className="comment__actions">
                                                                <p className="comment__action comment__timestamp">{formatDistanceToNow(reply.createdAt)}</p>
                                                                <span
                                                                    className={classNames("comment__action comment__action--like", { 'active': isReplyLiked, 'disabled': likeLoading[reply.id] })}
                                                                    onClick={() => handleLikeClick(reply.id, comment.id)}
                                                                    role="button"
                                                                >
                                                                    <span className="comment__action-icon">
                                                                        <i className={classNames("fa-thumbs-up", isReplyLiked ? "fa-solid" : "fa-regular")}></i>
                                                                    </span>
                                                                    <strong>{replyLikeCount}</strong>
                                                                </span>
                                                                {currentUser && reply.user?.id !== currentUser.id && (
                                                                    <span
                                                                        className="comment__action comment__action--report"
                                                                        onClick={() => openReportModal({ type: 'reply', id: reply.id, parentId: comment.id })}
                                                                        role="button"
                                                                        title="Báo cáo phản hồi"
                                                                    >
                                                                        <span className="comment__action-icon"><i className="fa-regular fa-flag"></i></span>
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </li>
                                            )
                                        })}
                                    </ul>
                                )}
                            </li>
                        )
                    }) : (
                        <p className="text-center text-muted">Chưa có bình luận nào.</p>
                    )}
                </ul>
            </section>
            <CustomModal
                show={showDeleteModal}
                onHide={handleDeleteCancel}
                title="Xác nhận xóa"
                modalId="delete-confirm-modal"
                footer={
                    <>
                        <button className="btn btn-sm btn-secondary" onClick={handleDeleteCancel}>Hủy</button>
                        <button className="btn btn-sm btn-outline-danger" onClick={handleDeleteConfirm}>Đồng ý</button>
                    </>
                }
            >
                <p>Bạn có chắc chắn muốn xóa {itemToDelete?.type === 'reply' ? 'phản hồi' : 'bình luận'} này không?</p>
            </CustomModal>
            <CustomModal
                show={showReportModal}
                onHide={handleReportCancel}
                title="Báo cáo bình luận/phản hồi"
                modalId="report-modal"
                footer={
                    <>
                        <button className="btn btn-sm btn-secondary" onClick={handleReportCancel}>Hủy</button>
                        <button className="btn btn-sm btn-danger" onClick={handleReportSubmit}>Gửi báo cáo</button>
                    </>
                }
            >
                <div>
                    <label htmlFor="report-reason" className="form-label">Lý do báo cáo</label>
                    <textarea
                        id="report-reason"
                        className="form-control"
                        rows={3}
                        value={reportReason}
                        onChange={e => setReportReason(e.target.value)}
                        placeholder="Nhập lý do báo cáo..."
                    />
                </div>
            </CustomModal>
        </div>
    );
});

export default VideoPlayComments;