import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

interface SettingsSwitchProps {
  label: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}

const SettingsSwitch = ({ label, value, onValueChange }: SettingsSwitchProps) => {
  return (
    <View className="flex-row justify-between items-center mt-3">
      <Text className="text-gray-600">{label}</Text>
      <TouchableOpacity
        onPress={() => onValueChange(!value)}
        className={`w-12 h-6 rounded-full items-center ${
          value ? "bg-blue-500" : "bg-gray-300"
        } flex-row px-0.5`}
        style={{ justifyContent: value ? "flex-end" : "flex-start" }}
      >
        <View className="w-5 h-5 rounded-full bg-white" />
      </TouchableOpacity>
    </View>
  );
};

export default SettingsSwitch;
