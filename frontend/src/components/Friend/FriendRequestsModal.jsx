
import { useCallback, useEffect, useState } from 'react';
import { Modal } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import { acceptFriendRequest, getFriends, rejectFriendRequest } from '@features/friendSlice';


const FriendRequestsModal = ({ isOpen, onClose }) => {
    const [friendRequests, setFriendRequests] = useState([]);
    const [sentFriendRequests, setSentFriendRequests] = useState([]);
    const [friends, setFriends] = useState([]);

    const [loadingFriends, setLoadingFriends] = useState(true);

    const { user: currentUser } = useSelector((state) => state.user);

    const dispatch = useDispatch();
    useEffect(() => {
        if (isOpen) {
            dispatch(getFriends(currentUser.id))
                .unwrap()
                .then((response) => {
                    setFriends(response?.friends || []);
                    setFriendRequests(response?.friendRequests || []);
                    setSentFriendRequests(response?.sentFriendRequests || []);
                })
                .catch((error) => console.log("Error fetching friends list:", error))
                .finally(() => setLoadingFriends(false));
        }
    }, [isOpen, currentUser, dispatch]);

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

            optimisticUpdate();

            try {
                await dispatch(actionCreator(payload)).unwrap();
            } catch (error) {
                rollbackUpdate(originalState);
            }
        },
        [dispatch, friends, friendRequests, sentFriendRequests]
    );

    const handleAcceptRequest = (requesterId) => {
        handleFriendAction(
            acceptFriendRequest,
            requesterId,
            () => {
                const requesterInfo = friendRequests.find(
                    (req) => req.id === requesterId
                );
                if (requesterInfo) {
                    setFriends((prev) => [...prev, requesterInfo]);
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

    const handleRejectRequest = (requesterId) => {
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
    return (
        <Modal show={isOpen} onHide={onClose} size="md" centered>
            <Modal.Header closeButton>
                <Modal.Title>Friend Requests</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {loadingFriends ? (
                    <div className="text-center">
                        <div className="spinner-border" role="status">
                            <span className="sr-only">Loading...</span>
                        </div>
                    </div>
                ) : (
                    friendRequests.length === 0 ? (
                        <div className="text-center">
                            <p>No friend requests available.</p>
                        </div>
                    ) : (
                        friendRequests.map((request) => (
                            <div key={request.id} className="d-flex justify-content-between align-items-center mb-3">
                                <div>
                                    <strong>{request.name}</strong> sent you a friend request.
                                </div>
                                <div>
                                    <button className="btn btn-success btn-sm me-2" onClick={() => handleAcceptRequest(request.id)}>Accept</button>
                                    <button className="btn btn-danger btn-sm" onClick={() => handleRejectRequest(request.id)}>Reject</button>
                                </div>
                            </div>
                        ))
                    )
                )}
            </Modal.Body>
        </Modal>
    );
}

export default FriendRequestsModal;