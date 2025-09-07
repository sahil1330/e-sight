import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';

interface AuthButtonProps {
    title: string;
    onPress: () => void;
    isLoading?: boolean;
    disabled?: boolean;
    loadingText?: string;
    variant?: 'primary' | 'secondary';
    icon?: keyof typeof Ionicons.glyphMap;
}

const AuthButton: React.FC<AuthButtonProps> = ({
    title,
    onPress,
    isLoading = false,
    disabled = false,
    loadingText = 'Loading...',
    variant = 'primary',
    icon
}) => {
    const isPrimary = variant === 'primary';
    const isDisabled = disabled || isLoading;

    return (
        <TouchableOpacity
            onPress={onPress}
            disabled={isDisabled}
            className={`py-4 rounded-xl items-center ${
                isDisabled 
                    ? 'bg-gray-400' 
                    : isPrimary 
                        ? 'bg-blue-600' 
                        : 'bg-gray-100 border border-gray-300'
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
            accessibilityRole="button"
            accessibilityState={{ disabled: isDisabled }}
        >
            {isLoading ? (
                <View className="flex-row items-center">
                    <ActivityIndicator 
                        size="small" 
                        color={isPrimary ? "white" : "#6B7280"} 
                    />
                    <Text className={`font-bold text-lg ml-2 ${
                        isPrimary ? 'text-white' : 'text-gray-700'
                    }`}>
                        {loadingText}
                    </Text>
                </View>
            ) : (
                <View className="flex-row items-center">
                    {icon && (
                        <Ionicons 
                            name={icon} 
                            size={20} 
                            color={isPrimary ? "white" : "#6B7280"} 
                        />
                    )}
                    <Text className={`font-bold text-lg ${icon ? 'ml-2' : ''} ${
                        isPrimary ? 'text-white' : 'text-gray-700'
                    }`}>
                        {title}
                    </Text>
                </View>
            )}
        </TouchableOpacity>
    );
};

export default AuthButton;
