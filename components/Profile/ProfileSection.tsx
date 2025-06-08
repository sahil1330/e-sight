import React, { PropsWithChildren } from "react";
import { Text, View } from "react-native";

interface ProfileSectionProps extends PropsWithChildren {
  title: string;
  className?: string;
}

const ProfileSection: React.FC<ProfileSectionProps> = ({
  title,
  children,
  className = "",
}) => {
  return (
    <View className={`bg-white rounded-xl p-5 shadow-sm mb-4 ${className}`}>
      <Text className="text-lg font-semibold text-gray-800 mb-4">{title}</Text>
      {children}
    </View>
  );
};

export default ProfileSection;
