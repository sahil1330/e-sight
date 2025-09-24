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
  Dimensions,
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
  // Force reload by adding console log
  console.log("BlindHomeComponent loaded with responsive design");

  const [error, setError] = useState<string | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const locationService = useRef(new LocationService()).current;
  const appState = useRef(AppState.currentState);
  const [modalVisible, setModalVisible] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { refreshUserState } = useAuth()
  // Get screen dimensions for responsive design
  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

  // Calculate responsive sizes
  const responsiveSize = {
    // Base unit for spacing (5% of screen width)
    baseUnit: screenWidth * 0.05,
    // Text sizes based on screen size
    headerText: Math.max(screenWidth * 0.055, 18),
    bodyText: Math.max(screenWidth * 0.04, 14),
    buttonText: Math.max(screenWidth * 0.045, 16),
    // Icon sizes
    iconSize: Math.max(screenWidth * 0.07, 24),
    smallIconSize: Math.max(screenWidth * 0.05, 18),
    // Container padding
    containerPadding: screenWidth * 0.04,
    // Button padding
    buttonPadding: screenHeight * 0.015,
  };

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

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      // Refresh location tracking status
      await checkServiceStatus();

      // Refresh connection status
      await checkConnectionStatus();

      if (refreshUserState) {
        await refreshUserState();
      }

      // Add a small delay for better UX
      setTimeout(() => {
        setIsRefreshing(false);
      }, 800);
    } catch (error) {
      console.error("Error during refresh:", error);
      setIsRefreshing(false);
      Alert.alert("Refresh Error", "Failed to refresh data. Please try again.");
    } finally {
      setIsRefreshing(false);
    }
  }, [checkServiceStatus, checkConnectionStatus, refreshUserState]);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#e3f2fd' }}
      contentContainerStyle={{ flexGrow: 1 }}
      scrollEnabled={false}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
          colors={['#2563eb']}
          tintColor="#2563eb"
        />
      }
      showsVerticalScrollIndicator={false}
      accessibilityLabel="E-Kaathi home screen content - responsive design"
    >
      {/* Location Tracking Status - 20% of viewport */}
      <View style={{ height: '20%', paddingHorizontal: responsiveSize.containerPadding, paddingTop: responsiveSize.baseUnit }}>
        <View style={{
          backgroundColor: 'white',
          borderRadius: responsiveSize.baseUnit,
          padding: responsiveSize.containerPadding,
          height: '100%',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 3,
          borderWidth: 1,
          borderColor: '#e5e7eb'
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: responsiveSize.baseUnit * 0.4 }}>
            <View style={{
              width: responsiveSize.baseUnit * 0.6,
              height: responsiveSize.baseUnit * 0.6,
              borderRadius: responsiveSize.baseUnit * 0.3,
              marginRight: responsiveSize.baseUnit * 0.6,
              backgroundColor: isTracking ? '#10b981' : '#9ca3af'
            }} />
            <Text
              style={{
                fontSize: responsiveSize.headerText,
                fontWeight: '600',
                color: '#1e293b',
                flex: 1
              }}
              accessibilityRole="header"
            >
              Location Tracking
            </Text>
          </View>

          <TouchableOpacity
            style={{
              paddingVertical: responsiveSize.buttonPadding,
              paddingHorizontal: responsiveSize.containerPadding,
              borderRadius: responsiveSize.baseUnit * 0.6,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              flex: 1,
              backgroundColor: isTracking ? '#dc2626' : '#10b981',
              borderWidth: 1,
              borderColor: isTracking ? '#b91c1c' : '#059669',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 3,
              elevation: 2,
            }}
            onPress={handleToggleTracking}
            accessibilityRole="button"
            accessibilityLabel={isTracking ? "Stop location tracking" : "Start location tracking"}
            accessibilityHint={isTracking ? "Double tap to stop sharing your location with caretakers" : "Double tap to start sharing your location with caretakers"}
          >
            <Ionicons
              name={isTracking ? "stop-circle" : "play-circle"}
              size={responsiveSize.iconSize}
              color="white"
            />
            <Text style={{
              color: 'white',
              fontSize: responsiveSize.buttonText,
              fontWeight: '600',
              marginLeft: responsiveSize.baseUnit * 0.6
            }}>
              {isTracking ? "Stop Tracking" : "Start Tracking"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Device Connection - 30% of viewport */}
      <View style={{ height: '35%', paddingHorizontal: responsiveSize.containerPadding, paddingVertical: responsiveSize.baseUnit * 0.4 }}>
        <View style={{
          backgroundColor: 'white',
          borderRadius: responsiveSize.baseUnit,
          padding: responsiveSize.containerPadding,
          height: '100%',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 3,
          borderWidth: 1,
          borderColor: '#e5e7eb'
        }}>
          <Text
            style={{
              fontSize: responsiveSize.headerText,
              fontWeight: '600',
              color: '#1e293b',
              marginBottom: responsiveSize.baseUnit * 0.6
            }}
            accessibilityRole="header"
          >
            Device Connection
          </Text>
          <View style={{ flex: 1 }}>
            <ConnectToDevice />
          </View>
        </View>
      </View>

      {/* Connected Caretakers - 30% of viewport with internal scrolling */}
      <View style={{ height: '30%', paddingHorizontal: responsiveSize.containerPadding, paddingVertical: responsiveSize.baseUnit * 0.4 }}>
        <View style={{
          backgroundColor: 'white',
          borderRadius: responsiveSize.baseUnit,
          padding: responsiveSize.containerPadding,
          height: '100%',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 3,
          borderWidth: 1,
          borderColor: '#e5e7eb'
        }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: responsiveSize.baseUnit * 0.6 }}>
            <Text
              style={{
                fontSize: responsiveSize.headerText,
                fontWeight: '600',
                color: '#1e293b'
              }}
              accessibilityRole="header"
            >
              Caretakers ({userDetails.connectedUsers?.length || 0})
            </Text>
            <TouchableOpacity
              style={{
                backgroundColor: '#2563eb',
                borderRadius: responsiveSize.baseUnit * 0.5,
                paddingVertical: responsiveSize.baseUnit * 0.4,
                paddingHorizontal: responsiveSize.baseUnit * 1,
                flexDirection: 'row',
                alignItems: 'center',
                borderWidth: 1,
                borderColor: '#1d4ed8',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.1,
                shadowRadius: 2,
                elevation: 1,
              }}
              onPress={() => setModalVisible(true)}
              accessibilityRole="button"
              accessibilityLabel="Add new caretaker"
              accessibilityHint="Double tap to show QR code for connecting a new caretaker"
            >
              <Ionicons name="person-add" size={responsiveSize.smallIconSize} color="white" />
              <Text style={{
                color: 'white',
                fontSize: responsiveSize.bodyText,
                fontWeight: '500',
                marginLeft: responsiveSize.baseUnit * 0.4
              }}>Add</Text>
            </TouchableOpacity>
          </View>

          {userDetails.connectedUsers && userDetails.connectedUsers.length > 0 ? (
            <ScrollView
              style={{ flex: 1 }}
              showsVerticalScrollIndicator={true}
              accessibilityLabel="List of connected caretakers"
            >
              <View style={{ gap: responsiveSize.baseUnit * 0.6 }}>
                {userDetails.connectedUsers.map((caretaker, index) => (
                  <View
                    key={caretaker._id}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      padding: responsiveSize.baseUnit * 0.6,
                      backgroundColor: '#f9fafb',
                      borderRadius: responsiveSize.baseUnit * 0.5,
                      borderWidth: 1,
                      borderColor: '#e5e7eb'
                    }}
                    accessibilityRole="text"
                    accessibilityLabel={`Caretaker: ${caretaker.fullName || "Unknown name"}, Email: ${caretaker.email}`}
                  >
                    <View style={{
                      width: responsiveSize.baseUnit * 2,
                      height: responsiveSize.baseUnit * 2,
                      borderRadius: responsiveSize.baseUnit * 0.5,
                      backgroundColor: '#dbeafe',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: responsiveSize.baseUnit * 0.6,
                      borderWidth: 1,
                      borderColor: '#93c5fd'
                    }}>
                      <Text style={{
                        color: '#1d4ed8',
                        fontSize: responsiveSize.bodyText,
                        fontWeight: '600'
                      }}>
                        {caretaker.fullName?.charAt(0) || "C"}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{
                        color: '#1e293b',
                        fontSize: responsiveSize.bodyText,
                        fontWeight: '600'
                      }}>
                        {caretaker.fullName || "Unknown"}
                      </Text>
                      <Text style={{
                        color: '#64748b',
                        fontSize: responsiveSize.bodyText * 0.9,
                        marginTop: responsiveSize.baseUnit * 0.1
                      }}>
                        {caretaker.email}
                      </Text>
                    </View>
                    <View style={{
                      width: responsiveSize.baseUnit * 0.5,
                      height: responsiveSize.baseUnit * 0.5,
                      borderRadius: responsiveSize.baseUnit * 0.25,
                      backgroundColor: '#10b981',
                      borderWidth: 1,
                      borderColor: '#059669'
                    }}
                      accessibilityLabel="Connected and active" />
                  </View>
                ))}
              </View>
            </ScrollView>
          ) : (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <Ionicons name="people-outline" size={responsiveSize.iconSize * 2} color="#9ca3af" />
              <Text
                style={{
                  color: '#64748b',
                  fontSize: responsiveSize.bodyText,
                  marginTop: responsiveSize.baseUnit * 0.6,
                  textAlign: 'center',
                  fontWeight: '500'
                }}
                accessibilityLabel="No caretakers connected. Add a caretaker to help monitor your location and provide assistance."
              >
                No caretakers connected yet
              </Text>
              <Text style={{
                color: '#9ca3af',
                fontSize: responsiveSize.bodyText * 0.9,
                textAlign: 'center',
                marginTop: responsiveSize.baseUnit * 0.4,
                lineHeight: responsiveSize.bodyText * 1.3
              }}>
                Add a caretaker to help monitor your location and provide assistance when needed
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Emergency Button - 10% of viewport */}
      <View style={{ height: '10%', paddingHorizontal: responsiveSize.containerPadding, paddingVertical: responsiveSize.baseUnit * 0.4 }}>
        <TouchableOpacity
          style={{
            backgroundColor: '#dc2626',
            borderRadius: responsiveSize.baseUnit,
            height: '100%',
            justifyContent: 'center',
            alignItems: 'center',
            borderWidth: 1,
            borderColor: '#b91c1c',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 3 },
            shadowOpacity: 0.2,
            shadowRadius: 5,
            elevation: 4,
          }}
          onPress={handleEmergencyPress}
          accessibilityRole="button"
          accessibilityLabel="Emergency assistance button"
          accessibilityHint="Double tap to send emergency alert to all connected caretakers with your current location"
        >
          <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
            <Ionicons name="warning" size={responsiveSize.iconSize} color="white" />
            <Text style={{
              color: 'white',
              fontWeight: '600',
              fontSize: responsiveSize.buttonText,
              marginLeft: responsiveSize.baseUnit * 0.6
            }}>
              Emergency Assistance
            </Text>
          </View>
          <Text style={{
            color: '#fecaca',
            fontSize: responsiveSize.bodyText * 0.9,
            textAlign: 'center',
            marginTop: responsiveSize.baseUnit * 0.2,
            fontWeight: '500'
          }}>
            Tap to alert all caretakers
          </Text>
        </TouchableOpacity>
      </View>

      {/* QR Code Modal - Responsive design */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
        accessibilityViewIsModal={true}
      >
        <View style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          paddingHorizontal: responsiveSize.containerPadding
        }}>
          <View style={{
            backgroundColor: 'white',
            borderRadius: responsiveSize.baseUnit,
            padding: responsiveSize.containerPadding,
            width: '100%',
            maxWidth: screenWidth * 0.85,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.2,
            shadowRadius: 8,
            elevation: 5,
            borderWidth: 1,
            borderColor: '#e5e7eb'
          }}>
            <Text
              style={{
                color: '#1e293b',
                fontSize: responsiveSize.headerText,
                fontWeight: '600',
                marginBottom: responsiveSize.baseUnit,
                textAlign: 'center'
              }}
              accessibilityRole="header"
            >
              Your Connection Code
            </Text>
            <Text
              style={{
                color: '#64748b',
                fontSize: responsiveSize.bodyText,
                marginBottom: responsiveSize.baseUnit * 1.2,
                textAlign: 'center',
                lineHeight: responsiveSize.bodyText * 1.4
              }}
              accessibilityLabel="Share this QR code with your caretakers to connect with them. They can scan this code using their camera app."
            >
              Share this code with your caretakers to connect with them. They can scan it using their camera.
            </Text>

            <View
              style={{
                backgroundColor: '#f9fafb',
                borderWidth: 2,
                borderStyle: 'dashed',
                borderColor: '#d1d5db',
                padding: responsiveSize.baseUnit * 1.2,
                borderRadius: responsiveSize.baseUnit * 0.5,
                marginBottom: responsiveSize.baseUnit * 1.2,
                alignItems: 'center'
              }}
              accessibilityLabel="QR Code for connection"
            >
              <QRCode
                value={userDetails._id}
                size={Math.min(screenWidth * 0.45, 200)}
                backgroundColor="transparent"
                color="#1F2937"
              />
            </View>

            <TouchableOpacity
              style={{
                backgroundColor: '#2563eb',
                paddingVertical: responsiveSize.buttonPadding,
                paddingHorizontal: responsiveSize.containerPadding,
                borderRadius: responsiveSize.baseUnit * 0.5,
                borderWidth: 1,
                borderColor: '#1d4ed8',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 3,
                elevation: 2,
              }}
              onPress={() => setModalVisible(false)}
              accessibilityRole="button"
              accessibilityLabel="Close QR code modal"
            >
              <Text style={{
                color: 'white',
                textAlign: 'center',
                fontSize: responsiveSize.bodyText,
                fontWeight: '600'
              }}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

export default BlindHomeComponent;
