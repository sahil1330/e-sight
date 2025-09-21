import { useAuth } from "@/context/AuthContext";
import User from "@/schema/userSchema";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Linking,
  Modal,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import ConnectToBlind from "./connectToBlind";

const CaretakerHomeComponent = ({ userDetails }: { userDetails: User }) => {
  const [refreshing, setRefreshing] = useState(false);
  const [ModalVisible, setModalVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();
  const { refreshUserState } = useAuth();
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    // Add your refresh logic here
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
  useEffect(() => {
    if (error) {
      Alert.alert("Error", error);
      setError(null); // Reset error after showing alert
    }
  }, [error]);
  const isVerified = userDetails.isVerified || false;
  const hasBlindUsers =
    userDetails.connectedUsers && userDetails.connectedUsers.length > 0;

  // Mock data for location status (in a real app, this would come from backend)
  const getLocationStatus = (userId: string | undefined) => {
    // This is just for UI demonstration - in real app, use actual data
    const statuses = ["active", "inactive"];
    return statuses[Math.floor(Math.random() * statuses.length)];
  };

  return (
    <ScrollView
      className="flex-1 bg-gray-50"
      contentContainerClassName="pb-6"
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      accessibilityLabel="Caretaker monitoring dashboard"
      showsVerticalScrollIndicator={false}
    >
      {/* Welcome Header */}
      <View className="bg-indigo-600 px-6 py-5">
        <Text
          className="text-white text-xl font-bold mb-1"
          accessibilityRole="header"
          accessibilityLabel={`Welcome to E-Kaathi Dashboard, ${userDetails.fullName?.split(" ")[0] || "Caretaker"}`}
        >
          Welcome, {userDetails.fullName?.split(" ")[0] || "Caretaker"}
        </Text>
        <Text className="text-indigo-100 text-sm font-medium">
          E-Kaathi Monitoring Dashboard
        </Text>
        <View className="mt-3">
          {isVerified ? (
            <View className="bg-emerald-500 rounded-lg px-3 py-1.5 flex-row items-center self-start">
              <Ionicons name="checkmark-circle" size={16} color="white" />
              <Text className="text-white text-sm font-semibold ml-1.5">Verified Caretaker</Text>
            </View>
          ) : (
            <View className="bg-amber-500 rounded-lg px-3 py-1.5 flex-row items-center self-start">
              <Ionicons name="alert-circle" size={16} color="white" />
              <Text className="text-white text-sm font-semibold ml-1.5">Pending Verification</Text>
            </View>
          )}
        </View>
      </View>

      <View className="px-5 mt-5 space-y-5">
        {/* Summary Cards */}
        <View className="flex-row space-x-4">
          <View className="bg-white rounded-xl p-5 flex-1 shadow-sm border border-gray-100">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-gray-600 text-sm font-semibold">
                People in Care
              </Text>
              <View className="bg-indigo-100 rounded-lg p-2">
                <Ionicons name="people" size={18} color="#4F46E5" />
              </View>
            </View>
            <Text className="text-gray-900 text-2xl font-bold">
              {userDetails.connectedUsers?.length || 0}
            </Text>
          </View>

          <View className="bg-white rounded-xl p-5 flex-1 shadow-sm border border-gray-100">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-gray-600 text-sm font-semibold">
                Active Now
              </Text>
              <View className="bg-emerald-100 rounded-lg p-2">
                <Ionicons name="pulse" size={18} color="#10B981" />
              </View>
            </View>
            <Text className="text-gray-900 text-2xl font-bold">
              {userDetails.connectedUsers?.filter(() => Math.random() > 0.5).length || 0}
            </Text>
          </View>
        </View>

        {/* People Under Care */}
        <View className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-gray-900 text-lg font-bold">
              People Under Care
            </Text>
            <TouchableOpacity
              className="bg-indigo-600 rounded-lg py-2.5 px-4 flex-row items-center"
              onPress={() => setModalVisible(true)}
              accessibilityRole="button"
              accessibilityLabel="Add new person to care"
            >
              <Ionicons name="person-add" size={16} color="white" />
              <Text className="text-white text-sm font-semibold ml-1.5">Add Person</Text>
            </TouchableOpacity>
          </View>

          {hasBlindUsers ? (
            <View className="space-y-3">
              {userDetails.connectedUsers?.map((blindUser, index) => {
                const status = getLocationStatus(blindUser._id);
                return (
                  <TouchableOpacity
                    key={blindUser._id}
                    className="flex-row items-center p-4 bg-gray-50 rounded-xl border border-gray-200"
                    onPress={() => router.push("/(protected)/(tabs)/location")}
                    accessibilityRole="button"
                    accessibilityLabel={`View ${blindUser.fullName || "Unknown"}'s location and details`}
                  >
                    <View className="w-12 h-12 rounded-xl bg-indigo-100 items-center justify-center mr-4">
                      <Text className="text-indigo-700 text-lg font-bold">
                        {blindUser.fullName?.charAt(0) || "B"}
                      </Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-gray-900 text-base font-semibold">
                        {blindUser.fullName || "Unknown"}
                      </Text>
                      <Text className="text-gray-500 text-sm mt-0.5">
                        {blindUser.email}
                      </Text>
                      <View className="flex-row items-center mt-2">
                        <View className={`h-2.5 w-2.5 rounded-full ${status === "active" ? "bg-emerald-500" : "bg-gray-400"} mr-2`} />
                        <Text className={`text-sm font-medium ${status === "active" ? "text-emerald-600" : "text-gray-500"}`}>
                          {status === "active" ? "Location Active" : "Offline"}
                        </Text>
                      </View>
                    </View>
                    <View className="flex-row items-center space-x-2">
                      <TouchableOpacity
                        className="p-2.5 bg-emerald-100 rounded-lg"
                        onPress={() => Linking.openURL(`tel:${blindUser.phone || ""}`)}
                        accessibilityRole="button"
                        accessibilityLabel={`Call ${blindUser.fullName || "this person"}`}
                      >
                        <Ionicons name="call" size={18} color="#10B981" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        className="p-2.5 bg-blue-100 rounded-lg"
                        onPress={() => router.push("/(protected)/(tabs)/location")}
                        accessibilityRole="button"
                        accessibilityLabel="View location"
                      >
                        <Ionicons name="location" size={18} color="#3B82F6" />
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
            <View className="py-8 items-center">
              <View className="w-16 h-16 rounded-full bg-gray-100 items-center justify-center mb-4">
                <Ionicons name="people-outline" size={28} color="#9CA3AF" />
              </View>
              <Text className="text-gray-700 text-base font-semibold text-center mb-1">
                No people in your care yet
              </Text>
              <Text className="text-gray-500 text-sm text-center">
                Add someone to start monitoring their safety
              </Text>
            </View>
          )}
        </View>

        {/* Quick Actions */}
        <View className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <Text className="text-gray-900 text-lg font-bold mb-4">
            Quick Actions
          </Text>

          <View className="flex-row space-x-3">
            <TouchableOpacity
              className="flex-1 bg-red-50 p-4 rounded-xl border border-red-200 items-center"
              onPress={() => router.push("/(protected)/(tabs)/notifications")}
              accessibilityRole="button"
              accessibilityLabel="Send emergency alert"
            >
              <View className="w-12 h-12 bg-red-100 rounded-xl items-center justify-center mb-3">
                <Ionicons name="warning" size={24} color="#EF4444" />
              </View>
              <Text className="text-red-700 text-sm font-semibold text-center">
                Emergency Alert
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-1 bg-blue-50 p-4 rounded-xl border border-blue-200 items-center"
              onPress={() => router.push("/(protected)/(tabs)/location")}
              accessibilityRole="button"
              accessibilityLabel="View all locations"
            >
              <View className="w-12 h-12 bg-blue-100 rounded-xl items-center justify-center mb-3">
                <Ionicons name="map" size={24} color="#3B82F6" />
              </View>
              <Text className="text-blue-700 text-sm font-semibold text-center">
                View Locations
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-1 bg-emerald-50 p-4 rounded-xl border border-emerald-200 items-center"
              onPress={() => setModalVisible(true)}
              accessibilityRole="button"
              accessibilityLabel="Add new person"
            >
              <View className="w-12 h-12 bg-emerald-100 rounded-xl items-center justify-center mb-3">
                <Ionicons name="person-add" size={24} color="#10B981" />
              </View>
              <Text className="text-emerald-700 text-sm font-semibold text-center">
                Add Person
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Add Person Modal */}
      <Modal visible={ModalVisible} animationType="slide" transparent>
        <View className="flex-1 justify-center items-center bg-black/50 p-5">
          <View className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <Text className="text-gray-900 text-xl font-bold mb-5 text-center">
              Add Person to Care
            </Text>
            <ConnectToBlind userDetails={userDetails} />
            <TouchableOpacity
              onPress={() => setModalVisible(false)}
              className="bg-indigo-600 py-3 px-6 rounded-xl mt-5"
              accessibilityRole="button"
              accessibilityLabel="Close modal"
            >
              <Text className="text-white text-center text-base font-semibold">Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

export default CaretakerHomeComponent;
