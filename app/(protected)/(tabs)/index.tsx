import BlindHomeComponent from "@/components/Home/BlindHomeComponent";
import CaretakerHomeComponent from "@/components/Home/CaretakerHomeComponent";
import { useAuth } from "@/context/AuthContext";

import { SafeAreaView } from "react-native-safe-area-context";

export default function HomeScreen() {
  const { authState } = useAuth();
  if (!authState?.userDetails) {
    return null;
  }
  return (
    <SafeAreaView className="flex-1 justify-center items-center bg-white">
      {authState?.userDetails?.role === "caretaker" ? (
        <CaretakerHomeComponent userDetails={authState?.userDetails} />
      ) : (
        <BlindHomeComponent userDetails={authState?.userDetails} />
      )}
    </SafeAreaView>
  );
}
