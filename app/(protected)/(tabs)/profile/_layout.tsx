import { Stack } from "expo-router";
import React from "react";

const ProfileLayout = () => {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="edit"
        options={{
          headerTitle: "Edit Profile",
          headerBackTitle: "Profile",
          presentation: "card",
          headerTintColor: "#3b82f6",
        }}
      />
      <Stack.Screen
        name="password"
        options={{
          headerTitle: "Change Password",
          headerBackTitle: "Profile",
          presentation: "card",
          headerTintColor: "#3b82f6",
        }}
      />
      <Stack.Screen
        name="settings"
        options={{
          headerTitle: "Settings",
          headerBackTitle: "Profile",
          presentation: "card",
          headerTintColor: "#3b82f6",
        }}
      />
    </Stack>
  );
};

export default ProfileLayout;
