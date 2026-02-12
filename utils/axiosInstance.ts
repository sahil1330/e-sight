import axios from "axios";
import * as SecureStore from "expo-secure-store";
import Constants from 'expo-constants';

// Get BASE_URL from environment or expo-constants (for EAS builds)
const BASE_URL = 
    process.env.EXPO_PUBLIC_REST_API_BASE_URL || 
    Constants.expoConfig?.extra?.apiBaseUrl;

console.log('[Axios Config] BASE_URL from process.env:', process.env.EXPO_PUBLIC_REST_API_BASE_URL);
console.log('[Axios Config] BASE_URL from Constants:', Constants.expoConfig?.extra?.apiBaseUrl);
console.log('[Axios Config] Final BASE_URL:', BASE_URL);

// Validate BASE_URL exists
if (!BASE_URL) {
    console.error('❌ CRITICAL: Backend URL is not configured!');
    console.error('Check app.config.ts extra section and eas.json env variables');
}

// Create the instance without auth headers initially
const axiosInstance = axios.create({
    baseURL: BASE_URL ? `${BASE_URL}/api/v1` : "/api/v1",
    timeout: 10000, // Request timeout in milliseconds
    headers: {
        "Content-Type": "application/json",
    },
});

console.log('[Axios Config] Final baseURL:', axiosInstance.defaults.baseURL);

// Add a request interceptor to dynamically include the token on each request
axiosInstance.interceptors.request.use(
    async (config) => {
        console.log(`[API Request] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
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
        console.error('[API Request Error]', error);
        return Promise.reject(error);
    }
);

// Add response interceptor to log errors
axiosInstance.interceptors.response.use(
    (response) => {
        console.log(`[API Response] ${response.status} ${response.config.url}`);
        return response;
    },
    (error) => {
        if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
            console.error('[API Timeout]', error.config?.url);
        } else if (error.code === 'ERR_NETWORK' || !error.response) {
            console.error('[Network Error] Cannot reach backend:', error.config?.baseURL);
        } else {
            console.error('[API Error]', error.response?.status, error.response?.data);
        }
        return Promise.reject(error);
    }
);

export default axiosInstance;
