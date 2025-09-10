import { useAuth } from "@/context/AuthContext";
import User from "@/schema/userSchema";
import axiosInstance from "@/utils/axiosInstance";
import { getErrorMessage } from "@/utils/getErrorMessage";
import { Ionicons } from "@expo/vector-icons";
import { isAxiosError } from "axios";
import { CameraView, useCameraPermissions } from "expo-camera";
import React, { useState } from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface ConnectToBlindProps {
  userDetails: User;
}

const ConnectToBlind: React.FC<ConnectToBlindProps> = ({ userDetails }) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const { updateConnectedUsers } = useAuth();

  const handleBarCodeScanned = ({ type, data }: { type: string; data: string }) => {
    setScanned(true);

    try {
      // Parse the QR code data (assuming it contains user info as JSON
      Alert.alert(
        "QR Code Scanned",
        `Connect with user ID ${data}?`,
        [
          {
            text: "Cancel",
            style: "cancel",
            onPress: () => setScanned(false),
          },
          {
            text: "Connect",
            onPress: () => handleConnectBlindUser(data),
          },
        ]
      );
    } catch (error) {
      console.error("Error parsing QR code data:", error);
      if (isAxiosError(error)) {
        getErrorMessage(error.response?.data || "").then((errorMessage) => {
          console.error("Error message from server:", errorMessage);
          Alert.alert("Error", "Something went wrong while processing the QR code.");
        });
      }
      Alert.alert("Invalid QR Code", "This QR code is not valid for connecting users.");
      setScanned(false);
    }
  };

  const handleConnectBlindUser = async (blindUserId: string) => {
    try {
      const response = await axiosInstance.post("/user-connections", {
        blindId: blindUserId,
        caretakerId: userDetails._id,
      });

      if (response.status !== 201) {
        throw new Error("Failed to connect to user");
      }
      const { blind, caretaker } = response.data.data;
      // Update connected users in auth context

      if (!blind || !caretaker) {
        throw new Error("Invalid connection data received");
      }
      if (updateConnectedUsers) {
        const result = await updateConnectedUsers(blind);
        if (result.success) {
          Alert.alert("Success", result.message);
        } else {
          Alert.alert("Error", result.message);
        }
      }
      // Show success message


      Alert.alert("Success", "Successfully connected to user!");
      setShowCamera(false);
      setScanned(false);
    } catch (error) {
      Alert.alert("Error", "Failed to connect to user");
      console.error("Connection error:", error);
      setScanned(false);
      if (error instanceof Error) {
        Alert.alert("Error", error.message);
      }
      if (isAxiosError(error)) {
        const errorMessage = await getErrorMessage(error.response?.data || "");
        Alert.alert("Error", errorMessage);
      }
    }
  };

  if (!permission) {
    return (
      <View className="py-8 items-center">
        <Text className="text-gray-600 text-center">Requesting camera permission...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View className="py-8 items-center">
        <Ionicons name="camera-outline" size={48} color="#d1d5db" />
        <Text className="text-gray-600 text-center mb-4">
          Camera permission is required to scan QR codes
        </Text>
        <TouchableOpacity
          onPress={requestPermission}
          className="bg-indigo-600 py-2 px-4 rounded-lg"
        >
          <Text className="text-white font-medium">Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!showCamera) {
    return (
      <View className="py-8 items-center">
        <Ionicons name="qr-code-outline" size={64} color="#6366f1" />
        <Text className="text-gray-800 text-lg font-semibold mb-2 text-center">
          Scan QR Code
        </Text>
        <Text className="text-gray-600 text-sm mb-6 text-center">
          Ask the person to show their QR code from the app, then tap the button below to start scanning
        </Text>

        <TouchableOpacity
          onPress={() => setShowCamera(true)}
          className="bg-indigo-600 py-3 px-6 rounded-lg flex-row items-center"
        >
          <Ionicons
            name="camera-outline"
            size={20}
            color="white"
            style={{ marginRight: 8 }}
          />
          <Text className="text-white font-medium">Open Camera</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="h-80">
      <Text className="text-gray-800 font-semibold mb-3 text-center">
        Point camera at QR code
      </Text>

      <View className="flex-1 rounded-lg overflow-hidden">
        <CameraView
          style={StyleSheet.absoluteFillObject}
          facing="back"
          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        >
          <View className="flex-1 justify-center items-center">
            {/* QR Code overlay */}
            <View className="w-64 h-64 border-2 border-white rounded-lg" />

            {scanned && (
              <View className="absolute bottom-4 left-4 right-4 bg-black bg-opacity-50 rounded-lg p-3">
                <Text className="text-white text-center">Processing QR code...</Text>
              </View>
            )}
          </View>
        </CameraView>
      </View>

      <TouchableOpacity
        onPress={() => {
          setShowCamera(false);
          setScanned(false);
        }}
        className="bg-gray-600 py-2 px-4 rounded-lg mt-3"
      >
        <Text className="text-white text-center font-medium">Cancel</Text>
      </TouchableOpacity>
    </View>
  );
};

export default ConnectToBlind;
