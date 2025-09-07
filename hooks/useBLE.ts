import { LAST_LOCATION_TOKEN, PREVIOUS_DEVICES, SOSMESSAGE, USER_AUTH_STATE } from "@/utils/constants";
import { registeredDevices } from "@/utils/devices";
import { addDeviceNotification } from "@/utils/notificationHelpers";
import { sendSOS } from "@/utils/sendSOSFeature";
import { Buffer } from "buffer";
import * as ExpoDevice from "expo-device";
import * as SecureStore from "expo-secure-store";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AppState, AppStateStatus, PermissionsAndroid, Platform } from "react-native";
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

    // Monitor app state changes to check connection when app comes to foreground
    const handleAppStateChange = useCallback((nextAppState: AppStateStatus) => {
        if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
            // App came to foreground - check connection health
            if (connectedDevice && connectionState === 'connected') {
                checkConnectionHealth();
            }
        }
        appState.current = nextAppState;
    }, [connectedDevice, connectionState]);

    useEffect(() => {
        const subscription = AppState.addEventListener('change', handleAppStateChange);
        return () => subscription?.remove();
    }, [handleAppStateChange]);

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
                console.log('Device health check failed - device disconnected');

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
        } catch (error) {
            console.log('Connection health check error:', error);

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

        console.log('Setting up connection monitoring for:', connectedDevice.name);

        // Update background service with connected device
        backgroundService.setConnectedDevice(connectedDevice);

        // Monitor disconnection events - This is the key to detecting when device is turned off
        disconnectSubscription.current = bleManager.onDeviceDisconnected(
            connectedDevice.id,
            async (error, device) => {
                if (error) {
                    console.log('Device disconnected with error:', error);
                } else {
                    console.log('Device disconnected:', device?.name || 'Unknown Device');
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
            console.log("Bluetooth permissions not granted");
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
                    return;
                }
                if (device && device.name) { // Only add devices with names
                    registeredDevices.map(async (registeredDevice) => {
                        if (device.name === registeredDevice.model) {
                            console.log("Registered device found:", device.name);
                            console.log("Device ID:", device.id);
                            const previousDevices = await SecureStore.getItemAsync(PREVIOUS_DEVICES);
                            const prevDevicesArray = previousDevices ? JSON.parse(previousDevices) : [];
                            if (prevDevicesArray.some((prevDevice: Device) => prevDevice.id === device.id)) {
                                console.log("Previously connected device found:", device.name);
                                stopScan();
                                connectToDevice(device);
                                return;
                            }
                            setAllDevices(prevDevices => {
                                if (!isDuplicateDevice(prevDevices, device)) {
                                    console.log("Discovered device:", device.name);
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
                console.log("Already connected to this device:", device.name || "Unnamed Device");
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
                console.log("Adding device to SecureStore:", deviceConnection.name || "Unnamed Device");
                await SecureStore.setItemAsync(PREVIOUS_DEVICES, JSON.stringify(prevDevicesArray));
            }
            console.log("Devices stored in SecureStore:", await SecureStore.getItemAsync(PREVIOUS_DEVICES));

            await deviceConnection.discoverAllServicesAndCharacteristics();
            try {
                await deviceConnection.requestMTU(512);
            } catch (mtuError) {
                console.warn("MTU request failed, continuing with default:", mtuError);
            }

            const services = await deviceConnection.services();
            console.log("Connected to device:", device.name || "Unnamed Device");
            console.log("Services found:", services.length);

            if (services.length > 0) {
                const characteristics = await deviceConnection.characteristicsForService(services[2].uuid);
                console.log("Characteristics found:", characteristics.length);
                console.log("Characteristics found:", characteristics.map(c => c.uuid));
                console.log("Characteristics Services found:", characteristics.map(c => c.serviceUUID));
                const writeCharacteristic = characteristics.find(c => c.isWritableWithResponse || c.isWritableWithoutResponse);
                console.log("Write characteristic found:", JSON.stringify(writeCharacteristic?.uuid));
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
                await bleManager.cancelDeviceConnection(connectedDevice.id);
                console.log("Disconnected from device:", connectedDevice.name || "Unnamed Device");

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
            console.log("Received data:", value);
            setMessages(prevMessages => [...prevMessages, value]);
            if (value === SOSMESSAGE) {
                const lastLocationDataRaw = await SecureStore.getItemAsync(LAST_LOCATION_TOKEN);
                const lastLocationData = await JSON.parse(lastLocationDataRaw as string);
                const userDetailsRaw = await SecureStore.getItemAsync(USER_AUTH_STATE);
                const userData = await JSON.parse(userDetailsRaw as string);
                await sendSOS(userData.userDetails, {
                    latitude: lastLocationData.location.latitude,
                    longitude: lastLocationData.location.longitude
                })
            }
            return 0;
        } catch (decodeError) {
            console.error("Error decoding characteristic value:", decodeError);
            return -1;
        }
    }, []);

    const startStreamingData = useCallback(async (device: Device, writeCharacteristic: Characteristic | null) => {
        try {
            console.log("Starting data stream for device:", device.name || "Unnamed Device");
            console.log("Starting data stream for characteristic:", writeCharacteristic?.uuid);
            if (!writeCharacteristic) {
                return;
            }
            // Start monitoring the characteristic
            device.monitorCharacteristicForService(
                writeCharacteristic.serviceUUID,
                writeCharacteristic.uuid,
                onMessageUpdate
            );
        } catch (error) {
            console.error("Error starting data stream:", error);
        }
    }, [onMessageUpdate]);

    const forgetDevice = async () => {
        try {
            const previousDevices = await SecureStore.getItemAsync(PREVIOUS_DEVICES);
            const prevDevicesArray = previousDevices ? JSON.parse(previousDevices) : [];
            console.log("Previous Devices Array: ", prevDevicesArray)
            if (connectedDevice) {
                const updatedDevicesArray = prevDevicesArray.filter((device: Device) => device.id !== connectedDevice.id);
                console.log("Updated Devices Array: ", updatedDevicesArray)
                console.log("Setting the devices array in store")
                const isStoredPromise = await SecureStore.setItemAsync(PREVIOUS_DEVICES, JSON.stringify(updatedDevicesArray))
                console.log("isStoredPromise ", isStoredPromise)
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
        stopBackgroundService
    };
}

export default useBLE;