import { Redirect, Stack } from "expo-router";
import React from "react";

import { useAuth } from "@/context/AuthContext";
import { useColorScheme } from "@/hooks/useColorScheme";
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
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}
