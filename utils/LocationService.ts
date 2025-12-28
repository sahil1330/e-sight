import * as Location from "expo-location";
import * as Notifications from "expo-notifications";
import * as SecureStore from "expo-secure-store";
import * as TaskManager from "expo-task-manager";
import axiosInstance from "./axiosInstance";
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
    notificationId: string | null;
    isServiceRunning: boolean;
    private maxRetries: number;
    private retryDelay: number;

    constructor() {
        this.isServiceRunning = false;
        this.notificationId = null;
        this.maxRetries = 3;
        this.retryDelay = 1000; // 1 second initial delay
    }

    async checkAPIHealth(): Promise<boolean> {
        try {
            // Simple health check or use existing API call
            await axiosInstance.get('/health', { timeout: 5000 });
            return true;
        } catch (error) {
            console.error("API health check failed:", error);
            return false;
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

            // Check if API is reachable
            const isHealthy = await this.checkAPIHealth();
            if (!isHealthy) {
                console.warn("API health check failed, but starting service anyway");
            }

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
                    notificationTitle: "E-Kaathi Location Tracking",
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

    // Get current API connection status
    async getConnectionStatus() {
        return await this.checkAPIHealth();
    }
}

// Offline queue for failed location updates
const OFFLINE_QUEUE_KEY = "locationOfflineQueue";
const MAX_QUEUE_SIZE = 100;

// Helper function to add location to offline queue
const addToOfflineQueue = async (locationData: any) => {
    try {
        const queueStr = await SecureStore.getItemAsync(OFFLINE_QUEUE_KEY);
        const queue = queueStr ? JSON.parse(queueStr) : [];
        
        // Add new location to queue
        queue.push({
            ...locationData,
            queuedAt: Date.now()
        });
        
        // Keep only the latest MAX_QUEUE_SIZE items
        const trimmedQueue = queue.slice(-MAX_QUEUE_SIZE);
        
        await SecureStore.setItemAsync(OFFLINE_QUEUE_KEY, JSON.stringify(trimmedQueue));
        // console.log(`Added location to offline queue. Queue size: ${trimmedQueue.length}`);
    } catch (error) {
        console.error("Error adding to offline queue:", error);
    }
};

// Helper function to process offline queue
const processOfflineQueue = async () => {
    try {
        const queueStr = await SecureStore.getItemAsync(OFFLINE_QUEUE_KEY);
        if (!queueStr) return;
        
        const queue = JSON.parse(queueStr);
        if (queue.length === 0) return;
        
        // console.log(`Processing ${queue.length} queued location updates`);
        
        const successfulUpdates: number[] = [];
        
        // Process queue items (max 10 at a time to avoid overwhelming the API)
        const batchSize = Math.min(10, queue.length);
        for (let i = 0; i < batchSize; i++) {
            const item = queue[i];
            try {
                await axiosInstance.post('/location/update', item, { timeout: 5000 });
                successfulUpdates.push(i);
            } catch (error) {
                // Skip failed items, will retry next time
                console.error(`Failed to send queued location ${i}:`, error);
            }
        }
        
        // Remove successful updates from queue
        if (successfulUpdates.length > 0) {
            const remainingQueue = queue.filter((_: any, index: number) => 
                !successfulUpdates.includes(index)
            );
            await SecureStore.setItemAsync(OFFLINE_QUEUE_KEY, JSON.stringify(remainingQueue));
            // console.log(`Processed ${successfulUpdates.length} queued locations. ${remainingQueue.length} remaining.`);
        }
    } catch (error) {
        console.error("Error processing offline queue:", error);
    }
};

// Helper function to send location update with retry logic
const sendLocationUpdate = async (
    locationData: any, 
    retryCount: number = 0, 
    maxRetries: number = 3
): Promise<boolean> => {
    try {
        const response = await axiosInstance.post('/location/update', locationData, {
            timeout: 10000, // 10 second timeout
        });
        
        if (response.status === 200 || response.status === 201) {
            // Success! Try to process any queued updates
            processOfflineQueue().catch(err => 
                console.error("Error processing queue after successful update:", err)
            );
            return true;
        }
        
        throw new Error(`Unexpected status code: ${response.status}`);
    } catch (error: any) {
        console.error(`Location update attempt ${retryCount + 1}/${maxRetries} failed:`, error.message);
        
        // If we haven't exceeded max retries, try again with exponential backoff
        if (retryCount < maxRetries - 1) {
            const delay = Math.min(1000 * Math.pow(2, retryCount), 10000); // Max 10 seconds
            await new Promise(resolve => setTimeout(resolve, delay));
            return sendLocationUpdate(locationData, retryCount + 1, maxRetries);
        }
        
        // Max retries exceeded, add to offline queue
        await addToOfflineQueue(locationData);
        return false;
    }
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

                // Send location update via REST API with retry logic
                const success = await sendLocationUpdate(locationData);

                if (success) {
                    // Store the last successful location
                    await SecureStore.setItemAsync(LAST_LOCATION_TOKEN, JSON.stringify(locationData));
                    
                    // Clear any pending location since we succeeded
                    await SecureStore.deleteItemAsync(PENDING_LOCATION_TOKEN);
                } else {
                    // Store as pending for manual retry if needed
                    await SecureStore.setItemAsync(PENDING_LOCATION_TOKEN, JSON.stringify(locationData));
                }

                // Store location update in notifications system (non-blocking)
                try {
                    await addLocationNotification(
                        location.coords.latitude,
                        location.coords.longitude
                    );
                } catch {
                    // console.log("Location notification storage error");
                }

                return { success: true, locationUpdateSuccess: success };
            }
        }

        return { success: true, message: "No location data" };
    } catch (error: any) {
        console.error("Critical error in background location task:", error);
        return { success: false, error: error.message };
    }
})

export default LocationService;