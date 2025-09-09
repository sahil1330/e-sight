import AuthButton from '@/components/ui/AuthButton';
import AuthHeader from '@/components/ui/AuthHeader';
import AuthInputField from '@/components/ui/AuthInputField';
import { ResetPasswordFormData, resetPasswordSchema } from '@/schema/forgotPasswordSchema';
import axiosInstance from '@/utils/axiosInstance';
import { getErrorMessage } from '@/utils/getErrorMessage';
import { zodResolver } from '@hookform/resolvers/zod';
import { isAxiosError } from 'axios';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
    useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const ResetPasswordScreen = () => {
    const params = useLocalSearchParams();
    const email = params.email as string;
    const router = useRouter();
    const { width } = useWindowDimensions();
    
    const [focusedField, setFocusedField] = useState<string | null>(null);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const isSmallDevice = width < 380;
    const fontSize = isSmallDevice ? 14 : 16;
    const headerFontSize = isSmallDevice ? 24 : 28;

    const {
        control,
        handleSubmit,
        formState: { errors },
        reset,
    } = useForm<ResetPasswordFormData>({
        resolver: zodResolver(resetPasswordSchema),
        defaultValues: {
            newPassword: '',
            confirmPassword: '',
        },
    });

    const resetPassword = async (userEmail: string, newPassword: string) => {
        try {
            const response = await axiosInstance.post('/users/reset-password', {
                email: userEmail,
                newPassword: newPassword,
            });

            if (response.status === 200) {
                return { success: true, message: response.data.message || 'Password reset successfully' };
            } else {
                return { success: false, message: response.data.message || 'Failed to reset password' };
            }
        } catch (error) {
            console.error('Reset password error:', error);
            if (isAxiosError(error)) {
                const errorMessage = await getErrorMessage(error.response?.data || '');
                return { success: false, message: errorMessage };
            }
            return { success: false, message: 'An unexpected error occurred' };
        }
    };

    const onSubmit = async (data: ResetPasswordFormData) => {
        setIsLoading(true);
        try {
            const result = await resetPassword(email, data.newPassword);
            
            if (result.success) {
                Alert.alert(
                    "Password Reset Successful",
                    "Your password has been reset successfully. You can now sign in with your new password.",
                    [
                        {
                            text: "Sign In Now",
                            onPress: () => router.replace("/(auth)/sign-in")
                        }
                    ]
                );
                reset();
            } else {
                Alert.alert("Reset Failed", result.message);
            }
        } catch (error) {
            console.error('Reset password error:', error);
            Alert.alert("Error", "An unexpected error occurred. Please try again.");
        } finally {
            setIsLoading(false);
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
                    <AuthHeader
                        title="Set New Password"
                        subtitle="Choose a strong password that you haven't used before."
                        iconName="key-outline"
                        iconColor="#10B981"
                        iconBgColor="bg-green-100 border-green-200"
                        headerFontSize={headerFontSize}
                    />

                    {/* Form Container */}
                    <View className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
                        <Controller
                            control={control}
                            name="newPassword"
                            render={({ field: { onChange, onBlur, value } }) => (
                                <AuthInputField
                                    label="New Password"
                                    placeholder="Enter your new password"
                                    value={value}
                                    onChangeText={onChange}
                                    onBlur={() => {
                                        setFocusedField(null);
                                        onBlur();
                                    }}
                                    onFocus={() => setFocusedField("newPassword")}
                                    error={errors.newPassword?.message}
                                    secureTextEntry={!showNewPassword}
                                    autoComplete="new-password"
                                    accessibilityLabel="New password input"
                                    accessibilityHint="Enter your new password"
                                    isFocused={focusedField === "newPassword"}
                                    fontSize={fontSize}
                                    editable={!isLoading}
                                    showPasswordToggle={true}
                                    onTogglePassword={() => setShowNewPassword(!showNewPassword)}
                                />
                            )}
                        />

                        <Controller
                            control={control}
                            name="confirmPassword"
                            render={({ field: { onChange, onBlur, value } }) => (
                                <AuthInputField
                                    label="Confirm New Password"
                                    placeholder="Confirm your new password"
                                    value={value}
                                    onChangeText={onChange}
                                    onBlur={() => {
                                        setFocusedField(null);
                                        onBlur();
                                    }}
                                    onFocus={() => setFocusedField("confirmPassword")}
                                    error={errors.confirmPassword?.message}
                                    secureTextEntry={!showConfirmPassword}
                                    autoComplete="new-password"
                                    accessibilityLabel="Confirm new password input"
                                    accessibilityHint="Re-enter your new password to confirm"
                                    isFocused={focusedField === "confirmPassword"}
                                    fontSize={fontSize}
                                    editable={!isLoading}
                                    showPasswordToggle={true}
                                    onTogglePassword={() => setShowConfirmPassword(!showConfirmPassword)}
                                />
                            )}
                        />

                        {/* Password Requirements */}
                        <View className="bg-blue-50 p-4 rounded-xl mb-6 border border-blue-200">
                            <Text className="text-blue-800 text-sm font-semibold mb-2">Password Requirements:</Text>
                            <Text className="text-blue-700 text-sm">• At least 8 characters long</Text>
                            <Text className="text-blue-700 text-sm">• Contains both letters and numbers</Text>
                            <Text className="text-blue-700 text-sm">• Different from your previous passwords</Text>
                        </View>

                        <AuthButton
                            title="Reset Password"
                            onPress={handleSubmit(onSubmit)}
                            isLoading={isLoading}
                            loadingText="Resetting..."
                            variant="primary"
                            icon="checkmark-circle-outline"
                        />
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

export default ResetPasswordScreen;
