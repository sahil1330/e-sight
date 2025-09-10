import { Stack } from "expo-router";
import React from "react";

const AuthLayout = () => {
  // if (authState?.authenticated) {
  //   return <Redirect href={"/(protected)/(tabs)"} />;
  // 
  return (
    <Stack initialRouteName="sign-in" screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name="sign-in"
        options={{
          headerShown: true,
          headerTitle: "Sign in",
          headerBackTitle: "Go Back",
        }}
      />
      <Stack.Screen
        name="sign-up"
        options={{
          headerShown: true,
          headerTitle: "Sign up",
          headerBackTitle: "Go Back",
        }}
      />
      
      <Stack.Screen
        name="verify-email"
        options={{
          headerShown: true,
          headerTitle: "Verify Email",
          headerBackTitle: "Go Back",
        }}
      />
    </Stack>
  );
};

export default AuthLayout;
