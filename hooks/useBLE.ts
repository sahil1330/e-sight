import { LAST_LOCATION_TOKEN, PREVIOUS_DEVICES, SOSMESSAGE, USER_AUTH_STATE } from "@/utils/constants";
import { registeredDevices } from "@/utils/devices";
import { addDeviceNotification } from "@/utils/notificationHelpers";
import { sendSOS } from "@/utils/sendSOSFeature";
import { Buffer } from "buffer";
import * as ExpoDevice from "expo-device";
import * as SecureStore from "expo-secure-store";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert, AppState, AppStateStatus, PermissionsAndroid, Platform } from "react-native";
import { BleError, BleManager, Characteristic, Device, Subscription } from "react-native-ble-plx";
import BackgroundBLEService from "../utils/BackgroundBLEService";

interface BLEAPI {
    requestPermissions(): Promise<boolean>;
    scanForPeripherals(): void;
    connectToDevice(device: Device): Promise<void>;
    disconnectFromDevice(): Promise<void>;
    connectedDevice: Device | null;
    setConnectedDevice: (device: Device | null) => void;
    allDevices: Device[];
    messages: string[];
    isScanning: boolean;
    characteristic: Characteristic | null;
    startStreamingData(device: Device, writeCharacteristic: Characteristic | null): Promise<void>;
    onMessageUpdate(error: BleError | null, characteristic: Characteristic | null): Promise<number>;
    stopScan(): void;
    forgetDevice(): void;
    connectionState: 'connected' | 'disconnected' | 'connecting';
    checkConnectionHealth(): Promise<void>;
    isBackgroundServiceActive: boolean;
    startBackgroundService(): Promise<boolean>;
    stopBackgroundService(): Promise<boolean>;
    checkBluetoothState(): Promise<string>;
}

