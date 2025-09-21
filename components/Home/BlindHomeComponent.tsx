import { useAuth } from "@/context/AuthContext";
import User from "@/schema/userSchema";
import { LAST_LOCATION_TOKEN } from "@/utils/constants";
import LocationService from "@/utils/LocationService";
import { sendSOS } from "@/utils/sendSOSFeature";
import { Ionicons } from "@expo/vector-icons";
import * as SecureStore from "expo-secure-store";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  AppState,
  AppStateStatus,
  Modal,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import QRCode from "react-native-qrcode-svg";
import ConnectToDevice from "./ConnectToDevice";

const BlindHomeComponent = ({ userDetails }: { userDetails: User }) => {
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [isTracking, setIsTracking] = useState(false);
  const locationService = useRef(new LocationService()).current;
  const appState = useRef(AppState.currentState);
  const { refreshUserState } = useAuth();
  const [modalVisible, setModalVisible] = useState(false);

  const checkServiceStatus = useCallback(async () => {
    const isActive = await locationService.isServiceActive();
    setIsTracking(isActive);
  }, [locationService]);

  const checkConnectionStatus = useCallback(async () => {
    await locationService.getConnectionStatus();
  }, [locationService]);

  const handleAppStateChange = useCallback((nextAppState: AppStateStatus) => {
    if (
      appState.current.match(/inactive|background/) &&
      nextAppState === "active"
    ) {
      // App has come to the foreground
      checkServiceStatus();
      checkConnectionStatus();
    }
    appState.current = nextAppState;
  }, [checkServiceStatus, checkConnectionStatus]);

  const startTracking = useCallback(async () => {
    try {
      const success = await locationService.startBackgroundService();
      if (success) {
        setIsTracking(true);
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
  }, [locationService]);

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
  }, [checkServiceStatus, handleAppStateChange, checkConnectionStatus, startTracking]);

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

  const stopTracking = async () => {
    try {
      const success = await locationService.stopBackgroundService();
      if (success) {
        setIsTracking(false);
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

  /**
   * Callback function to refresh the user state.
   * 
   * Sets refreshing state to true while operation is in progress.
   * If refreshUserState function is available, calls it and handles the result:
   * - On error: Sets the error state with the error message
   * - On success: Shows a success alert to the user
   * Finally sets refreshing state to false when complete.
   * 
   * @async
   * @returns {Promise<void>} A promise that resolves when refresh operation completes
   */
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    if (refreshUserState) {
      const result = await refreshUserState();
      if (result.isError) {
        setError(result.message);
      } else {
        Alert.alert("Success", "User state refreshed successfully");
      }
    }
    setRefreshing(false);
  }, [refreshUserState]);

  /**
   * Handles the user pressing the emergency button.
   * Displays a confirmation alert asking if the user wants to notify caretakers.
   * 
   * If the user confirms:
   * 1. Retrieves the last saved location from SecureStore
   * 2. Sends an SOS notification to the user's caretakers with their location
   * 
   * @throws {Error} Displays an alert if the SOS notification fails to send
   * @returns {void}
   */
  const handleEmergencyPress = () => {
    Alert.alert(
      "Emergency Assistance",
      "Do you want to notify your caretakers?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Notify",
          onPress: async () => {
            // Add logic to notify caretakers
            try {
              const locationData = JSON.parse(await SecureStore.getItemAsync(LAST_LOCATION_TOKEN) || "{}");
              await sendSOS(userDetails, locationData.location);
            } catch (error) {
              console.error("Error sending SOS:", error);
              Alert.alert("Error", "Failed to send SOS message. Please try again.");
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView
      className="flex-1 bg-white"
      contentContainerClassName="pb-12"
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      accessibilityLabel="E-Kaathi home screen content"
      showsVerticalScrollIndicator={false}
    >
      {/* Welcome Header - Professional enterprise styling */}
      <View className="bg-slate-800 px-6 py-8 rounded-b-2xl shadow-lg border-b border-slate-700">
        <Text
          className="text-white text-2xl font-semibold mb-2"
          accessibilityRole="header"
          accessibilityLabel={`Welcome to E-Kaathi, ${userDetails.fullName?.split(" ")[0] || "User"}`}
        >
          Welcome, {userDetails.fullName?.split(" ")[0] || "User"}
        </Text>
        <Text className="text-slate-300 text-base font-medium">
          E-Kaathi Navigation Assistant
        </Text>
        <View className="flex-row items-center mt-3">
          {userDetails.isVerified ? (
            <View className="bg-emerald-600 rounded-lg px-3 py-1.5 flex-row items-center border border-emerald-500">
              <Ionicons name="checkmark-circle" size={16} color="white" />
              <Text className="text-white text-sm font-medium ml-2">Verified Account</Text>
            </View>
          ) : (
            <View className="bg-amber-600 rounded-lg px-3 py-1.5 flex-row items-center border border-amber-500">
              <Ionicons name="alert-circle" size={16} color="white" />
              <Text className="text-white text-sm font-medium ml-2">Pending Verification</Text>
            </View>
          )}
        </View>
      </View>

      <View className="px-6 mt-6 space-y-5">
        {/* Location Tracking Status - Professional design */}
        <View className="bg-white rounded-xl p-6 shadow-md border border-gray-200">
          <View className="flex-row items-center mb-4">
            <View className={`w-3 h-3 rounded-full mr-3 ${isTracking ? 'bg-emerald-500' : 'bg-gray-400'}`} />
            <Text
              className="text-lg font-semibold text-slate-800"
              accessibilityRole="header"
            >
              Location Tracking
            </Text>
          </View>

          <Text
            className={`text-base mb-5 leading-relaxed ${isTracking ? 'text-emerald-700' : 'text-slate-600'}`}
            accessibilityLabel={isTracking ? "Location tracking is currently active. Your caretakers can see your real-time location." : "Location tracking is currently inactive. Your caretakers cannot see your location."}
          >
            {isTracking
              ? "✓ Location tracking is active. Your caretakers can monitor your location in real-time for your safety."
              : "⚠ Location tracking is inactive. Tap the button below to start sharing your location with your caretakers."
            }
          </Text>

          <TouchableOpacity
            className={`py-6 px-10 rounded-lg flex-row items-center justify-center shadow-sm border ${isTracking ? 'bg-red-600 border-red-700' : 'bg-emerald-600 border-emerald-700'
              }`}
            onPress={handleToggleTracking}
            accessibilityRole="button"
            accessibilityLabel={isTracking ? "Stop location tracking" : "Start location tracking"}
            accessibilityHint={isTracking ? "Double tap to stop sharing your location with caretakers" : "Double tap to start sharing your location with caretakers"}
          >
            <Ionicons
              name={isTracking ? "stop-circle" : "play-circle"}
              size={30}
              color="white"
            />
            <Text className="text-white text-2xl font-semibold ml-3">
              {isTracking ? "Stop Tracking" : "Start Tracking"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Device Connection - Professional design */}
        <View className="bg-white rounded-xl p-6 my-4 shadow-md border border-gray-200">
          <Text
            className="text-lg font-semibold text-slate-800 mb-4"
            accessibilityRole="header"
          >
            Device Connection
          </Text>
          <ConnectToDevice />
        </View>

        {/* Connected Caretakers - Professional design */}
        <View className="bg-white rounded-xl p-6 shadow-md border border-gray-200">
          <View className="flex-row justify-between items-center mb-4">
            <Text
              className="text-lg font-semibold text-slate-800"
              accessibilityRole="header"
            >
              Caretakers ({userDetails.connectedUsers?.length || 0})
            </Text>
            <TouchableOpacity
              className="bg-blue-600 rounded-lg py-2.5 px-4 flex-row items-center shadow-sm border border-blue-700"
              onPress={() => setModalVisible(true)}
              accessibilityRole="button"
              accessibilityLabel="Add new caretaker"
              accessibilityHint="Double tap to show QR code for connecting a new caretaker"
            >
              <Ionicons name="person-add" size={18} color="white" />
              <Text className="text-white text-sm font-medium ml-2">Add</Text>
            </TouchableOpacity>
          </View>

          {userDetails.connectedUsers && userDetails.connectedUsers.length > 0 ? (
            <View className="space-y-4">
              {userDetails.connectedUsers.map((caretaker, index) => (
                <View
                  key={caretaker._id}
                  className="flex-row items-center p-4 bg-gray-50 rounded-lg border border-gray-200"
                  accessibilityRole="text"
                  accessibilityLabel={`Caretaker: ${caretaker.fullName || "Unknown name"}, Email: ${caretaker.email}`}
                >
                  <View className="w-12 h-12 rounded-lg bg-blue-100 items-center justify-center mr-4 border border-blue-200">
                    <Text className="text-blue-700 text-lg font-semibold">
                      {caretaker.fullName?.charAt(0) || "C"}
                    </Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-slate-800 text-base font-semibold">
                      {caretaker.fullName || "Unknown"}
                    </Text>
                    <Text className="text-slate-600 text-sm mt-0.5">
                      {caretaker.email}
                    </Text>
                  </View>
                  <View className="w-2.5 h-2.5 rounded-full bg-emerald-500 border border-emerald-600"
                    accessibilityLabel="Connected and active" />
                </View>
              ))}
            </View>
          ) : (
            <View className="py-8 items-center">
              <Ionicons name="people-outline" size={48} color="#9CA3AF" />
              <Text
                className="text-slate-500 text-base mt-4 text-center font-medium"
                accessibilityLabel="No caretakers connected. Add a caretaker to help monitor your location and provide assistance."
              >
                No caretakers connected yet
              </Text>
              <Text className="text-slate-400 text-sm text-center mt-2 leading-relaxed">
                Add a caretaker to help monitor your location and provide assistance when needed
              </Text>
            </View>
          )}
        </View>

        {/* Emergency Button - Professional critical design */}
        <TouchableOpacity
          className="bg-red-600 py-4 my-4 rounded-xl shadow-lg border border-red-700"
          onPress={handleEmergencyPress}
          accessibilityRole="button"
          accessibilityLabel="Emergency assistance button"
          accessibilityHint="Double tap to send emergency alert to all connected caretakers with your current location"
        >
          <View className="flex-row justify-center items-center">
            <Ionicons name="warning" size={24} color="white" />
            <Text className="text-white font-semibold text-lg ml-3">
              Emergency Assistance
            </Text>
          </View>
          <Text className="text-red-100 text-sm text-center mt-2 font-medium">
            Tap to alert all caretakers
          </Text>
        </TouchableOpacity>
      </View>

      {/* QR Code Modal - Professional enterprise styling */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
        accessibilityViewIsModal={true}
      >
        <View className="flex-1 justify-center items-center bg-black/60 px-6">
          <View className="bg-white rounded-xl p-6 w-full max-w-sm shadow-lg border border-gray-200">
            <Text
              className="text-slate-800 text-lg font-semibold mb-4 text-center"
              accessibilityRole="header"
            >
              Your Connection Code
            </Text>
            <Text
              className="text-slate-600 text-base mb-6 text-center leading-relaxed"
              accessibilityLabel="Share this QR code with your caretakers to connect with them. They can scan this code using their camera app."
            >
              Share this code with your caretakers to connect with them. They can scan it using their camera.
            </Text>

            <View
              className="bg-gray-50 border border-dashed border-gray-300 p-6 rounded-lg mb-6 items-center"
              accessibilityLabel="QR Code for connection"
            >
              <QRCode
                value={userDetails._id}
                size={180}
                backgroundColor="transparent"
                color="#1F2937"
              />
            </View>

            <TouchableOpacity
              className="bg-blue-600 py-3 px-6 rounded-lg shadow-sm border border-blue-700"
              onPress={() => setModalVisible(false)}
              accessibilityRole="button"
              accessibilityLabel="Close QR code modal"
            >
              <Text className="text-white text-center text-base font-semibold">Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

export default BlindHomeComponent;
