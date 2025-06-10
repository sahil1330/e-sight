import * as Location from "expo-location";
import * as Notifications from "expo-notifications";
import * as SecureStore from "expo-secure-store";
import * as TaskManager from "expo-task-manager";
import { io, Socket } from "socket.io-client";

const LOCATION_TASK_NAME = "background-location-task";
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
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

    async createNotification() {
        try {
            const notificationId = await Notifications.scheduleNotificationAsync({
                content: {
                    title: "Location tracking active",
                    body: "Initializing location tracking...",
                    sticky: true,
                    priority: Notifications.AndroidNotificationPriority.HIGH,
                    sound: "default",
                    vibrate: [500, 1000, 500],
                },
                trigger: null, // Trigger immediately
            });

            this.notificationId = notificationId;
            return notificationId;
        } catch (error) {
            console.error("Error creating notification:", error);
        }
    }

    // Update notification content
    async updateNotification(message: string) {
        try {
            await Notifications.scheduleNotificationAsync({
                content: {
                    title: "Location tracking active",
                    body: message,
                    sticky: true,
                    priority: Notifications.AndroidNotificationPriority.HIGH,
                    sound: "default",
                    vibrate: [500, 1000, 500],
                },
                trigger: null, // Trigger immediately
            });
        } catch (error) {
            console.error("Error updating notification:", error);
        }
    }

    // Start the background location service
    async startBackgroundService() {
        try {
            const hasPermissions = await this.requestPermissions();
            if (!hasPermissions) {
                throw new Error("Permissions not granted");
            }

            await this.initializeSocket();

            await this.createNotification();

            // Store a heartbeat timestamp to help monitor the service
            await SecureStore.setItemAsync("locationLastHeartbeat", Date.now().toString());
            
            // Start background location task with improved settings
            await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
                accuracy: Location.Accuracy.BestForNavigation,
                timeInterval: 10000, // 10 seconds
                distanceInterval: 10, // 10 meters
                deferredUpdatesInterval: 10000, // 10 seconds
                foregroundService: {
                    notificationTitle: "Location Tracking",
                    notificationBody: "Tracking your location in the background",
                    notificationColor: "#00FF00",
                },
                showsBackgroundLocationIndicator: true,
                // Add these properties to prevent system from killing the task
                pausesUpdatesAutomatically: false,
            });

            this.isServiceRunning = true;
            await SecureStore.setItemAsync("locationServiceRunning", "true");

            console.log("Background location service started successfully");
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
                this.socket.disconnect();
                this.socket = undefined;
            }

            // Cancel Notification
            if (this.notificationId) {
                await Notifications.cancelScheduledNotificationAsync(this.notificationId);
                this.notificationId = null;
            }

            this.isServiceRunning = false;
            await SecureStore.setItemAsync("locationServiceRunning", "false");
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

TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }: any) => {
    if (error) {
        console.error("Location task error:", error);
        return;
    }
    
    // Check if data is available
    if (data) {
        const { locations } = data;
        
        // Only log the latest location to avoid excessive logging
        if (locations && locations.length > 0) {
            console.log("Latest location:", locations[0]);
            
            // Send only the most recent location to server
            try {
                const locationService = new LocationService();
                await locationService.initializeSocket();
                
                // Add a small delay to ensure socket has time to connect
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                const userState = await SecureStore.getItemAsync("authState");
                const parsedUserState = userState ? JSON.parse(userState) : null;
                
                if (!parsedUserState || !parsedUserState.userDetails || !parsedUserState.userDetails._id) {
                    console.error("User ID not found in authState");
                    locationService.updateNotification("User not authenticated");
                    return;
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
                
                // Check if socket is connected before trying to emit
                if (locationService.socket && locationService.socket.connected) {
                    console.log("Sending location to server:", locationData);
                    locationService.socket.emit("locationUpdate", locationData);
                    locationService.updateNotification(`Location sent at ${new Date(location.timestamp).toLocaleTimeString()}`);
                } else {
                    console.log("Socket not connected. Attempting to connect...");
                    locationService.updateNotification("Connecting to server...");
                    
                    // Set up a connection listener to send data once connected
                    locationService.socket?.once("connect", () => {
                        console.log("Socket connected. Now sending location.");
                        locationService.socket?.emit("locationUpdate", locationData);
                        locationService.updateNotification(`Location sent at ${new Date(location.timestamp).toLocaleTimeString()}`);
                    });
                    
                    // Try to connect
                    if (locationService.socket) {
                        locationService.socket.connect();
                    }
                }
            } catch (error) {
                console.error("Error in location update task:", error);
            }
        }
    }
})

export default LocationService;