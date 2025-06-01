import { useRouter } from "expo-router";
import React from "react";
import { Pressable, Text, View } from "react-native";

const SignIn = () => {
  const router = useRouter()
  return (
    <View>
      <Text className="text-3xl text-red-600">SignIn</Text>
      <Pressable
        className="bg-blue-500 p-4 rounded-lg mt-4"
        onPress={() => {
          // Handle sign-in logic here
          console.log("Sign In Pressed");
          router.push("/(auth)/sign-up");
        }}
      >
        <Text className="text-white font-bold text-lg">Sign Up</Text>
      </Pressable>
    </View>
  );
};

export default SignIn;
