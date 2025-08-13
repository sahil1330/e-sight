import { Stack } from "expo-router";
import React from "react";

const NotificationsLayout = () => {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="location"
        options={{
          headerTitle: "Location Updates",
          headerBackTitle: "Notifications",
          presentation: "card",
          headerTintColor: "#3b82f6",
        }}
      />
      <Stack.Screen
        name="emergency_alerts"
        options={{
          headerTitle: "Emergency Alerts",
          headerBackTitle: "Notifications",
          presentation: "card",
          headerTintColor: "#3b82f6",
        }}
      />
      <Stack.Screen
        name="device_connections"
        options={{
          headerTitle: "Device Connections Statuses",
          headerBackTitle: "Notifications",
          presentation: "card",
          headerTintColor: "#3b82f6",
        }}
      />
    </Stack>
  );
};

export default NotificationsLayout;
