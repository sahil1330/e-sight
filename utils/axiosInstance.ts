import axios from "axios";
import * as SecureStore from "expo-secure-store";
let token;
(async () => {
    token = await SecureStore.getItemAsync("authToken");
    // if (token) {
    //     axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    // }
})();
const axiosInstance = axios.create({
    baseURL: process.env.EXPO_PUBLIC_REST_API_URL, // Replace with your API base URL
    timeout: 10000, // Request timeout in milliseconds
    headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
    },
    proxy: {
        host: process.env.EXPO_PUBLIC_REST_API_HOSTNAME as string,
        port: 443,
    },
});

export default axiosInstance;
