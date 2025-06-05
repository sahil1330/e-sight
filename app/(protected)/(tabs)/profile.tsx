import { useAuth } from "@/context/AuthContext";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";

export default function TabTwoScreen() {
  const { logout } = useAuth();
  const router = useRouter();
  const handleLogout = async () => {
    if (logout) {
      const result = await logout();
      console.log("Logout result:", result);
      router.replace("/(auth)/sign-in");
    }
  };
  return (
    <SafeAreaView>
      <View className={"flex-auto h-full justify-center items-center bg-white"}>
        <Pressable
          className="px-6 rounded-2xl h-16 bg-blue-500 justify-center items-center"
          onPress={handleLogout}
        >
          <Text className="text-white text-xl font-bold">Logout</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  headerImage: {
    color: "#808080",
    bottom: -90,
    left: -35,
    position: "absolute",
  },
  titleContainer: {
    flexDirection: "row",
    gap: 8,
  },
});
