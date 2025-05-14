// utils/slugUtils.js
export const generateSlug = (text) => {
    if (!text) return `item-${Date.now()}`; // Trả về slug mặc định nếu text rỗng
    return text
        .toString()
        .toLowerCase()
        .normalize('NFD') // Chuẩn hóa Unicode (tách dấu)
        .replace(/[\u0300-\u036f]/g, '') // Loại bỏ dấu
        .replace(/[đĐ]/g, 'd') // Xử lý chữ 'đ'
        .replace(/\s+/g, '-') // Thay khoảng trắng bằng -
        .replace(/[^\w-]+/g, '') // Loại bỏ ký tự đặc biệt (giữ lại chữ, số, _, -)
        .replace(/--+/g, '-') // Thay nhiều -- bằng một -
        .replace(/^-+/, '') // Bỏ - ở đầu
        .replace(/-+$/, ''); // Bỏ - ở cuối
};