import { analyzeImageWithQuestion } from "@/utils/geminiAPI";
import { Ionicons } from "@expo/vector-icons";
import { CameraType, CameraView, useCameraPermissions } from "expo-camera";
import * as ImageManipulator from "expo-image-manipulator";
import * as Speech from "expo-speech";
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from "expo-speech-recognition";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const LiveVisionAssistant = () => {
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>("back");
  const [isListening, setIsListening] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [recognizedText, setRecognizedText] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [conversationHistory, setConversationHistory] = useState<
    { type: "user" | "ai"; text: string }[]
  >([]);

  const cameraRef = useRef<CameraView>(null);
  const recognitionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  const { width: screenWidth } = Dimensions.get("window");

  const responsiveSize = {
    baseUnit: screenWidth * 0.05,
    headerText: Math.max(screenWidth * 0.05, 18),
    bodyText: Math.max(screenWidth * 0.04, 14),
    buttonText: Math.max(screenWidth * 0.045, 16),
    iconSize: Math.max(screenWidth * 0.08, 28),
    smallIconSize: Math.max(screenWidth * 0.06, 20),
    containerPadding: screenWidth * 0.04,
  };

  // Speech recognition event handler
  useSpeechRecognitionEvent("start", () => {
    console.log("Speech recognition started");
  });

  useSpeechRecognitionEvent("result", (event) => {
    const transcription = event.results[0]?.transcript || "";
    setRecognizedText(transcription);

    // Clear existing timeout
    if (recognitionTimeoutRef.current) {
      clearTimeout(recognitionTimeoutRef.current);
    }

    // Set new timeout - if user pauses for 2 seconds, process the question
    recognitionTimeoutRef.current = setTimeout(() => {
      if (transcription.trim()) {
        handleQuestionSubmit(transcription);
      }
    }, 2000);
  });

  useSpeechRecognitionEvent("error", (event) => {
    console.error("Speech recognition error:", event);
    setIsListening(false);

    if (event.error === "no-match") {
      // User didn't say anything - this is normal
      return;
    }

    // Handle specific error codes
    let errorMessage = "Could not understand. Please try again.";

    if (event.code === 5 || event.error === "client") {
      errorMessage =
        "Speech recognition failed. Please check your internet connection and microphone.";
    } else if (event.code === 7 || event.error === "network") {
      errorMessage = "Network error. Please check your internet connection.";
    } else if (event.code === 9) {
      errorMessage = "Insufficient permissions for microphone.";
    }

    Alert.alert("Speech Recognition Error", errorMessage);
  });

  useSpeechRecognitionEvent("end", () => {
    console.log("Speech recognition ended");
    setIsListening(false);
  });

  useEffect(() => {
    // Request microphone permissions
    const requestPermissions = async () => {
      const { status } =
        await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Microphone permission is needed for voice commands.",
        );
      }
    };

    requestPermissions();

    return () => {
      if (recognitionTimeoutRef.current) {
        clearTimeout(recognitionTimeoutRef.current);
      }
      ExpoSpeechRecognitionModule.stop();
      Speech.stop();
    };
  }, []);

  const handleMicToggle = async () => {
    if (isListening) {
      // Stop listening
      ExpoSpeechRecognitionModule.stop();
      setIsListening(false);
      if (recognitionTimeoutRef.current) {
        clearTimeout(recognitionTimeoutRef.current);
      }
    } else {
      // Start listening
      setRecognizedText("");
      setIsListening(true);

      try {
        await ExpoSpeechRecognitionModule.start({
          lang: "en-US",
          interimResults: true,
          maxAlternatives: 1,
          continuous: true,
          requiresOnDeviceRecognition: false,
          addsPunctuation: true,
          contextualStrings: [
            "what",
            "where",
            "who",
            "describe",
            "read",
            "tell me",
          ],
          androidIntentOptions: {
            EXTRA_LANGUAGE_MODEL: "free_form",
            EXTRA_SPEECH_INPUT_COMPLETE_SILENCE_LENGTH_MILLIS: 2000,
            EXTRA_SPEECH_INPUT_POSSIBLY_COMPLETE_SILENCE_LENGTH_MILLIS: 2000,
          },
          iosTaskHint: "search",
        });
      } catch (error) {
        console.error("Error starting speech recognition:", error);
        setIsListening(false);

        const errorMsg =
          error instanceof Error ? error.message : "Unknown error";
        Alert.alert(
          "Error",
          `Failed to start voice recognition: ${errorMsg}\n\nPlease ensure:\n• Microphone permission is granted\n• Internet connection is available\n• Device volume is up`,
        );
      }
    }
  };

  const handleQuestionSubmit = async (question: string) => {
    if (!question.trim() || !cameraRef.current) return;

    // Stop listening
    if (isListening) {
      ExpoSpeechRecognitionModule.stop();
      setIsListening(false);
    }

    // Stop any ongoing speech
    if (isSpeaking) {
      Speech.stop();
      setIsSpeaking(false);
    }

    try {
      setIsAnalyzing(true);
      const startTime = Date.now();

      // Capture current camera frame
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.5,
        skipProcessing: true,
      });
      console.log(`Photo captured in ${Date.now() - startTime}ms`);

      if (!photo) {
        Alert.alert("Error", "Failed to capture camera frame.");
        setIsAnalyzing(false);
        return;
      }

      // Resize and compress image for faster upload
      const resizeStartTime = Date.now();
      const manipulatedImage = await ImageManipulator.manipulateAsync(
        photo.uri,
        [{ resize: { width: 640 } }], // Smaller size for faster upload
        {
          compress: 0.3,
          format: ImageManipulator.SaveFormat.JPEG,
          base64: true,
        },
      );
      console.log(`Image resized in ${Date.now() - resizeStartTime}ms`);

      if (!manipulatedImage.base64) {
        Alert.alert("Error", "Failed to process image.");
        setIsAnalyzing(false);
        return;
      }

      // Add user question to history
      setConversationHistory((prev) => [
        ...prev,
        { type: "user", text: question },
      ]);

      // Get AI response
      const aiStartTime = Date.now();
      const response = await analyzeImageWithQuestion(
        manipulatedImage.base64,
        question,
        "image/jpeg",
      );
      console.log(`AI response received in ${Date.now() - aiStartTime}ms`);

      setAiResponse(response);

      // Add AI response to history
      setConversationHistory((prev) => [
        ...prev,
        { type: "ai", text: response },
      ]);

      setIsAnalyzing(false);
      setRecognizedText("");
      console.log(`Total analysis completed in ${Date.now() - startTime}ms`);

      // Speak the response
      speakResponse(response);
    } catch (error) {
      console.error("Error analyzing image:", error);
      setIsAnalyzing(false);
      Alert.alert(
        "Analysis Failed",
        error instanceof Error ? error.message : "Failed to analyze the image.",
      );
    }
  };

  const speakResponse = (text: string) => {
    setIsSpeaking(true);
    Speech.speak(text, {
      language: "en-US",
      pitch: 1.0,
      rate: 0.9,
      onDone: () => setIsSpeaking(false),
      onStopped: () => setIsSpeaking(false),
      onError: () => {
        setIsSpeaking(false);
        Alert.alert("Error", "Failed to speak response.");
      },
    });
  };

  const toggleSpeechPlayback = () => {
    if (isSpeaking) {
      Speech.stop();
      setIsSpeaking(false);
    } else if (aiResponse) {
      speakResponse(aiResponse);
    }
  };

  const toggleCameraFacing = () => {
    setFacing((current) => (current === "back" ? "front" : "back"));
  };

  if (!cameraPermission) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8b5cf6" />
        <Text
          style={[styles.loadingText, { fontSize: responsiveSize.bodyText }]}
        >
          Loading camera...
        </Text>
      </View>
    );
  }

  if (!cameraPermission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Ionicons
          name="camera-outline"
          size={responsiveSize.iconSize * 3}
          color="#9ca3af"
        />
        <Text
          style={[
            styles.permissionTitle,
            { fontSize: responsiveSize.headerText },
          ]}
        >
          Camera Permission Required
        </Text>
        <Text
          style={[styles.permissionText, { fontSize: responsiveSize.bodyText }]}
        >
          This feature requires camera access to help you see your surroundings.
        </Text>
        <TouchableOpacity
          style={[
            styles.permissionButton,
            { paddingVertical: responsiveSize.baseUnit * 0.8 },
          ]}
          onPress={requestCameraPermission}
        >
          <Text
            style={[
              styles.permissionButtonText,
              { fontSize: responsiveSize.buttonText },
            ]}
          >
            Grant Camera Permission
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Camera View */}
      <View style={styles.cameraContainer}>
        <CameraView ref={cameraRef} style={styles.camera} facing={facing}>
          {/* Top Controls */}
          <View
            style={[
              styles.topControls,
              { paddingHorizontal: responsiveSize.containerPadding },
            ]}
          >
            <TouchableOpacity
              onPress={toggleCameraFacing}
              style={[
                styles.topButton,
                { padding: responsiveSize.baseUnit * 0.6 },
              ]}
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

          {/* Listening Indicator */}
          {isListening && (
            <View style={styles.listeningIndicator}>
              <View style={styles.listeningPulse} />
              <Text
                style={[
                  styles.listeningText,
                  { fontSize: responsiveSize.bodyText },
                ]}
              >
                Listening...
              </Text>
              {recognizedText && (
                <Text
                  style={[
                    styles.recognizedText,
                    { fontSize: responsiveSize.bodyText },
                  ]}
                >
                  &quot;{recognizedText}&quot;
                </Text>
              )}
            </View>
          )}

          {/* Analyzing Overlay */}
          {isAnalyzing && (
            <View style={styles.analyzingOverlay}>
              <ActivityIndicator size="large" color="#ffffff" />
              <Text
                style={[
                  styles.analyzingText,
                  { fontSize: responsiveSize.headerText },
                ]}
              >
                Analyzing...
              </Text>
            </View>
          )}
        </CameraView>
      </View>

      {/* Response Display */}
      <View
        style={[
          styles.responseContainer,
          { padding: responsiveSize.containerPadding },
        ]}
      >
        {conversationHistory.length === 0 ? (
          <View style={styles.instructionsContainer}>
            <Ionicons
              name="mic"
              size={responsiveSize.iconSize * 2}
              color="#8b5cf6"
            />
            <Text
              style={[
                styles.instructionsTitle,
                { fontSize: responsiveSize.headerText },
              ]}
            >
              AI Vision Assistant
            </Text>
            <Text
              style={[
                styles.instructionsText,
                { fontSize: responsiveSize.bodyText },
              ]}
            >
              Tap the microphone button and ask me anything about what&apos;s in
              front of your camera!
            </Text>
            <View style={styles.examplesContainer}>
              <Text
                style={[
                  styles.exampleText,
                  { fontSize: responsiveSize.bodyText * 0.9 },
                ]}
              >
                • &quot;What do you see?&quot;
              </Text>
              <Text
                style={[
                  styles.exampleText,
                  { fontSize: responsiveSize.bodyText * 0.9 },
                ]}
              >
                • &quot;Read the text on this&quot;
              </Text>
              <Text
                style={[
                  styles.exampleText,
                  { fontSize: responsiveSize.bodyText * 0.9 },
                ]}
              >
                • &quot;What color is this?&quot;
              </Text>
              <Text
                style={[
                  styles.exampleText,
                  { fontSize: responsiveSize.bodyText * 0.9 },
                ]}
              >
                • &quot;Is there anyone nearby?&quot;
              </Text>
            </View>
          </View>
        ) : (
          <ScrollView
            style={styles.conversationScroll}
            showsVerticalScrollIndicator={true}
            contentContainerStyle={{ paddingBottom: responsiveSize.baseUnit }}
          >
            {conversationHistory.map((item, index) => (
              <View
                key={index}
                style={[
                  styles.messageContainer,
                  item.type === "user" ? styles.userMessage : styles.aiMessage,
                ]}
              >
                <View style={styles.messageHeader}>
                  <Ionicons
                    name={item.type === "user" ? "person-circle" : "sparkles"}
                    size={responsiveSize.smallIconSize}
                    color={item.type === "user" ? "#8b5cf6" : "#10b981"}
                  />
                  <Text
                    style={[
                      styles.messageLabel,
                      { fontSize: responsiveSize.bodyText * 0.9 },
                    ]}
                  >
                    {item.type === "user" ? "You" : "AI"}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.messageText,
                    { fontSize: responsiveSize.bodyText },
                  ]}
                >
                  {item.text}
                </Text>
              </View>
            ))}
          </ScrollView>
        )}

        {/* Audio Control */}
        {aiResponse && (
          <TouchableOpacity
            onPress={toggleSpeechPlayback}
            style={[
              styles.audioButton,
              { padding: responsiveSize.baseUnit * 0.5 },
            ]}
            accessibilityRole="button"
            accessibilityLabel={
              isSpeaking ? "Stop speaking" : "Replay response"
            }
          >
            <Ionicons
              name={isSpeaking ? "stop-circle" : "volume-high"}
              size={responsiveSize.smallIconSize}
              color="white"
            />
          </TouchableOpacity>
        )}
      </View>

      {/* Microphone Button */}
      <View
        style={[
          styles.micContainer,
          { paddingBottom: responsiveSize.baseUnit * 1.5 },
        ]}
      >
        <TouchableOpacity
          onPress={handleMicToggle}
          disabled={isAnalyzing}
          style={[
            styles.micButton,
            {
              width: responsiveSize.baseUnit * 4.5,
              height: responsiveSize.baseUnit * 4.5,
              borderRadius: responsiveSize.baseUnit * 2.25,
            },
            isListening && styles.micButtonActive,
            isAnalyzing && styles.micButtonDisabled,
          ]}
          accessibilityRole="button"
          accessibilityLabel={
            isListening ? "Stop listening" : "Start listening"
          }
        >
          <Ionicons
            name={isListening ? "mic" : "mic-outline"}
            size={responsiveSize.iconSize * 1.5}
            color="white"
          />
        </TouchableOpacity>
        <Text style={[styles.micLabel, { fontSize: responsiveSize.bodyText }]}>
          {isListening ? "Listening..." : "Tap to ask"}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f9fafb",
  },
  loadingText: {
    marginTop: 16,
    color: "#64748b",
  },
  permissionContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f9fafb",
    padding: 32,
  },
  permissionTitle: {
    fontWeight: "600",
    color: "#1e293b",
    marginTop: 16,
    marginBottom: 8,
    textAlign: "center",
  },
  permissionText: {
    color: "#64748b",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 22,
  },
  permissionButton: {
    backgroundColor: "#8b5cf6",
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  permissionButtonText: {
    color: "white",
    fontWeight: "600",
  },
  cameraContainer: {
    flex: 0.6,
  },
  camera: {
    flex: 1,
  },
  topControls: {
    position: "absolute",
    top: 40,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  topButton: {
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    borderRadius: 12,
  },
  listeningIndicator: {
    position: "absolute",
    top: "40%",
    left: "50%",
    transform: [{ translateX: -100 }, { translateY: -50 }],
    backgroundColor: "rgba(139, 92, 246, 0.95)",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    alignItems: "center",
    minWidth: 200,
  },
  listeningPulse: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#10b981",
    marginBottom: 8,
  },
  listeningText: {
    color: "white",
    fontWeight: "600",
    marginBottom: 4,
  },
  recognizedText: {
    color: "white",
    fontStyle: "italic",
    textAlign: "center",
  },
  analyzingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  analyzingText: {
    color: "white",
    fontWeight: "600",
    marginTop: 16,
  },
  responseContainer: {
    flex: 0.4,
    backgroundColor: "#ffffff",
  },
  instructionsContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  instructionsTitle: {
    fontWeight: "600",
    color: "#1e293b",
    marginTop: 16,
    marginBottom: 8,
  },
  instructionsText: {
    color: "#64748b",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 22,
  },
  examplesContainer: {
    alignSelf: "stretch",
    backgroundColor: "#f9fafb",
    padding: 16,
    borderRadius: 12,
  },
  exampleText: {
    color: "#64748b",
    marginVertical: 4,
  },
  conversationScroll: {
    flex: 1,
  },
  messageContainer: {
    marginBottom: 12,
    padding: 12,
    borderRadius: 12,
  },
  userMessage: {
    backgroundColor: "#ede9fe",
    alignSelf: "flex-end",
    maxWidth: "80%",
  },
  aiMessage: {
    backgroundColor: "#f0fdf4",
    alignSelf: "flex-start",
    maxWidth: "80%",
  },
  messageHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  messageLabel: {
    fontWeight: "600",
    marginLeft: 6,
    color: "#1e293b",
  },
  messageText: {
    color: "#1e293b",
    lineHeight: 20,
  },
  audioButton: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: "#0ea5e9",
    borderRadius: 20,
  },
  micContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  micButton: {
    backgroundColor: "#8b5cf6",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  micButtonActive: {
    backgroundColor: "#10b981",
  },
  micButtonDisabled: {
    backgroundColor: "#9ca3af",
  },
  micLabel: {
    color: "#ffffff",
    fontWeight: "600",
    marginTop: 8,
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});

export default LiveVisionAssistant;
