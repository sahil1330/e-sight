import { AuthProvider, useAuth } from "@/context/AuthContext";
import { NotificationProvider } from "@/context/NotificationContext";
import { useColorScheme } from "@/hooks/useColorScheme";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";
import "./global.css";

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });
  if (!loaded) {
    // Async font loading only occurs in development.
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <AuthProvider>
        <NotificationProvider>
          {/* <Stack>
            <Stack.Screen name="(protected)" options={{ headerShown: false }} />
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            <Stack.Screen name="+not-found" />
          </Stack> */}
          <AuthCheckProvider />
          <StatusBar style="auto" />
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export const AuthCheckProvider = () => {
  const { authState, isReady } = useAuth();
  if (!isReady) {
    return null; // or a loading spinner
  }
  return (
    <Stack>
      <Stack.Protected guard={authState?.authenticated as boolean}>
        <Stack.Screen name="(protected)" options={{ headerShown: false }} />
      </Stack.Protected>
      <Stack.Protected guard={!authState?.authenticated as boolean}>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      </Stack.Protected>
      <Stack.Screen name="+not-found" />
    </Stack>
  );
};
