import axios, { AxiosHeaders } from "axios";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const API_HelpTable_URL = import.meta.env.VITE_API_HelpTable_URL;


const instance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 900000, // Optional: Set a timeout in milliseconds
});

// Add logging to verify if the token is being included in requests
instance.interceptors.request.use(
  (config) => {
    // التحقق من التوكن في كلا الموقعين
    const AUTH_STORAGE_KEY = "latin_academy_user";
    
    // محاولة الحصول على التوكن من بيانات المستخدم
    let token = null;
    
    // الطريقة 1: من بيانات المستخدم الكاملة
    try {
      const userDataStr = localStorage.getItem(AUTH_STORAGE_KEY);
      if (userDataStr) {
        const userData = JSON.parse(userDataStr);
        if (userData && userData.accessToken) {
          token = userData.accessToken;
          console.log("[AXIOS] Token found in user data");
        }
      }
    } catch (error) {
      console.error("[AXIOS] Error parsing user data:", error);
    }
    
    // الطريقة 2: من مفتاح التوكن المنفصل
    if (!token) {
      token = localStorage.getItem("token");
      if (token) {
        console.log("[AXIOS] Token found in separate token storage");
      }
    }
    
    if (token) {
      config.headers = config.headers || new AxiosHeaders();
      config.headers.set("Authorization", `Bearer ${token}`);
      console.log("[AXIOS] Token included in request headers:", `Bearer ${token}`); // Log the token
    } else {
      console.log("[AXIOS] No token found in any storage location"); // Log if no token is found
    }
    return config;
  },
  (error) => Promise.reject(error)
);

instance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Remove user data from localStorage and redirect to login
      const AUTH_STORAGE_KEY = "latin_academy_user";
      localStorage.removeItem(AUTH_STORAGE_KEY);
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default instance;
