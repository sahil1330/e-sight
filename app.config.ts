import { ConfigContext, ExpoConfig } from 'expo/config';

const IS_DEV = process.env.APP_VARIANT === 'development';
const IS_PREVIEW = process.env.APP_VARIANT === 'preview';

const getUniqueIdentifier = () => {
    if (IS_DEV) {
        return 'com.sahilmane26.esight.dev';
    }

    if (IS_PREVIEW) {
        return 'com.sahilmane26.esight.preview';
    }

    return 'com.sahilmane26.esight';
};

const getAppName = () => {
    if (IS_DEV) {
        return 'e-Sight (Dev)';
    }

    if (IS_PREVIEW) {
        return 'e-Sight (Preview)';
    }

    return 'e-Sight';
};

export default ({ config }: ConfigContext): ExpoConfig => ({
    ...config,
    name: getAppName(),
    slug: 'e-sight',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/images/icon.png',
    scheme: 'esight',
    userInterfaceStyle: 'automatic',
    newArchEnabled: true,
    ios: {
        ...config.ios,
        icon: {
            dark: "./assets/images/adaptive-icon.png",
            light: "./assets/images/adaptive-icon.png"
        },
        bundleIdentifier: getUniqueIdentifier(),
        supportsTablet: true,
        infoPlist: {
            NSLocationAlwaysAndWhenInUseUsageDescription: 'This app needs location access to send your current location to the server in the background.',
            NSLocationWhenInUseUsageDescription: 'This app needs location access to send your current location to the server.',
            UIBackgroundModes: ['location', "bluetooth-central", "bluetooth-peripheral", "background-fetch", "background-processing"],
        },
    },
    android: {
        ...config.android,
        package: getUniqueIdentifier(),
        usesCleartextTraffic: true, // Allow HTTP traffic (needed for backend API)
        config: {
            googleMaps: {
                apiKey: process.env.GOOGLE_MAPS_API_KEY || ''
            }
        },
        adaptiveIcon: {
            foregroundImage: './assets/images/adaptive-icon.png',
            backgroundColor: '#ffffff'
        },
        edgeToEdgeEnabled: true,
        permissions: [
            'android.permission.BLUETOOTH',
            'android.permission.BLUETOOTH_ADMIN',
            'android.permission.BLUETOOTH_CONNECT',
            "android.permission.BLUETOOTH_PRIVILEGED",
            "android.permission.WAKE_LOCK",
            "android.permission.FOREGROUND_SERVICE"
        ]
    },
    web: {
        bundler: 'metro',
        output: 'static',
        favicon: './assets/images/favicon.png'
    },
    plugins: [
        'expo-router',
        [
            'expo-splash-screen',
            {
                image: './assets/images/splash-icon.png',
                imageWidth: 200,
                resizeMode: 'contain',
                backgroundColor: '#ffffff'
            }
        ],
        [
            'expo-camera',
            {
                cameraPermission: 'Allow $(PRODUCT_NAME) to access your camera',
                microphonePermission: 'Allow $(PRODUCT_NAME) to access your microphone',
                recordAudioAndroid: true
            }
        ],
        [
            'expo-speech-recognition',
            {
                microphonePermission: 'Allow $(PRODUCT_NAME) to access your microphone for voice commands',
                speechRecognitionPermission: 'Allow $(PRODUCT_NAME) to use speech recognition',
                androidSpeechServicePackages: ['com.google.android.googlequicksearchbox']
            }
        ],
        'expo-secure-store',
        [
            "react-native-ble-plx",
            {
                "isBackgroundEnabled": true,
                "modes": ["peripheral", "central"],
                "bluetoothAlwaysPermission": "Allow $(PRODUCT_NAME) to connect to bluetooth devices"
            }
        ],
        [
            'expo-location',
            {
                locationAlwaysAndWhenInUsePermission: 'Allow $(PRODUCT_NAME) to access your location',
                locationAlwaysPermission: 'Allow $(PRODUCT_NAME) to access your location even when the app is closed or in the background',
                locationWhenInUsePermission: 'Allow ${PRODUCT_NAME} to access your location while you are using the app',
                isIosBackgroundLocationEnabled: true,
                isAndroidBackgroundLocationEnabled: true,
                isAndroidForegroundServiceEnabled: true
            }
        ],
        [
            'expo-notifications',
            {
                icon: './assets/images/icon.png',
                color: '#000000',
                sounds: []
            }
        ],
        'expo-task-manager',
        [
            'expo-location',
            {
                locationAlwaysAndWhenInUsePermission: 'Allow $(PRODUCT_NAME) to access your location',
                locationAlwaysPermission: 'Allow $(PRODUCT_NAME) to access your location even when the app is closed or in the background',
                locationWhenInUsePermission: 'Allow ${PRODUCT_NAME} to access your location while you are using the app',
                isIosBackgroundLocationEnabled: true,
                isAndroidBackgroundLocationEnabled: true,
                isAndroidForegroundServiceEnabled: true
            }
        ],
    ],
    experiments: {
        typedRoutes: true
    },
    extra: {
        router: {},
        eas: {
            projectId: process.env.EAS_PROJECT_ID || "184fa7f8-1896-4164-8a5b-037db4f7e1fa"
        },
        // Expose environment variables to the app at runtime
        apiBaseUrl: process.env.EXPO_PUBLIC_REST_API_BASE_URL,
        apiHostname: process.env.EXPO_PUBLIC_REST_API_HOSTNAME,
        geminiApiKey: process.env.EXPO_PUBLIC_GEMINI_API_KEY,
        googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY,
    }
});
