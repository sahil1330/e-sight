import * as ExpoDevice from "expo-device";
import { useMemo, useState } from "react";
import { PermissionsAndroid, Platform } from "react-native";
import { BleError, BleManager, Characteristic, Device } from "react-native-ble-plx";

interface BLEAPI {
    requestPermissions(): Promise<boolean>;
    scanForPeripherals(): void;
    connectToDevice(device: Device): Promise<void>;
    disconnectFromDevice(deviceId: string): Promise<void>;
    connectedDevice: Device | null;
    allDevices: Device[];
    messages: string[];
    isScanning: boolean;
    characteristic: Characteristic | null;
    startStreamingData(device: Device): Promise<void>;
    onMessageUpdate(error: BleError | null, characteristic: Characteristic | null): Promise<number>;

}

function useBLE(): BLEAPI {
    const bleManager = useMemo(() => new BleManager(), []);
    const [allDevices, setAllDevices] = useState<Device[]>([]);
    const [connectedDevice, setConnectedDevice] = useState<Device | null>(null);
    const [messages, setMessages] = useState<string[]>([]);
    const [isScanning, setIsScanning] = useState(false);
    const [characteristic, setCharacteristic] = useState<Characteristic | null>(null);

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

    const scanForPeripherals = async () => {
        const permissionsGranted = await requestPermissions();
        if (!permissionsGranted) {
            console.log("Bluetooth permissions not granted");
            return;
        }
        await bleManager.startDeviceScan(
            null,
            null,
            (error, device) => {
                setIsScanning(true);
                if (error) {
                    console.error("Error during device scan:", error);
                    setIsScanning(false);
                    return;
                }
                if (device && !isDuplicateDevice(allDevices, device)) {
                    setAllDevices(prevDevices => [...prevDevices, device]);
                    console.log("Discovered device:", device.name || "Unnamed Device");
                }
            })
    };

    const connectToDevice = async (device: Device) => {
        try {
            if (connectedDevice && connectedDevice.id === device.id) {
                console.log("Already connected to this device:", device.name || "Unnamed Device");
                return;
            }
            if (connectedDevice && connectedDevice.id !== device.id) {
                await bleManager.cancelDeviceConnection(connectedDevice.id);
                setConnectedDevice(null);
            }

            const deviceConnection = await bleManager.connectToDevice(device.id);
            setConnectedDevice(deviceConnection);
            await deviceConnection.discoverAllServicesAndCharacteristics();

            await device.requestMTU(512);

            const services = await deviceConnection.services();
            console.log("Connected to device:", device.name || "Unnamed Device");
            console.log("Services:", services);
            const characteristics = await deviceConnection.characteristicsForService(services[0].uuid);
            const characteristic = characteristics.find(c => c.isWritableWithResponse || c.isWritableWithoutResponse);
            if (characteristic) {
                setCharacteristic(characteristic);
                console.log("Characteristic found:", characteristic.uuid);
            }

            await bleManager.stopDeviceScan();
            setIsScanning(false);
        } catch (error) {
            console.error("Error connecting to device:", error);
        }
    }

    const disconnectFromDevice = async () => {
        if (connectedDevice) {
            bleManager.cancelDeviceConnection(connectedDevice.id)
                .then(() => {
                    console.log("Disconnected from device:", connectedDevice.name || "Unnamed Device");
                    setConnectedDevice(null);
                    setCharacteristic(null);
                })
        }
    }

    const onMessageUpdate = async (error: BleError | null, characteristic: Characteristic | null) => {
        if (error) {
            console.error("Error monitoring characteristic:", error);
            return -1;
        }
        else if (!characteristic?.value) {
            console.error("No value found for characteristic:", characteristic);
            return -1;
        }

        console.log("Characteristic value updated:", characteristic.value);
        const value = Buffer.from(characteristic.value, 'base64').toString('utf-8');
        setMessages(prevMessages => [...prevMessages, value]);
        console.log("Received data:", value);
        return 0;
    }

    const startStreamingData = async (device: Device) => {
        try {
            if (!characteristic) {
                console.error("No characteristic available for data streaming.");
                return;
            }
            await device.monitorCharacteristicForService(
                characteristic.serviceUUID,
                characteristic.uuid,
                (error, char) => {
                    if (error) {
                        console.error("Error monitoring characteristic:", error);
                        return;
                    }
                    if (char && char.value) {
                        const value = Buffer.from(char.value, 'base64').toString('utf-8');
                        setMessages(prevMessages => [...prevMessages, value]);
                        console.log("Received data:", value);
                    }
                }
            );
        } catch (error) {
            console.error("Error starting data stream:", error);
        }
    }

    return {
        startStreamingData,
        requestPermissions,
        scanForPeripherals,
        connectToDevice,
        disconnectFromDevice,
        connectedDevice,
        allDevices,
        messages,
        isScanning,
        characteristic,
        onMessageUpdate
    }
}

