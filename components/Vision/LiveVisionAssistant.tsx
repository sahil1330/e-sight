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
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastTranscriptionRef = useRef<string>("");

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
    // console.log("Speech recognition started");
  });

  useSpeechRecognitionEvent("result", (event) => {
    const transcription = event.results[0]?.transcript || "";
    setRecognizedText(transcription);
    lastTranscriptionRef.current = transcription;

    // Clear existing timeout
    if (recognitionTimeoutRef.current) {
      clearTimeout(recognitionTimeoutRef.current);
    }

    // Set new timeout - if user pauses for 2 seconds, process the question
    recognitionTimeoutRef.current = setTimeout(() => {
      if (transcription.trim()) {
        // console.log("Submitting question after 2s pause:", transcription);
        handleQuestionSubmit(transcription);
      }
    }, 2000);
  });

  useSpeechRecognitionEvent("error", (event) => {
    console.error("Speech recognition error:", event);
    setIsListening(false);
    lastTranscriptionRef.current = "";

    if (event.error === "no-match") {
      // User didn't say anything - this is normal
      // console.log("No speech detected");
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
    // console.log(
    //   "Speech recognition ended, last text:",
    //   lastTranscriptionRef.current,
    // );
    setIsListening(false);

    // If we have valid text and a pending timeout, submit immediately
    if (lastTranscriptionRef.current.trim() && recognitionTimeoutRef.current) {
      clearTimeout(recognitionTimeoutRef.current);
      recognitionTimeoutRef.current = null;
      handleQuestionSubmit(lastTranscriptionRef.current);
      lastTranscriptionRef.current = "";
    } else {
      // Clear timeout and reset if no valid text
      if (recognitionTimeoutRef.current) {
        clearTimeout(recognitionTimeoutRef.current);
        recognitionTimeoutRef.current = null;
      }
      lastTranscriptionRef.current = "";
      // console.log("Speech ended with no valid text");
    }
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
      lastTranscriptionRef.current = "";
    } else {
      // Start listening
      setRecognizedText("");
      lastTranscriptionRef.current = "";
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

    if (!question.trim() || !cameraRef.current) {
      lastTranscriptionRef.current = "";
      return;
    }

    // Clear the transcription ref
    lastTranscriptionRef.current = "";

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

    // Create new abort controller for this request
    abortControllerRef.current = new AbortController();

    try {
      setIsAnalyzing(true);
      const startTime = Date.now();

      // Capture current camera frame
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.3,
        skipProcessing: true,
      });
      // console.log(`Photo captured in ${Date.now() - startTime}ms`);

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
      // console.log(`Image resized in ${Date.now() - resizeStartTime}ms`);

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
      // console.log(`AI response received in ${Date.now() - aiStartTime}ms`);

      setAiResponse(response);

      // Add AI response to history
      setConversationHistory((prev) => [
        ...prev,
        { type: "ai", text: response },
      ]);

      setIsAnalyzing(false);
      setRecognizedText("");
      abortControllerRef.current = null;
      // console.log(`Total analysis completed in ${Date.now() - startTime}ms`);

      // Speak the response
      speakResponse(response);
    } catch (error) {
      console.error("Error analyzing image:", error);
      setIsAnalyzing(false);
      abortControllerRef.current = null;

      // Check if it was aborted
      if (error instanceof Error && error.name === "AbortError") {
        // console.log("Analysis was cancelled by user");
        return;
      }

      Alert.alert(
        "Analysis Failed",
        error instanceof Error ? error.message : "Failed to analyze the image.",
      );
    }
  };

  const handleStopAnalysis = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsAnalyzing(false);
    setRecognizedText("");
    // console.log("Analysis stopped by user");
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
      <View className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text
          className="mt-4 text-slate-600"
          style={{ fontSize: responsiveSize.bodyText }}
        >
          Loading camera...
        </Text>
      </View>
    );
  }

  if (!cameraPermission.granted) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50 p-8">
        <Ionicons
          name="camera-outline"
          size={responsiveSize.iconSize * 3}
          color="#9ca3af"
        />
        <Text
          className="font-semibold text-slate-800 mt-4 mb-2 text-center"
          style={{ fontSize: responsiveSize.headerText }}
        >
          Camera Permission Required
        </Text>
        <Text
          className="text-slate-600 text-center mb-6 leading-6"
          style={{ fontSize: responsiveSize.bodyText }}
        >
          This feature requires camera access to help you see your surroundings.
        </Text>
        <TouchableOpacity
          className="bg-blue-500 px-8 rounded-xl"
          style={{ paddingVertical: responsiveSize.baseUnit * 0.8 }}
          onPress={requestCameraPermission}
        >
          <Text
            className="text-white font-semibold"
            style={{ fontSize: responsiveSize.buttonText }}
          >
            Grant Camera Permission
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black">
      {/* Full Screen Camera View */}
      <View className="flex-1 relative">
        <CameraView
          ref={cameraRef}
          style={{ flex: 1 }}
          facing={facing}
          mode="picture"
        />

        {/* Top Controls - Overlaid on Camera */}
        <View
          className="absolute top-10 left-0 right-0 flex-row justify-end"
          style={{ paddingHorizontal: responsiveSize.containerPadding }}
        >
          <TouchableOpacity
            onPress={toggleCameraFacing}
            className="bg-black/60 rounded-xl"
            style={{ padding: responsiveSize.baseUnit * 0.6 }}
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

        {/* Listening Indicator - Overlaid on Camera */}
        {isListening && (
          <View
            className="absolute bg-blue-500/95 py-4 px-6 rounded-2xl items-center"
            style={{
              top: "40%",
              left: "50%",
              transform: [{ translateX: -100 }, { translateY: -50 }],
              minWidth: 200,
            }}
          >
            <View className="w-3 h-3 rounded-full bg-emerald-500 mb-2" />
            <Text
              className="text-white font-semibold mb-1"
              style={{ fontSize: responsiveSize.bodyText }}
            >
              Listening...
            </Text>
            {recognizedText && (
              <Text
                className="text-white italic text-center"
                style={{ fontSize: responsiveSize.bodyText }}
              >
                &quot;{recognizedText}&quot;
              </Text>
            )}
          </View>
        )}

        {/* Analyzing Overlay - Overlaid on Camera */}
        {isAnalyzing && (
          <View className="absolute inset-0 bg-black/70 justify-center items-center">
            <ActivityIndicator size="large" color="#ffffff" />
            <Text
              className="text-white font-semibold mt-4"
              style={{ fontSize: responsiveSize.headerText }}
            >
              Analyzing...
            </Text>

            {/* Stop Analysis Button */}
            <TouchableOpacity
              onPress={handleStopAnalysis}
              className="absolute right-6 bg-red-500 rounded-full"
              style={{
                bottom: responsiveSize.baseUnit * 6,
                padding: responsiveSize.baseUnit * 0.8,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.3,
                shadowRadius: 4,
                elevation: 5,
              }}
              accessibilityRole="button"
              accessibilityLabel="Stop analysis"
            >
              <Ionicons
                name="stop"
                size={responsiveSize.iconSize}
                color="white"
              />
            </TouchableOpacity>
          </View>
        )}

        {/* Glassmorphic AI Response Bubble - Shows when speaking */}
        {isSpeaking && aiResponse && (
          <View
            className="absolute left-4 right-4 items-center"
            style={{
              bottom: responsiveSize.baseUnit * 10,
            }}
          >
            <View
              className="bg-black/70 backdrop-blur-xl p-4 rounded-3xl max-w-[90%]"
              style={{
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 12,
                elevation: 8,
                borderWidth: 1,
                borderColor: "rgba(255, 255, 255, 0.1)",
              }}
            >
              <View className="flex-row items-center mb-2">
                <Ionicons
                  name="sparkles"
                  size={responsiveSize.smallIconSize}
                  color="#3b82f6"
                />
                <Text
                  className="text-blue-400 font-semibold ml-2"
                  style={{ fontSize: responsiveSize.bodyText * 0.9 }}
                >
                  AI Assistant
                </Text>
                <View className="flex-1" />
                <TouchableOpacity
                  onPress={toggleSpeechPlayback}
                  className="ml-2"
                  accessibilityRole="button"
                  accessibilityLabel="Stop speaking"
                >
                  <Ionicons
                    name="stop-circle"
                    size={responsiveSize.smallIconSize}
                    color="#3b82f6"
                  />
                </TouchableOpacity>
              </View>
              <Text
                className="text-white leading-6"
                style={{ fontSize: responsiveSize.bodyText }}
              >
                {aiResponse}
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* Microphone Button */}
      <View
        className="absolute bottom-0 left-0 right-0 items-center"
        style={{ paddingBottom: responsiveSize.baseUnit * 5 }}
      >
        <TouchableOpacity
          onPress={handleMicToggle}
          disabled={isAnalyzing}
          className={`justify-center items-center shadow-lg ${
            isListening
              ? "bg-emerald-500"
              : isAnalyzing
                ? "bg-gray-400"
                : "bg-blue-500"
          }`}
          style={{
            width: responsiveSize.baseUnit * 4.5,
            height: responsiveSize.baseUnit * 4.5,
            borderRadius: responsiveSize.baseUnit * 2.25,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 8,
          }}
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
        <Text
          className="text-white font-semibold mt-2"
          style={{
            fontSize: responsiveSize.bodyText,
            textShadowColor: "rgba(0, 0, 0, 0.5)",
            textShadowOffset: { width: 0, height: 1 },
            textShadowRadius: 2,
          }}
        >
          {isListening ? "Listening..." : "Tap to ask"}
        </Text>
      </View>
    </View>
  );
};

export default LiveVisionAssistant;
