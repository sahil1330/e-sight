import useBLE from "@/hooks/useBLE";
import { Ionicons } from "@expo/vector-icons";
import Entypo from "@expo/vector-icons/Entypo";
import Feather from "@expo/vector-icons/Feather";
import React, { useEffect } from "react";
import { ActivityIndicator, Alert, FlatList, Modal, Text, TouchableOpacity, View } from "react-native";
import { Device } from "react-native-ble-plx";

const ConnectToDevice = () => {
  const [isDeviceConnected, setIsDeviceConnected] = React.useState(false);
  const [deviceName, setDeviceName] = React.useState("");
  const [modalVisible, setModalVisible] = React.useState(false);
  const [isConnecting, setIsConnecting] = React.useState(false);
  const [showPopover, setShowPopover] = React.useState(false);

  const {
    scanForPeripherals,
    connectToDevice,
    disconnectFromDevice,
    connectedDevice,
    allDevices,
    isScanning,
    stopScan,
    // startStreamingData
  } = useBLE();

  useEffect(() => {
    // Update device name and connection status when connectedDevice changes
    if (connectedDevice) {
      setDeviceName(connectedDevice.name || "Unknown Device");
      setIsDeviceConnected(true);
    } else {
      setDeviceName("");
      setIsDeviceConnected(false);
    }
  }, [connectedDevice])

  useEffect(() => {
    if (isScanning) {
      console.log("Scanning for devices...");
      setModalVisible(true);
    } else {
      console.log("Stopped scanning.");
      setModalVisible(false);
    }
  }, [isScanning])

  // Handle device connection
  const handleConnectToDevice = async (device: Device) => {
    try {
      setIsConnecting(true);
      await connectToDevice(device);
      setDeviceName(device.name || "Unknown Device");
      setIsDeviceConnected(true);
      setModalVisible(false);

      // Start streaming data after connection
      // await startStreamingData(device);

      Alert.alert("Success", `Connected to ${device.name || "Unknown Device"}`);
    } catch (error) {
      Alert.alert("Connection Error", "Failed to connect to device");
      console.error("Connection error:", error);
    } finally {
      setIsConnecting(false);
    }
  };

  // Handle device disconnection with confirmation
  const handleDisconnectDevice = async () => {
    setShowPopover(false);
    Alert.alert(
      "Disconnect Device",
      `Are you sure you want to disconnect from ${deviceName}?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Disconnect",
          style: "destructive",
          onPress: async () => {
            try {
              await disconnectFromDevice();
              setIsDeviceConnected(false);
              setDeviceName("");
              Alert.alert("Disconnected", "Device has been disconnected successfully");
            } catch (error) {
              Alert.alert("Disconnection Error", "Failed to disconnect from device");
              console.error("Disconnection error:", error);
            }
          },
        },
      ]
    );
  };

  // Open modal and start scanning
  const openModal = () => {
    setModalVisible(true);
    scanForPeripherals();
  };

  // Close modal and stop scanning
  const closeModal = () => {
    setModalVisible(false);
    if (isScanning) {
      stopScan();
    }
  };

  // Render device item
  const renderDevice = ({ item }: { item: Device }) => (
    <View 
      className="flex-row justify-between items-center p-4 border-b border-gray-100"
      accessibilityRole="text"
      accessibilityLabel={`Device: ${item.name || "Unknown Device"}, ID: ${item.id}`}
    >
      <View className="flex-1 flex-row items-center">
        <View className="w-10 h-10 rounded-full bg-blue-100 items-center justify-center mr-3">
          <Ionicons name="bluetooth" size={20} color="#3B82F6" />
        </View>
        <View className="flex-1">
          <Text className="text-lg font-medium text-gray-800">
            {item.name || "Unknown Device"}
          </Text>
          <Text className="text-sm text-gray-500" numberOfLines={1}>
            {item.id}
          </Text>
        </View>
      </View>
      <TouchableOpacity
        className="bg-blue-600 px-4 py-3 rounded-xl"
        style={{
          minHeight: 44,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 3,
        }}
        onPress={() => handleConnectToDevice(item)}
        disabled={isConnecting}
        accessibilityRole="button"
        accessibilityLabel={`Connect to ${item.name || "Unknown Device"}`}
      >
        <Text className="text-white font-semibold text-base">
          {(item.id === connectedDevice?.id && isConnecting) ? "Connecting..." : "Connect"}
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View className="w-full">
      {!isDeviceConnected ? (
        <View className="bg-gray-50 rounded-xl p-6 border-2 border-dashed border-gray-300">
          <View className="items-center">
            <TouchableOpacity
              className="w-16 h-16 rounded-full bg-blue-100 items-center justify-center mb-4"
              onPress={openModal}
              accessibilityRole="button"
              accessibilityLabel="Connect to navigation device"
              accessibilityHint="Double tap to scan for available navigation devices"
            >
              <Entypo name="plus" size={32} color="#3B82F6" />
            </TouchableOpacity>
            <Text 
              className="text-gray-700 text-lg text-center font-medium"
              accessibilityLabel="No device connected. Tap the plus button to connect to a navigation device."
            >
              Connect Navigation Device
            </Text>
            <Text className="text-gray-500 text-base text-center mt-2">
              Tap to scan for available devices
            </Text>
          </View>
        </View>
      ) : (
        <View className="bg-green-50 rounded-xl p-6 border border-green-200">
          <View className="flex-row items-center justify-between">
            <View className="flex-1 flex-row items-center">
              <View className="w-12 h-12 rounded-full bg-green-100 items-center justify-center mr-4">
                <Ionicons name="bluetooth" size={24} color="#059669" />
              </View>
              <View className="flex-1">
                <Text 
                  className="text-green-800 text-lg font-semibold"
                  accessibilityLabel={`Connected to ${deviceName || "navigation device"}`}
                >
                  {deviceName || "Connected Device"}
                </Text>
                <Text className="text-green-600 text-base">
                  Status: Connected
                </Text>
              </View>
            </View>

            <View className="relative">
              <TouchableOpacity
                className="p-3"
                onPress={() => setShowPopover(!showPopover)}
                accessibilityRole="button"
                accessibilityLabel="Device options menu"
              >
                <Feather name="more-vertical" size={24} color="#059669" />
              </TouchableOpacity>

              {/* Popover Menu */}
              {showPopover && (
                <>
                  {/* Backdrop to close popover */}
                  <TouchableOpacity
                    className="absolute inset-0 w-screen h-screen -top-3 -right-3"
                    style={{ zIndex: 1 }}
                    onPress={() => setShowPopover(false)}
                    activeOpacity={1}
                  />

                  {/* Popover Content */}
                  <View
                    className="absolute right-0 top-12 bg-white rounded-xl shadow-lg border border-gray-200 min-w-48"
                    style={{ zIndex: 10 }}
                  >
                    <TouchableOpacity
                      className="px-4 py-4 border-b border-gray-100"
                      onPress={handleDisconnectDevice}
                      accessibilityRole="button"
                      accessibilityLabel="Disconnect device"
                    >
                      <View className="flex-row items-center">
                        <Feather name="x-circle" size={18} color="#EF4444" />
                        <Text className="ml-3 text-red-500 font-medium text-base">
                          Disconnect
                        </Text>
                      </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                      className="px-4 py-4"
                      onPress={() => setShowPopover(false)}
                      accessibilityRole="button"
                      accessibilityLabel="Device information"
                    >
                      <View className="flex-row items-center">
                        <Feather name="info" size={18} color="#6B7280" />
                        <Text className="ml-3 text-gray-600 font-medium text-base">
                          Device Info
                        </Text>
                      </View>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </View>
          </View>
        </View>
      )}

      {/* Device Selection Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={closeModal}
        accessibilityViewIsModal={true}
      >
        <View className="flex-1 justify-center items-center bg-black/50 px-6">
          <View className="bg-white rounded-2xl p-6 w-full max-w-md max-h-96">
            <View className="flex-row justify-between items-center mb-6">
              <Text 
                className="text-xl font-bold text-gray-800"
                accessibilityRole="header"
              >
                Available Devices
              </Text>
              <TouchableOpacity 
                onPress={closeModal}
                accessibilityRole="button"
                accessibilityLabel="Close device selection"
              >
                <Feather name="x" size={24} color="black" />
              </TouchableOpacity>
            </View>

            {isScanning && (
              <View className="flex-row items-center justify-center py-6">
                <ActivityIndicator size="large" color="#3B82F6" />
                <Text className="ml-3 text-gray-600 text-lg">Scanning for devices...</Text>
              </View>
            )}

            {allDevices.length === 0 && !isScanning ? (
              <View className="py-12 items-center">
                <Ionicons name="bluetooth-outline" size={64} color="#9CA3AF" />
                <Text 
                  className="text-gray-500 text-lg text-center mt-4"
                  accessibilityLabel="No devices found. Make sure your navigation device is discoverable and nearby."
                >
                  No devices found
                </Text>
                <Text className="text-gray-400 text-base text-center mt-2">
                  Make sure your device is discoverable
                </Text>
                <TouchableOpacity
                  className="bg-blue-600 px-6 py-4 rounded-xl mt-6"
                  style={{
                    minHeight: 56,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 4,
                    elevation: 3,
                  }}
                  onPress={scanForPeripherals}
                  accessibilityRole="button"
                  accessibilityLabel="Scan again for devices"
                >
                  <Text className="text-white font-semibold text-base">Scan Again</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <FlatList
                data={allDevices}
                renderItem={renderDevice}
                keyExtractor={(item) => item.id}
                className="max-h-64"
                showsVerticalScrollIndicator={false}
              />
            )}

            <View className="flex-row justify-between mt-6 space-x-3">
              <TouchableOpacity
                className="bg-gray-200 px-6 py-4 rounded-xl flex-1"
                style={{
                  minHeight: 56,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.05,
                  shadowRadius: 2,
                  elevation: 1,
                }}
                onPress={closeModal}
                accessibilityRole="button"
                accessibilityLabel="Cancel device selection"
              >
                <Text className="text-gray-700 font-semibold text-center text-base">Cancel</Text>
              </TouchableOpacity>

              {isScanning ? (
                <TouchableOpacity
                  className="bg-red-600 px-6 py-4 rounded-xl flex-1 ml-3"
                  style={{
                    minHeight: 56,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 4,
                    elevation: 3,
                  }}
                  onPress={stopScan}
                  accessibilityRole="button"
                  accessibilityLabel="Stop scanning for devices"
                >
                  <Text className="text-white font-semibold text-center text-base">Stop Scan</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  className="bg-blue-600 px-6 py-4 rounded-xl flex-1 ml-3"
                  style={{
                    minHeight: 56,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 4,
                    elevation: 3,
                  }}
                  onPress={scanForPeripherals}
                  accessibilityRole="button"
                  accessibilityLabel="Start scanning for devices"
                >
                  <Text className="text-white font-semibold text-center text-base">Scan</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default ConnectToDevice;
