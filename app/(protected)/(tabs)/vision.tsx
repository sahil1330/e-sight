import LiveVisionAssistant from "@/components/Vision/LiveVisionAssistant";
import { StyleSheet, View } from "react-native";

export default function VisionScreen() {
  return (
    <View style={styles.container}>
      <LiveVisionAssistant />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
});
