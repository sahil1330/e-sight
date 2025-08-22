import { useAuth } from "@/context/AuthContext";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { z } from "zod";

// Create a new schema that only requires the verification code
const verifyCodeSchema = z.object({
  code: z.string().min(6, "Verification code must be exactly 6 characters").max(6, "Verification code must be exactly 6 characters").regex(/^\d{6}$/, "Verification code must be a valid 6-digit number"),
});

type VerifyCodeFormData = z.infer<typeof verifyCodeSchema>;

const VerifyEmail = () => {
  const params = useLocalSearchParams();
  const email = params.email as string;
  
  const {
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<VerifyCodeFormData>({
    resolver: zodResolver(verifyCodeSchema),
    defaultValues: {
      code: "",
    },
  });

  const router = useRouter();
  const { width } = useWindowDimensions();
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const isSmallDevice = width < 380;
  const headerFontSize = isSmallDevice ? 24 : 28;

  // For handling the verification code input
  const [codeDigits, setCodeDigits] = useState(["", "", "", "", "", ""]);
  const codeInputRefs = useRef<(TextInput | null)[]>([]);
  const { verifyEmail } = useAuth();
  
  const onSubmit = async (data: VerifyCodeFormData) => {
    if (verifyEmail && email) {
      await verifyEmail(email, data.code);
    }
    Alert.alert(
      "Email Verification",
      "Verification successful!"
    );
    // Handle verification logic here
  };

  const handleCodeChange = (text: string, index: number) => {
    if (text.length > 1) {
      // Handle paste of the entire code
      const pastedCode = text.slice(0, 6);
      const newDigits = [...codeDigits];

      for (let i = 0; i < pastedCode.length; i++) {
        if (i + index < 6) {
          newDigits[i + index] = pastedCode[i];
        }
      }

      setCodeDigits(newDigits);
      setValue("code", newDigits.join(""));

      // Move focus to the last input
      if (index + pastedCode.length < 6) {
        codeInputRefs.current[index + pastedCode.length]?.focus();
      }
    } else {
      // Handle single digit input
      const newDigits = [...codeDigits];
      newDigits[index] = text;
      setCodeDigits(newDigits);
      setValue("code", newDigits.join(""));

      // Move to next input if a digit was entered
      if (text !== "" && index < 5) {
        codeInputRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    // Handle backspace
    if (
      e.nativeEvent.key === "Backspace" &&
      index > 0 &&
      codeDigits[index] === ""
    ) {
      const newDigits = [...codeDigits];
      newDigits[index - 1] = "";
      setCodeDigits(newDigits);
      setValue("code", newDigits.join(""));
      codeInputRefs.current[index - 1]?.focus();
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingTop: 40,
            paddingBottom: 40,
          }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header Section */}
          <View className="items-center mb-8">
            <View className="w-24 h-24 rounded-full bg-indigo-100 items-center justify-center mb-6 border-4 border-indigo-200">
              <Text className="text-indigo-600 text-4xl">📧</Text>
            </View>
            <Text
              style={{ fontSize: headerFontSize }}
              className="font-bold text-gray-900 text-center mb-3"
            >
              Check Your Email
            </Text>
            <Text className="text-gray-600 text-center text-base mb-2">
              We&apos;ve sent a 6-digit verification code to:
            </Text>
            <View className="bg-indigo-50 px-4 py-3 rounded-lg border border-indigo-200">
              <Text className="text-indigo-700 text-center text-lg font-semibold">
                {email || "your email address"}
              </Text>
            </View>
          </View>

          {/* Form Container */}
          <View className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
            {/* Verification Code Field */}
            <View>
              <Text className="text-lg font-bold text-gray-800 mb-4 text-center">
                Enter Verification Code
              </Text>

                <View className="flex-row justify-between">
                  {[0, 1, 2, 3, 4, 5].map((index) => (
                    <TextInput
                      key={index}
                      ref={(ref) => {
                        codeInputRefs.current[index] = ref;
                      }}
                      className={`w-14 h-16 border-2 text-center rounded-xl text-xl font-bold ${
                        errors.code && codeDigits.join("").length < 6
                          ? "border-red-500 bg-red-50"
                          : focusedField === `code-${index}`
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 bg-white"
                      }`}
                      style={{
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 1 },
                        shadowOpacity: 0.05,
                        shadowRadius: 2,
                        elevation: 1,
                      }}
                      maxLength={index === 0 ? 6 : 1}
                      keyboardType="number-pad"
                      value={codeDigits[index]}
                      onChangeText={(text) => handleCodeChange(text, index)}
                      onKeyPress={(e) => handleKeyPress(e, index)}
                      onFocus={() => setFocusedField(`code-${index}`)}
                      onBlur={() => setFocusedField(null)}
                      accessibilityLabel={`Verification code digit ${index + 1}`}
                      accessibilityHint={`Enter the ${index + 1} digit of your verification code`}
                    />
                  ))}
                </View>

                {errors.code && (
                  <Text className="text-red-600 text-sm mt-3 ml-1 text-center font-medium">
                    {errors.code.message}
                  </Text>
                )}

              {/* Verify Button */}
              <TouchableOpacity
                onPress={handleSubmit(onSubmit)}
                className="bg-blue-600 py-4 rounded-xl items-center mt-4"
                style={{
                  minHeight: 56,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 4,
                  elevation: 3,
                }}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel="Verify email address"
                accessibilityHint="Submit the verification code to verify your email"
              >
                <Text className="text-white font-bold text-lg">Verify Email</Text>
              </TouchableOpacity>

              {/* Resend Code */}
              <View className="items-center mt-6">
                <Text className="text-gray-600 mb-3 text-base">
                  Didn&apos;t receive the code?
                </Text>
                <TouchableOpacity
                  style={{ minHeight: 44 }}
                  className="py-2"
                  accessibilityRole="button"
                  accessibilityLabel="Resend verification code"
                  accessibilityHint="Request a new verification code to be sent to your email"
                >
                  <Text className="text-blue-600 font-semibold text-base">Resend Code</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Footer */}
          <View className="flex-row justify-center mt-8">
            <TouchableOpacity
              onPress={() => router.push("/(auth)/sign-in")}
              className="flex-row items-center py-2"
              style={{ minHeight: 44 }}
              accessibilityRole="button"
              accessibilityLabel="Go back to sign in"
            >
              <Text className="text-blue-600 font-semibold text-base">
                ← Back to Sign In
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default VerifyEmail;
