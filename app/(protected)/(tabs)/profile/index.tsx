import ProfileAvatar from "@/components/Profile/ProfileAvatar";
import ProfileSection from "@/components/Profile/ProfileSection";
import { useAuth } from "@/context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ProfileScreen() {
  const { logout, authState } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const user = authState?.userDetails;

  const handleLogout = async () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          if (logout) {
            setLoading(true);
            try {
              await logout();
              router.replace("/(auth)/sign-in");
            } catch (error) {
              Alert.alert("Error", "Failed to logout. Please try again.");
            } finally {
              setLoading(false);
            }
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1" contentContainerClassName="pb-8">
        {/* Profile Header */}
        <View className="bg-blue-500 pt-6 pb-8 px-5">
          <View className="flex-row justify-between items-center mb-2">
            <Text className="text-2xl font-bold text-white">Profile</Text>
            {loading && <ActivityIndicator size="small" color="white" />}
          </View>
          <Text className="text-blue-100">
            Manage your account and preferences
          </Text>
        </View>

        {/* Content */}
        <View className="px-4 mt-4">
          <ProfileSection title="Personal Information">
            <ProfileAvatar name={user?.fullName} role={user?.role} />

            <View className="mt-6 space-y-4">
              <View className="flex-row border-b border-gray-100 pb-3">
                <View className="w-1/3">
                  <Text className="text-gray-500">Full Name</Text>
                </View>
                <View className="w-2/3">
                  <Text className="font-medium text-gray-800">
                    {user?.fullName || "Not provided"}
                  </Text>
                </View>
              </View>

              <View className="flex-row border-b border-gray-100 pb-3">
                <View className="w-1/3">
                  <Text className="text-gray-500">Email</Text>
                </View>
                <View className="w-2/3">
                  <Text className="font-medium text-gray-800">
                    {user?.email || "Not provided"}
                  </Text>
                </View>
              </View>

              <View className="flex-row border-b border-gray-100 pb-3">
                <View className="w-1/3">
                  <Text className="text-gray-500">Phone</Text>
                </View>
                <View className="w-2/3">
                  <Text className="font-medium text-gray-800">
                    {user?.phone || "Not provided"}
                  </Text>
                </View>
              </View>

              <View className="flex-row">
                <View className="w-1/3">
                  <Text className="text-gray-500">Role</Text>
                </View>
                <View className="w-2/3">
                  <Text className="font-medium text-gray-800">
                    {user?.role === "blind"
                      ? "Blind User"
                      : user?.role === "caretaker"
                      ? "Caretaker"
                      : "Unknown"}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                onPress={() => router.push("/profile/edit")}
                className="flex-row items-center justify-center mt-4 py-3 border border-blue-500 rounded-xl"
              >
                <Ionicons name="pencil-outline" size={18} color="#3b82f6" />
                <Text className="text-blue-500 font-medium ml-2">
                  Edit Profile
                </Text>
              </TouchableOpacity>
            </View>
          </ProfileSection>

          {/* Quick Actions Section */}
          <ProfileSection title="Account Options">
            <View className="space-y-2">
              <TouchableOpacity
                onPress={() => router.push("/profile/password")}
                className="flex-row justify-between items-center py-3 border-b border-gray-100"
              >
                <View className="flex-row items-center">
                  <Ionicons name="key-outline" size={20} color="#4b5563" />
                  <Text className="ml-3 text-gray-700">Change Password</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#9ca3af" />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => router.push("/profile/settings")}
                className="flex-row justify-between items-center py-3 border-b border-gray-100"
              >
                <View className="flex-row items-center">
                  <Ionicons name="settings-outline" size={20} color="#4b5563" />
                  <Text className="ml-3 text-gray-700">Settings</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#9ca3af" />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleLogout}
                className="flex-row items-center py-3"
              >
                <Ionicons name="log-out-outline" size={20} color="#ef4444" />
                <Text className="ml-3 text-red-500">Logout</Text>
              </TouchableOpacity>
            </View>
          </ProfileSection>

          {/* Account Deletion */}
          <TouchableOpacity
            className="items-center mt-6"
            onPress={() =>
              Alert.alert(
                "Delete Account",
                "Are you sure you want to delete your account? This action cannot be undone.",
                [
                  { text: "Cancel", style: "cancel" },
                  { text: "Delete", style: "destructive" },
                ]
              )
            }
          >
            <Text className="text-gray-500 underline">Delete my account</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
