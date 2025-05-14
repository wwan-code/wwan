import { useSelector, useDispatch } from "react-redux";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { useVideo } from "../pages/PlayMovie";
import { Bounce, toast } from "react-toastify";
import classNames from "../utils/classNames";
import { sendFriendRequest, cancelFriendRequest, getFriends } from "../features/friendSlice";
import "../assets/scss/comment.scss";
import authHeader from "../services/auth-header";

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
    const commentsWrapperRef = useRef(null);
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [content, setContent] = useState("");
    const [sendCommentLoading, setSendCommentLoading] = useState(false);
    const [friends, setFriends] = useState([]);
    const [sentFriendRequests, setSentFriendRequests] = useState([]);
    const [likeLoading, setLikeLoading] = useState({});
    const [currentSort, setCurrentSort] = useState('newest');
    const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
    const sortDropdownRef = useRef(null);

    const getAvatarUrl = () => {
        if (!currentUser) return "";
        return currentUser.avatar || `https://ui-avatars.com/api/?name=${currentUser.name.split(' ').map(word => word[0].toUpperCase()).join('')}&background=20c997&color=fff`;
    };

    const fetchComments = useCallback(async (sortOption = 'newest') => { // Thêm tham số sortOption
        setContent(""); // Reset input khi fetch lại
        setLoading(true);
        try {
            const response = await axios.get(`/api/episodes/${state.data.episode?.id}/comments`, {
                params: { sort: sortOption } // Gửi tham số sort lên API
            });
            setComments(response.data || []); // Đảm bảo response.data là mảng
        } catch (error) {
            console.error("Lỗi tải bình luận:", error);
            setComments([]); // Reset về mảng rỗng nếu lỗi
        } finally {
            setLoading(false);
        }
    }, [state.data.episode?.id]);

    useEffect(() => {
        if (state.data.episode?.id) {
            fetchComments(currentSort);
        }
    }, [fetchComments, state.data.episode?.id, currentSort]);

    const commentsWithReplies = useMemo(() => {
        const commentMap = new Map();
        const rootComments = [];
        if (Array.isArray(comments)) {
            comments.forEach(comment => {
                commentMap.set(comment.id, { ...comment, replies: Array.isArray(comment.replies) ? comment.replies : [] });
            });

            comments.forEach(comment => {
                if (comment.parentId === null) {
                    rootComments.push(commentMap.get(comment.id));
                }
            });
        }

        return rootComments;
    }, [comments]);

    // Hàm xử lý gửi bình luận
    const handleCommentSubmit = async (e) => {
        e.preventDefault();
        if (!currentUser) {
            toast.warn("Vui lòng đăng nhập để bình luận", {
                theme: document.documentElement.getAttribute("data-ww-theme") || "light",
                transition: Bounce
            });
            return;
        }

        const commentForm = e.target;
        if (!commentForm) return;

        const input = commentForm.querySelector("textarea");
        if (!input) return;
        const value = input.value.trim();
        if (!value) return;

        const commentId = commentForm.dataset.commentIndex ? parseInt(commentForm.dataset.commentIndex) : null;

        if (containsBannedWord(value)) {
            toast.warn("Nội dung không hợp lệ", {
                theme: document.documentElement.getAttribute("data-ww-theme") || "light",
                transition: Bounce
            });
            return;
        }

        const state = commentForm.getAttribute("state");

        if (state === "comment") {
            await submitNewComment(value);
        } else if (state === "edit" && commentId !== null && !isNaN(commentId)) {
            await editExistingComment(commentId, value, commentForm);
        }

        input.value = "";
        setContent("");
    };

    async function submitNewComment(value) {
        setSendCommentLoading(true);
        try {
            const response = await axios.post(`/api/episodes/${state.data.episode?.id}/comments`, {
                content: value,
                userId: currentUser.id
            }, { headers: authHeader() });
            setComments((prevComments) => [...prevComments, response.data]);
        } catch (error) {
            console.error("Lỗi khi gửi bình luận:", error);
        } finally {
            setSendCommentLoading(false);
        }
    }

    async function editExistingComment(commentId, value, commentForm) {
        const commentElement = document.querySelector(`[data-id="${commentId}"]`);
        if (!commentElement) {
            console.error("Không tìm thấy bình luận để chỉnh sửa");
            return;
        }

        await editCommentOrReply(commentId, null, value);

        const contentTextElement = commentElement.querySelector(".comment__content-text");
        if (contentTextElement) {
            contentTextElement.textContent = value;
        }

        commentForm.setAttribute("state", "comment");
        document.querySelector(".force-edit")?.classList.remove("force-edit");
    }

    const submitReply = async (e) => {
        e.preventDefault();
        const form = e.target;
        if (!form) return;

        const input = form.querySelector(".reply-form__input");
        if (!input) return;
        const value = input.value.trim();
        if (!value) return;

        const commentId = parseInt(form.dataset.commentIndex);
        if (isNaN(commentId)) return;

        if (containsBannedWord(value)) {
            toast.warn("Nội dung không hợp lệ", {
                theme: document.documentElement.getAttribute("data-ww-theme") || "light",
                transition: Bounce
            });
            return;
        }

        const state = form.getAttribute("state");
        const replyId = form.dataset.replyId ? parseInt(form.dataset.replyId) : null;
        const comment = comments.find(com => com.id === commentId);
        if (!comment) return;

        if (state === "reply") {
            await handleReplySubmit(comment, form, value);
        } else if (state === "edit" && replyId !== null) {
            await handleReplyEdit(comment, replyId, form, value);
        }
    };

    async function handleReplySubmit(comment, form, value) {
        const newReply = {
            content: value,
            replyingTo: form.dataset.commentAuthor || form.dataset.replyAuthor,
            userId: currentUser.id,
            parentId: comment.id,
        };

        try {
            const response = await axios.post(`/api/episodes/${state.data.episode?.id}/comments`, newReply, { headers: authHeader() });
            const savedReply = response.data;
            comment.replies.push(savedReply);

            updateUIAfterReply(comment, savedReply);
            form.querySelector(".reply-form__input").value = "";
        } catch (error) {
            console.error("Lỗi khi gửi reply:", error);
        }
    }

    async function handleReplyEdit(comment, replyId, form, value) {
        if (!replyId) return;

        const reply = comment.replies.find(rep => rep.id === replyId);
        if (!reply) {
            console.error("Không tìm thấy reply để chỉnh sửa");
            return;
        }

        reply.content = value;
        updateUIAfterEdit(replyId, reply);
        await editCommentOrReply(comment.id, replyId, reply.content);

        form.setAttribute("state", "reply");
        form.removeAttribute("data-reply-author");
        form.setAttribute("data-comment-author", comment.user.name);
        document.querySelector(".force-edit-reply")?.classList.remove("force-edit-reply");
    }

    function updateUIAfterReply(comment, savedReply) {
        const commentElement = document.querySelector(`[data-id="${comment.id}"]`);
        if (!commentElement) return;
        setComments((prevComments) => [...prevComments, savedReply]);

        updateRepliesCount(comment.id, comment.replies.filter(rep => !rep.is_hidden).length);
    }

    function updateUIAfterEdit(replyId, reply) {
        const replyElement = document.querySelector(`li[data-reply-id="${replyId}"]`);
        if (!replyElement) return;

        const contentTextElement = replyElement.querySelector("span.comment__content-text");
        contentTextElement.innerHTML = "";

        const mentionElement = document.createElement("a");
        mentionElement.className = "comment__mention";
        mentionElement.textContent = `@${reply.replyingTo}`;

        contentTextElement.appendChild(mentionElement);
        contentTextElement.appendChild(document.createTextNode(" " + reply.content));
    }

    function updateRepliesCount(commentId, count) {
        const repliesCountElement = document.querySelector(`[data-comment-index="${commentId}"] .comment__action--toggle-replies strong`);
        if (repliesCountElement) {
            repliesCountElement.textContent = `${count} phản hồi`;
        }
    }

    const replyComment = (e, commentId, commentAuthor) => {
        e.preventDefault();
        const btn = e.currentTarget;
        let liOfComment = btn.closest("li");
        scrollToReplyElement(liOfComment);
        let formOfComment = document.querySelector(`#formOfComment_${commentId} form`);
        if (formOfComment.hasAttribute("data-reply-author")) {
            formOfComment.removeAttribute("data-reply-author");
            formOfComment.removeAttribute("data-reply-id");
            formOfComment.setAttribute("data-comment-author", commentAuthor);
        }
        if (!formOfComment.hasAttribute("data-comment-author")) {
            formOfComment.setAttribute("data-comment-author", commentAuthor);
        }
    }

    const replyToReply = (e, commentId, replyId, replyAuthor) => {
        e.preventDefault();
        let liOfComment = document.querySelector(`[data-id="${commentId}"]`);
        scrollToReplyElement(liOfComment);
        let formOfComment = document.querySelector(`#formOfComment_${commentId} form`);
        if (formOfComment.hasAttribute("data-comment-author")) {
            formOfComment.removeAttribute("data-comment-author");
        }
        if (!formOfComment.hasAttribute("data-reply-author")) {
            formOfComment.setAttribute("data-reply-author", replyAuthor);
            formOfComment.setAttribute("data-reply-id", replyId);
        } else {
            formOfComment.setAttribute("data-reply-author", replyAuthor);
            formOfComment.setAttribute("data-reply-id", replyId);
        }
        formOfComment.setAttribute("state", "reply");
    }

    function scrollToReplyElement(element) {
        if (!element.classList.contains("reply-status")) {
            element.classList.add("reply-status");
        }
        let formOfComment = document.querySelector(`#formOfComment_${element.dataset.id}`);
        formOfComment.querySelector(".reply-form__input").focus();
        commentsWrapperRef.current.scroll({
            top: formOfComment.offsetTop - commentsWrapperRef.current.offsetTop,
            behavior: "smooth"
        });
    }

    function handleDeleteComment(commentIndex) {
        const comment = document.querySelector(`[data-id="${commentIndex}"]`);
        if (!comment) return;
        confirmDelete({ type: 'comment', id: commentIndex });
    };

    function handleEditComment(e, commentIndex) {
        const clickedElement = e.currentTarget;
        const commentForm = document.querySelector(".comment-send__textarea");
        if (!commentForm) return;

        document.querySelectorAll(".force-edit").forEach((btn) => btn.classList.remove("force-edit"));

        clickedElement.classList.toggle("force-edit");

        const comment = document.querySelector(`[data-id="${commentIndex}"]`);
        if (!comment) return;

        const textarea = commentForm.querySelector("textarea");
        if (!textarea) return;

        if (clickedElement.classList.contains("force-edit")) {
            const text = comment.querySelector("span.comment__content-text")?.textContent.trim();

            if (text === "") return; // Bảo vệ dữ liệu đầu vào, không chỉnh sửa nếu nội dung rỗng
            commentForm.setAttribute("state", "edit");
            commentForm.dataset.commentIndex = commentIndex;
            textarea.value = text;
            textarea.focus();
        } else {
            commentForm.setAttribute("state", "reply");
            delete commentForm.dataset.commentIndex;
            const textarea = commentForm.querySelector("textarea");
            if (textarea) {
                textarea.value = "";
                textarea.focus();
            }
        }
    };

    function handleDeleteReply(commentIndex, replyId) {
        const reply = document.querySelector(`[data-reply-id="${replyId}"]`);
        if (!reply) return;
        console.log(commentIndex)
        confirmDelete({ type: 'reply', id: replyId, parentId: commentIndex });
    };

    function handleEditReply(e, commentIndex, replyId) {
        e.preventDefault();
        const clickedElement = e.currentTarget;
        const replyForm = document.querySelector(`#formOfComment_${commentIndex} form`);
        if (!replyForm) return;

        const comment = comments.find(com => com.id === parseInt(commentIndex));
        if (!comment) return;

        const reply = comment.replies.find(rep => rep.id === parseInt(replyId));
        if (!reply) return;

        const input = replyForm.querySelector(".reply-form__input");
        if (!input) return;

        const liOfComment = clickedElement.closest("ul").closest("li");

        if (!clickedElement.classList.contains("force-edit-reply")) {
            document.querySelectorAll(".force-edit-reply").forEach((btn) => {
                btn.classList.remove("force-edit-reply");
            });
            clickedElement.classList.add("force-edit-reply");

            scrollToReplyElement(liOfComment);
            let contentText = reply.content;
            if (reply.replyingTo) {
                contentText = contentText.replace(`@${reply.replyingTo}`, "");
            }

            if (contentText === "") return;

            replyForm.setAttribute("state", "edit");
            replyForm.setAttribute("data-reply-id", replyId);
            replyForm.setAttribute("data-reply-author", currentUser.name);
            input.value = contentText;
            input.focus();
            console.log(" Reply is being edited");

            if (replyForm.hasAttribute("data-comment-author")) {
                replyForm.removeAttribute("data-comment-author");
            }
        } else {
            clickedElement.classList.remove("force-edit-reply");

            replyForm.setAttribute("state", "reply");
            replyForm.removeAttribute("data-reply-id");
            const comment = comments.find(com => com.id === parseInt(commentIndex));
            replyForm.setAttribute("data-comment-author", comment.user.name);
            const input = replyForm.querySelector(".reply-form__input");
            input.value = "";
            input.focus();
            if (replyForm.hasAttribute("data-reply-author")) {
                replyForm.removeAttribute("data-reply-author");
            }
        }
    };

    const editCommentOrReply = useCallback(async (commentId, replyId, content) => {
        try {
            let url = `/api/episodes/${state.data.episode?.id}/comments/${commentId}`;
            if (replyId) {
                url += `/replies/${replyId}`;
            }
            await axios.put(url, {
                content,
                userId: currentUser?.id,
            }, { headers: authHeader() });
            // Cập nhật nội dung bình luận hoặc phản hồi trong state
            if (replyId) {
                setComments((prevComments) => {
                    const newComments = [...prevComments];
                    const comment = newComments.find((comment) => comment.id === commentId);
                    const reply = comment.replies.find((reply) => reply.id === replyId);
                    reply.content = content;
                    return newComments;
                });
            } else {
                setComments((prevComments) => {
                    const newComments = [...prevComments];
                    const foundComment = newComments.find((comment) => comment.id === parseInt(commentId));

                    if (!foundComment) {
                        console.error(`Comment with ID ${commentId} not found in`, newComments);
                        return prevComments;
                    }
                    foundComment.content = content;
                    return newComments;
                });

            }
            setContent("");
        } catch (error) {
            console.error("Lỗi chỉnh sửa bình luận hoặc phản hồi:", error);
        }
    }, [currentUser?.id, state.data.episode?.id]);

    const confirmDelete = (itemToDelete) => {
        const popup = document.querySelector(".confirm-delete-popup");
        if (!popup) return;

        popup.classList.add("show");

        // const handlePopupClick = (e) => {
        //     e.preventDefault();
        //     if (e.target.classList.contains("confirm-delete-popup__yes")) {
        //         // Gọi hàm xóa tương ứng
        //         if (itemToDelete.type === 'comment') {
        //             deleteCommentAPI(itemToDelete.id); // Gọi hàm gọi API xóa comment gốc
        //         } else if (itemToDelete.type === 'reply') {
        //             deleteCommentAPI(itemToDelete.id, itemToDelete.parentId); // Gọi hàm gọi API xóa reply
        //         }
        //         popup.classList.remove("show");
        //     } else if (e.target.classList.contains("confirm-delete-popup__no")) {
        //         popup.classList.remove("show");
        //     }
        //     // Gỡ listener sau khi xử lý
        //     popup.removeEventListener("click", handlePopupClick);
        //     // Gỡ cả listener trên nút yes/no nếu bạn thêm riêng
        //     const yesButton = popup.querySelector(".confirm-delete-popup__yes");
        //     const noButton = popup.querySelector(".confirm-delete-popup__no");
        //     yesButton?.removeEventListener('click', handleYesClick);
        //     noButton?.removeEventListener('click', handleNoClick);
        // };

        // Thêm listener vào container để bắt sự kiện nổi bọt từ nút
        // popup.addEventListener("click", handlePopupClick);

        // Hoặc thêm trực tiếp vào nút (cần cleanup cẩn thận hơn)
        const yesButton = popup.querySelector(".confirm-delete-popup__yes");
        const noButton = popup.querySelector(".confirm-delete-popup__no");

        const handleYesClick = () => {
            if (itemToDelete.type === 'comment') deleteCommentAPI(itemToDelete.id);
            else if (itemToDelete.type === 'reply') deleteCommentAPI(itemToDelete.id, itemToDelete.parentId);
            cleanup();
        };
        const handleNoClick = () => cleanup();
        const cleanup = () => {
            popup.classList.remove("show");
            yesButton?.removeEventListener('click', handleYesClick);
            noButton?.removeEventListener('click', handleNoClick);
            // popup.removeEventListener("click", handlePopupClick); // Cũng gỡ listener container
        };

        yesButton?.addEventListener('click', handleYesClick);
        noButton?.addEventListener('click', handleNoClick);
    }
    const deleteCommentAPI = useCallback(async (commentOrReplyId, commentIndex = null) => {
        console.log("commentOrReplyId", commentOrReplyId);
        try {
            await axios.delete(`/api/episodes/${state.data.episode?.id}/comments/${commentOrReplyId}`, {
                data: { userId: currentUser?.id },
                headers: authHeader()
            });
            if (commentIndex) {
                const comment = comments.find(com => com.id === parseInt(commentIndex));
                console.log("comment", comment);
                comment.replies = comment.replies.filter(rep => rep.id !== parseInt(commentOrReplyId));
                setComments(prevComments => {
                    const newComments = prevComments.map(c => {
                        if (c.id === comment.id) {
                            return { ...c, replies: comment.replies };
                        }
                        return c;
                    });
                    return newComments;
                });
                setComments(prevComments => prevComments.filter(item => item.id !== parseInt(commentOrReplyId)));
            } else {
                setComments(prevComments => prevComments.filter(item => item.id !== parseInt(commentOrReplyId)));
            }
            toast.success("Đã xóa bình luận/phản hồi.", {
                theme: document.documentElement.getAttribute("data-ww-theme") || "light",
                transition: Bounce
            });

        } catch (error) {
            console.error("Lỗi khi xóa:", error);
            toast.error("Xóa thất bại. Vui lòng thử lại.", {
                theme: document.documentElement.getAttribute("data-ww-theme") || "light",
                transition: Bounce
            });
        }
    }, [state.data.episode?.id, currentUser?.id, comments]);

    const rerenderModalConfirmDelete = () => {
        return (
            <div className="confirm-delete-popup">
                <div className="confirm-delete-popup__container">
                    <div className="confirm-delete-popup__content">
                        <h2>Confirm Delete</h2>
                        <p>Are you sure you want to delete this comment?</p>

                    </div>
                    <div className="confirm-delete-popup__footer">
                        <button className="confirm-delete-popup__no">Hủy</button>
                        <button className="confirm-delete-popup__yes">Đồng ý</button>
                    </div>
                </div>

            </div>
        );
    };

    const handleSendFriendRequest = (userId) => {
        dispatch(sendFriendRequest(userId))
            .unwrap()
            .then(() => {
                setSentFriendRequests((prev) => [...prev, userId]);
                toast.info("Đã gửi lời mời kết bạn", {
                    theme: document.documentElement.getAttribute("data-ww-theme") || "light",
                    transition: Bounce,
                });
            }).catch((error) => {
                toast.error(error.message || "Gửi lời mời thất bại", {
                    theme: document.documentElement.getAttribute("data-ww-theme") || "light",
                    transition: Bounce,
                });
                console.error("Cancel friend request error:", error);
            });
    };

    const handleCancelFriendRequest = (userId) => {
        dispatch(cancelFriendRequest(userId)).unwrap()
            .then(() => {
                setSentFriendRequests((prev) => prev.filter((id) => id !== userId));
                toast.info("Đã hủy lời mời kết bạn", {
                    theme: document.documentElement.getAttribute("data-ww-theme") || "light",
                    transition: Bounce,
                });
            }).catch((error) => {
                toast.error(error.message || "Hủy lời mời thất bại", {
                    theme: document.documentElement.getAttribute("data-ww-theme") || "light",
                    transition: Bounce,
                });
                console.error("Cancel friend request error:", error);
            });
    };

    useEffect(() => {
        if (currentUser) {
            dispatch(getFriends(currentUser.id))
                .unwrap()
                .then((data) => {
                    setFriends(data?.friends?.map(friend => friend.id) || []);
                    setSentFriendRequests(data?.sentFriendRequests?.map(request => request.id) || []);
                })
                .catch(error => console.error("Error fetching friends list:", error));
        } else {
            setFriends([]);
            setSentFriendRequests([]);
        }
    }, [currentUser, dispatch]);

    const handleSortChange = (sortType) => {
        if (sortType !== currentSort) {
            setCurrentSort(sortType);
            setIsSortDropdownOpen(false);
        } else {
            setIsSortDropdownOpen(false);
        }
    };
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (sortDropdownRef.current && !sortDropdownRef.current.contains(event.target)) {
                setIsSortDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const toggleRepliesBtn = (e, commentId) => {
        e.preventDefault();
        const btn = e.currentTarget;
        const commentElement = document.querySelector(`[data-id="${commentId}"]`);
        if (!commentElement) return;
        const commentChildsList = commentElement.querySelector(".comment-childs");
        if (commentChildsList) {
            const isHidden = commentChildsList.classList.toggle("hidden");
            const icon = btn.querySelector("i");
            if (icon) {
                icon.classList.toggle("fa-caret-down", isHidden);
                icon.classList.toggle("fa-caret-up", !isHidden);
            }
        }
    }
    const handleLikeClick = useCallback(async (commentId) => {
        if (!currentUser) {
            toast.info("Vui lòng đăng nhập để thích bình luận.", {
                theme: document.documentElement.getAttribute("data-ww-theme") || "light",
                transition: Bounce
            });
            return;
        }
        if (likeLoading[commentId]) return; // Ngăn chặn click liên tục

        // --- Optimistic Update ---
        setLikeLoading(prev => ({ ...prev, [commentId]: true }));
        setComments(prevComments => {
            return prevComments.map(c => {
                // Xử lý comment gốc
                if (c.id === commentId) {
                    const currentLikes = Array.isArray(c.likes) ? c.likes : [];
                    const userIndex = currentLikes.indexOf(currentUser.id);
                    let newLikes;
                    if (userIndex > -1) { // Đã like -> unlike
                        newLikes = currentLikes.filter(id => id !== currentUser.id);
                    } else { // Chưa like -> like
                        newLikes = [...currentLikes, currentUser.id];
                    }
                    return { ...c, likes: newLikes };
                }
                // Xử lý replies của comment gốc
                if (Array.isArray(c.replies)) {
                    return {
                        ...c,
                        replies: c.replies.map(r => {
                            if (r.id === commentId) { // Nếu commentId là của reply
                                const currentReplyLikes = Array.isArray(r.likes) ? r.likes : [];
                                const userReplyIndex = currentReplyLikes.indexOf(currentUser.id);
                                let newReplyLikes;
                                if (userReplyIndex > -1) {
                                    newReplyLikes = currentReplyLikes.filter(id => id !== currentUser.id);
                                } else {
                                    newReplyLikes = [...currentReplyLikes, currentUser.id];
                                }
                                return { ...r, likes: newReplyLikes };
                            }
                            return r;
                        })
                    };
                }
                return c;
            });
        });
        // ------------------------

        try {
            // Gọi API backend
            const response = await axios.post(`/api/comments/${commentId}/like`, {}, { headers: authHeader() });

            // --- Cập nhật state với dữ liệu chính xác từ server (tùy chọn, nếu cần) ---
            // Thường thì optimistic update là đủ, nhưng nếu API trả về count/status chính xác thì nên cập nhật lại
            // setComments(prevComments => prevComments.map(c => {
            //     if (c.id === commentId) {
            //         return { ...c, likes: Array.isArray(response.data.likes) ? response.data.likes : [], isLikedByCurrentUser: response.data.isLiked };
            //     }
            //     // Tương tự cho replies nếu API trả về cả replies đã update
            //     return c;
            // }));
            // ----------------------------------------------------------------------

        } catch (error) {
            console.error("Lỗi khi like/unlike:", error);
            toast.error("Đã có lỗi xảy ra khi thích bình luận.", {
                theme: document.documentElement.getAttribute("data-ww-theme") || "light",
                transition: Bounce
            });
            // --- Rollback Optimistic Update ---
            setComments(prevComments => {
                // Tìm comment/reply gốc trước khi rollback
                let originalLikes = null;
                const findOriginalLikes = (items) => {
                    for (const item of items) {
                        if (item.id === commentId) {
                            originalLikes = Array.isArray(item.likes) ? item.likes : [];
                            const userIndex = originalLikes.indexOf(currentUser.id);
                            if (userIndex > -1) originalLikes.push(currentUser.id); // Rollback like
                            else originalLikes = originalLikes.filter(id => id !== currentUser.id); // Rollback unlike
                            return true;
                        }
                        if (item.replies && findOriginalLikes(item.replies)) return true;
                    }
                    return false;
                }
                findOriginalLikes(prevComments); // Tìm và lấy lại mảng likes gốc trước khi thay đổi

                // Map lại để rollback
                return prevComments.map(c => {
                    if (c.id === commentId) {
                        const currentLikes = Array.isArray(c.likes) ? c.likes : [];
                        const userIndex = currentLikes.indexOf(currentUser.id);
                        let revertedLikes;
                        if (userIndex > -1) { // Nếu đang là liked (do optimistic) -> rollback thành unlike
                            revertedLikes = currentLikes.filter(id => id !== currentUser.id);
                        } else { // Nếu đang là unliked (do optimistic) -> rollback thành like
                            revertedLikes = [...currentLikes, currentUser.id];
                        }
                        return { ...c, likes: revertedLikes };
                    }
                    if (Array.isArray(c.replies)) {
                        return {
                            ...c,
                            replies: c.replies.map(r => {
                                if (r.id === commentId) {
                                    const currentReplyLikes = Array.isArray(r.likes) ? r.likes : [];
                                    const userReplyIndex = currentReplyLikes.indexOf(currentUser.id);
                                    let revertedReplyLikes;
                                    if (userReplyIndex > -1) {
                                        revertedReplyLikes = currentReplyLikes.filter(id => id !== currentUser.id);
                                    } else {
                                        revertedReplyLikes = [...currentReplyLikes, currentUser.id];
                                    }
                                    return { ...r, likes: revertedReplyLikes };
                                }
                                return r;
                            })
                        };
                    }
                    return c;
                });
            });
            // ---------------------------------
        } finally {
            setLikeLoading(prev => ({ ...prev, [commentId]: false }));
        }
    }, [currentUser, likeLoading]);
    // -----------------------------

    // Hàm kiểm tra user hiện tại đã like comment/reply chưa
    const isLikedByCurrentUser = useCallback((likesArray) => {
        if (!currentUser || !Array.isArray(likesArray)) {
            return false;
        }
        return likesArray.includes(currentUser.id);
    }, [currentUser]);
    return (
        <div className="video-play__comments">
            <section className="comment-section">
                <div className="comment-section__send">
                    <div className="comment-send" style={{ '--def34f72': '3', '--f927034e': '3' }}>
                        <img className="comment-send__avatar" src={getAvatarUrl()} alt={currentUser ? currentUser.name : 'Use Avatar'} />
                        <form onSubmit={handleCommentSubmit} className="comment-send__textarea" state="comment">
                            <div className="comment-send__textarea__inner" data-message="">
                                <textarea maxLength="1500" rows="1" placeholder="Để lại bình luận thân thiện(°▽°)~"
                                    value={content}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        if (value !== undefined) {
                                            setContent(value);
                                        }
                                    }}
                                ></textarea>
                            </div>
                            <button type="submit" className={`comment-send__btn ${content ? '' : 'comment-send__btn--disable'}`} disabled={!content} >
                                <i className="comment-send__btn--loading" style={sendCommentLoading ? { display: 'block' } : { display: 'none' }}></i>
                                <span >Gửi</span>
                            </button>
                        </form>
                    </div>
                </div>
                {!currentUser && <p className="text-center text-muted">Vui lòng <a href="/login">đăng nhập</a> để bình luận.</p>}
                {/* --- Phần Header của Comments (Thêm bộ lọc/sắp xếp) --- */}
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
                        <ul className={`dropdown-menu dropdown-menu-end shadow-sm ${isSortDropdownOpen ? 'show' : ''}`}>
                            <li><button className={`dropdown-item ${currentSort === 'newest' ? 'active' : ''}`} onClick={() => handleSortChange('newest')}>Mới nhất</button></li>
                            <li><button className={`dropdown-item ${currentSort === 'mostLiked' ? 'active' : ''}`} onClick={() => handleSortChange('mostLiked')}>Nhiều like nhất</button></li>
                        </ul>
                    </div>
                </div>
                <ul
                    ref={commentsWrapperRef}
                    className="main-comments flexcol"
                >
                    {loading ? (
                        <div id="container-loader">
                            <div className="loader-box" id="loader1"></div>
                            <div className="loader-box" id="loader2"></div>
                            <div className="loader-box" id="loader3"></div>
                            <div className="loader-box" id="loader4"></div>
                            <div className="loader-box" id="loader5"></div>
                        </div>
                    ) : commentsWithReplies.length > 0 ? commentsWithReplies.map((comment, index) => {
                        const isCommentLiked = isLikedByCurrentUser(comment.likes);
                        const commentLikeCount = comment.likes?.length || 0;
                        return (
                            <li
                                key={index}
                                className={classNames("comment", { "current-user": comment.user.id === currentUser?.id })}
                                data-id={comment.id}
                            >
                                <div className="comment__wrapper">
                                    <div className="comment__avatar">
                                        <img src={comment.user?.avatar || `https://ui-avatars.com/api/?name=${comment.user?.name?.split(' ').map(word => word[0]).join('').toUpperCase()}&background=20c997&color=fff`} alt="Avatar" />
                                    </div>
                                    <div className="comment__body">
                                        <div className="comment__header justify-content-between">
                                            <div className="comment__user">
                                                <strong className="comment__user-name">{comment.user.name}</strong>
                                                {currentUser && (comment.user.name === currentUser.name) ? <span className='comment__user-badge'>Bạn</span> : ""}
                                                <p className="comment__timestamp">{new Date(comment.createdAt).toLocaleString('vi-VN')}</p>
                                            </div>
                                            <div className="comment__actions" data-comment-index={comment.id}>
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
                                            <span className="comment__content-text">{comment.content}</span>
                                        </div>
                                        <div className="comment__actions" data-comment-index={comment.id}>
                                            <span
                                                className={classNames("comment__action comment__action--like", { 'active': isCommentLiked, 'disabled': likeLoading[comment.id] })}
                                                onClick={() => handleLikeClick(comment.id)}
                                                role="button"
                                            >
                                                <span className="comment__action-icon">
                                                    <i className={classNames("fa-thumbs-up", isCommentLiked ? "fa-solid" : "fa-regular")}></i> {/* Thay đổi icon solid/regular */}
                                                </span>
                                                <strong>Thích ({commentLikeCount})</strong> {/* Hiển thị count */}
                                            </span>
                                            {comment.replies && comment.replies.length > 0 ? (
                                                <span
                                                    className="comment__action comment__action--toggle-replies"
                                                    onClick={(e) => toggleRepliesBtn(e, comment.id)}
                                                    role="button"
                                                >
                                                    <span className="comment__action-icon"><i className="fa-solid fa-caret-down"></i></span>
                                                    <strong>{comment.replies.length} phản hồi</strong>
                                                </span>
                                            ) : null}
                                            {currentUser && (
                                                comment.user?.id === currentUser.id ? (
                                                    <>
                                                        <span className="comment__action comment__action--edit edit" onClick={(e) => handleEditComment(e, comment.id)} role="button">
                                                            <span className="comment__action-icon"><i className="fa-regular fa-pen-to-square"></i></span>
                                                            <strong>Sửa</strong>
                                                        </span>
                                                        <span className="comment__action comment__action--delete delete" onClick={() => handleDeleteComment(comment.id)} role="button">
                                                            <span className="comment__action-icon"><i className="fa-regular fa-trash-xmark"></i></span>
                                                            <strong>Xóa</strong>
                                                        </span>
                                                    </>
                                                ) : (
                                                    <a href={`#formOfComment_${comment.id}`} className="comment__action comment__action--reply" onClick={(e) => replyComment(e, comment.id, comment.user?.name)} role="button">
                                                        <span className="comment__action-icon"><i className="fa-regular fa-reply"></i></span>
                                                        <strong>Phản hồi</strong>
                                                    </a>
                                                )
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {currentUser && (
                                    <div className="reply-form" id={`formOfComment_${comment.id}`}>
                                        <div className="comment__avatar"><img src={getAvatarUrl()} alt="Your Avatar" /></div>
                                        <form onSubmit={submitReply} className="reply-form__form" data-comment-index={comment.id} state="reply">
                                            <input name="replyContent" className="reply-form__input" placeholder={`Trả lời ${comment.user?.name}...`} />
                                            <button type="submit" className="reply-form__button" ><i className="fa-regular fa-paper-plane-top"></i></button>
                                        </form>
                                    </div>
                                )}
                                {comment.replies && comment.replies.length > 0 && (
                                    <ul className="comment-childs hidden">
                                        {comment.replies.map((reply) => {
                                            const isReplyLiked = isLikedByCurrentUser(reply.likes);
                                            const replyLikeCount = reply.likes?.length || 0;
                                            return (
                                                <li
                                                    key={reply.id}
                                                    className={classNames("comment comment-reply", { "current-user": reply.user?.id === currentUser?.id })}
                                                    data-reply-id={reply.id}
                                                >
                                                    <div className="comment__wrapper">
                                                        <div className="comment__avatar">
                                                            <img src={reply.user?.avatar || `https://ui-avatars.com/api/?name=${reply.user?.name?.split(' ').map(word => word[0]).join('').toUpperCase()}&background=20c997&color=fff`} alt="Avatar" />
                                                        </div>
                                                        <div className="comment__body">
                                                            <div className="comment__header">
                                                                <div className="comment__user">
                                                                    <strong className="comment__user-name">{reply.user.name}</strong>
                                                                    {currentUser && (reply.user?.id === currentUser.id) ? <span className='comment__user-badge'>Bạn</span> : ""}
                                                                </div>
                                                                <p className="comment__timestamp">{new Date(reply.createdAt).toLocaleString('vi-VN')}</p>
                                                            </div>
                                                            <div className="comment__content">
                                                                <span className="comment__content-text">
                                                                    {reply.replyingTo && <a href="#/" className="comment__mention">@{reply.replyingTo}</a>}
                                                                    {' '}{reply.content} {/* Thêm khoảng trắng */}
                                                                </span>
                                                            </div>
                                                            <div className="comment__actions">
                                                                <span
                                                                    className={classNames("comment__action comment__action--like", { 'active': isReplyLiked, 'disabled': likeLoading[reply.id] })}
                                                                    onClick={() => handleLikeClick(reply.id)}
                                                                    role="button"
                                                                >
                                                                    <span className="comment__action-icon">
                                                                        <i className={classNames("fa-thumbs-up", isReplyLiked ? "fa-solid" : "fa-regular")}></i>
                                                                    </span>
                                                                    <strong>Thích ({replyLikeCount})</strong>
                                                                </span>
                                                                {currentUser && (
                                                                    reply.user?.id === currentUser.id ? (
                                                                        <>
                                                                            <span className="comment__action comment__action--edit edit-reply" onClick={(e) => handleEditReply(e, comment.id, reply.id)} role="button">
                                                                                <span className="comment__action-icon"><i className="fa-regular fa-pen-to-square"></i></span>
                                                                                <strong>Sửa</strong>
                                                                            </span>
                                                                            <span className="comment__action comment__action--delete delete-reply" onClick={() => handleDeleteReply(comment.id, reply.id)} role="button">
                                                                                <span className="comment__action-icon"><i className="fa-regular fa-trash-xmark"></i></span>
                                                                                <strong>Xóa</strong>
                                                                            </span>
                                                                        </>
                                                                    ) : (
                                                                        <a href={`#formOfComment_${comment.id}`} className="comment__action comment__action--reply-to-reply" onClick={(e) => replyToReply(e, comment.id, reply.id, reply.user?.name)} role="button">
                                                                            <span className="comment__action-icon"><i className="fa-regular fa-reply"></i></span>
                                                                            <strong>Phản hồi</strong>
                                                                        </a>
                                                                    )
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
            {rerenderModalConfirmDelete()}
        </div>
    )
})

export default VideoPlayComments;