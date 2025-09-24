import useBLE from "@/hooks/useBLE";
import { Ionicons } from "@expo/vector-icons";
import Entypo from "@expo/vector-icons/Entypo";
import Feather from "@expo/vector-icons/Feather";
import React, { useEffect } from "react";
import { ActivityIndicator, Alert, Dimensions, FlatList, Modal, Text, TouchableOpacity, View } from "react-native";
import { Device } from "react-native-ble-plx";

const ConnectToDevice = () => {
  const [isDeviceConnected, setIsDeviceConnected] = React.useState(false);
  const [deviceName, setDeviceName] = React.useState("");
  const [modalVisible, setModalVisible] = React.useState(false);
  const [isConnecting, setIsConnecting] = React.useState(false);
  const [showPopover, setShowPopover] = React.useState(false);

  // Get responsive sizes
  const { width: screenWidth } = Dimensions.get('window');
  const responsiveSize = {
    baseUnit: screenWidth * 0.04,
    iconSize: Math.max(screenWidth * 0.05, 20),
    smallIconSize: Math.max(screenWidth * 0.04, 16),
    textSize: Math.max(screenWidth * 0.05, 14),
    smallTextSize: Math.max(screenWidth * 0.03, 12),
  };

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
      setModalVisible(true);
    } else {
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

  // Render device item - Responsive
  const renderDevice = ({ item }: { item: Device }) => (
    <TouchableOpacity
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        padding: responsiveSize.baseUnit * 0.8,
        backgroundColor: 'white',
        borderRadius: responsiveSize.baseUnit * 0.6,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        marginHorizontal: responsiveSize.baseUnit * 0.2,
        marginVertical: responsiveSize.baseUnit * 0.2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 1,
      }}
      onPress={() => handleConnectToDevice(item)}
      disabled={isConnecting}
      accessibilityRole="button"
      accessibilityLabel={`Connect to ${item.name || 'Unknown Device'}`}
    >
      <View style={{
        width: responsiveSize.baseUnit * 2.4,
        height: responsiveSize.baseUnit * 2.4,
        borderRadius: responsiveSize.baseUnit * 1.2,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: responsiveSize.baseUnit * 0.8
      }}>
        <Ionicons name="bluetooth" size={responsiveSize.iconSize} color="#3b82f6" />
      </View>

      <View style={{ flex: 1 }}>
        <Text style={{
          color: '#1f2937',
          fontSize: responsiveSize.textSize,
          fontWeight: '600'
        }}>
          {item.name || "Unknown Device"}
        </Text>
        <Text style={{
          color: '#6b7280',
          fontSize: responsiveSize.smallTextSize
        }}>
          {item.id}
        </Text>
      </View>

      {isConnecting ? (
        <ActivityIndicator size="small" color="#3b82f6" />
      ) : (
        <Ionicons name="chevron-forward" size={responsiveSize.iconSize} color="#9ca3af" />
      )}
    </TouchableOpacity>
  );

  // Show connected device UI
  if (isDeviceConnected && connectedDevice) {
    return (
      <View style={{ flex: 1 }}>
        {/* Main Connection Status - Compact */}
        <View style={{
          backgroundColor: '#f0fdf4',
          borderRadius: responsiveSize.baseUnit,
          padding: responsiveSize.baseUnit,
          borderWidth: 1,
          borderColor: '#bbf7d0',
          flex: 1
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              <View style={{
                width: responsiveSize.baseUnit * 2,
                height: responsiveSize.baseUnit * 2,
                borderRadius: responsiveSize.baseUnit,
                backgroundColor: '#dcfce7',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: responsiveSize.baseUnit * 0.7
              }}>
                <Ionicons name="bluetooth-outline" size={responsiveSize.iconSize} color="#059669" />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={{
                  color: '#065f46',
                  fontSize: responsiveSize.textSize,
                  fontWeight: '600'
                }}>
                  {deviceName}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: responsiveSize.baseUnit * 0.1 }}>
                  <View style={{
                    width: responsiveSize.baseUnit * 0.4,
                    height: responsiveSize.baseUnit * 0.4,
                    borderRadius: responsiveSize.baseUnit * 0.2,
                    backgroundColor: '#10b981',
                    marginRight: responsiveSize.baseUnit * 0.3
                  }} />
                  <Text style={{
                    color: '#059669',
                    fontSize: responsiveSize.smallTextSize,
                    fontWeight: '500'
                  }}>
                    {connectionState === 'connected' ? 'Connected' :
                      connectionState === 'connecting' ? 'Connecting...' : 'Disconnected'}
                  </Text>
                </View>
                {isBackgroundServiceActive && (
                  <Text style={{
                    color: '#059669',
                    fontSize: responsiveSize.smallTextSize * 0.9,
                    marginTop: responsiveSize.baseUnit * 0.1
                  }}>
                    Monitoring active
                  </Text>
                )}
              </View>
            </View>

            {/* Compact Options Button */}
            <TouchableOpacity
              onPress={() => setShowPopover(true)}
              style={{
                width: responsiveSize.baseUnit * 1.8,
                height: responsiveSize.baseUnit * 1.8,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: responsiveSize.baseUnit * 0.9,
                backgroundColor: '#dcfce7'
              }}
              accessibilityLabel="Device options"
              accessibilityRole="button"
            >
              <Entypo name="dots-three-vertical" size={responsiveSize.smallIconSize} color="#059669" />
            </TouchableOpacity>
          </View>

          {/* Connection Status Indicators - Compact */}
          {connectionState === 'connecting' && (
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginTop: responsiveSize.baseUnit * 0.5,
              padding: responsiveSize.baseUnit * 0.5,
              backgroundColor: '#fef3c7',
              borderRadius: responsiveSize.baseUnit * 0.5
            }}>
              <ActivityIndicator size="small" color="#d97706" />
              <Text style={{
                color: '#92400e',
                fontSize: responsiveSize.smallTextSize,
                marginLeft: responsiveSize.baseUnit * 0.4
              }}>
                Connecting...
              </Text>
            </View>
          )}

          {connectionState === 'disconnected' && connectedDevice && (
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginTop: responsiveSize.baseUnit * 0.5,
              padding: responsiveSize.baseUnit * 0.5,
              backgroundColor: '#fee2e2',
              borderRadius: responsiveSize.baseUnit * 0.5
            }}>
              <Ionicons name="warning-outline" size={responsiveSize.smallIconSize} color="#dc2626" />
              <Text style={{
                color: '#b91c1c',
                fontSize: responsiveSize.smallTextSize,
                marginLeft: responsiveSize.baseUnit * 0.4
              }}>
                Connection lost
              </Text>
            </View>
          )}
        </View>

        {/* Device Options Modal */}
        <Modal
          animationType="fade"
          transparent={true}
          visible={showPopover}
          onRequestClose={() => setShowPopover(false)}
        >
          <View style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'rgba(0,0,0,0.5)',
            paddingHorizontal: responsiveSize.baseUnit
          }}>
            <View style={{
              backgroundColor: 'white',
              borderRadius: responsiveSize.baseUnit,
              padding: responsiveSize.baseUnit * 1.2,
              width: '100%',
              maxWidth: screenWidth * 0.8
            }}>
              <Text style={{
                fontSize: responsiveSize.textSize * 1.2,
                fontWeight: '700',
                color: '#1f2937',
                marginBottom: responsiveSize.baseUnit,
                textAlign: 'center'
              }}>
                Device Options
              </Text>

              {/* Health Check Option */}
              <TouchableOpacity
                onPress={handleConnectionHealthCheck}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: responsiveSize.baseUnit * 0.7,
                  paddingHorizontal: responsiveSize.baseUnit * 0.4
                }}
              >
                <View style={{
                  width: responsiveSize.baseUnit * 1.8,
                  height: responsiveSize.baseUnit * 1.8,
                  borderRadius: responsiveSize.baseUnit * 0.9,
                  backgroundColor: '#dbeafe',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: responsiveSize.baseUnit * 0.7
                }}>
                  <Ionicons name="pulse-outline" size={responsiveSize.iconSize} color="#3b82f6" />
                </View>
                <Text style={{ color: '#1f2937', fontSize: responsiveSize.textSize, fontWeight: '600' }}>Check Connection</Text>
              </TouchableOpacity>

              {/* Disconnect Option */}
              <TouchableOpacity
                onPress={handleDisconnectDevice}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: responsiveSize.baseUnit * 0.7,
                  paddingHorizontal: responsiveSize.baseUnit * 0.4
                }}
              >
                <View style={{
                  width: responsiveSize.baseUnit * 1.8,
                  height: responsiveSize.baseUnit * 1.8,
                  borderRadius: responsiveSize.baseUnit * 0.9,
                  backgroundColor: '#fee2e2',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: responsiveSize.baseUnit * 0.7
                }}>
                  <Feather name="x-circle" size={responsiveSize.iconSize} color="#dc2626" />
                </View>
                <Text style={{ color: '#1f2937', fontSize: responsiveSize.textSize, fontWeight: '600' }}>Disconnect</Text>
              </TouchableOpacity>

              {/* Forget Device Option */}
              <TouchableOpacity
                onPress={handleForgetDevice}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: responsiveSize.baseUnit * 0.7,
                  paddingHorizontal: responsiveSize.baseUnit * 0.4,
                  marginBottom: responsiveSize.baseUnit * 0.7
                }}
              >
                <View style={{
                  width: responsiveSize.baseUnit * 1.8,
                  height: responsiveSize.baseUnit * 1.8,
                  borderRadius: responsiveSize.baseUnit * 0.9,
                  backgroundColor: '#fed7aa',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: responsiveSize.baseUnit * 0.7
                }}>
                  <Ionicons name="trash-outline" size={responsiveSize.iconSize} color="#ea580c" />
                </View>
                <Text style={{ color: '#1f2937', fontSize: responsiveSize.textSize, fontWeight: '600' }}>Forget Device</Text>
              </TouchableOpacity>

              {/* Close Button */}
              <TouchableOpacity
                onPress={() => setShowPopover(false)}
                style={{
                  backgroundColor: '#f3f4f6',
                  paddingVertical: responsiveSize.baseUnit * 0.6,
                  borderRadius: responsiveSize.baseUnit * 0.6
                }}
              >
                <Text style={{
                  color: '#374151',
                  fontSize: responsiveSize.textSize,
                  fontWeight: '600',
                  textAlign: 'center'
                }}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    );
  }

  // Show scan/connect UI when no device is connected
  return (
    <View style={{ flex: 1 }}>
      {/* No Device Connected - Compact */}
      <View style={{
        borderRadius: responsiveSize.baseUnit,
        padding: responsiveSize.baseUnit * 1.2,
        alignItems: 'center',
        flex: 1,
        justifyContent: 'center'
      }}>
        <View style={{
          width: responsiveSize.baseUnit * 3,
          height: responsiveSize.baseUnit * 3,
          borderRadius: responsiveSize.baseUnit * 1.5,
          backgroundColor: '#e5e7eb',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: responsiveSize.baseUnit * 0.7
        }}>
          <Ionicons name="bluetooth-outline" size={responsiveSize.iconSize * 1.5} color="#6b7280" />
        </View>

        <Text style={{
          color: '#1f2937',
          fontSize: responsiveSize.textSize,
          fontWeight: '600',
          marginBottom: responsiveSize.baseUnit * 0.3
        }}>
          No Device Connected
        </Text>
        <Text style={{
          color: '#6b7280',
          fontSize: responsiveSize.smallTextSize,
          textAlign: 'center',
          marginBottom: responsiveSize.baseUnit * 0.8
        }}>
          Connect to your E-Kaathi device to get started
        </Text>

        <TouchableOpacity
          style={{
            backgroundColor: '#2563eb',
            paddingHorizontal: responsiveSize.baseUnit * 3.5,
            paddingVertical: responsiveSize.baseUnit * 1.2,
            borderRadius: responsiveSize.baseUnit * 0.6,
            flexDirection: 'row',
            alignItems: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 3,
            elevation: 2,
          }}
          onPress={openModal}
          accessibilityRole="button"
          accessibilityLabel="Scan for devices"
        >
          <Ionicons name="search" size={responsiveSize.iconSize} color="white" />
          <Text style={{
            color: 'white',
            fontWeight: '600',
            fontSize: responsiveSize.textSize,
            marginLeft: responsiveSize.baseUnit * 0.4,
          }}>
            Scan for Devices
          </Text>
        </TouchableOpacity>
      </View>

      {/* Scanning Modal - Responsive */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={closeModal}
      >
        <View style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: 'rgba(0,0,0,0.5)',
          paddingHorizontal: responsiveSize.baseUnit
        }}>
          <View style={{
            backgroundColor: 'white',
            borderRadius: responsiveSize.baseUnit,
            padding: responsiveSize.baseUnit * 1.2,
            width: '100%',
            maxWidth: screenWidth * 0.9,
            maxHeight: screenWidth * 0.8
          }}>
            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: responsiveSize.baseUnit * 1.2
            }}>
              <Text style={{
                fontSize: responsiveSize.textSize * 1.2,
                fontWeight: '700',
                color: '#1f2937'
              }}>
                Available Devices
              </Text>
              <TouchableOpacity
                onPress={closeModal}
                accessibilityRole="button"
                accessibilityLabel="Close device selection"
              >
                <Feather name="x" size={responsiveSize.iconSize * 1.2} color="black" />
              </TouchableOpacity>
            </View>

            {isScanning && (
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                paddingVertical: responsiveSize.baseUnit * 1.2
              }}>
                <ActivityIndicator size="large" color="#3b82f6" />
                <Text style={{
                  marginLeft: responsiveSize.baseUnit * 0.6,
                  color: '#6b7280',
                  fontSize: responsiveSize.textSize
                }}>Scanning...</Text>
              </View>
            )}

            {allDevices.length === 0 && !isScanning ? (
              <View style={{
                paddingVertical: responsiveSize.baseUnit * 2,
                alignItems: 'center'
              }}>
                <Ionicons name="bluetooth-outline" size={responsiveSize.iconSize * 2.5} color="#9ca3af" />
                <Text style={{
                  color: '#6b7280',
                  fontSize: responsiveSize.textSize,
                  textAlign: 'center',
                  marginTop: responsiveSize.baseUnit * 0.8
                }}>
                  No devices found
                </Text>
                <Text style={{
                  color: '#9ca3af',
                  fontSize: responsiveSize.smallTextSize,
                  textAlign: 'center',
                  marginTop: responsiveSize.baseUnit * 0.4
                }}>
                  Make sure your device is discoverable
                </Text>
                <TouchableOpacity
                  style={{
                    backgroundColor: '#2563eb',
                    paddingHorizontal: responsiveSize.baseUnit * 1.2,
                    paddingVertical: responsiveSize.baseUnit * 0.8,
                    borderRadius: responsiveSize.baseUnit * 0.6,
                    marginTop: responsiveSize.baseUnit * 1.2
                  }}
                  onPress={scanForPeripherals}
                  accessibilityRole="button"
                  accessibilityLabel="Scan again for devices"
                >
                  <Text style={{
                    color: 'white',
                    fontWeight: '600',
                    fontSize: responsiveSize.textSize
                  }}>Scan Again</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <FlatList
                data={allDevices}
                renderItem={renderDevice}
                keyExtractor={(item) => item.id}
                style={{ maxHeight: screenWidth * 0.5 }}
                showsVerticalScrollIndicator={false}
              />
            )}

            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              marginTop: responsiveSize.baseUnit,
              gap: responsiveSize.baseUnit * 0.6
            }}>
              <TouchableOpacity
                style={{
                  backgroundColor: '#e5e7eb',
                  paddingHorizontal: responsiveSize.baseUnit * 1.2,
                  paddingVertical: responsiveSize.baseUnit * 0.8,
                  borderRadius: responsiveSize.baseUnit * 0.6,
                  flex: 1
                }}
                onPress={closeModal}
                accessibilityRole="button"
                accessibilityLabel="Cancel device selection"
              >
                <Text style={{
                  color: '#374151',
                  fontWeight: '600',
                  textAlign: 'center',
                  fontSize: responsiveSize.textSize
                }}>Cancel</Text>
              </TouchableOpacity>

              {isScanning ? (
                <TouchableOpacity
                  style={{
                    backgroundColor: '#dc2626',
                    paddingHorizontal: responsiveSize.baseUnit * 1.2,
                    paddingVertical: responsiveSize.baseUnit * 0.8,
                    borderRadius: responsiveSize.baseUnit * 0.6,
                    flex: 1
                  }}
                  onPress={stopScan}
                  accessibilityRole="button"
                  accessibilityLabel="Stop scanning for devices"
                >
                  <Text style={{
                    color: 'white',
                    fontWeight: '600',
                    textAlign: 'center',
                    fontSize: responsiveSize.textSize
                  }}>Stop Scan</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={{
                    backgroundColor: '#2563eb',
                    paddingHorizontal: responsiveSize.baseUnit * 1.2,
                    paddingVertical: responsiveSize.baseUnit * 0.8,
                    borderRadius: responsiveSize.baseUnit * 0.6,
                    flex: 1
                  }}
                  onPress={scanForPeripherals}
                  accessibilityRole="button"
                  accessibilityLabel="Start scanning for devices"
                >
                  <Text style={{
                    color: 'white',
                    fontWeight: '600',
                    textAlign: 'center',
                    fontSize: responsiveSize.textSize
                  }}>Start Scan</Text>
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