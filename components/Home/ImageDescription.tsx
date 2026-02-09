import { describeImage } from "@/utils/geminiAPI";
import { Ionicons } from "@expo/vector-icons";
import { CameraType, CameraView, useCameraPermissions } from "expo-camera";
import * as Speech from "expo-speech";
import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const ImageDescription = () => {
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraVisible, setCameraVisible] = useState(false);
  const [facing, setFacing] = useState<CameraType>("back");
  const [description, setDescription] = useState<string>("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const cameraRef = useRef<CameraView>(null);

  const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

  const responsiveSize = {
    baseUnit: screenWidth * 0.05,
    headerText: Math.max(screenWidth * 0.055, 18),
    bodyText: Math.max(screenWidth * 0.04, 14),
    buttonText: Math.max(screenWidth * 0.045, 16),
    iconSize: Math.max(screenWidth * 0.07, 24),
    containerPadding: screenWidth * 0.04,
    buttonPadding: screenHeight * 0.015,
  };

  const handleOpenCamera = async () => {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        Alert.alert(
          "Permission Required",
          "Camera permission is needed to capture and describe images.",
        );
        return;
      }
    }
    setCameraVisible(true);
    setDescription("");
  };

  const handleTakePicture = async () => {
    if (!cameraRef.current) return;

    try {
      setIsAnalyzing(true);
      const photo = await cameraRef.current.takePictureAsync({
        base64: true,
        quality: 0.7,
      });

      if (!photo || !photo.base64) {
        Alert.alert("Error", "Failed to capture image. Please try again.");
        setIsAnalyzing(false);
        return;
      }

      // Get description from Gemini API
      const imageDescription = await describeImage(photo.base64, "image/jpeg");
      setDescription(imageDescription);
      setCameraVisible(false);
      setIsAnalyzing(false);

      // Automatically speak the description
      speakDescription(imageDescription);
    } catch (error) {
      console.error("Error analyzing image:", error);
      setIsAnalyzing(false);
      setCameraVisible(false);
      Alert.alert(
        "Analysis Failed",
        error instanceof Error
          ? error.message
          : "Failed to analyze the image. Please try again.",
      );
    }
  };

  const speakDescription = (text: string) => {
    if (isSpeaking) {
      Speech.stop();
      setIsSpeaking(false);
    } else {
      setIsSpeaking(true);
      Speech.speak(text, {
        language: "en-US",
        pitch: 1.0,
        rate: 0.9,
        onDone: () => setIsSpeaking(false),
        onStopped: () => setIsSpeaking(false),
        onError: () => {
          setIsSpeaking(false);
          Alert.alert("Error", "Failed to speak description.");
        },
      });
    }
  };

  const toggleCameraFacing = () => {
    setFacing((current) => (current === "back" ? "front" : "back"));
  };

  if (!permission) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          padding: responsiveSize.containerPadding,
        }}
      >
        <ActivityIndicator size="large" color="#2563eb" />
        <Text
          style={{
            marginTop: responsiveSize.baseUnit,
            color: "#64748b",
            fontSize: responsiveSize.bodyText,
          }}
        >
          Loading camera...
        </Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      {/* Main Button */}
      <TouchableOpacity
        style={{
          backgroundColor: "#8b5cf6",
          borderRadius: responsiveSize.baseUnit * 0.6,
          paddingVertical: responsiveSize.buttonPadding,
          paddingHorizontal: responsiveSize.containerPadding,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          borderWidth: 1,
          borderColor: "#7c3aed",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 3,
          elevation: 2,
        }}
        onPress={handleOpenCamera}
        accessibilityRole="button"
        accessibilityLabel="Describe what you see"
        accessibilityHint="Double tap to open camera and capture an image for AI description"
      >
        <Ionicons name="camera" size={responsiveSize.iconSize} color="white" />
        <Text
          style={{
            color: "white",
            fontSize: responsiveSize.buttonText,
            fontWeight: "600",
            marginLeft: responsiveSize.baseUnit * 0.6,
          }}
        >
          Describe What I See
        </Text>
      </TouchableOpacity>

      {/* Description Display */}
      {description !== "" && (
        <View
          style={{
            marginTop: responsiveSize.baseUnit,
            backgroundColor: "#f0f9ff",
            borderRadius: responsiveSize.baseUnit * 0.6,
            padding: responsiveSize.containerPadding,
            borderWidth: 1,
            borderColor: "#bae6fd",
          }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: responsiveSize.baseUnit * 0.4,
            }}
          >
            <Text
              style={{
                fontSize: responsiveSize.headerText * 0.9,
                fontWeight: "600",
                color: "#0c4a6e",
              }}
            >
              Image Description
            </Text>
            <TouchableOpacity
              onPress={() => speakDescription(description)}
              style={{
                backgroundColor: isSpeaking ? "#dc2626" : "#0ea5e9",
                borderRadius: responsiveSize.baseUnit * 0.4,
                padding: responsiveSize.baseUnit * 0.5,
              }}
              accessibilityRole="button"
              accessibilityLabel={
                isSpeaking ? "Stop speaking" : "Speak description"
              }
            >
              <Ionicons
                name={isSpeaking ? "stop-circle" : "volume-high"}
                size={responsiveSize.iconSize * 0.8}
                color="white"
              />
            </TouchableOpacity>
          </View>
          <ScrollView
            style={{ maxHeight: screenHeight * 0.15 }}
            showsVerticalScrollIndicator={true}
          >
            <Text
              style={{
                fontSize: responsiveSize.bodyText,
                color: "#0c4a6e",
                lineHeight: responsiveSize.bodyText * 1.5,
              }}
              accessibilityLabel={`Description: ${description}`}
            >
              {description}
            </Text>
          </ScrollView>
        </View>
      )}

      {/* Camera Modal */}
      <Modal
        visible={cameraVisible}
        animationType="slide"
        onRequestClose={() => !isAnalyzing && setCameraVisible(false)}
      >
        <View style={{ flex: 1, backgroundColor: "black" }}>
          <CameraView ref={cameraRef} style={{ flex: 1 }} facing={facing}>
            {isAnalyzing && (
              <View
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: "rgba(0, 0, 0, 0.7)",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <ActivityIndicator size="large" color="#ffffff" />
                <Text
                  style={{
                    color: "white",
                    fontSize: responsiveSize.headerText,
                    marginTop: responsiveSize.baseUnit,
                    fontWeight: "600",
                  }}
                >
                  Analyzing image...
                </Text>
                <Text
                  style={{
                    color: "#d1d5db",
                    fontSize: responsiveSize.bodyText,
                    marginTop: responsiveSize.baseUnit * 0.4,
                  }}
                >
                  This may take a few seconds
                </Text>
              </View>
            )}

            {!isAnalyzing && (
              <>
                {/* Top Controls */}
                <View
                  style={{
                    position: "absolute",
                    top: 40,
                    left: 0,
                    right: 0,
                    flexDirection: "row",
                    justifyContent: "space-between",
                    paddingHorizontal: responsiveSize.containerPadding,
                  }}
                >
                  <TouchableOpacity
                    onPress={() => setCameraVisible(false)}
                    style={{
                      backgroundColor: "rgba(0, 0, 0, 0.6)",
                      borderRadius: responsiveSize.baseUnit * 0.5,
                      padding: responsiveSize.baseUnit * 0.6,
                    }}
                    accessibilityRole="button"
                    accessibilityLabel="Close camera"
                  >
                    <Ionicons
                      name="close"
                      size={responsiveSize.iconSize}
                      color="white"
                    />
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={toggleCameraFacing}
                    style={{
                      backgroundColor: "rgba(0, 0, 0, 0.6)",
                      borderRadius: responsiveSize.baseUnit * 0.5,
                      padding: responsiveSize.baseUnit * 0.6,
                    }}
                    accessibilityRole="button"
                    accessibilityLabel="Flip camera"
                  >
                    <Ionicons
                      name="camera-reverse"
                      size={responsiveSize.iconSize}
                      color="white"
                    />
                  </TouchableOpacity>
                </View>

                {/* Bottom Capture Button */}
                <View
                  style={{
                    position: "absolute",
                    bottom: 40,
                    left: 0,
                    right: 0,
                    alignItems: "center",
                  }}
                >
                  <TouchableOpacity
                    onPress={handleTakePicture}
                    style={{
                      width: responsiveSize.baseUnit * 4,
                      height: responsiveSize.baseUnit * 4,
                      borderRadius: responsiveSize.baseUnit * 2,
                      backgroundColor: "white",
                      borderWidth: 4,
                      borderColor: "#8b5cf6",
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                    accessibilityRole="button"
                    accessibilityLabel="Capture image"
                    accessibilityHint="Double tap to take a picture and get AI description"
                  >
                    <View
                      style={{
                        width: responsiveSize.baseUnit * 3.4,
                        height: responsiveSize.baseUnit * 3.4,
                        borderRadius: responsiveSize.baseUnit * 1.7,
                        backgroundColor: "#8b5cf6",
                      }}
                    />
                  </TouchableOpacity>
                  <Text
                    style={{
                      color: "white",
                      fontSize: responsiveSize.bodyText,
                      marginTop: responsiveSize.baseUnit * 0.6,
                      textAlign: "center",
                      fontWeight: "600",
                    }}
                  >
                    Tap to capture and describe
                  </Text>
                </View>
              </>
            )}
          </CameraView>
        </View>
      </Modal>
    </View>
  );
};

export default ImageDescription;
