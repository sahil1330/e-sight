import { Stack } from "expo-router";
import React from "react";

import { useColorScheme } from "@/hooks/useColorScheme";

export const unstable_settings = {
  initialRouteName: "index",
};
export default function TabLayout() {
  const colorScheme = useColorScheme();
  // const { authState, isReady } = useAuth();
  // if (!isReady) {
  //   return null;
  // }
  // if (!authState?.authenticated) {
  //   return <Redirect href="/(auth)/sign-in" />;
  // }

  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="connectionModal"
        options={{
          presentation: "transparentModal",
          headerShown: false,
          animation: "slide_from_bottom",
          contentStyle: {
            backgroundColor: "transparent",
          },
        }}
      />
    </Stack>
  );
}
