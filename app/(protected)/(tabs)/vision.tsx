import LiveVisionAssistant from "@/components/Vision/LiveVisionAssistant";
import { View } from "react-native";

export default function VisionScreen() {
  return (
    <View className="flex-1 bg-black">
      <LiveVisionAssistant />
    </View>
  );
}
