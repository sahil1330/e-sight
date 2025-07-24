import User from "@/schema/userSchema";
import { Ionicons } from "@expo/vector-icons";
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

  const handleBarCodeScanned = ({ type, data }: { type: string; data: string }) => {
    setScanned(true);
    console.log(`QR code scanned! Type: ${type} Data: ${data}`);

    try {
      // Parse the QR code data (assuming it contains user info as JSON)
      const blindUserData = JSON.parse(data);
      console.log("Blind user data:", blindUserData);

      Alert.alert(
        "QR Code Scanned",
        `Connect with ${blindUserData.name || "this user"}?`,
        [
          {
            text: "Cancel",
            style: "cancel",
            onPress: () => setScanned(false),
          },
          {
            text: "Connect",
            onPress: () => handleConnectBlindUser(blindUserData),
          },
        ]
      );
    } catch (error) {
      Alert.alert("Invalid QR Code", "This QR code is not valid for connecting users.");
      setScanned(false);
    }
  };

  const handleConnectBlindUser = async (blindUserData: any) => {
    try {
      // Add your API call here to connect to blind user
      console.log("Connecting to blind user:", blindUserData);

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000));

      Alert.alert("Success", "Successfully connected to user!");
      setShowCamera(false);
      setScanned(false);
    } catch (error) {
      Alert.alert("Error", "Failed to connect to user");
      console.error("Connection error:", error);
      setScanned(false);
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
