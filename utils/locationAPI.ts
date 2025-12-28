/**
 * Location API utilities for REST-based location updates
 * Provides methods to interact with location endpoints
 */

import axiosInstance from "./axiosInstance";

export interface LocationData {
    userId: string;
    location: {
        latitude: number;
        longitude: number;
        accuracy: number | null;
        altitude: number | null;
        speed: number | null;
        timestamp: number;
    };
}

export interface LocationResponse {
    success: boolean;
    message?: string;
    data?: any;
}

/**
 * Send location update to the server
 * @param locationData - Location data including userId and coordinates
 * @returns Promise with the response
 */
export const updateLocation = async (
    locationData: LocationData
): Promise<LocationResponse> => {
    try {
        const response = await axiosInstance.post('/location/update', locationData, {
            timeout: 10000,
        });
        
        return {
            success: true,
            message: response.data.message,
            data: response.data
        };
    } catch (error: any) {
        console.error("Location update API error:", error);
        return {
            success: false,
            message: error.message || "Failed to update location"
        };
    }
};

/**
 * Get current location for a specific user
 * @param userId - User ID to fetch location for
 * @returns Promise with location data
 */
export const getLocationByUserId = async (userId: string) => {
    try {
        const response = await axiosInstance.get(`/location/${userId}`, {
            timeout: 5000,
        });
        
        return {
            success: true,
            data: response.data
        };
    } catch (error: any) {
        console.error("Get location API error:", error);
        return {
            success: false,
            message: error.message || "Failed to fetch location"
        };
    }
};

/**
 * Batch update multiple location points (for offline queue processing)
 * @param locations - Array of location data
 * @returns Promise with the response
 */
export const batchUpdateLocations = async (
    locations: LocationData[]
): Promise<LocationResponse> => {
    try {
        const response = await axiosInstance.post('/location/batch-update', {
            locations
        }, {
            timeout: 15000,
        });
        
        return {
            success: true,
            message: response.data.message,
            data: response.data
        };
    } catch (error: any) {
        console.error("Batch location update API error:", error);
        return {
            success: false,
            message: error.message || "Failed to batch update locations"
        };
    }
};

/**
 * Get location history for a user
 * @param userId - User ID
 * @param limit - Number of records to fetch
 * @returns Promise with location history
 */
export const getLocationHistory = async (
    userId: string,
    limit: number = 50
) => {
    try {
        const response = await axiosInstance.get(`/location/history/${userId}`, {
            params: { limit },
            timeout: 5000,
        });
        
        return {
            success: true,
            data: response.data
        };
    } catch (error: any) {
        console.error("Get location history API error:", error);
        return {
            success: false,
            message: error.message || "Failed to fetch location history"
        };
    }
};
