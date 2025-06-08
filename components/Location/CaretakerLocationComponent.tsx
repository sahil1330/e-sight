import User from "@/schema/userSchema";
import axiosInstance from "@/utils/axiosInstance";
import React, { useCallback, useEffect, useState } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
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
  const [region, setRegion] = useState({
    latitude: 37.78825,
    longitude: -122.4324,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  // This component would typically fetch the location data from an API or context
  useEffect(() => {
    if (userDetails.connectedUsers && userDetails.connectedUsers.length > 0) {
      fetchAllBlindUsersLocations();
    } else {
      setError("No connected users found");
    }
  }, []);
  const fetchAllBlindUsersLocations = useCallback(async () => {
    try {
      const responses: Promise<any>[] = userDetails.connectedUsers?.map(
        async (user) => {
          const response = await axiosInstance.get(`/location/${user._id}`);
          if (response.status !== 200) {
            throw new Error(`Failed to fetch location for user ${user._id}`);
          }
          if (locations?.some((loc) => loc.userId === user._id)) {
            setLocations((prevLocations) => {
              if (prevLocations) {
                return prevLocations.map((loc) =>
                  loc.userId === user._id
                    ? { ...loc, ...response.data.data }
                    : loc
                );
              }
              return null;
            });
          } else {
            setLocations((prevLocations) => [
              ...(prevLocations || []),
              response.data.data,
            ]);
          }
          return response.data.data;
        }
      ) as Promise<any>[];
      const locationsData = await Promise.all(responses);
      console.log("Fetched locations:", locationsData);
    } catch (error) {
      setError("Failed to fetch locations");
      console.error("Error fetching locations:", error);
    }
  }, [userDetails.connectedUsers]);
  useEffect(() => {
    // If we have locations, center the map on the first one
    if (locations && locations.length > 0) {
      setRegion({
        latitude: locations[0].latitude,
        longitude: locations[0].longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      });
    }
  }, [locations]);
  return (
    <View style={styles.container}>
      {error && <Text style={styles.errorText}>{error}</Text>}
      
      <View style={styles.mapContainer}>
        <MapView
          provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
          style={styles.map}
          initialRegion={region}
          onMapReady={() => setMapLoaded(true)}
          showsUserLocation
          showsMyLocationButton
        >
          {locations?.map((location) => (
            <Marker
              key={location.userId}
              coordinate={{
                latitude: location.latitude,
                longitude: location.longitude,
              }}
              title={location.fullName}
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
  },
  mapContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  errorText: {
    color: 'red',
    padding: 10,
    textAlign: 'center',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  }
});

export default CaretakerLocationComponent;
