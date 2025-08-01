import { Redirect, Tabs } from "expo-router";
import React from "react";
import { Platform } from "react-native";

import { HapticTab } from "@/components/HapticTab";
import { IconSymbol } from "@/components/ui/IconSymbol";
import TabBarBackground from "@/components/ui/TabBarBackground";
import { Colors } from "@/constants/Colors";
import { useAuth } from "@/context/AuthContext";
import { useColorScheme } from "@/hooks/useColorScheme";
import Ionicons from "@expo/vector-icons/Ionicons";
export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { authState, isReady } = useAuth();
  if (!isReady) {
    return null;
  }
  if (!authState?.authenticated) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarStyle: Platform.select({
          ios: {
            // Use a transparent background on iOS to show the blur effect
            position: "absolute",
          },
          android: {
            // Use a solid background on Android
            backgroundColor: Colors[colorScheme ?? "light"].background,
            position: "absolute",
          },
          default: {},
        }),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="house.fill" color={color} />
          ),
        }}
      />
      {
        authState.userDetails?.role === "caretaker" ? (
          <Tabs.Screen
            name="location"
            options={{
              title: "Location",
              tabBarIcon: ({ color }) => (
                <Ionicons name="location-sharp" size={24} color={color} />
              ),
            }}
          />
        ) : (
          <Tabs.Screen
            name="location"
            options={{
              href: null, // Disable direct navigation to this tab
              title: "Location",
              tabBarIcon: ({ color }) => (
                <Ionicons name="location-sharp" size={24} color={color} />
              ),
            }}
          />
        )
      }
      <Tabs.Screen
        name="notifications"
        options={{
          title: "Notifications",
          tabBarIcon: ({ color }) => (
            <Ionicons name="notifications" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          headerShown: false,
          title: "Profile",
          tabBarIcon: ({ color }) => (
            <Ionicons name="person-circle-sharp" size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
