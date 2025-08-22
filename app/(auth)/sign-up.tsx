import { useAuth } from "@/context/AuthContext";
import { signUpSchema } from "@/schema/signUpSchema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "expo-router";
import React, { useState } from "react";
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

// Get TypeScript type from schema
type SignUpFormData = z.infer<typeof signUpSchema>;

const SignUp = () => {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<z.infer<typeof signUpSchema>>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
      role: undefined,
    },
  });
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { register } = useAuth();
  const onSubmit = async (data: SignUpFormData) => {
    try {
      setIsSubmitting(true);
      if (!register) {
        Alert.alert("Error", "Some error occurred.");
        return;
      }
      const result = await register(
        data.fullName,
        data.email,
        data.password,
        data.phone,
        data.role
      );

      if (result?.isError) {
        Alert.alert("Error", result.message || "An error occurred.");
        return;
      }

      if (result) {
        router.push({
          pathname: "/(auth)/verify-email",
          params: { email: data.email }
        });
      }
    } catch (error) {
      console.error("Error during sign-up:", error);
      Alert.alert("Sign Up Error", "An error occurred during sign-up.");
      return;
    }
    finally {
      setIsSubmitting(false);
    }
    Alert.alert(
      "Sign Up",
      "Sign up successful!"
    );
    // Handle sign-up logic here
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
            paddingTop: 20,
            paddingBottom: 40,
          }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header Section */}
          <View className="items-center mb-8">
            <View className="bg-blue-600 w-20 h-20 rounded-full items-center justify-center mb-6">
              <Text className="text-white text-2xl font-bold">E</Text>
            </View>
            <Text
              style={{ fontSize: headerFontSize }}
              className="font-bold text-gray-900 mb-2"
            >
              Create Account
            </Text>
            <Text className="text-gray-600 text-center text-lg">
              Join E-Sight to get started with accessibility features
            </Text>
          </View>

          {/* Form Container */}
          <View className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <View className="space-y-6">
              {/* Full Name Field */}
              <View>
                <Text className="text-base font-semibold text-gray-800 mb-3">
                  Full Name
                </Text>
                <Controller
                  control={control}
                  name="fullName"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      className={`border-2 rounded-xl px-4 py-4 text-base ${errors.fullName
                          ? "border-red-500 bg-red-50"
                          : focusedField === "fullName"
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200 bg-white"
                        }`}
                      style={{
                        fontSize,
                        minHeight: 56,
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 1 },
                        shadowOpacity: 0.05,
                        shadowRadius: 2,
                        elevation: 1,
                      }}
                      placeholder="Enter your full name"
                      onBlur={() => {
                        setFocusedField(null);
                        onBlur();
                      }}
                      onFocus={() => setFocusedField("fullName")}
                      onChangeText={onChange}
                      value={value}
                      autoComplete="name"
                      placeholderTextColor="#9CA3AF"
                      accessibilityLabel="Full name input"
                      accessibilityHint="Enter your complete name"
                    />
                  )}
                />
                {errors.fullName && (
                  <Text className="text-red-600 text-sm mt-2 ml-1 font-medium">
                    {errors.fullName.message}
                  </Text>
                )}
              </View>

              {/* Email Field */}
              <View>
                <Text className="text-base font-semibold text-gray-800 mb-3">
                  Email Address
                </Text>
                <Controller
                  control={control}
                  name="email"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      className={`border-2 rounded-xl px-4 py-4 text-base ${errors.email
                          ? "border-red-500 bg-red-50"
                          : focusedField === "email"
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200 bg-white"
                        }`}
                      style={{
                        fontSize,
                        minHeight: 56,
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 1 },
                        shadowOpacity: 0.05,
                        shadowRadius: 2,
                        elevation: 1,
                      }}
                      placeholder="Enter your email address"
                      onBlur={() => {
                        setFocusedField(null);
                        onBlur();
                      }}
                      onFocus={() => setFocusedField("email")}
                      onChangeText={onChange}
                      value={value}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoComplete="email"
                      placeholderTextColor="#9CA3AF"
                      accessibilityLabel="Email address input"
                      accessibilityHint="Enter your email address for account creation"
                    />
                  )}
                />
                {errors.email && (
                  <Text className="text-red-600 text-sm mt-2 ml-1 font-medium">
                    {errors.email.message}
                  </Text>
                )}
              </View>

              {/* Phone Field */}
              <View>
                <Text className="text-base font-semibold text-gray-800 mb-3">
                  Phone Number
                </Text>
                <Controller
                  control={control}
                  name="phone"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      className={`border-2 rounded-xl px-4 py-4 text-base ${errors.phone
                          ? "border-red-500 bg-red-50"
                          : focusedField === "phone"
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200 bg-white"
                        }`}
                      style={{
                        fontSize,
                        minHeight: 56,
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 1 },
                        shadowOpacity: 0.05,
                        shadowRadius: 2,
                        elevation: 1,
                      }}
                      placeholder="Enter your phone number"
                      onBlur={() => {
                        setFocusedField(null);
                        onBlur();
                      }}
                      onFocus={() => setFocusedField("phone")}
                      onChangeText={onChange}
                      value={value}
                      keyboardType="phone-pad"
                      autoComplete="tel"
                      placeholderTextColor="#9CA3AF"
                      accessibilityLabel="Phone number input"
                      accessibilityHint="Enter your phone number for account creation"
                    />
                  )}
                />
                {errors.phone && (
                  <Text className="text-red-600 text-sm mt-2 ml-1 font-medium">
                    {errors.phone.message}
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
                    render={({ field: { onChange, onBlur, value } }) => (
                      <TextInput
                        className={`border-2 rounded-xl px-4 py-4 pr-16 ${errors.password
                            ? "border-red-500 bg-red-50"
                            : focusedField === "password"
                              ? "border-blue-500 bg-blue-50"
                              : "border-gray-200 bg-white"
                          }`}
                        style={{
                          fontSize,
                          minHeight: 56,
                          shadowColor: '#000',
                          shadowOffset: { width: 0, height: 1 },
                          shadowOpacity: 0.05,
                          shadowRadius: 2,
                          elevation: 1,
                        }}
                        placeholder="Create a secure password"
                        onBlur={() => {
                          setFocusedField(null);
                          onBlur();
                        }}
                        onFocus={() => setFocusedField("password")}
                        onChangeText={onChange}
                        value={value}
                        secureTextEntry={!passwordVisible}
                        autoComplete="new-password"
                        placeholderTextColor="#9CA3AF"
                        accessibilityLabel="Password input"
                        accessibilityHint="Create a secure password for your account"
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

              {/* Confirm Password Field */}
              <View>
                <Text className="text-base font-semibold text-gray-800 mb-3">
                  Confirm Password
                </Text>
                <View className="relative">
                  <Controller
                    control={control}
                    name="confirmPassword"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <TextInput
                        className={`border-2 rounded-xl px-4 py-4 pr-16 ${errors.confirmPassword
                            ? "border-red-500 bg-red-50"
                            : focusedField === "confirmPassword"
                              ? "border-blue-500 bg-blue-50"
                              : "border-gray-200 bg-white"
                          }`}
                        style={{
                          fontSize,
                          minHeight: 56,
                          shadowColor: '#000',
                          shadowOffset: { width: 0, height: 1 },
                          shadowOpacity: 0.05,
                          shadowRadius: 2,
                          elevation: 1,
                        }}
                        placeholder="Confirm your password"
                        onBlur={() => {
                          setFocusedField(null);
                          onBlur();
                        }}
                        onFocus={() => setFocusedField("confirmPassword")}
                        onChangeText={onChange}
                        value={value}
                        secureTextEntry={!confirmPasswordVisible}
                        autoComplete="new-password"
                        placeholderTextColor="#9CA3AF"
                        accessibilityLabel="Confirm password input"
                        accessibilityHint="Re-enter your password to confirm"
                      />
                    )}
                  />
                  <TouchableOpacity
                    onPress={() => setConfirmPasswordVisible(!confirmPasswordVisible)}
                    className="absolute right-4 top-4 p-2"
                    style={{ minHeight: 44, minWidth: 44 }}
                    accessibilityRole="button"
                    accessibilityLabel={confirmPasswordVisible ? "Hide confirm password" : "Show confirm password"}
                  >
                    <Text className="text-blue-600 font-medium">
                      {confirmPasswordVisible ? "Hide" : "Show"}
                    </Text>
                  </TouchableOpacity>
                </View>
                {errors.confirmPassword && (
                  <Text className="text-red-600 text-sm mt-2 ml-1 font-medium">
                    {errors.confirmPassword.message}
                  </Text>
                )}
              </View>

              {/* Role Selection */}
              <View>
                <Text className="text-base font-semibold text-gray-800 mb-3">
                  Select Your Role
                </Text>
                <Controller
                  control={control}
                  name="role"
                  render={({ field: { onChange, value } }) => (
                    <View className="space-y-3">
                      <TouchableOpacity
                        onPress={() => onChange("blind")}
                        className={`border-2 rounded-xl p-4 ${value === "blind"
                            ? "bg-blue-50 border-blue-500"
                            : "bg-white border-gray-200"
                          }`}
                        style={{
                          minHeight: 64,
                          shadowColor: '#000',
                          shadowOffset: { width: 0, height: 1 },
                          shadowOpacity: 0.05,
                          shadowRadius: 2,
                          elevation: 1,
                        }}
                        accessibilityRole="radio"
                        accessibilityState={{ checked: value === "blind" }}
                        accessibilityLabel="Blind user role"
                        accessibilityHint="Select if you are a blind user who will use accessibility features"
                      >
                        <View className="flex-row items-center">
                          <View
                            className={`h-6 w-6 rounded-full border-2 mr-4 items-center justify-center ${value === "blind"
                                ? "border-blue-500"
                                : "border-gray-400"
                              }`}
                          >
                            {value === "blind" && (
                              <View className="h-3 w-3 rounded-full bg-blue-500" />
                            )}
                          </View>
                          <View className="flex-1">
                            <Text
                              className={`font-semibold text-lg ${value === "blind"
                                  ? "text-blue-600"
                                  : "text-gray-800"
                                }`}
                            >
                              Blind User
                            </Text>
                            <Text className="text-gray-600 text-sm mt-1">
                              Access full accessibility features and navigation assistance
                            </Text>
                          </View>
                        </View>
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => onChange("caretaker")}
                        className={`border-2 rounded-xl p-4 ${value === "caretaker"
                            ? "bg-blue-50 border-blue-500"
                            : "bg-white border-gray-200"
                          }`}
                        style={{
                          minHeight: 64,
                          shadowColor: '#000',
                          shadowOffset: { width: 0, height: 1 },
                          shadowOpacity: 0.05,
                          shadowRadius: 2,
                          elevation: 1,
                        }}
                        accessibilityRole="radio"
                        accessibilityState={{ checked: value === "caretaker" }}
                        accessibilityLabel="Caretaker role"
                        accessibilityHint="Select if you are a caretaker who will monitor and assist blind users"
                      >
                        <View className="flex-row items-center">
                          <View
                            className={`h-6 w-6 rounded-full border-2 mr-4 items-center justify-center ${value === "caretaker"
                                ? "border-blue-500"
                                : "border-gray-400"
                              }`}
                          >
                            {value === "caretaker" && (
                              <View className="h-3 w-3 rounded-full bg-blue-500" />
                            )}
                          </View>
                          <View className="flex-1">
                            <Text
                              className={`font-semibold text-lg ${value === "caretaker"
                                  ? "text-blue-600"
                                  : "text-gray-800"
                                }`}
                            >
                              Caretaker
                            </Text>
                            <Text className="text-gray-600 text-sm mt-1">
                              Monitor and provide assistance to blind users
                            </Text>
                          </View>
                        </View>
                      </TouchableOpacity>
                    </View>
                  )}
                />
                {errors.role && (
                  <Text className="text-red-600 text-sm mt-2 ml-1 font-medium">
                    {errors.role.message}
                  </Text>
                )}
              </View>

              {/* Sign Up Button */}
              <TouchableOpacity
                onPress={handleSubmit(onSubmit)}
                disabled={isSubmitting}
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
                accessibilityLabel="Create your account"
                accessibilityHint="Submit the form to create your new E-Sight account"
              >
                <Text className="text-white font-bold text-lg">
                  {isSubmitting ? "Creating Account..." : "Create Account"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Footer */}
          <View className="flex-row justify-center mt-8">
            <Text className="text-gray-600 text-base">Already have an account? </Text>
            <TouchableOpacity
              onPress={() => router.push("/(auth)/sign-in")}
              style={{ minHeight: 44 }}
              className="py-2"
              accessibilityRole="button"
              accessibilityLabel="Navigate to sign in"
            >
              <Text className="text-blue-600 font-semibold text-base">Sign In</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default SignUp;
