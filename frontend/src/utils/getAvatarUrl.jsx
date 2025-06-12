export const getAvatarUrl = (user) => {
    if (!user) return "https://ui-avatars.com/api/?name=?&background=20c997&color=fff&size=40";
    return user.avatar || `https://ui-avatars.com/api/?name=${user.name?.split(' ').map(word => word[0]).join('').toUpperCase()}&background=20c997&color=fff&size=40`;
};

export const getImageUrl = (url) => `${process.env.REACT_APP_API_URL_IMAGE}/${url}`;