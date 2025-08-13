import * as Location from "expo-location";
import * as Notifications from "expo-notifications";
import * as SecureStore from "expo-secure-store";
import * as TaskManager from "expo-task-manager";
import { io, Socket } from "socket.io-client";
import { LAST_LOCATION_TOKEN, LOCATION_TASK_NAME, PENDING_LOCATION_TOKEN } from "./constants";
import { addLocationNotification } from "./notificationHelpers";

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldPlaySound: false,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
        // priority: Notifications.AndroidNotificationPriority.HIGH
    }),
})

class LocationService {
    socket: Socket | undefined;
    notificationId: string | null;
    isServiceRunning: boolean;

    constructor() {
        this.isServiceRunning = false;
        this.notificationId = null;
        this.socket = undefined;
    }

    async initializeSocket() {
        // Use external socket if provided now or in constructor
        if (!this.socket) {
            // Fallback to creating a new socket if none is provided
            console.log("Creating new socket connection");
            this.socket = io(process.env.EXPO_PUBLIC_REST_API_BASE_URL!, {
                transports: ["websocket"],
                autoConnect: true,
                reconnectionAttempts: 5,
                reconnectionDelay: 1000,
                timeout: 20000,
            });

            // Only set up listeners if we're creating a new socket
            this.socket.on("connect", () => {
                console.log("Socket connected:", this.socket?.id);
            });

            this.socket.on("disconnect", (reason) => {
                console.log("Socket disconnected:", reason);
            });

            this.socket.on("connect_error", (error) => {
                console.log("Socket connection error:", error);
            });
        } else {
            console.log("Using existing socket:", this.socket.id);
        }
    }

    async requestPermissions() {
        try {
            const { status: notificationStatus } = await Notifications.requestPermissionsAsync();
            if (notificationStatus !== "granted") {
                throw new Error("Notification permissions not granted");
            }

            // Request Foreground location permissions
            const { status: foregroundLocationStatus } = await Location.requestForegroundPermissionsAsync();
            if (foregroundLocationStatus !== "granted") {
                throw new Error("Foreground location permissions not granted");
            }

            // Request Background location permissions
            const { status: backgroundLocationStatus } = await Location.requestBackgroundPermissionsAsync();
            if (backgroundLocationStatus !== "granted") {
                throw new Error("Background location permissions not granted");
            }

            return true;
        } catch (error) {
            console.error("Error requesting permissions:", error);
            return false;
        }
    }

    // Note: Device notifications removed - using secure storage notification system instead

    // Start the background location service
    async startBackgroundService() {
        try {
            const hasPermissions = await this.requestPermissions();
            if (!hasPermissions) {
                throw new Error("Permissions not granted");
            }

            await this.initializeSocket();

            // Note: Device notifications removed - using secure storage notification system instead

            // Store a heartbeat timestamp to help monitor the service
            await SecureStore.setItemAsync("locationLastHeartbeat", Date.now().toString());

            // Start background location task with settings optimized for 24/7 operation
            await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
                accuracy: Location.Accuracy.Highest, // Use balanced instead of best for battery
                timeInterval: 30000, // 30 seconds - less frequent to preserve battery
                distanceInterval: 50, // 50 meters
                deferredUpdatesInterval: 30000,
                foregroundService: {
                    notificationTitle: "E-Sight Location Tracking",
                    notificationBody: "Continuously tracking location for safety",
                    notificationColor: "#00FF00",
                    killServiceOnDestroy: false, // Prevent service from being killed
                },
                pausesUpdatesAutomatically: false,
                showsBackgroundLocationIndicator: false, // Hide indicator to prevent user from stopping
                // Additional properties for continuous operation
                activityType: Location.LocationActivityType.Other,
                mayShowUserSettingsDialog: false,
            });

            this.isServiceRunning = true;
            await SecureStore.setItemAsync("locationServiceRunning", "true");
            await SecureStore.setItemAsync("serviceStartTime", Date.now().toString());

            console.log("24/7 Background location service started successfully");
            return true;
        } catch (error) {
            console.error("Error starting background service:", error);
            return false;
        }
    }

    // Stop the background location service
    async stopBackgroundService() {
        try {
            await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);

            if (this.socket) {
                this.socket.removeAllListeners();
                this.socket.disconnect();
                this.socket = undefined;
            }

            // Clean up global socket
            if (globalSocket) {
                globalSocket.removeAllListeners();
                globalSocket.disconnect();
                globalSocket = null;
            }

            // Cancel all notifications
            await Notifications.cancelAllScheduledNotificationsAsync();

            this.notificationId = null;
            this.isServiceRunning = false;

            // Clean up stored data
            await SecureStore.setItemAsync("locationServiceRunning", "false");
            await SecureStore.deleteItemAsync("locationLastHeartbeat");
            await SecureStore.deleteItemAsync("serviceStartTime");
            await SecureStore.deleteItemAsync("lastLocationData");
            await SecureStore.deleteItemAsync("pendingLocationData");

            console.log("Background location service stopped successfully");
            return true;
        } catch (error) {
            console.error("Error stopping background service:", error);
            return false;
        }
    }

    // Check if the service is running
    async isServiceActive() {
        const stored = await SecureStore.getItemAsync("locationServiceRunning");
        return stored === "true" && this.isServiceRunning;
    }

    // Get current location status
    async getConnectionStatus() {
        return this.socket?.connected || false
    }
}

