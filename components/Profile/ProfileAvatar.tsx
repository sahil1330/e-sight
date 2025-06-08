import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

interface ProfileAvatarProps {
  name: string | undefined;
  role: string | undefined;
  editable?: boolean;
  onPressEdit?: () => void;
  size?: "small" | "medium" | "large";
}

const ProfileAvatar = ({
  name,
  role,
  editable = false,
  onPressEdit,
  size = "medium",
}: ProfileAvatarProps) => {
  const getSize = () => {
    switch (size) {
      case "small":
        return {
          container: "w-16 h-16",
          text: "text-2xl",
          editButton: "p-1",
          editIcon: 12,
        };
      case "large":
        return {
          container: "w-32 h-32",
          text: "text-4xl",
          editButton: "p-2",
          editIcon: 16,
        };
      case "medium":
      default:
        return {
          container: "w-24 h-24",
          text: "text-3xl",
          editButton: "p-1.5",
          editIcon: 14,
        };
    }
  };

  const sizeStyles = getSize();

  return (
    <View className="items-center">
      <View className={`${sizeStyles.container} rounded-full bg-blue-100 justify-center items-center`}>
        <Text className={`text-blue-600 ${sizeStyles.text} font-bold`}>
          {name?.charAt(0) || "U"}
        </Text>

        {editable && (
          <TouchableOpacity
            onPress={onPressEdit}
            className={`absolute bottom-0 right-0 bg-blue-500 rounded-full ${sizeStyles.editButton}`}
          >
            <Ionicons
              name="camera"
              size={sizeStyles.editIcon}
              color="white"
            />
          </TouchableOpacity>
        )}
      </View>

      {name && (
        <Text className="mt-2 text-lg font-semibold text-gray-800">
          {name}
        </Text>
      )}
      {role && (
        <Text className="text-gray-500">
          {role === "blind" ? "Blind User" : "Caretaker"}
        </Text>
      )}
    </View>
  );
};

export default ProfileAvatar;
