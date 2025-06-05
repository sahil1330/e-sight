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
  const { register } = useAuth();
  const onSubmit = async (data: SignUpFormData) => {
    try {
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
        router.push("/(auth)/verify-email");
      }
    } catch (error) {
      console.error("Error during sign-up:", error);
      Alert.alert("Sign Up Error", "An error occurred during sign-up.");
      return;
    }
    Alert.alert(
      "Sign Up",
      "Sign up successful!" + JSON.stringify(data, null, 2)
    );
    // Handle sign-up logic here
  };

  // Additional styles for responsive design
  const isSmallDevice = width < 380;
  const fontSize = isSmallDevice ? 14 : 16;
  const headerFontSize = isSmallDevice ? 24 : 28;

  return (
    <SafeAreaView className="flex-1 bg-white ">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          className="flex-1 px-6 space-y-6"
          contentInsetAdjustmentBehavior="automatic"
          contentContainerClassName="py-0"
          showsVerticalScrollIndicator={false}
        >
          <View className="items-center mb-8">
            <Text
              style={{ fontSize: headerFontSize }}
              className="font-bold text-black"
            >
              Create Account
            </Text>
            <Text className="text-gray-500 mt-2 text-center">
              Please fill the details to create your account
            </Text>
          </View>

          <View className="space-y-5">
            {/* Full Name Field */}
            <View>
              <Text className="text-sm font-medium text-gray-700 ml-1 mb-1.5">
                Full Name
              </Text>
              <Controller
                control={control}
                name="fullName"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    className={`border rounded-xl px-4 py-3.5 ${
                      errors.fullName
                        ? "border-red-500 bg-red-50"
                        : focusedField === "fullName"
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-300"
                    }`}
                    style={{ fontSize }}
                    placeholder="Enter your full name"
                    onBlur={() => {
                      setFocusedField(null);
                      onBlur();
                    }}
                    onFocus={() => setFocusedField("fullName")}
                    onChangeText={onChange}
                    value={value}
                    placeholderTextColor="#9ca3af"
                  />
                )}
              />
              {errors.fullName && (
                <Text className="text-red-500 text-sm mt-1 ml-1">
                  {errors.fullName.message}
                </Text>
              )}
            </View>

            {/* Email Field */}
            <View className="mt-4">
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

            {/* Phone Field */}
            <View className="mt-4">
              <Text className="text-sm font-medium text-gray-700 ml-1 mb-1.5">
                Phone Number
              </Text>
              <Controller
                control={control}
                name="phone"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    className={`border rounded-xl px-4 py-3.5 ${
                      errors.phone
                        ? "border-red-500 bg-red-50"
                        : focusedField === "phone"
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-300"
                    }`}
                    style={{ fontSize }}
                    placeholder="Enter your phone number"
                    onBlur={() => {
                      setFocusedField(null);
                      onBlur();
                    }}
                    onFocus={() => setFocusedField("phone")}
                    onChangeText={onChange}
                    value={value}
                    keyboardType="phone-pad"
                    placeholderTextColor="#9ca3af"
                  />
                )}
              />
              {errors.phone && (
                <Text className="text-red-500 text-sm mt-1 ml-1">
                  {errors.phone.message}
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
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      className={`border rounded-xl px-4 py-3.5 ${
                        errors.password
                          ? "border-red-500 bg-red-50"
                          : focusedField === "password"
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-300"
                      }`}
                      style={{ fontSize }}
                      placeholder="Create a password"
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

            {/* Confirm Password Field */}
            <View className="mt-4">
              <Text className="text-sm font-medium text-gray-700 ml-1 mb-1.5">
                Confirm Password
              </Text>
              <View className="relative">
                <Controller
                  control={control}
                  name="confirmPassword"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      className={`border rounded-xl px-4 py-3.5 ${
                        errors.confirmPassword
                          ? "border-red-500 bg-red-50"
                          : focusedField === "confirmPassword"
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-300"
                      }`}
                      style={{ fontSize }}
                      placeholder="Confirm your password"
                      onBlur={() => {
                        setFocusedField(null);
                        onBlur();
                      }}
                      onFocus={() => setFocusedField("confirmPassword")}
                      onChangeText={onChange}
                      value={value}
                      secureTextEntry={!confirmPasswordVisible}
                      placeholderTextColor="#9ca3af"
                    />
                  )}
                />
                <TouchableOpacity
                  onPress={() =>
                    setConfirmPasswordVisible(!confirmPasswordVisible)
                  }
                  className="absolute right-4 top-3.5"
                >
                  <Text className="text-blue-600">
                    {confirmPasswordVisible ? "Hide" : "Show"}
                  </Text>
                </TouchableOpacity>
              </View>
              {errors.confirmPassword && (
                <Text className="text-red-500 text-sm mt-1 ml-1">
                  {errors.confirmPassword.message}
                </Text>
              )}
            </View>

            {/* Role Selection */}
            <View className="mt-4">
              <Text className="text-sm font-medium text-gray-700 ml-1 mb-1.5">
                Select Your Role
              </Text>
              <Controller
                control={control}
                name="role"
                render={({ field: { onChange, value } }) => (
                  <View className="flex-row space-x-4">
                    <TouchableOpacity
                      onPress={() => onChange("blind")}
                      className={`flex-1 border rounded-xl p-4 items-center ${
                        value === "blind"
                          ? "bg-blue-100 border-blue-500"
                          : "border-gray-300"
                      }`}
                    >
                      <View className="flex-row items-center justify-center">
                        <View
                          className={`h-5 w-5 rounded-full border-2 mr-2 items-center justify-center ${
                            value === "blind"
                              ? "border-blue-500"
                              : "border-gray-400"
                          }`}
                        >
                          {value === "blind" && (
                            <View className="h-3 w-3 rounded-full bg-blue-500" />
                          )}
                        </View>
                        <Text
                          className={`font-medium ${
                            value === "blind"
                              ? "text-blue-600"
                              : "text-gray-700"
                          }`}
                        >
                          Blind
                        </Text>
                      </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => onChange("caretaker")}
                      className={`flex-1 border rounded-xl p-4 items-center ${
                        value === "caretaker"
                          ? "bg-blue-100 border-blue-500"
                          : "border-gray-300"
                      }`}
                    >
                      <View className="flex-row items-center justify-center">
                        <View
                          className={`h-5 w-5 rounded-full border-2 mr-2 items-center justify-center ${
                            value === "caretaker"
                              ? "border-blue-500"
                              : "border-gray-400"
                          }`}
                        >
                          {value === "caretaker" && (
                            <View className="h-3 w-3 rounded-full bg-blue-500" />
                          )}
                        </View>
                        <Text
                          className={`font-medium ${
                            value === "caretaker"
                              ? "text-blue-600"
                              : "text-gray-700"
                          }`}
                        >
                          Caretaker
                        </Text>
                      </View>
                    </TouchableOpacity>
                  </View>
                )}
              />
              {errors.role && (
                <Text className="text-red-500 text-sm mt-1 ml-1">
                  {errors.role.message}
                </Text>
              )}
            </View>

            {/* Sign Up Button */}
            <TouchableOpacity
              onPress={handleSubmit(onSubmit)}
              className="bg-blue-500 py-4 rounded-xl items-center mt-6 shadow-sm shadow-blue-400"
              activeOpacity={0.8}
            >
              <Text className="text-white font-bold text-xl">
                Create Account
              </Text>
            </TouchableOpacity>

            {/* Already have account */}
            <View className="flex-row justify-center mt-5">
              <Text className="text-gray-600">Already have an account? </Text>
              <TouchableOpacity onPress={() => router.push("/(auth)/sign-in")}>
                <Text className="text-blue-600 font-semibold">Sign In</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default SignUp;
