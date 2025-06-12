// src/services/api.jsx
import axios from 'axios';
import authHeader from '@services/auth-header';
import eventBus from '@utils/eventBus';
import NProgress from 'nprogress';

// Lấy baseURL từ biến môi trường, fallback về URL mặc định nếu không có
// Trong Vite, bạn sẽ dùng import.meta.env.VITE_API_URL
// Trong Create React App, bạn sẽ dùng process.env.REACT_APP_API_URL
const API_BASE_URL = import.meta.env.VITE_REACT_APP_API_URL || process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  },
});

// --- Axios Interceptors ---

// Request Interceptor: Thêm Authorization header và NProgress
api.interceptors.request.use(
  (config) => {
    NProgress.start();
    const userAuthHeader = authHeader();
    if (userAuthHeader && userAuthHeader.Authorization) {
      config.headers['Authorization'] = userAuthHeader.Authorization;
    }
    // Thêm các headers khác nếu cần cho từng request
    // Ví dụ, nếu là FormData, header Content-Type sẽ được tự động set bởi Axios khi có FormData
    if (config.data instanceof FormData) {
      // Để Axios tự đặt Content-Type cho FormData
      // delete config.headers['Content-Type']; // Hoặc config.headers['Content-Type'] = 'multipart/form-data'; (nhưng thường Axios tự xử lý tốt hơn)
    }
    return config;
  },
  (error) => {
    NProgress.done(); // Kết thúc NProgress nếu có lỗi trong request interceptor
    return Promise.reject(error);
  }
);

// Response Interceptor: Xử lý lỗi chung và NProgress
api.interceptors.response.use(
  (response) => {
    NProgress.done(); // Kết thúc NProgress khi nhận được response thành công
    // Bất kỳ mã trạng thái nào nằm trong phạm vi 2xx sẽ khiến hàm này được kích hoạt
    // Làm gì đó với response data
    return response;
  },
  (error) => {
    NProgress.done(); // Kết thúc NProgress khi có lỗi response
    // Bất kỳ mã trạng thái nào nằm ngoài phạm vi 2xx sẽ khiến hàm này được kích hoạt
    // Làm gì đó với lỗi response
    if (error.response) {
      // Request được thực hiện và server trả về với mã trạng thái ngoài 2xx
      console.error("API Error Response:", error.response.data);
      console.error("Status:", error.response.status);
      console.error("Headers:", error.response.headers);

      if (error.response.status === 401) {
        // Lỗi Unauthenticated (ví dụ: token hết hạn hoặc không hợp lệ)
        // Phát sự kiện 'logout' để AppContext hoặc các component khác xử lý
        // (ví dụ: xóa user khỏi localStorage, chuyển hướng về trang login)
        eventBus.dispatch("logout", { message: "Phiên đăng nhập hết hạn hoặc không hợp lệ." });
        // Bạn có thể không muốn toast ở đây vì eventBus đã xử lý
        // toast.error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
      } else if (error.response.status === 403) {
        // Lỗi Forbidden (không có quyền truy cập)
        // toast.error("Bạn không có quyền thực hiện hành động này.");
      } else if (error.response.status >= 500) {
        // Lỗi server
        // toast.error("Lỗi máy chủ. Vui lòng thử lại sau.");
      }
      // Các mã lỗi khác có thể được xử lý tại nơi gọi API hoặc ở đây nếu muốn
    } else if (error.request) {
      // Request được thực hiện nhưng không nhận được response
      // (ví dụ: server không phản hồi, lỗi mạng)
      console.error("API No Response:", error.request);
      // toast.error("Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.");
    } else {
      // Có lỗi xảy ra khi thiết lập request
      console.error("API Error:", error.message);
      // toast.error("Đã có lỗi xảy ra khi gửi yêu cầu.");
    }
    return Promise.reject(error); // Quan trọng: reject error để .catch() ở nơi gọi API có thể bắt được
  }
);

export default api;