function useBLE(): BLEAPI {
    const bleManager = useMemo(() => new BleManager(), []);
    const [allDevices, setAllDevices] = useState<Device[]>([]);
    const [connectedDevice, setConnectedDevice] = useState<Device | null>(null);
    const [messages, setMessages] = useState<string[]>([]);
    const [isScanning, setIsScanning] = useState(false);
    const [characteristic, setCharacteristic] = useState<Characteristic | null>(null);
    const [connectionState, setConnectionState] = useState<'connected' | 'disconnected' | 'connecting'>('disconnected');
    const [isBackgroundServiceActive, setIsBackgroundServiceActive] = useState(false);

    // Refs for cleanup and monitoring
    const disconnectSubscription = useRef<Subscription | null>(null);
    const characteristicSubscription = useRef<Subscription | null>(null);
    const healthCheckInterval = useRef<number | null>(null);
    const appState = useRef(AppState.currentState);

    // Background service instance
    const backgroundService = useMemo(() => BackgroundBLEService.getInstance(), []);

    // Initialize background service on mount
    useEffect(() => {
        const initializeBackgroundService = async () => {
            const isRunning = await backgroundService.isServiceRunning();
            setIsBackgroundServiceActive(isRunning);

            if (!isRunning) {
                // Auto-start background service
                const started = await backgroundService.startBackgroundService();
                setIsBackgroundServiceActive(started);
            }
        };

        initializeBackgroundService();
    }, [backgroundService]);

    // Background service control functions
    const startBackgroundService = useCallback(async (): Promise<boolean> => {
        const started = await backgroundService.startBackgroundService();
        setIsBackgroundServiceActive(started);
        return started;
    }, [backgroundService]);

    const stopBackgroundService = useCallback(async (): Promise<boolean> => {
        const stopped = await backgroundService.stopBackgroundService();
        setIsBackgroundServiceActive(!stopped);
        return stopped;
    }, [backgroundService]);

    // Connection health check function
    const checkConnectionHealth = useCallback(async () => {
        if (!connectedDevice) return;

        try {
            // Try to check if device is still connected
            const isConnected = await connectedDevice.isConnected();

            if (!isConnected) {
                // Clean up characteristic subscription
                if (characteristicSubscription.current) {
                    characteristicSubscription.current.remove();
                    characteristicSubscription.current = null;
                }
                
                // Add disconnection notification
                await addDeviceNotification(
                    connectedDevice.name || "Unknown Device",
                    connectedDevice.id,
                    'disconnected',
                    'Connection lost - device may be turned off'
                );

                // Update state
                setConnectedDevice(null);
                setCharacteristic(null);
                setConnectionState('disconnected');
            } else {
                // Device is still connected, ensure state is correct
                if (connectionState !== 'connected') {
                    setConnectionState('connected');
                }
            }
        } catch {
            // Clean up characteristic subscription on error
            if (characteristicSubscription.current) {
                characteristicSubscription.current.remove();
                characteristicSubscription.current = null;
            }
            
            // Device is likely disconnected due to error
            await addDeviceNotification(
                connectedDevice.name || "Unknown Device",
                connectedDevice.id,
                'disconnected',
                'Connection check failed - device may be turned off'
            );

            setConnectedDevice(null);
            setCharacteristic(null);
            setConnectionState('disconnected');
        }
    }, [connectedDevice, connectionState]);

    // Monitor app state changes to check connection when app comes to foreground
    const handleAppStateChange = useCallback((nextAppState: AppStateStatus) => {
        if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
            // App came to foreground - check connection health
            if (connectedDevice && connectionState === 'connected') {
                checkConnectionHealth();
            }
        }
        appState.current = nextAppState;
    }, [connectedDevice, connectionState, checkConnectionHealth]);

    useEffect(() => {
        const subscription = AppState.addEventListener('change', handleAppStateChange);
        return () => subscription?.remove();
    }, [handleAppStateChange]);

    // Set up connection monitoring when device connects
    useEffect(() => {
        if (!connectedDevice) {
            // Clean up monitoring when no device is connected
            if (disconnectSubscription.current) {
                disconnectSubscription.current.remove();
                disconnectSubscription.current = null;
            }
            if (healthCheckInterval.current) {
                clearInterval(healthCheckInterval.current);
                healthCheckInterval.current = null;
            }
            return;
        }

        // Update background service with connected device
        backgroundService.setConnectedDevice(connectedDevice);

        // Monitor disconnection events - This is the key to detecting when device is turned off
        disconnectSubscription.current = bleManager.onDeviceDisconnected(
            connectedDevice.id,
            async (error, device) => {
                if (error) {
                    // console.log('Device disconnected with error:', error);
                } else {
                    // console.log('Device disconnected:', device?.name || 'Unknown Device');
                }

                // Update state immediately when device disconnects
                setConnectedDevice(null);
                setCharacteristic(null);
                setConnectionState('disconnected');

                // Update background service
                await backgroundService.setConnectedDevice(null);

                // Add disconnection notification
                await addDeviceNotification(
                    device?.name || connectedDevice.name || "Unknown Device",
                    device?.id || connectedDevice.id,
                    'disconnected',
                    error ? 'Device disconnected with error' : 'Device was turned off or went out of range'
                );
            }
        );

        // Set up periodic health checks every 10 seconds for additional reliability
        healthCheckInterval.current = setInterval(checkConnectionHealth, 10000);

        // Set connection state to connected when monitoring is established
        setConnectionState('connected');

        return () => {
            if (disconnectSubscription.current) {
                disconnectSubscription.current.remove();
            }
            if (characteristicSubscription.current) {
                characteristicSubscription.current.remove();
            }
            if (healthCheckInterval.current) {
                clearInterval(healthCheckInterval.current);
            }
        };
    }, [connectedDevice, bleManager, checkConnectionHealth, backgroundService]);

    // Clean up on unmount
    useEffect(() => {
        return () => {
            if (isScanning) {
                bleManager.stopDeviceScan();
            }
            if (connectedDevice) {
                bleManager.cancelDeviceConnection(connectedDevice.id);
            }
            if (disconnectSubscription.current) {
                disconnectSubscription.current.remove();
            }
            if (characteristicSubscription.current) {
                characteristicSubscription.current.remove();
            }
            if (healthCheckInterval.current) {
                clearInterval(healthCheckInterval.current);
            }
        };
    }, [bleManager, isScanning, connectedDevice]);

    const requestAndroid31Permissions = async () => {
        const bluetoothPermission = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
            {
                title: "Bluetooth Scan Permission",
                message: "This app needs access to your Bluetooth to scan for Bluetooth devices.",
                buttonPositive: "OK",
            }
        )
        const bluetoothConnectPermission = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
            {
                title: "Bluetooth Connect Permission",
                message: "This app needs permission to connect to Bluetooth devices.",
                buttonPositive: "OK",
            }
        )
        const fineLocationPermission = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
            {
                title: "Location Permission",
                message: "This app needs access to your location to scan for Bluetooth devices.",
                buttonPositive: "OK",
            }
        )
        return (
            bluetoothPermission === PermissionsAndroid.RESULTS.GRANTED &&
            bluetoothConnectPermission === PermissionsAndroid.RESULTS.GRANTED &&
            fineLocationPermission === PermissionsAndroid.RESULTS.GRANTED
        );
    }

    const requestPermissions = async () => {
        if (Platform.OS === "android") {
            if ((ExpoDevice.platformApiLevel ?? -1) < 31) {
                const granted = await PermissionsAndroid.request(
                    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
                    {
                        title: "Nearby Devices Permission",
                        message: "This app needs access to your location to scan for Bluetooth devices.",
                        buttonPositive: "OK",
                    }
                )
                return granted === PermissionsAndroid.RESULTS.GRANTED;
            }
            else {
                const isAndroid31PermissionsGranted = await requestAndroid31Permissions();
                return isAndroid31PermissionsGranted;
            }
        } else {
            // iOS does not require explicit permissions for Bluetooth scanning
            return true;
        }
    }

    // Check Bluetooth state
    const checkBluetoothState = useCallback(async (): Promise<string> => {
        return new Promise((resolve) => {
            const subscription = bleManager.onStateChange((state) => {
                subscription.remove();
                resolve(state);
            }, true);
        });
    }, [bleManager]);

    const isDuplicateDevice = (devices: Device[], nextDevice: Device) => {
        return devices.findIndex(device => nextDevice.id === device.id) >= 0;
    };

    const stopScan = async () => {
        await bleManager.stopDeviceScan();
        setIsScanning(false);
    };

    const scanForPeripherals = async () => {
        const permissionsGranted = await requestPermissions();
        if (!permissionsGranted) {
            Alert.alert(
                "Permissions Required",
                "Bluetooth and location permissions are required to scan for devices. Please enable them in your device settings.",
                [{ text: "OK" }]
            );
            return;
        }

        // Check Bluetooth state before scanning
        const bluetoothState = await checkBluetoothState();
        if (bluetoothState !== 'PoweredOn') {

            let message = "Please enable Bluetooth to scan for devices.";
            if (bluetoothState === 'PoweredOff') {
                message = "Bluetooth is turned off. Please enable Bluetooth in your device settings to scan for devices.";
            } else if (bluetoothState === 'Unauthorized') {
                message = "Bluetooth access is not authorized. Please allow Bluetooth permissions in your device settings.";
            } else if (bluetoothState === 'Unsupported') {
                message = "Bluetooth Low Energy is not supported on this device.";
            }

            Alert.alert(
                "Bluetooth Required",
                message,
                [
                    {
                        text: "OK",
                        onPress: () => {
                            // Don't start scanning if Bluetooth is not available
                            setIsScanning(false);
                        }
                    }
                ]
            );
            return;
        }

        // Clear previous devices when starting new scan
        setAllDevices([]);
        setIsScanning(true);

        bleManager.startDeviceScan(
            null,
            null,
            (error, device) => {
                if (error) {
                    console.error("Error during device scan:", error);
                    setIsScanning(false);

                    // Handle specific Bluetooth errors
                    if (error.errorCode === 102) { // Bluetooth is off
                        Alert.alert(
                            "Bluetooth Disabled",
                            "Bluetooth was turned off during scanning. Please enable Bluetooth and try again.",
                            [{ text: "OK" }]
                        );
                    } else {
                        Alert.alert(
                            "Scan Error",
                            `Failed to scan for devices: ${error.message}`,
                            [{ text: "OK" }]
                        );
                    }
                    return;
                }
                if (device && device.name) { // Only add devices with names
                    registeredDevices.map(async (registeredDevice) => {
                        if (device.name === registeredDevice.model) {
                            const previousDevices = await SecureStore.getItemAsync(PREVIOUS_DEVICES);
                            const prevDevicesArray = previousDevices ? JSON.parse(previousDevices) : [];
                            if (prevDevicesArray.some((prevDevice: Device) => prevDevice.id === device.id)) {
                                stopScan();
                                connectToDevice(device);
                                return;
                            }
                            setAllDevices(prevDevices => {
                                if (!isDuplicateDevice(prevDevices, device)) {
                                    return [...prevDevices, device];
                                }
                                return prevDevices;
                            });
                        }
                    })
                }
            }
        );

        // Auto-stop scan after 30 seconds
        setTimeout(() => {
            if (isScanning) {
                stopScan();
            }
        }, 30000);
    };

    const connectToDevice = async (device: Device) => {
        try {
            if (connectedDevice && connectedDevice.id === device.id) {
                return;
            }

            setConnectionState('connecting');

            // Disconnect from previous device if exists
            if (connectedDevice && connectedDevice.id !== device.id) {
                await bleManager.cancelDeviceConnection(connectedDevice.id);
                setConnectedDevice(null);
                setCharacteristic(null);

                // Add disconnection notification
                await addDeviceNotification(
                    connectedDevice.name || "Unknown Device",
                    connectedDevice.id,
                    'disconnected',
                    'Disconnected to connect to new device'
                );
            }

            // Stop scanning before connecting
            if (isScanning) {
                await bleManager.stopDeviceScan();
                setIsScanning(false);
            }

            // Add pairing started notification
            await addDeviceNotification(
                device.name || "Unknown Device",
                device.id,
                'pairing_started',
                'Attempting to connect to device'
            );

            const deviceConnection = await bleManager.connectToDevice(device.id);
            if (!deviceConnection) {
                throw new Error("Failed to connect to device");
            }

            setConnectedDevice(deviceConnection);
            // Update background service immediately
            await backgroundService.setConnectedDevice(deviceConnection);

            // Note: connectionState will be set to 'connected' in the useEffect monitoring setup

            // Add successful connection notification
            await addDeviceNotification(
                deviceConnection.name || "Unknown Device",
                deviceConnection.id,
                'connected',
                'Successfully connected to device'
            );

            // Store device in SecureStore
            const previousDevices = await SecureStore.getItemAsync(PREVIOUS_DEVICES);
            const prevDevicesArray = previousDevices ? JSON.parse(previousDevices) : [];
            if (!prevDevicesArray.some((prevDevice: Device) => prevDevice.id === deviceConnection.id)) {
                prevDevicesArray.push(deviceConnection);
                await SecureStore.deleteItemAsync(PREVIOUS_DEVICES);
                await SecureStore.setItemAsync(PREVIOUS_DEVICES, JSON.stringify(prevDevicesArray));
            }
            await deviceConnection.discoverAllServicesAndCharacteristics();
            try {
                await deviceConnection.requestMTU(512);
            } catch (mtuError) {
                console.warn("MTU request failed, continuing with default:", mtuError);
            }

            const services = await deviceConnection.services();

            if (services.length > 0) {
                const characteristics = await deviceConnection.characteristicsForService(services[2].uuid);
                const writeCharacteristic = characteristics.find(c => c.isWritableWithResponse || c.isWritableWithoutResponse);
                setCharacteristic(writeCharacteristic || null);
                if (writeCharacteristic) {
                    startStreamingData(deviceConnection, writeCharacteristic);
                }

                // Add pairing completed notification
                await addDeviceNotification(
                    deviceConnection.name || "Unknown Device",
                    deviceConnection.id,
                    'pairing_completed',
                    'Device pairing and setup completed successfully'
                );
            }
        } catch (error) {
            console.error("Error connecting to device:", error);
            setConnectionState('disconnected');
            await backgroundService.setConnectedDevice(null);

            // Add connection failed notification
            await addDeviceNotification(
                device.name || "Unknown Device",
                device.id,
                'connection_failed',
                `Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`
            );

            setConnectedDevice(null);
            setCharacteristic(null);
            await bleManager.cancelDeviceConnection(device.id);
        }
    };

    const disconnectFromDevice = async () => {
        if (connectedDevice) {
            try {
                // Clean up characteristic subscription first
                if (characteristicSubscription.current) {
                    characteristicSubscription.current.remove();
                    characteristicSubscription.current = null;
                }
                
                await bleManager.cancelDeviceConnection(connectedDevice.id);

                // Add disconnection notification
                await addDeviceNotification(
                    connectedDevice.name || "Unknown Device",
                    connectedDevice.id,
                    'disconnected',
                    'Device disconnected by user'
                );

                setConnectedDevice(null);
                setCharacteristic(null);
                setConnectionState('disconnected');
            } catch (error) {
                console.error("Error disconnecting from device:", error);

                // Clean up subscription even on error
                if (characteristicSubscription.current) {
                    characteristicSubscription.current.remove();
                    characteristicSubscription.current = null;
                }

                // Add disconnection failed notification (though we still clear the state)
                await addDeviceNotification(
                    connectedDevice.name || "Unknown Device",
                    connectedDevice.id,
                    'disconnected',
                    `Disconnection error: ${error instanceof Error ? error.message : 'Unknown error'}`
                );

                setConnectedDevice(null);
                setCharacteristic(null);
                setConnectionState('disconnected');
            }
        }
    };

    const onMessageUpdate = useCallback(async (error: BleError | null, characteristic: Characteristic | null) => {
        if (error) {
            console.error("Error monitoring characteristic:", error);
            return -1;
        }
        else if (!characteristic?.value) {
            console.error("No value found for characteristic");
            return -1;
        }

        try {
            const value = (Buffer.from(characteristic.value, 'base64')).toString('utf-8');
            setMessages(prevMessages => [...prevMessages, value]);
            if (value === SOSMESSAGE) {
                try {
                    const lastLocationDataRaw = await SecureStore.getItemAsync(LAST_LOCATION_TOKEN);
                    const lastLocationData = await JSON.parse(lastLocationDataRaw as string);
                    const userDetailsRaw = await SecureStore.getItemAsync(USER_AUTH_STATE);
                    const userData = await JSON.parse(userDetailsRaw as string);
                    
                    const sosResult = await sendSOS(userData.userDetails, {
                        latitude: lastLocationData.location.latitude,
                        longitude: lastLocationData.location.longitude
                    });
                    
                    if (sosResult.success) {
                        // SOS processed successfully
                    } else {
                        console.error(`SOS processing failed: ${sosResult.message}`);
                    }
                } catch (sosError) {
                    console.error("Error processing SOS message:", sosError);
                    // Add fallback emergency notification if SOS processing fails completely
                    await addDeviceNotification(
                        connectedDevice?.name || "Unknown Device",
                        connectedDevice?.id || "unknown",
                        'connection_failed',
                        `SOS received but processing failed: ${sosError instanceof Error ? sosError.message : 'Unknown error'}`
                    );
                }
            }
            return 0;
        } catch (decodeError) {
            console.error("Error decoding characteristic value:", decodeError);
            return -1;
        }
    }, [connectedDevice?.id, connectedDevice?.name]);

    const startStreamingData = useCallback(async (device: Device, writeCharacteristic: Characteristic | null) => {
        try {
            if (!writeCharacteristic) {
                return;
            }
            
            // Clean up existing subscription if any
            if (characteristicSubscription.current) {
                characteristicSubscription.current.remove();
                characteristicSubscription.current = null;
            }
            
            // Check if device is still connected before starting monitoring
            const isConnected = await device.isConnected();
            if (!isConnected) {
                console.warn('Device is not connected, skipping characteristic monitoring');
                return;
            }
            
            // Start monitoring the characteristic and store the subscription
            characteristicSubscription.current = device.monitorCharacteristicForService(
                writeCharacteristic.serviceUUID,
                writeCharacteristic.uuid,
                onMessageUpdate
            );
        } catch (error) {
            console.error("Error starting data stream:", error);
            // Clean up subscription on error
            if (characteristicSubscription.current) {
                characteristicSubscription.current.remove();
                characteristicSubscription.current = null;
            }
        }
    }, [onMessageUpdate]);

    const forgetDevice = async () => {
        try {
            const previousDevices = await SecureStore.getItemAsync(PREVIOUS_DEVICES);
            const prevDevicesArray = previousDevices ? JSON.parse(previousDevices) : [];
            if (connectedDevice) {
                const updatedDevicesArray = prevDevicesArray.filter((device: Device) => device.id !== connectedDevice.id);
                await SecureStore.setItemAsync(PREVIOUS_DEVICES, JSON.stringify(updatedDevicesArray))
                // Add forget device notification
                await addDeviceNotification(
                    connectedDevice.name || "Unknown Device",
                    connectedDevice.id,
                    'forgot_device',
                    'Device is forgotten by user'
                );
            }
        } catch (error) {
            console.error("Error forgetting device: " + error)
            throw error
        }
        finally {
            await disconnectFromDevice()
        }
    }

    return {
        startStreamingData,
        requestPermissions,
        scanForPeripherals,
        connectToDevice,
        disconnectFromDevice,
        connectedDevice,
        setConnectedDevice,
        allDevices,
        messages,
        isScanning,
        characteristic,
        onMessageUpdate,
        stopScan,
        forgetDevice,
        connectionState,
        checkConnectionHealth,
        isBackgroundServiceActive,
        startBackgroundService,
        stopBackgroundService,
        checkBluetoothState
    };
}

export default useBLE;