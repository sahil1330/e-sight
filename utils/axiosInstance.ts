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
    baseURL: "https://9fk5b449-8000.inc1.devtunnels.ms/api/v1", // Replace with your API base URL
    timeout: 10000, // Request timeout in milliseconds
    headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
    },
    proxy: {
        host: "9fk5b449-8000.inc1.devtunnels.ms",
        port: 443,
    },
});

export default axiosInstance;
