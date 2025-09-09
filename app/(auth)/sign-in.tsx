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
            minHeight: '100%',
          }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header Section */}
          <View className="items-center mb-10">
            <View className="bg-blue-600 w-20 h-20 rounded-full items-center justify-center mb-6">
              <Text className="text-white text-2xl font-bold">E</Text>
            </View>
            <Text
              style={{ fontSize: headerFontSize }}
              className="font-bold text-gray-900 mb-2"
            >
              Welcome Back
            </Text>
            <Text className="text-gray-600 text-center text-lg">
              Sign in to access your E-Sight account
            </Text>
          </View>

          {/* Form Container */}
          <View className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <View className="space-y-6">
              {/* Email/Phone Field */}
              <View>
                <Text className="text-base font-semibold text-gray-800 mb-3">
                  Email or Phone
                </Text>
                <Controller
                  control={control}
                  name="identifier"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      className={`border-2 rounded-xl px-4 py-4 text-base ${errors.identifier
                        ? "border-red-500 bg-red-50"
                        : focusedField === "identifier"
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 bg-white"
                        }`}
                      style={{
                        fontSize,
                        minHeight: 56, // Ensure 44px+ touch target
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 1 },
                        shadowOpacity: 0.05,
                        shadowRadius: 2,
                        elevation: 1,
                      }}
                      placeholder="Enter your email or phone number"
                      onBlur={() => {
                        setFocusedField(null);
                        onBlur();
                      }}
                      onFocus={() => setFocusedField("identifier")}
                      onChangeText={onChange}
                      value={value}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoComplete="email"
                      placeholderTextColor="#9CA3AF"
                      accessibilityLabel="Email or phone number input"
                      accessibilityHint="Enter your email address or phone number to sign in"
                    />
                  )}
                />
                {errors.identifier && (
                  <Text className="text-red-600 text-sm mt-2 ml-1 font-medium">
                    {errors.identifier.message}
                  </Text>
                )}
              </View>

              {/* Password Field */}
              <View>
                <Text className="text-base font-semibold text-gray-800 mb-3">
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
                        className={`border-2 rounded-xl px-4 py-4 pr-16 text-black ${errors.password
                          ? "border-red-500 bg-red-50"
                          : focusedField === "password"
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200 bg-white"
                          }`}
                        style={{
                          fontSize,
                          minHeight: 56, // Ensure 44px+ touch target
                          shadowColor: '#000',
                          shadowOffset: { width: 0, height: 1 },
                          shadowOpacity: 0.05,
                          shadowRadius: 2,
                          elevation: 1,
                        }}
                        placeholder="Enter your password"
                        onBlur={() => {
                          setFocusedField(null);
                          onBlur();
                        }}
                        onFocus={() => setFocusedField("password")}
                        onChangeText={onChange}
                        value={value}
                        secureTextEntry={!passwordVisible}
                        autoComplete="password"
                        placeholderTextColor="#9CA3AF"
                        accessibilityLabel="Password input"
                        accessibilityHint="Enter your account password"
                      />
                    )}
                  />
                  <TouchableOpacity
                    onPress={() => setPasswordVisible(!passwordVisible)}
                    className="absolute right-4 top-4 p-2"
                    style={{ minHeight: 44, minWidth: 44 }}
                    accessibilityRole="button"
                    accessibilityLabel={passwordVisible ? "Hide password" : "Show password"}
                  >
                    <Text className="text-blue-600 font-medium">
                      {passwordVisible ? "Hide" : "Show"}
                    </Text>
                  </TouchableOpacity>
                </View>
                {errors.password && (
                  <Text className="text-red-600 text-sm mt-2 ml-1 font-medium">
                    {errors.password.message}
                  </Text>
                )}
              </View>

              {/* Forgot Password */}
              <View className="items-end mt-2">
                <TouchableOpacity
                  onPress={() => router.push("/forgot-password" as any)}
                  style={{ minHeight: 44 }}
                  className="py-2"
                  accessibilityRole="button"
                  accessibilityLabel="Forgot password"
                  accessibilityHint="Navigate to password reset"
                >
                  <Text className="text-blue-600 font-semibold text-base">
                    Forgot Password?
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Sign In Button */}
              <TouchableOpacity
                onPress={handleSubmit(onSubmit)}
                className={`py-4 rounded-xl items-center mt-4 ${isSubmitting ? 'bg-blue-400' : 'bg-blue-600'
                  }`}
                style={{
                  minHeight: 56,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 4,
                  elevation: 3,
                }}
                activeOpacity={0.8}
                disabled={isSubmitting}
                accessibilityRole="button"
                accessibilityLabel="Sign in to your account"
                accessibilityState={{ disabled: isSubmitting }}
              >
                {isSubmitting ? (
                  <View className="flex-row items-center">
                    <ActivityIndicator size="small" color="white" style={{ marginRight: 8 }} />
                    <Text className="text-white font-bold text-lg">Signing In...</Text>
                  </View>
                ) : (
                  <Text className="text-white font-bold text-lg">Sign In</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Footer */}
          <View className="flex-row justify-center mt-8">
            <Text className="text-gray-600 text-base">
              Don&apos;t have an account?{" "}
            </Text>
            <TouchableOpacity
              onPress={() => router.push("/(auth)/sign-up")}
              style={{ minHeight: 44 }}
              accessibilityRole="button"
              accessibilityLabel="Navigate to sign up"
            >
              <Text className="text-blue-600 font-semibold text-base">Sign Up</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default SignIn;
