import { useAuth } from "@/context/AuthContext";
import { verifyEmailSchema } from "@/schema/verifyEmailSchema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
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

type VerifyEmailFormData = z.infer<typeof verifyEmailSchema>;

const VerifyEmail = () => {
  const {
    control,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<VerifyEmailFormData>({
    resolver: zodResolver(verifyEmailSchema),
    defaultValues: {
      email: "",
      code: "",
    },
  });

  const router = useRouter();
  const { width } = useWindowDimensions();
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const isSmallDevice = width < 380;
  const fontSize = isSmallDevice ? 14 : 16;
  const headerFontSize = isSmallDevice ? 24 : 28;

  // For handling the verification code input
  const [codeDigits, setCodeDigits] = useState(["", "", "", "", "", ""]);
  const codeInputRefs = useRef<(TextInput | null)[]>([]);
  const { verifyEmail } = useAuth();
  const onSubmit = async (data: VerifyEmailFormData) => {
    if (verifyEmail) {
      await verifyEmail(data.email, data.code);
    }
    Alert.alert(
      "Email Verification",
      "Verification successful!" + JSON.stringify(data, null, 2)
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
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          className="flex-1 px-6"
          contentContainerClassName="py-10"
          showsVerticalScrollIndicator={false}
        >
          <View className="items-center mb-8">
            <View className="w-16 h-16 rounded-full bg-blue-100 items-center justify-center mb-4">
              <Text className="text-blue-500 text-2xl font-bold">✓</Text>
            </View>
            <Text
              style={{ fontSize: headerFontSize }}
              className="font-bold text-black text-center"
            >
              Verify Your Email
            </Text>
            <Text className="text-gray-500 mt-2 text-center">
              We have sent a verification code to your email
            </Text>
          </View>

          <View className="space-y-6">
            {/* Email Field */}
            <View>
              <Text className="text-sm font-medium text-gray-700 ml-1 mb-1.5">
                Email Address
              </Text>
              <Controller
                control={control}
                name="email"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    className={`border rounded-xl px-4 py-3.5 ${
                      errors.email
                        ? "border-red-500 bg-red-50"
                        : focusedField === "email"
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-300"
                    }`}
                    style={{ fontSize }}
                    placeholder="Enter your email"
                    onBlur={() => {
                      setFocusedField(null);
                      onBlur();
                    }}
                    onFocus={() => setFocusedField("email")}
                    onChangeText={onChange}
                    value={value}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    placeholderTextColor="#9ca3af"
                  />
                )}
              />
              {errors.email && (
                <Text className="text-red-500 text-sm mt-1 ml-1">
                  {errors.email.message}
                </Text>
              )}
            </View>

            {/* Verification Code Field */}
            <View>
              <Text className="text-sm font-medium text-gray-700 ml-1 mb-1.5">
                Verification Code
              </Text>

              <View className="flex-row justify-between">
                {[0, 1, 2, 3, 4, 5].map((index) => (
                  <TextInput
                    key={index}
                    ref={(ref) => {
                      codeInputRefs.current[index] = ref;
                    }}
                    className={`w-12 h-14 border text-center rounded-lg text-lg font-semibold ${
                      errors.code && codeDigits.join("").length < 6
                        ? "border-red-500 bg-red-50"
                        : focusedField === `code-${index}`
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-300"
                    }`}
                    maxLength={index === 0 ? 6 : 1}
                    keyboardType="number-pad"
                    value={codeDigits[index]}
                    onChangeText={(text) => handleCodeChange(text, index)}
                    onKeyPress={(e) => handleKeyPress(e, index)}
                    onFocus={() => setFocusedField(`code-${index}`)}
                    onBlur={() => setFocusedField(null)}
                  />
                ))}
              </View>

              {errors.code && (
                <Text className="text-red-500 text-sm mt-2 ml-1 text-center">
                  {errors.code.message}
                </Text>
              )}
            </View>

            {/* Verify Button */}
            <TouchableOpacity
              onPress={handleSubmit(onSubmit)}
              className="bg-blue-500 py-4 rounded-xl items-center mt-6 shadow-sm shadow-blue-400"
              activeOpacity={0.8}
            >
              <Text className="text-white font-bold text-xl">Verify Email</Text>
            </TouchableOpacity>

            {/* Resend Code */}
            <View className="items-center mt-4">
              <Text className="text-gray-600 mb-2">
                Didn&apos;t receive the code?
              </Text>
              <TouchableOpacity>
                <Text className="text-blue-600 font-semibold">Resend Code</Text>
              </TouchableOpacity>
            </View>

            {/* Back to Sign In */}
            <View className="flex-row justify-center mt-6">
              <TouchableOpacity
                onPress={() => router.push("/(auth)/sign-in")}
                className="flex-row items-center"
              >
                <Text className="text-blue-600 font-semibold">
                  ← Back to Sign In
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default VerifyEmail;
