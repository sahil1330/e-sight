import BlindLocationComponent from "@/components/Location/BlindLocationComponent";
import CaretakerLocationComponent from "@/components/Location/CaretakerLocationComponent";
import { useAuth } from "@/context/AuthContext";
import React from "react";
import { SafeAreaView } from "react-native";

const Location = () => {
  const { authState } = useAuth();
  if (!authState?.userDetails) {
    return null; // or handle loading state
  }
  return (
    <SafeAreaView>
      {authState?.userDetails?.role === "caretaker" ? (
        <CaretakerLocationComponent userDetails={authState.userDetails} />
      ) : (
        <BlindLocationComponent userDetails={authState.userDetails} />
      )}
    </SafeAreaView>
  );
};

export default Location;
