import axios from "axios";
import * as SecureStore from "expo-secure-store";

// Create the instance without auth headers initially
const axiosInstance = axios.create({
    baseURL: `${process.env.EXPO_PUBLIC_REST_API_BASE_URL || ""}/api/v1`,
    timeout: 10000, // Request timeout in milliseconds
    headers: {
        "Content-Type": "application/json",
    },
});

// Add a request interceptor to dynamically include the token on each request
axiosInstance.interceptors.request.use(
    async (config) => {
        // Get the token from secure storage on each request
        const token = await SecureStore.getItemAsync("authState");
        if (token) {
            const authState = JSON.parse(token);
            if (authState?.token) {
                config.headers.Authorization = `Bearer ${authState.token}`;
            }
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default axiosInstance;
