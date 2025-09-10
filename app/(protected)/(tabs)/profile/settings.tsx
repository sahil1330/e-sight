import ProfileSection from "@/components/Profile/ProfileSection";
import SettingsSwitch from "@/components/Profile/SettingsSwitch";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SettingsScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // Settings state
  const [settings, setSettings] = useState({
    pushNotifications: true,
    emailNotifications: false,
    darkMode: false,
    highContrast: false,
    locationServices: true,
    biometricLogin: false,
  });

  const updateSetting = async (key: keyof typeof settings, value: boolean) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));

    // Here you would typically call an API to update user settings
    await SecureStore.setItemAsync(key, JSON.stringify(value))
  };

  const handleExport = async () => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      Alert.alert("Success", "Your data has been exported successfully. Check your email for the download link.");
    } catch (error) {
      Alert.alert("Error", "Failed to export data. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1 px-4" contentContainerClassName="py-4">
        {/* Notification Settings */}
        <ProfileSection title="Notifications">
          <SettingsSwitch
            label="Push notifications"
            value={settings.pushNotifications}
            onValueChange={(value) => updateSetting("pushNotifications", value)}
          />
          <SettingsSwitch
            label="Email notifications"
            value={settings.emailNotifications}
            onValueChange={(value) => updateSetting("emailNotifications", value)}
          />
        </ProfileSection>

        {/* Display Settings */}
        <ProfileSection title="Display">
          <SettingsSwitch
            label="Dark mode"
            value={settings.darkMode}
            onValueChange={(value) => updateSetting("darkMode", value)}
          />
          <SettingsSwitch
            label="High contrast"
            value={settings.highContrast}
            onValueChange={(value) => updateSetting("highContrast", value)}
          />
        </ProfileSection>

        {/* Privacy & Security */}
        <ProfileSection title="Privacy & Security">
          <SettingsSwitch
            label="Location services"
            value={settings.locationServices}
            onValueChange={(value) => updateSetting("locationServices", value)}
          />
          <SettingsSwitch
            label="Biometric login"
            value={settings.biometricLogin}
            onValueChange={(value) => updateSetting("biometricLogin", value)}
          />

          <TouchableOpacity
            className="flex-row justify-between items-center py-3 mt-2"
            onPress={handleExport}
          >
            <Text className="text-gray-600">Export my data</Text>
            {loading ? (
              <ActivityIndicator size="small" color="#3b82f6" />
            ) : (
              <Ionicons name="download-outline" size={20} color="#3b82f6" />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-row justify-between items-center py-3"
            onPress={() => Alert.alert("Clear Data", "Are you sure you want to clear all app data? This will log you out.", [
              { text: "Cancel", style: "cancel" },
              { text: "Clear", style: "destructive" }
            ])}
          >
            <Text className="text-gray-600">Clear app data</Text>
            <Ionicons name="trash-outline" size={20} color="#ef4444" />
          </TouchableOpacity>
        </ProfileSection>

        {/* About */}
        <ProfileSection title="About">
          <TouchableOpacity className="py-2.5 flex-row justify-between items-center border-b border-gray-100">
            <Text className="text-gray-600">Privacy Policy</Text>
            <Ionicons name="chevron-forward" size={18} color="#9ca3af" />
          </TouchableOpacity>
          <TouchableOpacity className="py-2.5 flex-row justify-between items-center border-b border-gray-100">
            <Text className="text-gray-600">Terms of Service</Text>
            <Ionicons name="chevron-forward" size={18} color="#9ca3af" />
          </TouchableOpacity>
          <TouchableOpacity className="py-2.5 flex-row justify-between items-center border-b border-gray-100">
            <Text className="text-gray-600">Help & Support</Text>
            <Ionicons name="chevron-forward" size={18} color="#9ca3af" />
          </TouchableOpacity>
          <View className="py-2.5 flex-row justify-between items-center">
            <Text className="text-gray-600">App Version</Text>
            <Text className="text-gray-400">1.0.0</Text>
          </View>
        </ProfileSection>
      </ScrollView>
    </SafeAreaView>
  );
}
