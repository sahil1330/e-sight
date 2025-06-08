import User from "@/schema/userSchema";
import { CameraView, useCameraPermissions } from "expo-camera";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
const ConnectToBlind = ({ userDetails }: { userDetails: User }) => {
  const [cameraPermission, requestPermission] = useCameraPermissions();

  if (!cameraPermission) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text className="text-lg font-bold mb-4">
          Requesting Camera Permission...
        </Text>
      </View>
    );
  }

  if (!cameraPermission.granted) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text className="text-lg font-bold mb-4">Camera Permission Denied</Text>
        <Text className="text-gray-600 mb-4">
          Please enable camera access in your device settings.
        </Text>
        <TouchableOpacity
          onPress={requestPermission}
          className="bg-blue-500 py-2 px-4 rounded"
        >
          <Text className="text-white">Request Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View>
      {userDetails.role === "caretaker" ? (
        <View className="flex">
          <Text className="text-lg font-bold mb-4">
            Connect to a Blind User
          </Text>
          <CameraView
            className="h-64 rounded-lg"
            onCameraReady={() => console.log("Camera is ready")}
            onMountError={(error) =>
              console.error("Camera mount error:", error)
            }
            onBarcodeScanned={(barcode) =>
              console.log("Barcode scanned:", barcode)
            }
            barcodeScannerSettings={{
              barcodeTypes: ["qr"],
            }}
            facing="back"
          />
          {/* Add your connection logic here */}
        </View>
      ) : (
        <View>Hello</View>
      )}
    </View>
  );
};

export default ConnectToBlind;
