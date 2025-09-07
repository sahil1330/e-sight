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
    forgetDevice,
    connectionState,
    checkConnectionHealth,
    isBackgroundServiceActive,
    startBackgroundService,
    stopBackgroundService
  } = useBLE();

  // Update connection status based on connectionState instead of just connectedDevice
  useEffect(() => {
    const isReallyConnected = connectionState === 'connected' && connectedDevice !== null;
    setIsDeviceConnected(isReallyConnected);
    setDeviceName(connectedDevice?.name || "");

    // Close popover if device disconnects
    if (!isReallyConnected && showPopover) {
      setShowPopover(false);
    }
  }, [connectedDevice, connectionState, showPopover]);

  useEffect(() => {
    if (isScanning) {
      console.log("Scanning for devices...");
      setModalVisible(true);
    } else {
      console.log("Stopped scanning.");
      if (!isConnecting) {
        setModalVisible(false);
      }
    }
  }, [isScanning, isConnecting]);

  // Handle device connection
  const handleConnectToDevice = async (device: Device) => {
    try {
      setIsConnecting(true);
      await connectToDevice(device);
      setModalVisible(false);

      // Don't show alert here as the connection state will be handled by the hook
      // Alert.alert("Success", `Connected to ${device.name || "Unknown Device"}`);
    } catch (error) {
      console.error("Connection error:", error);
      Alert.alert("Connection Failed", "Unable to connect to device. Please try again.");
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

  const handleForgetDevice = async () => {
    setShowPopover(false);
    Alert.alert(
      "Forget Device",
      `Are you sure you want to forget ${deviceName}?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Forget Device",
          style: "destructive",
          onPress: async () => {
            try {
              await forgetDevice();
              Alert.alert("Forgot", "Device has been forgotten successfully");
            } catch (error) {
              Alert.alert("Forget Error", "Failed to forget device");
              console.error("Forget error:", error);
            }
          },
        },
      ]
    );
  }

  const handleConnectionHealthCheck = async () => {
    setShowPopover(false);
    try {
      await checkConnectionHealth();
      Alert.alert("Connection Check", "Connection health check completed");
    } catch (error) {
      Alert.alert("Health Check Error", "Failed to check connection health");
      console.error("Health check error:", error);
    }
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
    <TouchableOpacity
      className="flex-row items-center p-4 bg-white rounded-xl border border-gray-200 mx-1 my-1"
      style={{
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
      }}
      onPress={() => handleConnectToDevice(item)}
      disabled={isConnecting}
      accessibilityRole="button"
      accessibilityLabel={`Connect to ${item.name || 'Unknown Device'}`}
    >
      <View className="w-12 h-12 rounded-full bg-blue-100 items-center justify-center mr-4">
        <Ionicons name="bluetooth" size={24} color="#3B82F6" />
      </View>

      <View className="flex-1">
        <Text className="text-gray-800 text-base font-semibold">
          {item.name || "Unknown Device"}
        </Text>
        <Text className="text-gray-500 text-sm">
          {item.id}
        </Text>
      </View>

      {isConnecting ? (
        <ActivityIndicator size="small" color="#3B82F6" />
      ) : (
        <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
      )}
    </TouchableOpacity>
  );

  // Show connected device UI
  if (isDeviceConnected && connectedDevice) {
    return (
      <View className="space-y-4">
        {/* Connection Status */}
        <View className="bg-green-50 rounded-xl p-4 border border-green-200">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center flex-1">
              <View className="w-12 h-12 rounded-full bg-green-100 items-center justify-center mr-4">
                <Ionicons name="bluetooth-outline" size={24} color="#059669" />
              </View>

              <View className="flex-1">
                <Text className="text-green-800 text-lg font-semibold">
                  {deviceName}
                </Text>
                <View className="flex-row items-center mt-1">
                  <View className="w-2.5 h-2.5 rounded-full bg-green-500 mr-2" />
                  <Text className="text-green-600 text-base">
                    {connectionState === 'connected' ? 'Connected' :
                      connectionState === 'connecting' ? 'Connecting...' : 'Disconnected'}
                  </Text>
                </View>
                {isBackgroundServiceActive && (
                  <Text className="text-green-500 text-sm mt-1">
                    Background monitoring active
                  </Text>
                )}
              </View>
            </View>

            {/* Three Dots Menu */}
            <TouchableOpacity
              onPress={() => setShowPopover(true)}
              className="w-10 h-10 items-center justify-center rounded-full bg-green-100"
              accessibilityLabel="Device options"
              accessibilityRole="button"
            >
              <Entypo name="dots-three-vertical" size={16} color="#059669" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Background Service Status Card */}
        {isBackgroundServiceActive && (
          <View className="bg-blue-50 rounded-xl p-4 border border-blue-200">
            <View className="flex-row items-center">
              <View className="w-10 h-10 rounded-full bg-blue-100 items-center justify-center mr-3">
                <Ionicons name="shield-checkmark" size={20} color="#3B82F6" />
              </View>
              <View className="flex-1">
                <Text className="text-blue-800 text-base font-semibold">
                  Background Monitoring Active
                </Text>
                <Text className="text-blue-600 text-sm">
                  App will monitor device even when minimized
                </Text>
              </View>
              <View className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
            </View>
          </View>
        )}

        {/* Connection Status Warning */}
        {connectionState === 'connecting' && (
          <View className="bg-yellow-50 rounded-xl p-4 border border-yellow-200">
            <View className="flex-row items-center">
              <ActivityIndicator size="small" color="#D97706" />
              <Text className="text-yellow-700 text-base font-medium ml-3">
                Connecting to device...
              </Text>
            </View>
          </View>
        )}

        {connectionState === 'disconnected' && connectedDevice && (
          <View className="bg-red-50 rounded-xl p-4 border border-red-200">
            <View className="flex-row items-center">
              <Ionicons name="warning-outline" size={20} color="#DC2626" />
              <Text className="text-red-700 text-base font-medium ml-3">
                Device connection lost
              </Text>
            </View>
          </View>
        )}

        {/* Device Options Modal */}
        <Modal
          animationType="fade"
          transparent={true}
          visible={showPopover}
          onRequestClose={() => setShowPopover(false)}
        >
          <View className="flex-1 justify-center items-center bg-black/50 px-6">
            <View className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
              <Text className="text-xl font-bold text-gray-800 mb-6 text-center">
                Device Options
              </Text>

              {/* Health Check Option */}
              <TouchableOpacity
                onPress={handleConnectionHealthCheck}
                className="flex-row items-center py-4 px-2 rounded-xl"
                accessibilityLabel="Check device connection health"
                accessibilityRole="button"
              >
                <View className="w-10 h-10 rounded-full bg-blue-100 items-center justify-center mr-4">
                  <Ionicons name="pulse-outline" size={20} color="#3B82F6" />
                </View>
                <Text className="text-gray-800 text-base font-semibold">Check Connection</Text>
              </TouchableOpacity>

              {/* Background Service Toggle */}
              <TouchableOpacity
                onPress={async () => {
                  setShowPopover(false);
                  try {
                    if (isBackgroundServiceActive) {
                      await stopBackgroundService();
                      Alert.alert("Background Service", "Background monitoring disabled");
                    } else {
                      await startBackgroundService();
                      Alert.alert("Background Service", "Background monitoring enabled");
                    }
                  } catch (error) {
                    Alert.alert("Error", "Failed to toggle background service");
                    console.error("Background service toggle error:", error);
                  }
                }}
                className="flex-row items-center justify-between py-4 px-2 rounded-xl"
                accessibilityLabel={isBackgroundServiceActive ? "Disable background monitoring" : "Enable background monitoring"}
                accessibilityRole="button"
              >
                <View className="flex-row items-center flex-1">
                  <View className={`w-10 h-10 rounded-full items-center justify-center mr-4 ${isBackgroundServiceActive ? 'bg-green-100' : 'bg-gray-100'}`}>
                    <Ionicons 
                      name={isBackgroundServiceActive ? "shield-checkmark-outline" : "shield-outline"} 
                      size={20} 
                      color={isBackgroundServiceActive ? "#059669" : "#6B7280"} 
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="text-gray-800 text-base font-semibold">Background Monitoring</Text>
                    <Text className="text-gray-500 text-sm">
                      {isBackgroundServiceActive ? "Active" : "Inactive"}
                    </Text>
                  </View>
                </View>
                <View 
                  className={`w-12 h-6 rounded-full ${isBackgroundServiceActive ? 'bg-green-500' : 'bg-gray-300'} relative`}
                >
                  <View 
                    className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all duration-200 ${
                      isBackgroundServiceActive ? 'left-6' : 'left-0.5'
                    }`}
                  />
                </View>
              </TouchableOpacity>

              {/* Disconnect Option */}
              <TouchableOpacity
                onPress={handleDisconnectDevice}
                className="flex-row items-center py-4 px-2 rounded-xl"
                accessibilityLabel="Disconnect from device"
                accessibilityRole="button"
              >
                <View className="w-10 h-10 rounded-full bg-red-100 items-center justify-center mr-4">
                  <Feather name="x-circle" size={20} color="#DC2626" />
                </View>
                <Text className="text-gray-800 text-base font-semibold">Disconnect</Text>
              </TouchableOpacity>

              {/* Device Info Option */}
              <TouchableOpacity
                onPress={() => {
                  setShowPopover(false);
                  Alert.alert("Device Info", `Device: ${deviceName}\nID: ${connectedDevice.id}\nStatus: ${connectionState}`);
                }}
                className="flex-row items-center py-4 px-2 rounded-xl"
                accessibilityLabel="View device information"
                accessibilityRole="button"
              >
                <View className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center mr-4">
                  <Ionicons name="information-circle-outline" size={20} color="#6B7280" />
                </View>
                <Text className="text-gray-800 text-base font-semibold">Device Info</Text>
              </TouchableOpacity>

              {/* Forget Device Option */}
              <TouchableOpacity
                onPress={handleForgetDevice}
                className="flex-row items-center py-4 px-2 rounded-xl mb-4"
                accessibilityLabel="Forget this device"
                accessibilityRole="button"
              >
                <View className="w-10 h-10 rounded-full bg-orange-100 items-center justify-center mr-4">
                  <Ionicons name="trash-outline" size={20} color="#EA580C" />
                </View>
                <Text className="text-gray-800 text-base font-semibold">Forget Device</Text>
              </TouchableOpacity>

              {/* Close Button */}
              <TouchableOpacity
                onPress={() => setShowPopover(false)}
                className="bg-gray-100 py-3 rounded-xl"
                accessibilityLabel="Close options"
                accessibilityRole="button"
              >
                <Text className="text-gray-700 text-base font-semibold text-center">Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    );
  }

  // Show scan/connect UI when no device is connected
  return (
    <View className="space-y-4">
      {/* No Device Connected */}
      <View className="bg-gray-50 rounded-xl p-6 border border-gray-200">
        <View className="items-center">
          <View className="w-16 h-16 rounded-full bg-gray-200 items-center justify-center mb-4">
            <Ionicons name="bluetooth-outline" size={32} color="#6B7280" />
          </View>

          <Text className="text-gray-800 text-lg font-semibold mb-2">
            No Device Connected
          </Text>
          <Text className="text-gray-500 text-base text-center mb-6">
            Connect to your E-Sight navigation device to get started
          </Text>

          <TouchableOpacity
            className="bg-blue-600 px-8 py-4 rounded-xl flex-row items-center"
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 3,
            }}
            onPress={openModal}
            accessibilityRole="button"
            accessibilityLabel="Scan for devices"
          >
            <Ionicons name="search" size={20} color="white" />
            <Text className="text-white font-semibold text-base ml-2">
              Scan for Devices
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Scanning Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={closeModal}
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
                onPress={closeModal}
                accessibilityRole="button"
                accessibilityLabel="Cancel device selection"
              >
                <Text className="text-gray-700 font-semibold text-center text-base">Cancel</Text>
              </TouchableOpacity>

              {isScanning ? (
                <TouchableOpacity
                  className="bg-red-600 px-6 py-4 rounded-xl flex-1 ml-3"
                  onPress={stopScan}
                  accessibilityRole="button"
                  accessibilityLabel="Stop scanning for devices"
                >
                  <Text className="text-white font-semibold text-center text-base">Stop Scan</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  className="bg-blue-600 px-6 py-4 rounded-xl flex-1 ml-3"
                  onPress={scanForPeripherals}
                  accessibilityRole="button"
                  accessibilityLabel="Start scanning for devices"
                >
                  <Text className="text-white font-semibold text-center text-base">Start Scan</Text>
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