import useBLE from "@/hooks/useBLE";
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
    <View className="flex-row justify-between items-center p-4 border-b border-gray-200">
      <View className="flex-1">
        <Text className="text-lg font-semibold text-gray-800">
          {item.name || "Unknown Device"}
        </Text>
        <Text className="text-sm text-gray-500">
          {item.id}
        </Text>
      </View>
      <TouchableOpacity
        className="bg-blue-500 px-4 py-2 rounded-lg"
        onPress={() => handleConnectToDevice(item)}
        disabled={isConnecting}
      >
        <Text className="text-white font-medium">
          {(item.id === connectedDevice?.id && isConnecting) ? "Connecting..." : "Connect"}
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View className="flex-1 items-center justify-center">
      {!isDeviceConnected ? (
        <View className="connection-box w-2/3 rounded-lg p-4 bg-white shadow-md flex justify-center items-center">
          <TouchableOpacity
            className="rounded-full bg-blue-100 p-4 mb-4"
            onPress={openModal}
          >
            <Entypo name="plus" size={24} color="black" />
          </TouchableOpacity>
          <Text className="text-gray-600 text-center">
            Tap to connect to a device
          </Text>
        </View>
      ) : (
        <View className="connection-box w-full rounded-lg p-4 bg-green-50 shadow-md flex flex-row justify-between items-center relative">
          <View className="flex-1">
            <Text className="text-xl font-semibold mb-2 text-green-800">
              {deviceName || "Connected Device"}
            </Text>
            <Text className="text-sm text-green-600">
              Status: Connected
            </Text>
          </View>

          <View className="relative">
            <TouchableOpacity
              className="p-2"
              onPress={() => setShowPopover(!showPopover)}
            >
              <Feather name="more-vertical" size={24} color="black" />
            </TouchableOpacity>

            {/* Popover Menu */}
            {showPopover && (
              <>
                {/* Backdrop to close popover */}
                <TouchableOpacity
                  className="absolute inset-0 w-screen h-screen -top-2 -right-2"
                  style={{ zIndex: 1 }}
                  onPress={() => setShowPopover(false)}
                  activeOpacity={1}
                />

                {/* Popover Content */}
                <View
                  className="absolute right-0 top-10 bg-white rounded-lg shadow-lg border border-gray-200 min-w-40"
                  style={{ zIndex: 10 }}
                >
                  <TouchableOpacity
                    className="px-4 py-3 border-b border-gray-100"
                    onPress={handleDisconnectDevice}
                  >
                    <View className="flex-row items-center">
                      <Feather name="x-circle" size={16} color="#EF4444" />
                      <Text className="ml-2 text-red-500 font-medium">
                        Disconnect
                      </Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    className="px-4 py-3"
                    onPress={() => setShowPopover(false)}
                  >
                    <View className="flex-row items-center">
                      <Feather name="info" size={16} color="#6B7280" />
                      <Text className="ml-2 text-gray-600 font-medium">
                        Device Info
                      </Text>
                    </View>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      )}

      {/* Device Selection Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={closeModal}
      >
        <View className="flex-1 justify-center items-center bg-black bg-opacity-50">
          <View className="bg-white rounded-lg p-6 w-4/5 max-h-96">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-xl font-bold text-gray-800">
                Available Devices
              </Text>
              <TouchableOpacity onPress={closeModal}>
                <Feather name="x" size={24} color="black" />
              </TouchableOpacity>
            </View>

            {isScanning && (
              <View className="flex-row items-center justify-center py-4">
                <ActivityIndicator size="small" color="#3B82F6" />
                <Text className="ml-2 text-gray-600">Scanning for devices...</Text>
              </View>
            )}

            {allDevices.length === 0 && !isScanning ? (
              <View className="py-8 items-center">
                <Text className="text-gray-500 text-center">
                  No devices found. Make sure your device is discoverable.
                </Text>
                <TouchableOpacity
                  className="bg-blue-500 px-4 py-2 rounded-lg mt-4"
                  onPress={scanForPeripherals}
                >
                  <Text className="text-white font-medium">Scan Again</Text>
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

            <View className="flex-row justify-between mt-4">
              <TouchableOpacity
                className="bg-gray-300 px-4 py-2 rounded-lg flex-1 mr-2"
                onPress={closeModal}
              >
                <Text className="text-gray-700 font-medium text-center">Cancel</Text>
              </TouchableOpacity>

              {isScanning ? (
                <TouchableOpacity
                  className="bg-red-500 px-4 py-2 rounded-lg flex-1 ml-2"
                  onPress={stopScan}
                >
                  <Text className="text-white font-medium text-center">Stop Scan</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  className="bg-blue-500 px-4 py-2 rounded-lg flex-1 ml-2"
                  onPress={scanForPeripherals}
                >
                  <Text className="text-white font-medium text-center">Scan</Text>
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
