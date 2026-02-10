import { Redirect, Tabs } from "expo-router";
import React from "react";
import { Platform } from "react-native";

import { HapticTab } from "@/components/HapticTab";
import { IconSymbol } from "@/components/ui/IconSymbol";
import TabBarBackground from "@/components/ui/TabBarBackground";
import { Colors } from "@/constants/Colors";
import { useAuth } from "@/context/AuthContext";
import Ionicons from "@expo/vector-icons/Ionicons";
export default function TabLayout() {
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
        tabBarActiveTintColor: Colors.primary.blue,
        tabBarInactiveTintColor: Colors.text.light,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600",
        },
        tabBarStyle: Platform.select({
          ios: {
            position: "absolute",
            backgroundColor: Colors.background.primary,
            borderTopWidth: 1,
            borderTopColor: Colors.border.light,
            paddingTop: 8,
            height: 84,
          },
          android: {
            backgroundColor: Colors.background.primary,
            borderTopWidth: 1,
            borderTopColor: Colors.border.light,
            position: "absolute",
            paddingTop: 8,
            height: 70,
          },
          default: {},
        }),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, focused }) => (
            <IconSymbol
              size={focused ? 32 : 28}
              name="house.fill"
              color={color}
            />
          ),
          tabBarAccessibilityLabel: "Home tab",
        }}
      />
      {authState.userDetails?.role === "blind" && (
        <Tabs.Screen
          name="vision"
          options={{
            title: "Vision",
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name="eye" size={focused ? 28 : 24} color={color} />
            ),
            tabBarAccessibilityLabel: "AI Vision Assistant tab",
          }}
        />
      )}
      {authState.userDetails?.role === "caretaker" && (
        <Tabs.Screen
          name="vision"
          options={{
            href: null, // Disable for caretakers
          }}
        />
      )}
      {authState.userDetails?.role === "caretaker" ? (
        <Tabs.Screen
          name="location"
          options={{
            title: "Location",
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name="location-sharp"
                size={focused ? 28 : 24}
                color={color}
              />
            ),
            tabBarAccessibilityLabel: "Location tracking tab",
          }}
        />
      ) : (
        <Tabs.Screen
          name="location"
          options={{
            href: null, // Disable direct navigation to this tab
            title: "Location",
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name="location-sharp"
                size={focused ? 28 : 24}
                color={color}
              />
            ),
            tabBarAccessibilityLabel: "Location tab (disabled for blind users)",
          }}
        />
      )}
      <Tabs.Screen
        name="notifications"
        options={{
          title: "Alerts",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name="notifications"
              size={focused ? 28 : 24}
              color={color}
            />
          ),
          tabBarAccessibilityLabel: "Notifications and alerts tab",
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          headerShown: false,
          title: "Profile",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name="person-circle-sharp"
              size={focused ? 32 : 28}
              color={color}
            />
          ),
          tabBarAccessibilityLabel: "Profile settings tab",
        }}
      />
    </Tabs>
  );
}
