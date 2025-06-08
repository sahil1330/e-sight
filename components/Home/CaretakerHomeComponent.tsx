import User from "@/schema/userSchema";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import ConnectToBlind from "./connectToBlind";

const CaretakerHomeComponent = ({ userDetails }: { userDetails: User }) => {
  const [refreshing, setRefreshing] = useState(false);
  const [ModalVisible, setModalVisible] = useState(false);
  const { width } = useWindowDimensions();
  const [selectedTab, setSelectedTab] = useState("all"); // 'all', 'active', 'inactive'
  const router = useRouter();
  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    // Add your refresh logic here
    setTimeout(() => setRefreshing(false), 2000);
  }, []);

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
      contentContainerClassName="pb-10"
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header Section */}
      <View className="bg-indigo-600 pt-6 pb-8 px-5 rounded-b-3xl shadow-md">
        <Text className="text-white text-2xl font-bold mb-1">
          Hello, {userDetails.fullName?.split(" ")[0] || "Caretaker"}
        </Text>
        <View className="flex-row items-center">
          <Text className="text-indigo-100 text-base">
            {isVerified ? "Verified Caretaker" : "Account Pending Verification"}
          </Text>
          {isVerified ? (
            <View className="ml-2 bg-green-500 rounded-full p-1">
              <Ionicons name="checkmark" size={12} color="white" />
            </View>
          ) : (
            <View className="ml-2 bg-yellow-500 rounded-full p-1">
              <Ionicons name="alert" size={12} color="white" />
            </View>
          )}
        </View>
      </View>

      {/* Main Content */}
      <View className="px-5 mt-6">
        {/* Status Summary Cards */}
        <View className="flex-row justify-between mb-6">
          <View className="bg-white rounded-xl p-4 shadow-sm w-[48%]">
            <View className="flex-row items-center justify-between">
              <Text className="text-gray-500 text-xs">People in care</Text>
              <View className="bg-indigo-100 rounded-full p-1">
                <Ionicons name="people-outline" size={16} color="#6366f1" />
              </View>
            </View>
            <Text className="text-2xl font-bold text-gray-800 mt-2">
              {userDetails.connectedUsers?.length || 0}
            </Text>
          </View>

          <View className="bg-white rounded-xl p-4 shadow-sm w-[48%]">
            <View className="flex-row items-center justify-between">
              <Text className="text-gray-500 text-xs">Active now</Text>
              <View className="bg-green-100 rounded-full p-1">
                <Ionicons name="location-outline" size={16} color="#10b981" />
              </View>
            </View>
            <Text className="text-2xl font-bold text-gray-800 mt-2">
              {/* Simulate active users count */}
              {userDetails.connectedUsers?.filter(() => Math.random() > 0.5)
                .length || 0}
            </Text>
          </View>
        </View>

        {/* User Info Card */}
        <View className="bg-white rounded-xl p-5 shadow-sm mb-6">
          <Text className="text-gray-500 text-sm mb-1">
            PROFILE INFORMATION
          </Text>

          <View className="flex-row items-center py-3 border-b border-gray-100">
            <Ionicons
              name="person-outline"
              size={20}
              color="#4b5563"
              className="mr-3"
            />
            <View>
              <Text className="text-gray-500 text-xs mb-1">Full Name</Text>
              <Text className="text-gray-800">
                {userDetails.fullName || "Not provided"}
              </Text>
            </View>
          </View>

          <View className="flex-row items-center py-3 border-b border-gray-100">
            <Ionicons
              name="mail-outline"
              size={20}
              color="#4b5563"
              className="mr-3"
            />
            <View>
              <Text className="text-gray-500 text-xs mb-1">Email Address</Text>
              <Text className="text-gray-800">
                {userDetails.email || "Not provided"}
              </Text>
            </View>
          </View>

          <View className="flex-row items-center py-3">
            <Ionicons
              name="call-outline"
              size={20}
              color="#4b5563"
              className="mr-3"
            />
            <View>
              <Text className="text-gray-500 text-xs mb-1">Phone Number</Text>
              <Text className="text-gray-800">
                {userDetails.phone || "Not provided"}
              </Text>
            </View>
          </View>
        </View>

        {/* Connected Blind Users Section */}
        <View className="bg-white rounded-xl p-5 shadow-sm">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-gray-500 text-sm">PEOPLE IN YOUR CARE</Text>
            <TouchableOpacity
              onPress={() => setModalVisible(true)}
              className="bg-indigo-500 rounded-full py-1 px-3 flex-row items-center"
            >
              <Ionicons name="person-add-outline" size={14} color="white" />
              <Text className="text-white text-xs ml-1">Add Person</Text>
            </TouchableOpacity>
          </View>

          {/* Filter Tabs */}
          <View className="flex-row border-b border-gray-200 mb-3">
            <TouchableOpacity
              onPress={() => setSelectedTab("all")}
              className={`py-2 px-4 ${
                selectedTab === "all" ? "border-b-2 border-indigo-500" : ""
              }`}
            >
              <Text
                className={
                  selectedTab === "all"
                    ? "text-indigo-600 font-medium"
                    : "text-gray-500"
                }
              >
                All
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setSelectedTab("active")}
              className={`py-2 px-4 ${
                selectedTab === "active" ? "border-b-2 border-indigo-500" : ""
              }`}
            >
              <Text
                className={
                  selectedTab === "active"
                    ? "text-indigo-600 font-medium"
                    : "text-gray-500"
                }
              >
                Active
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setSelectedTab("inactive")}
              className={`py-2 px-4 ${
                selectedTab === "inactive" ? "border-b-2 border-indigo-500" : ""
              }`}
            >
              <Text
                className={
                  selectedTab === "inactive"
                    ? "text-indigo-600 font-medium"
                    : "text-gray-500"
                }
              >
                Inactive
              </Text>
            </TouchableOpacity>
          </View>

          {hasBlindUsers ? (
            userDetails.connectedUsers?.map((blindUser, index) => {
              const status = getLocationStatus(blindUser._id);

              // Filter based on selected tab
              if (selectedTab !== "all" && status !== selectedTab) {
                return null;
              }

              return (
                <TouchableOpacity
                  key={blindUser._id}
                  className={`flex-row justify-between items-center py-3 ${
                    index < userDetails.connectedUsers!.length - 1
                      ? "border-b border-gray-100"
                      : ""
                  }`}
                  activeOpacity={0.7}
                >
                  <View className="flex-row items-center">
                    <View className="w-10 h-10 rounded-full bg-indigo-100 items-center justify-center mr-3">
                      <Text className="text-indigo-600 font-bold">
                        {blindUser.fullName?.charAt(0) || "B"}
                      </Text>
                    </View>
                    <View>
                      <Text className="text-gray-800 font-medium">
                        {blindUser.fullName || "Unknown"}
                      </Text>
                      <Text className="text-gray-500 text-xs">
                        {blindUser.email}
                      </Text>
                    </View>
                  </View>
                  <View className="flex-row items-center">
                    <View
                      className={`h-2.5 w-2.5 rounded-full ${
                        status === "active" ? "bg-green-500" : "bg-gray-300"
                      } mr-2`}
                    />
                    <TouchableOpacity className="p-2">
                      <Ionicons
                        name="locate-outline"
                        size={20}
                        color="#6366f1"
                      />
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              );
            })
          ) : (
            <View className="py-6 items-center">
              <Ionicons name="people-outline" size={48} color="#d1d5db" />
              <Text className="text-gray-400 mt-2 text-center">
                No people in your care yet
              </Text>
              <Text className="text-gray-400 text-xs text-center mt-1">
                Add a person to start monitoring their location
              </Text>
            </View>
          )}
        </View>

        {/* Quick Actions */}
        <View className="bg-white rounded-xl p-5 shadow-sm mt-6">
          <Text className="text-gray-500 text-sm mb-3">QUICK ACTIONS</Text>

          <View className="flex-row justify-between">
            <TouchableOpacity
              className="items-center w-[30%]"
              activeOpacity={0.7}
            >
              <View className="w-12 h-12 rounded-full bg-red-100 items-center justify-center mb-2">
                <Ionicons
                  name="alert-circle-outline"
                  size={24}
                  color="#ef4444"
                />
              </View>
              <Text className="text-gray-800 text-xs text-center">
                Emergency Alert
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="items-center w-[30%]"
              activeOpacity={0.7}
            >
              <View className="w-12 h-12 rounded-full bg-blue-100 items-center justify-center mb-2">
                <Ionicons name="location-outline" size={24} color="#3b82f6" />
              </View>
              <Text className="text-gray-800 text-xs text-center">
                Track Location
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="items-center w-[30%]"
              activeOpacity={0.7}
            >
              <View className="w-12 h-12 rounded-full bg-green-100 items-center justify-center mb-2">
                <Ionicons name="call-outline" size={24} color="#10b981" />
              </View>
              <Text className="text-gray-800 text-xs text-center">
                Quick Call
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
      <Modal visible={ModalVisible} animationType="slide" transparent>
        <View className="flex-1 justify-center items-center border-black bg-gray-800 bg-opacity-50 p-4">
          <View className="bg-white rounded-lg p-6 w-11/12 max-w-md border border-gray-300 shadow-lg px-4 py-4">
            <ConnectToBlind userDetails={userDetails} />
            <Pressable
              onPress={() => setModalVisible(false)}
              className="bg-indigo-600 py-2 px-4 rounded-full"
            >
              <Text className="text-white text-center">Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

export default CaretakerHomeComponent;
