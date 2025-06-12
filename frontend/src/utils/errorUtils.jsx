import { toast } from "react-toastify";

const formatMessage = (message, fallback) => {
    return typeof message === "string" && message.trim() !== "" ? message : fallback;
};

const showSuccessToast = (message, options = {}) => {
    const finalMessage = formatMessage(message, "Thao tác thành công!");
    toast.success(finalMessage, options);
};

const showInfoToast = (message, options = {}) => {
    const finalMessage = formatMessage(message, "Thông tin cập nhật thành công!");
    toast.info(finalMessage, options);
};

const showWarningToast = (message, options = {}) => {
    const finalMessage = formatMessage(message, "Thông báo!");
    toast.warn(finalMessage, options);
};

const showErrorToast = (error, operation = "thực hiện", options = {}) => {
    let message = `Thao tác ${operation} thất bại. Vui lòng thử lại.`;

    if (error?.response?.data?.message) {
        message = error.response.data.message;
    } else if (error?.message) {
        message = error.message;
    }

    if (error) {
        console.error(`❌ Failed to ${operation}:`, error);
    }

    toast.error(message, {
        autoClose: 4000,
        ...options,
    });
};

export {
    showSuccessToast,
    showInfoToast,
    showWarningToast,
    showErrorToast,
};
