import User from "@/schema/userSchema";
import axiosInstance from "@/utils/axiosInstance";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";

interface UserLocation {
  userId: string;
  fullName: string;
  email: string;
  latitude: number;
  longitude: number;
}
const CaretakerLocationComponent = ({ userDetails }: { userDetails: User }) => {
  const [locations, setLocations] = useState<UserLocation[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [mapKey, setMapKey] = useState(0); // Key to force map remounting
  const [region, setRegion] = useState({
    latitude: 39.8283, // Center of US
    longitude: -98.5795,
    latitudeDelta: 50, // Larger delta for initial view
    longitudeDelta: 50,
  });
  const mapRef = useRef<MapView>(null);

  // Manual refresh function for troubleshooting
  const refreshMap = useCallback(() => {
    if (locations && locations.length > 0) {
      const refreshRegion = {
        latitude: locations[0].latitude,
        longitude: locations[0].longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      };

      console.log("Manual refresh triggered:", refreshRegion);
      setMapKey(prev => prev + 1);
      setRegion(refreshRegion);
      setMapLoaded(false);

      setTimeout(() => {
        if (mapRef.current) {
          mapRef.current.animateToRegion(refreshRegion, 1000);
        }
      }, 300);
    }
  }, [locations]);

  // This component would typically fetch the location data from an API or context
  const fetchAllBlindUsersLocations = useCallback(async () => {
    if (!userDetails.connectedUsers || userDetails.connectedUsers.length <= 0) {
      setError("No connected users found");
      setLocations(null);
      return;
    }

    try {
      setIsLoading(true);
      setError(null); // Clear any existing errors

      const responses = userDetails.connectedUsers.map(
        async (user) => {
          const response = await axiosInstance.get(`/location/${user._id}`);
          if (response.status !== 200) {
            throw new Error(`Failed to fetch location for user ${user._id}`);
          }
          return response.data.data;
        }
      );

      const locationsData = await Promise.all(responses);
      console.log("Fetched locations:", locationsData);

      // Set all locations at once instead of incrementally
      setLocations(locationsData);

    } catch (error) {
      setError("Failed to fetch locations");
      console.error("Error fetching locations:", error);
      setLocations(null);
    } finally {
      setIsLoading(false);
    }
  }, [userDetails.connectedUsers]);

  // Refetch function to get fresh location data from API
  const refetchLocations = useCallback(async () => {
    console.log("Refetching locations...");
    await fetchAllBlindUsersLocations();
  }, [fetchAllBlindUsersLocations]);

  useEffect(() => {
    fetchAllBlindUsersLocations();
  }, [fetchAllBlindUsersLocations]);

  useEffect(() => {
    // If we have locations, center the map on the first one
    if (locations && locations.length > 0) {
      const newRegion = {
        latitude: locations[0].latitude,
        longitude: locations[0].longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      };

      setRegion(newRegion);

      // Always try to animate to the new region, regardless of map loaded state
      // Use a longer delay to ensure map is ready
      const timeoutId = setTimeout(() => {
        if (mapRef.current) {
          mapRef.current.animateToRegion(newRegion, 1000);
          console.log("Animated to new region:", newRegion);
        }
      }, 500);

      return () => clearTimeout(timeoutId);
    }
  }, [locations]); // Remove mapLoaded dependency to ensure it runs every time locations change

  // Additional effect to handle component focus/visibility changes
  useEffect(() => {
    if (locations && locations.length > 0 && mapLoaded && mapRef.current) {
      const currentRegion = {
        latitude: locations[0].latitude,
        longitude: locations[0].longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      };

      // Force map to show the correct region when component becomes visible
      setTimeout(() => {
        mapRef.current?.animateToRegion(currentRegion, 1000);
      }, 300);
    }
  }, [mapLoaded, locations]); // This will run when map loads or locations change

  // Handle tab focus to ensure map shows correct region when returning to this tab
  useFocusEffect(
    useCallback(() => {
      console.log("Screen focused, locations:", locations);
      // When this screen comes into focus, force map remount and reset region
      if (locations && locations.length > 0) {
        const focusRegion = {
          latitude: locations[0].latitude,
          longitude: locations[0].longitude,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        };

        console.log("Screen focused, resetting map region:", focusRegion);

        // Force map remount by changing key
        setMapKey(prev => prev + 1);
        setRegion(focusRegion);
        setMapLoaded(false); // Reset map loaded state

        // Animate to region after a delay to ensure map is ready
        setTimeout(() => {
          if (mapRef.current) {
            mapRef.current.animateToRegion(focusRegion, 1000);
          }
        }, 500);
      }
    }, [locations])
  );

  console.log("MapLoaded:", mapLoaded);
  console.log("Locations:", locations);
  console.log("Current Region:", region);

  return (
    <View className="container h-full bg-white">
      {error && <Text style={styles.errorText}>{error}</Text>}
      {isLoading && (
        <View className="p-4">
          <Text className="text-center text-blue-600">Loading locations...</Text>
        </View>
      )}

      <View className="w-full h-2/3 p-4 mt-10 rounded-full relative">
        <MapView
          key={mapKey} // Force remount when key changes
          ref={mapRef}
          provider={Platform.OS === "android" ? PROVIDER_GOOGLE : undefined}
          style={styles.map}
          onMapReady={() => {
            setMapLoaded(true);
            console.log("Map is ready with key:", mapKey);
          }}
          initialRegion={region} // Use initialRegion with key-based remounting
          className="rounded-xl"
          showsUserLocation={false}
          showsMyLocationButton={false}
        >
          {locations && locations.map((location) => (
            <Marker
              key={location.userId}
              coordinate={{
                latitude: location.latitude,
                longitude: location.longitude,
              }}
              title={location.fullName}
              pinColor="#007AFF" // Custom pin color
              description={location.email}
            />
          ))}
        </MapView>
        {!mapLoaded && (
          <View style={styles.loadingOverlay}>
            <Text>Loading map...</Text>
          </View>
        )}
      </View>

      {/* Action buttons */}
      <View className="px-4 pb-4 space-y-3">
        {/* Refetch locations button - always available when there are connected users */}
        {userDetails.connectedUsers && userDetails.connectedUsers.length > 0 && (
          <TouchableOpacity
            onPress={refetchLocations}
            disabled={isLoading}
            className={`flex-row items-center justify-center py-3 px-4 rounded-lg ${isLoading ? 'bg-gray-400' : 'bg-green-500'
              }`}
          >
            <Ionicons
              name="refresh"
              size={40}
              color="white"
              style={{ marginRight: 8 }}
            />
            <Text className="text-white text-2xl text-center font-medium">
              {isLoading ? 'Fetching Locations...' : 'Refetch Locations'}
            </Text>
          </TouchableOpacity>
        )}

        {/* Map refresh button - only when locations are loaded */}
        {locations && locations.length > 0 && (
          <TouchableOpacity
            onPress={refreshMap}
            className="flex-row items-center justify-center bg-blue-500 py-3 px-4 rounded-lg mt-4"
          >
            <Ionicons
              name="map"
              size={40}
              color="white"
              style={{ marginRight: 8 }}
            />
            <Text className="text-white text-center text-2xl font-medium">Refresh Map View</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
  },
  mapContainer: {
    width: "100%",
    height: "100%",
    position: "relative",
  },
  map: {
    width: "100%",
    height: "100%",
  },
  errorText: {
    color: "red",
    padding: 10,
    textAlign: "center",
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
});

export default CaretakerLocationComponent;
