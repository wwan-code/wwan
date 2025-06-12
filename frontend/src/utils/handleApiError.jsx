import { toast } from "react-toastify";

export const handleApiError = (error, operation = "thực hiện") => {
    console.error(`Failed to ${operation}:`, error);
    let message = `Thao tác ${operation} thất bại. Vui lòng thử lagi.`;
    if (error.response?.data?.message) {
        message = error.response.data.message;
    } else if (error.message) {
        message = error.message;
    }
    toast.error(message, {
        autoClose: 4000,
    }); 
};