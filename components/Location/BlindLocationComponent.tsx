import User from "@/schema/userSchema";
import React from "react";
import { Text, View } from "react-native";

const BlindLocationComponent = ({ userDetails }: { userDetails: User }) => {
  return (
    <View className="flex-1">
      <Text className="mt-5 text-lg text-gray-700">
        Your Location is being tracked. Please ensure you have location services enabled.
      </Text>
    </View>
  );
};

export default BlindLocationComponent;
