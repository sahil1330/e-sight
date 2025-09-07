import AuthButton from '@/components/ui/AuthButton';
import AuthHeader from '@/components/ui/AuthHeader';
import AuthInputField from '@/components/ui/AuthInputField';
import { EmailFormData, emailSchema } from '@/schema/forgotPasswordSchema';
import axiosInstance from '@/utils/axiosInstance';
import { getErrorMessage } from '@/utils/getErrorMessage';
import { zodResolver } from '@hookform/resolvers/zod';
import { isAxiosError } from 'axios';
import { useRouter } from 'expo-router';
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

const ForgotPasswordScreen = () => {
    const router = useRouter();
    const { width } = useWindowDimensions();
    const [focusedField, setFocusedField] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const isSmallDevice = width < 380;
    const fontSize = isSmallDevice ? 14 : 16;
    const headerFontSize = isSmallDevice ? 24 : 28;

    const {
        control,
        handleSubmit,
        formState: { errors },
    } = useForm<EmailFormData>({
        resolver: zodResolver(emailSchema),
        defaultValues: {
            email: '',
        },
    });

    const sendResetCode = async (email: string) => {
        try {
            const response = await axiosInstance.post('/users/send-forget-password-code', {
                email,
            });

            if (response.status === 200) {
                return { success: true, message: response.data.message || 'Reset code sent successfully' };
            } else {
                return { success: false, message: response.data.message || 'Failed to send reset code' };
            }
        } catch (error) {
            console.error('Send reset code error:', error);
            if (isAxiosError(error)) {
                const errorMessage = await getErrorMessage(error.response?.data || '');
                return { success: false, message: errorMessage };
            }
            return { success: false, message: 'An unexpected error occurred' };
        }
    };

    const onSubmit = async (data: EmailFormData) => {
        setIsLoading(true);
        try {
            const result = await sendResetCode(data.email);

            if (result.success) {
                Alert.alert(
                    "Reset Code Sent",
                    "We've sent a 6-digit verification code to your email address.",
                    [
                        {
                            text: "OK",
                            onPress: () => router.push({
                                pathname: "/verify-reset-code" as any,
                                params: { email: data.email }
                            })
                        }
                    ]
                );
            } else {
                Alert.alert("Error", result.message);
            }
        } catch (error) {
            console.error('Forgot password error:', error);
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
                        title="Forgot Password?"
                        subtitle="No worries! Enter your email address and we'll send you a reset code."
                        iconName="mail-outline"
                        iconColor="#3B82F6"
                        iconBgColor="bg-blue-100 border-blue-200"
                        headerFontSize={headerFontSize}
                    />

                    {/* Form Container */}
                    <View className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
                        <Controller
                            control={control}
                            name="email"
                            render={({ field: { onChange, onBlur, value } }) => (
                                <AuthInputField
                                    label="Email Address"
                                    placeholder="Enter your email address"
                                    value={value}
                                    onChangeText={onChange}
                                    onBlur={() => {
                                        setFocusedField(null);
                                        onBlur();
                                    }}
                                    onFocus={() => setFocusedField("email")}
                                    error={errors.email?.message}
                                    keyboardType="email-address"
                                    autoComplete="email"
                                    accessibilityLabel="Email address input"
                                    accessibilityHint="Enter your email address to receive reset code"
                                    isFocused={focusedField === "email"}
                                    fontSize={fontSize}
                                    editable={!isLoading}
                                />
                            )}
                        />

                        <AuthButton
                            title="Send Reset Code"
                            onPress={handleSubmit(onSubmit)}
                            isLoading={isLoading}
                            loadingText="Sending..."
                            variant="primary"
                        />

                        {/* Help Text */}
                        <View className="bg-blue-50 p-4 rounded-xl mt-4 border border-blue-200">
                            <Text className="text-blue-800 text-sm text-center">
                                💡 Check your spam folder if you don&apos;t receive the email within a few minutes.
                            </Text>
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

export default ForgotPasswordScreen;
