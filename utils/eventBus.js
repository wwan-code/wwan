const eventBus = {
    on(event, callback) {
        const handler = (e) => callback(e.detail);
        document.addEventListener(event, handler);
        // Trả về một hàm để loại bỏ sự kiện
        return () => document.removeEventListener(event, handler);
    },
    dispatch(event, data) {
        document.dispatchEvent(new CustomEvent(event, { detail: data }));
    },
    remove(event, callback) {
        // Sử dụng hàm trả về từ on để loại bỏ sự kiện
        const handler = (e) => callback(e.detail);
        document.removeEventListener(event, handler);
    },
};

export default eventBus;
