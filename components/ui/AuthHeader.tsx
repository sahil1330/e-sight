import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';


interface AuthHeaderProps {
    title: string;
    subtitle: string;
    iconName: keyof typeof Ionicons.glyphMap;
    iconColor: string;
    iconBgColor: string;
    showBackButton?: boolean;
    backButtonAction?: () => void;
    headerFontSize?: number;
}

const AuthHeader: React.FC<AuthHeaderProps> = ({
    title,
    subtitle,
    iconName,
    iconColor,
    iconBgColor,
    showBackButton = true,
    backButtonAction,
    headerFontSize = 28
}) => {
    const router = useRouter();

    const handleBackPress = () => {
        if (backButtonAction) {
            backButtonAction();
        } else {
            router.back();
        }
    };

    return (
        <View className="items-center mb-8">
            {showBackButton && (
                <TouchableOpacity
                    onPress={handleBackPress}
                    className="absolute left-0 top-0 w-12 h-12 items-center justify-center rounded-full bg-white border border-gray-200"
                    style={{
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 1 },
                        shadowOpacity: 0.1,
                        shadowRadius: 3,
                        elevation: 2,
                    }}
                    accessibilityRole="button"
                    accessibilityLabel="Go back"
                >
                    <Ionicons name="arrow-back" size={20} color="#374151" />
                </TouchableOpacity>
            )}

            <View className="w-40 h-40 rounded-full items-center justify-center mb-6">
              {/* <Text className="text-white text-2xl font-bold">E</Text> */}
              <Image
                source={require('../../assets/images/icon.png')}
                style={{ resizeMode: 'contain' }}
                accessible
                accessibilityLabel="App logo"
                className="w-32 h-32 rounded-full"
              />
            </View>
            
            <Text
                style={{ fontSize: headerFontSize }}
                className="font-bold text-gray-900 text-center mb-3"
            >
                {title}
            </Text>
            <Text className="text-gray-600 text-center text-base px-4">
                {subtitle}
            </Text>
        </View>
    );
};

export default AuthHeader;
