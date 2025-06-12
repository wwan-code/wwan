const FriendModal = ({ friend, onClose }) => {
    return (
        <div className="fixed inset-0 flex items-center justify-center z-50">
            <div className="bg-white p-4 rounded-lg shadow-lg">
                <h2 className="text-lg font-semibold mb-2">Thông tin người dùng</h2>
                <div className="flex items-center mb-4">
                    <img src={friend.avatar} alt={friend.name} className="w-16 h-16 rounded-full me-4" />
                    <div>
                        <h3 className="text-md font-semibold">{friend.name}</h3>
                        <p className="text-sm text-gray-600">{friend.email}</p>
                    </div>
                </div>
                <div className="flex justify-end">
                    <button
                        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                        onClick={onClose}
                    >
                        Đóng
                    </button>
                </div>
            </div>
        </div>
    );
}

export default FriendModal;