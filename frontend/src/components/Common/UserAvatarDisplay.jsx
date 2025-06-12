import classNames from '@utils/classNames';
import { getAvatarUrl } from '@utils/getAvatarUrl';
import { useMemo } from 'react';

function parseAvatarFrame(activeFrameUrl) {
    const match = activeFrameUrl?.match(/^assets\/icons\/frames\/(\d{1,2})\.png$/);
    if (match) {
        const rankNum = parseInt(match[1], 10);
        if (rankNum >= 1 && rankNum <= 13) {
            return { isRankFrame: true, rankClass: 'rank-1-13' };
        }
    }
    return { isRankFrame: false, rankClass: '' };
}
const getSpecialFrameClass = (activeFrameUrl) => {
    if (!activeFrameUrl) return "";
    if (activeFrameUrl === "assets/icons/frames/admin.png") return "isFrameAdmin";
    if (activeFrameUrl === "assets/icons/frames/editor.png") return "isFrameEditor";
    return "";
};
const UserAvatarDisplay = ({ userToDisplay, size = "80", className }) => {
    const { isRankFrame, rankClass } = parseAvatarFrame(userToDisplay?.activeAvatarFrame);

    let activeFrameUrl = null;
    if (userToDisplay && userToDisplay.activeAvatarFrame) {
        activeFrameUrl = userToDisplay.activeAvatarFrame;
    }
        const specialFrameClass = getSpecialFrameClass(activeFrameUrl);

    // Kích thước của khung có thể lớn hơn avatar một chút để tạo hiệu ứng đẹp
    const framePadding = Math.max(2, Math.round(parseInt(size) * 0.25));
    const frameSizeStyle = useMemo(() => ({
        width: `${parseInt(size) + framePadding * 2}px`,
        height: `${parseInt(size) + framePadding * 2}px`,
    }), [size, framePadding]);

    return (
        <div
            className={classNames("user-avatar-container", className, rankClass, specialFrameClass)}
            style={frameSizeStyle}
        >
            <img
                src={getAvatarUrl(userToDisplay)}
                alt={userToDisplay?.name || 'Avatar'}
                className="user-avatar-image"
                style={{ width: `${size}px`, height: `${size}px`, objectFit: 'cover', display: 'block', borderRadius: '50%', zIndex: 0 }}
                loading="lazy"
            />
            {activeFrameUrl && (
                <img
                    src={`${process.env.REACT_APP_API_URL}/${activeFrameUrl}`}
                    alt="Avatar Frame"
                    className={classNames("user-avatar-frame", rankClass)}
                />
            )}
        </div>
    );
};

export default UserAvatarDisplay;