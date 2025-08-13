import ProfileAvatar from "@/components/Profile/ProfileAvatar";
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
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top', 'left', 'right']}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingBottom: 120, // Extra space for tab bar
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header */}
        <View className="bg-blue-600 pt-8 pb-10 px-6 rounded-b-3xl">
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-3xl font-bold text-white">Profile</Text>
            {loading && <ActivityIndicator size="small" color="white" />}
          </View>
          <Text className="text-blue-100 text-lg">
            Manage your account and preferences
          </Text>
        </View>

        {/* Content */}
        <View className="px-6 -mt-6">
          {/* Profile Card */}
          <View className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
            <ProfileAvatar name={user?.fullName} role={user?.role} />

            <View className="mt-6 space-y-5">
              <View className="flex-row items-center py-3 border-b border-gray-100">
                <View className="w-1/3">
                  <Text className="text-gray-600 font-medium">Full Name</Text>
                </View>
                <View className="w-2/3">
                  <Text className="font-semibold text-gray-900 text-base">
                    {user?.fullName || "Not provided"}
                  </Text>
                </View>
              </View>

              <View className="flex-row items-center py-3 border-b border-gray-100">
                <View className="w-1/3">
                  <Text className="text-gray-600 font-medium">Email</Text>
                </View>
                <View className="w-2/3">
                  <Text className="font-semibold text-gray-900 text-base">
                    {user?.email || "Not provided"}
                  </Text>
                </View>
              </View>

              <View className="flex-row items-center py-3 border-b border-gray-100">
                <View className="w-1/3">
                  <Text className="text-gray-600 font-medium">Phone</Text>
                </View>
                <View className="w-2/3">
                  <Text className="font-semibold text-gray-900 text-base">
                    {user?.phone || "Not provided"}
                  </Text>
                </View>
              </View>

              <View className="flex-row items-center py-3">
                <View className="w-1/3">
                  <Text className="text-gray-600 font-medium">Role</Text>
                </View>
                <View className="w-2/3">
                  <View className={`px-3 py-1 rounded-full ${
                    user?.role === "blind" ? "bg-blue-100" : "bg-green-100"
                  }`}>
                    <Text className={`font-semibold text-sm ${
                      user?.role === "blind" ? "text-blue-700" : "text-green-700"
                    }`}>
                      {user?.role === "blind"
                        ? "Blind User"
                        : user?.role === "caretaker"
                        ? "Caretaker"
                        : "Unknown"}
                    </Text>
                  </View>
                </View>
              </View>

              <TouchableOpacity
                onPress={() => router.push("/profile/edit")}
                className="flex-row items-center justify-center mt-6 py-4 border-2 border-blue-600 rounded-xl"
                style={{
                  minHeight: 56,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.05,
                  shadowRadius: 2,
                  elevation: 1,
                }}
                accessibilityRole="button"
                accessibilityLabel="Edit profile information"
                accessibilityHint="Navigate to edit your profile details"
              >
                <Ionicons name="pencil-outline" size={20} color="#2563EB" />
                <Text className="text-blue-600 font-semibold ml-3 text-base">
                  Edit Profile
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Account Options */}
          <View className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
            <Text className="text-xl font-bold text-gray-900 mb-4">Account Options</Text>

            <View className="space-y-1">
              <TouchableOpacity
                onPress={() => router.push("/profile/password")}
                className="flex-row justify-between items-center py-4 px-2 rounded-xl"
                style={{ minHeight: 56 }}
                accessibilityRole="button"
                accessibilityLabel="Change password"
                accessibilityHint="Navigate to change your account password"
              >
                <View className="flex-row items-center">
                  <View className="w-10 h-10 bg-blue-100 rounded-full items-center justify-center mr-4">
                    <Ionicons name="key-outline" size={20} color="#2563EB" />
                  </View>
                  <View>
                    <Text className="text-gray-900 font-semibold text-base">Change Password</Text>
                    <Text className="text-gray-500 text-sm">Update your account password</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => router.push("/profile/settings")}
                className="flex-row justify-between items-center py-4 px-2 rounded-xl"
                style={{ minHeight: 56 }}
                accessibilityRole="button"
                accessibilityLabel="Settings"
                accessibilityHint="Navigate to app settings and preferences"
              >
                <View className="flex-row items-center">
                  <View className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center mr-4">
                    <Ionicons name="settings-outline" size={20} color="#6B7280" />
                  </View>
                  <View>
                    <Text className="text-gray-900 font-semibold text-base">Settings</Text>
                    <Text className="text-gray-500 text-sm">App preferences and configuration</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleLogout}
                className="flex-row items-center py-4 px-2 rounded-xl"
                style={{ minHeight: 56 }}
                accessibilityRole="button"
                accessibilityLabel="Logout"
                accessibilityHint="Sign out of your account"
              >
                <View className="w-10 h-10 bg-red-100 rounded-full items-center justify-center mr-4">
                  <Ionicons name="log-out-outline" size={20} color="#DC2626" />
                </View>
                <View>
                  <Text className="text-red-600 font-semibold text-base">Logout</Text>
                  <Text className="text-red-400 text-sm">Sign out of your account</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>

          {/* Account Deletion */}
          <View className="items-center mt-4">
            <TouchableOpacity
              className="py-3 px-4"
              style={{ minHeight: 44 }}
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
              accessibilityRole="button"
              accessibilityLabel="Delete account"
              accessibilityHint="Permanently delete your account and all data"
            >
              <Text className="text-gray-500 underline text-base">Delete my account</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
