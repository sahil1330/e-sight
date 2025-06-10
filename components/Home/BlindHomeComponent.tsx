import User from "@/schema/userSchema";
import LocationService from "@/utils/LocationService";
import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  AppState,
  AppStateStatus,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import ConnectToDevice from "./ConnectToDevice";

const BlindHomeComponent = ({ userDetails }: { userDetails: User }) => {
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [isTracking, setIsTracking] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);
  const locationService = useRef(new LocationService()).current;
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    checkServiceStatus();

    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange
    );

    const interval = setInterval(checkConnectionStatus, 5000);
    startTracking();
    return () => {
      subscription.remove();
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (error) {
      Alert.alert("Error", error);
      setError(null);
    }
    return () => {
      // Cleanup function to reset error state if needed
      setError(null);
    };
  }, [error]);

  const handleAppStateChange = (nextAppState: AppStateStatus) => {
    if (
      appState.current.match(/inactive|background/) &&
      nextAppState === "active"
    ) {
      // App has come to the foreground
      checkServiceStatus();
      checkConnectionStatus();
    }
    appState.current = nextAppState;
  };

  const checkServiceStatus = async () => {
    const isActive = await locationService.isServiceActive();
    setIsTracking(isActive);
  };

  const checkConnectionStatus = async () => {
    const isConnected = await locationService.getConnectionStatus();
    setIsConnected(isConnected);
  };

  const startTracking = async () => {
    try {
      const success = await locationService.startBackgroundService();
      if (success) {
        setIsTracking(true);
        setLastUpdate(new Date().toLocaleDateString());
        setError(null);
        Alert.alert(
          "Location Tracking Started",
          "Your location can be seen by the caretaker."
        );
      } else {
        setError("Failed to start tracking. Please try again.");
        Alert.alert(
          "Error",
          "Failed to start location tracking. Please try again."
        );
      }
    } catch (error) {
      console.error("Error starting tracking:", error);
      setError("Failed to start tracking. Please try again.");
    }
  };

  const stopTracking = async () => {
    try {
      const success = await locationService.stopBackgroundService();
      if (success) {
        setIsTracking(false);
        setLastUpdate(null);
        setIsConnected(false);
        Alert.alert(
          "Location Tracking Stopped",
          "Your location is no longer being shared."
        );
      } else {
        Alert.alert(
          "Error",
          "Failed to stop location tracking. Please try again."
        );
      }
    } catch (error) {
      console.error("Error stopping tracking:", error);
      setError("Failed to stop tracking. Please try again.");
    }
  };

  const handleToggleTracking = () => {
    if (isTracking) {
      Alert.alert(
        "Stop Tracking",
        "Are you sure you want to stop location tracking?",
        [
          {
            text: "Cancel",
            style: "cancel",
          },
          {
            text: "Stop",
            onPress: stopTracking,
            style: "destructive",
          },
        ]
      );
    } else {
      startTracking();
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // Add your refresh logic here
    setTimeout(() => setRefreshing(false), 2000);
  }, []);

  const isVerified = userDetails.isVerified || false;
  const hasCaretakers =
    userDetails.connectedUsers && userDetails.connectedUsers.length > 0;

  return (
    <ScrollView
      className="flex-1 bg-gray-50 w-full"
      contentContainerClassName="pb-10"
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header Section */}
      <View className="bg-blue-600 pt-6 pb-8 px-5 rounded-b-3xl shadow-md">
        <Text className="text-white text-2xl font-bold mb-1">
          Hello, {userDetails.fullName?.split(" ")[0] || "User"}
        </Text>
        <View className="flex-row items-center">
          <Text className="text-blue-100 text-base">
            {isVerified ? "Verified Account" : "Account Pending Verification"}
          </Text>
          {isVerified ? (
            <View className="ml-2 bg-green-500 rounded-full p-1">
              <Ionicons name="checkmark" size={12} color="white" />
            </View>
          ) : (
            <View className="ml-2 bg-yellow-500 rounded-full p-1">
              <Ionicons name="alert" size={12} color="white" />
            </View>
          )}
        </View>
      </View>

      {/* Main Content */}
      <View className="px-5 mt-6">
        {/* User Info Card */}
        <View className="bg-white rounded-xl p-5 shadow-sm mb-6">
          <Text className="text-gray-500 text-sm mb-1">
            PROFILE INFORMATION
          </Text>

          <View className="flex-row items-center py-3 border-b border-gray-100">
            <Ionicons
              name="person-outline"
              size={20}
              color="#4b5563"
              className="mr-3"
            />
            <View>
              <Text className="text-gray-500 text-xs mb-1">Full Name</Text>
              <Text className="text-gray-800">
                {userDetails.fullName || "Not provided"}
              </Text>
            </View>
          </View>

          <View className="flex-row items-center py-3 border-b border-gray-100">
            <Ionicons
              name="mail-outline"
              size={20}
              color="#4b5563"
              className="mr-3"
            />
            <View>
              <Text className="text-gray-500 text-xs mb-1">Email Address</Text>
              <Text className="text-gray-800">
                {userDetails.email || "Not provided"}
              </Text>
            </View>
          </View>

          <View className="flex-row items-center py-3">
            <Ionicons
              name="call-outline"
              size={20}
              color="#4b5563"
              className="mr-3"
            />
            <View>
              <Text className="text-gray-500 text-xs mb-1">Phone Number</Text>
              <Text className="text-gray-800">
                {userDetails.phone || "Not provided"}
              </Text>
            </View>
          </View>
        </View>

        {/* Connect Device Section */}
        <View className="bg-white rounded-xl p-5 shadow-sm mb-6">
          <Text className="text-gray-500 text-sm mb-3">DEVICE CONNECTION</Text>
          <ConnectToDevice />
        </View>

        {/* Caretakers Section */}
        <View className="bg-white rounded-xl p-5 shadow-sm">
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-gray-500 text-sm">CONNECTED CARETAKERS</Text>
            <TouchableOpacity
              className="bg-blue-500 rounded-full py-1 px-3 flex-row items-center"
              activeOpacity={0.8}
            >
              <Ionicons name="person-add-outline" size={14} color="white" />
              <Text className="text-white text-xs ml-1">Add</Text>
            </TouchableOpacity>
          </View>

          {hasCaretakers ? (
            userDetails.connectedUsers?.map((caretaker, index) => (
              <View
                key={caretaker._id}
                className={`flex-row justify-between items-center py-3 ${
                  index < userDetails.connectedUsers!.length - 1
                    ? "border-b border-gray-100"
                    : ""
                }`}
              >
                <View className="flex-row items-center">
                  <View className="w-10 h-10 rounded-full bg-blue-100 items-center justify-center mr-3">
                    <Text className="text-blue-600 font-bold">
                      {caretaker.fullName?.charAt(0) || "C"}
                    </Text>
                  </View>
                  <View>
                    <Text className="text-gray-800 font-medium">
                      {caretaker.fullName || "Unknown"}
                    </Text>
                    <Text className="text-gray-500 text-xs">
                      {caretaker.email}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity>
                  <Ionicons
                    name="ellipsis-vertical"
                    size={20}
                    color="#6b7280"
                  />
                </TouchableOpacity>
              </View>
            ))
          ) : (
            <View className="py-6 items-center">
              <Ionicons name="people-outline" size={48} color="#d1d5db" />
              <Text className="text-gray-400 mt-2 text-center">
                No caretakers connected yet
              </Text>
              <Text className="text-gray-400 text-xs text-center mt-1">
                Add a caretaker to help monitor your location
              </Text>
            </View>
          )}
        </View>

        {/* Emergency Button */}
        <TouchableOpacity
          className="bg-red-500 mt-6 py-4 rounded-xl shadow-md"
          activeOpacity={0.8}
        >
          <View className="flex-row justify-center items-center">
            <Ionicons name="alert-circle-outline" size={24} color="white" />
            <Text className="text-white font-bold text-lg ml-2">
              Emergency Assistance
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

export default BlindHomeComponent;
