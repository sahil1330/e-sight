import { PREVIOUS_DEVICES } from "@/utils/constants";
import { registeredDevices } from "@/utils/devices";
import { addDeviceNotification } from "@/utils/notificationHelpers";
import { Buffer } from "buffer";
import * as ExpoDevice from "expo-device";
import * as SecureStore from "expo-secure-store";
import { useCallback, useEffect, useMemo, useState } from "react";
import { PermissionsAndroid, Platform } from "react-native";
import { BleError, BleManager, Characteristic, Device } from "react-native-ble-plx";
interface BLEAPI {
    requestPermissions(): Promise<boolean>;
    scanForPeripherals(): void;
    connectToDevice(device: Device): Promise<void>;
    disconnectFromDevice(): Promise<void>; // Remove deviceId parameter
    connectedDevice: Device | null;
    setConnectedDevice: (device: Device | null) => void; // Add setter for connectedDevice
    allDevices: Device[];
    messages: string[];
    isScanning: boolean;
    characteristic: Characteristic | null;
    startStreamingData(device: Device, writeCharacteristic: Characteristic | null): Promise<void>;
    onMessageUpdate(error: BleError | null, characteristic: Characteristic | null): Promise<number>;
    stopScan(): void; // Add stop scan method
}

function useBLE(): BLEAPI {
    const bleManager = useMemo(() => new BleManager(), []);
    const [allDevices, setAllDevices] = useState<Device[]>([]);
    const [connectedDevice, setConnectedDevice] = useState<Device | null>(null);
    const [messages, setMessages] = useState<string[]>([]);
    const [isScanning, setIsScanning] = useState(false);
    const [characteristic, setCharacteristic] = useState<Characteristic | null>(null);

    // Clean up on unmount
    useEffect(() => {
        return () => {
            if (isScanning) {
                bleManager.stopDeviceScan();
            }
            if (connectedDevice) {
                bleManager.cancelDeviceConnection(connectedDevice.id);
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

    const stopScan = () => {
        bleManager.stopDeviceScan();
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
                            //console.log("Device Manufacturer Data:", device.manufacturerData);
                            // console.log("Device RSSI:", device.rssi);
                            // console.log("Device Manufacturer Data:", device.manufacturerData);
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

            const deviceConnection = await bleManager.connectToDevice(device.id)
            if (!deviceConnection) {
                throw new Error("Failed to connect to device");
            }

            setConnectedDevice(deviceConnection);

            // Add successful connection notification
            await addDeviceNotification(
                deviceConnection.name || "Unknown Device",
                deviceConnection.id,
                'connected',
                'Successfully connected to device'
            );
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
                // const writeCharacteristic = characteristics.find(c => c.isWritableWithResponse || c.isWritableWithoutResponse);
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
                // const result = await bleManager.cancelDeviceConnection(connectedDevice.id);
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
        stopScan
    };
}

export default useBLE;

