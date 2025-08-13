import { useAuth } from "@/context/AuthContext";
import { signInSchema } from "@/schema/signInSchema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  ActivityIndicator,
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

// Get TypeScript type from schema
type SignInFormData = z.infer<typeof signInSchema>;

const SignIn = () => {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      identifier: "",
      password: "",
    },
  });
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
  const onSubmit = async (data: SignInFormData) => {
    setIsSubmitting(true);
    try {
      if (login) {
        const result = await login(data?.identifier, data?.password);
        if (result.isError) {
          Alert.alert("Error", result.message || "An error occurred.");
        }
        if (result.success) {
          Alert.alert("Success", "You have successfully signed in!");
          router.replace("/(protected)/(tabs)");
        }
      }
    } catch (error) {
      console.error("Sign-in error:", error);
      Alert.alert("Error", "An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Additional styles for responsive design
  const isSmallDevice = width < 380;
  const fontSize = isSmallDevice ? 14 : 16;
  const headerFontSize = isSmallDevice ? 24 : 28;

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          className="flex-1 px-6 space-y-6"
          contentInsetAdjustmentBehavior="automatic"
          contentContainerClassName="py-16"
          showsVerticalScrollIndicator={false}
        >
          <View className="items-center mb-8">
            <Text
              style={{ fontSize: headerFontSize }}
              className="font-bold text-black"
            >
              Welcome Back
            </Text>
            <Text className="text-gray-500 mt-2 text-center">
              Please sign in to your account
            </Text>
          </View>

          <View className="space-y-5">
            {/* Email/Phone Field */}
            <View>
              <Text className="text-sm font-medium text-gray-700 ml-1 mb-1.5">
                Email or Phone
              </Text>
              <Controller
                control={control}
                name="identifier"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    className={`border rounded-xl px-4 py-3.5 ${
                      errors.identifier
                        ? "border-red-500 bg-red-50"
                        : focusedField === "identifier"
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-300"
                    }`}
                    style={{ fontSize }}
                    placeholder="Enter your email or phone"
                    onBlur={() => {
                      setFocusedField(null);
                      onBlur();
                    }}
                    onFocus={() => setFocusedField("identifier")}
                    onChangeText={onChange}
                    value={value}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    placeholderTextColor="#9ca3af"
                  />
                )}
              />
              {errors.identifier && (
                <Text className="text-red-500 text-sm mt-1 ml-1">
                  {errors.identifier.message}
                </Text>
              )}
            </View>

            {/* Password Field */}
            <View className="mt-4">
              <Text className="text-sm font-medium text-gray-700 ml-1 mb-1.5">
                Password
              </Text>
              <View className="relative">
                <Controller
                  control={control}
                  name="password"
                  rules={{
                    required: "Password is required",
                  }}
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      className={`border rounded-xl px-4 py-3.5  text-black ${
                        errors.password
                          ? "border-red-500 bg-red-50"
                          : focusedField === "password"
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-300"
                      }`}
                      style={{ fontSize }}
                      placeholder="Enter your password"
                      onBlur={() => {
                        setFocusedField(null);
                        onBlur();
                      }}
                      onFocus={() => setFocusedField("password")}
                      onChangeText={onChange}
                      value={value}
                      secureTextEntry={!passwordVisible}
                      placeholderTextColor="#9ca3af"
                    />
                  )}
                />
                <TouchableOpacity
                  onPress={() => setPasswordVisible(!passwordVisible)}
                  className="absolute right-4 top-3.5"
                >
                  <Text className="text-blue-600">
                    {passwordVisible ? "Hide" : "Show"}
                  </Text>
                </TouchableOpacity>
              </View>
              {errors.password && (
                <Text className="text-red-500 text-sm mt-1 ml-1">
                  {errors.password.message}
                </Text>
              )}
            </View>

            {/* Forgot Password */}
            <View className="items-end">
              <TouchableOpacity>
                <Text className="text-blue-600 font-medium">
                  Forgot Password?
                </Text>
              </TouchableOpacity>
            </View>

            {/* Sign In Button */}
            <TouchableOpacity
              onPress={handleSubmit(onSubmit)}
              className="bg-blue-500 py-4 rounded-xl items-center mt-6 shadow-sm shadow-blue-400"
              activeOpacity={0.8}
              disabled={isSubmitting}
            >
              {isSubmitting ? (<Text className="text-white font-bold text-xl">Signing in <ActivityIndicator size={16} /></Text>) : (<Text className="text-white font-bold text-xl">Sign In</Text>)} 
            </TouchableOpacity>

            {/* Don't have an account */}
            <View className="flex-row justify-center mt-5">
              <Text className="text-gray-600">
                Don&apos;t have an account?{" "}
              </Text>
              <TouchableOpacity onPress={() => router.push("/(auth)/sign-up")}>
                <Text className="text-blue-600 font-semibold">Sign Up</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default SignIn;
