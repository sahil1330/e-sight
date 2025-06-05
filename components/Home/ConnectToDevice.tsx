import Entypo from "@expo/vector-icons/Entypo";
import Feather from "@expo/vector-icons/Feather";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
const ConnectToDevice = () => {
  const [isDeviceConnected, setIsDeviceConnected] = React.useState(false);
  const [deviceName, setDeviceName] = React.useState("rodeo");

  return (
    <View className="flex-1 items-center justify-center">
      {!isDeviceConnected ? (
        <View className="connection-box w-2/3 rounded-lg p-4 bg-white shadow-md flex justify-center items-center">
          <TouchableOpacity className="rounded-full bg-blue-100 p-4 mb-4">
            <Text>
              <Entypo name="plus" size={24} color="black" />
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View className="connection-box w-full rounded-lg p-4 shadow-md flex flex-row justify-between items-center">
          <Text className="text-xl font-semibold mb-2">
            {deviceName || "Connected Device"}
          </Text>
          <TouchableOpacity
            className=""
            onPress={() => {
              setIsDeviceConnected(false);
              setDeviceName("");
            }}
          >
            <Text>
              <Feather name="more-vertical" size={24} color="black" />{" "}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

export default ConnectToDevice;