// Create a global socket instance to persist between location updates
let globalSocket: Socket | null = null;

// Helper function to ensure socket connection
const ensureSocketConnection = async (): Promise<Socket | null> => {
    if (!globalSocket || !globalSocket.connected) {
        console.log("Creating/reconnecting global socket for background updates");

        if (globalSocket) {
            globalSocket.removeAllListeners();
            globalSocket.disconnect();
        }

        globalSocket = io(process.env.EXPO_PUBLIC_REST_API_BASE_URL!, {
            transports: ["websocket"],
            autoConnect: true,
            reconnectionAttempts: Infinity, // Keep trying forever
            reconnectionDelay: 2000,
            reconnectionDelayMax: 10000,
            timeout: 20000,
            forceNew: true, // Force new connection
        });

        globalSocket.on("connect", () => {
            console.log("Global socket connected:", globalSocket?.id);
        });

        globalSocket.on("disconnect", (reason) => {
            console.log("Global socket disconnected:", reason);
            // Auto-reconnect on disconnect
            setTimeout(() => {
                if (globalSocket && !globalSocket.connected) {
                    globalSocket.connect();
                }
            }, 2000);
        });

        globalSocket.on("connect_error", (error) => {
            console.log("Global socket connection error:", error);
        });

        globalSocket.on("reconnect", (attemptNumber) => {
            console.log("Global socket reconnected after", attemptNumber, "attempts");
        });

        // Wait for connection with longer timeout
        return new Promise((resolve) => {
            const timeout = setTimeout(() => {
                console.log("Socket connection timeout - but continuing anyway");
                resolve(globalSocket); // Return socket even if not connected yet
            }, 10000);

            if (globalSocket?.connected) {
                clearTimeout(timeout);
                resolve(globalSocket);
            } else {
                globalSocket?.once("connect", () => {
                    clearTimeout(timeout);
                    resolve(globalSocket);
                });
            }
        });
    }

    return globalSocket;
};

TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }: any) => {
    try {
        if (error) {
            console.error("Location task error:", error);
            return { success: false, error };
        }

        // Update heartbeat timestamp
        const heartbeat = Date.now().toString();
        await SecureStore.setItemAsync("locationLastHeartbeat", heartbeat);

        // Check if data is available
        if (data) {
            const { locations } = data;

            // Only proceed if we have location data
            if (locations && locations.length > 0) {
                console.log("Processing location update at:", new Date().toLocaleTimeString());

                // Ensure socket connection (non-blocking)
                const socket = await ensureSocketConnection();

                const userState = await SecureStore.getItemAsync("authState");
                const parsedUserState = userState ? JSON.parse(userState) : null;

                if (!parsedUserState || !parsedUserState.userDetails || !parsedUserState.userDetails._id) {
                    console.error("User ID not found in authState");
                    return { success: false, error: "No user auth" };
                }

                const userId = parsedUserState.userDetails._id;
                const location = locations[0]; // Use only the latest location

                const locationData = {
                    userId,
                    location: {
                        latitude: location.coords.latitude,
                        longitude: location.coords.longitude,
                        accuracy: location.coords.accuracy,
                        altitude: location.coords.altitude,
                        speed: location.coords.speed,
                        timestamp: location.timestamp
                    }
                };

                // Try to emit the location data
                if (socket) {
                    console.log("Emitting location update:", new Date().toLocaleTimeString());
                    socket.emit("locationUpdate", locationData);

                    // Store the last location for recovery
                    await SecureStore.setItemAsync(LAST_LOCATION_TOKEN, JSON.stringify(locationData));
                } else {
                    console.log("No socket available, storing location for later");
                    await SecureStore.setItemAsync(PENDING_LOCATION_TOKEN, JSON.stringify(locationData));
                }

                // Store location update in notifications system (non-blocking)
                try {
                    await addLocationNotification(
                        location.coords.latitude,
                        location.coords.longitude
                    );
                    console.log("Location notification stored:", new Date().toLocaleTimeString());
                } catch (notifError) {
                    console.log("Location notification storage error:", notifError);
                }

                return { success: true };
            }
        }

        return { success: true, message: "No location data" };
    } catch (error: any) {
        console.error("Critical error in background location task:", error);
        return { success: false, error: error.message };
    }
})

export default LocationService;