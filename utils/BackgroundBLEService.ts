import { PREVIOUS_DEVICES } from '@/utils/constants';
import { addDeviceNotification } from '@/utils/notificationHelpers';
import * as Notifications from 'expo-notifications';
import * as SecureStore from 'expo-secure-store';
import * as TaskManager from 'expo-task-manager';
import { AppState } from 'react-native';
import { BleManager, Device } from 'react-native-ble-plx';

const BLE_BACKGROUND_TASK = 'ble-background-task';
const BLE_CONNECTION_MONITOR_TASK = 'ble-connection-monitor-task';

// Global BLE manager for background operations
let backgroundBleManager: BleManager | null = null;
let currentConnectedDevice: Device | null = null;
let connectionMonitoringActive = false;

class BackgroundBLEService {
    private static instance: BackgroundBLEService;
    private isServiceActive = false;
    private monitoringInterval: NodeJS.Timeout | number | null = null;
    private healthCheckInterval: NodeJS.Timeout | number | null = null;

    static getInstance(): BackgroundBLEService {
        if (!BackgroundBLEService.instance) {
            BackgroundBLEService.instance = new BackgroundBLEService();
        }
        return BackgroundBLEService.instance;
    }

    constructor() {
        this.setupTaskManager();
        this.setupAppStateHandling();
    }

    private setupTaskManager() {
        // Define background BLE monitoring task
        TaskManager.defineTask(BLE_BACKGROUND_TASK, async () => {
            try {
                await this.performBackgroundBLECheck();
                return { success: true };
            } catch (error) {
                console.error('Background BLE task error:', error);
                return { success: false };
            }
        });

        // Define connection monitoring task
        TaskManager.defineTask(BLE_CONNECTION_MONITOR_TASK, async () => {
            try {
                await this.monitorActiveConnection();
                return { success: true };
            } catch (error) {
                console.error('Connection monitor error:', error);
                return { success: false };
            }
        });
    }

    private setupAppStateHandling() {
        AppState.addEventListener('change', (nextAppState) => {
            if (nextAppState === 'background' || nextAppState === 'inactive') {
                // App is going to background - start intensive monitoring
                this.startBackgroundMonitoring();
            } else if (nextAppState === 'active') {
                // App is coming to foreground - reduce monitoring intensity
                this.stopBackgroundMonitoring();
            }
        });
    }

    async startBackgroundService(): Promise<boolean> {
        try {
            // Initialize background BLE manager
            if (!backgroundBleManager) {
                backgroundBleManager = new BleManager();
            }

            // Start location-based background execution (this allows BLE to work in background)
            // This leverages the existing location service background capabilities
            const isLocationServiceRunning = await SecureStore.getItemAsync("locationServiceRunning");
            if (isLocationServiceRunning !== "true") {
                console.warn('Location service should be running for optimal BLE background performance');
            }

            this.isServiceActive = true;
            connectionMonitoringActive = true;

            // Notify user
            await Notifications.scheduleNotificationAsync({
                content: {
                    title: 'E-Sight BLE Service',
                    body: 'Bluetooth monitoring is now active',
                    data: { type: 'service_started' },
                },
                trigger: null,
            });

            return true;
        } catch (error) {
            console.error('Failed to start background BLE service:', error);
            return false;
        }
    }

    async stopBackgroundService(): Promise<boolean> {
        try {
            // Stop monitoring intervals
            this.stopBackgroundMonitoring();

            this.isServiceActive = false;
            connectionMonitoringActive = false;

            if (backgroundBleManager) {
                backgroundBleManager.destroy();
                backgroundBleManager = null;
            }

            currentConnectedDevice = null;

            return true;
        } catch (error) {
            console.error('Failed to stop background BLE service:', error);
            return false;
        }
    }

    private startBackgroundMonitoring() {
        if (!this.isServiceActive) return;

        // Start periodic BLE scanning every 30 seconds
        this.monitoringInterval = setInterval(async () => {
            await this.performBackgroundBLECheck();
        }, 30000);

        // Start connection health checks every 10 seconds
        this.healthCheckInterval = setInterval(async () => {
            await this.monitorActiveConnection();
        }, 10000);

    }

    private stopBackgroundMonitoring() {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = null;
        }

        if (this.healthCheckInterval) {
            clearInterval(this.healthCheckInterval);
            this.healthCheckInterval = null;
        }

    }

    async setConnectedDevice(device: Device | null) {
        currentConnectedDevice = device;

        if (device && backgroundBleManager) {

            // Set up disconnect monitoring in background
            backgroundBleManager.onDeviceDisconnected(device.id, async (error, disconnectedDevice) => {

                currentConnectedDevice = null;

                // Send background notification
                await Notifications.scheduleNotificationAsync({
                    content: {
                        title: 'Device Disconnected',
                        body: `${disconnectedDevice?.name || 'Device'} was disconnected`,
                        data: {
                            type: 'device_disconnected',
                            deviceId: disconnectedDevice?.id,
                            deviceName: disconnectedDevice?.name
                        },
                    },
                    trigger: null,
                });

                // Add to notification storage
                await addDeviceNotification(
                    disconnectedDevice?.name || "Unknown Device",
                    disconnectedDevice?.id || '',
                    'disconnected',
                    'Device disconnected while app was in background'
                );
            });
        }
    }

    private async performBackgroundBLECheck(): Promise<void> {
        if (!backgroundBleManager) return;

        try {

            // Check if previously connected devices are available
            const previousDevicesData = await SecureStore.getItemAsync(PREVIOUS_DEVICES);
            if (!previousDevicesData) return;

            const previousDevices: Device[] = JSON.parse(previousDevicesData);
            const availableDevices: Device[] = [];

            // Quick scan to check for known devices
            return new Promise((resolve) => {
                let scanTimeout: NodeJS.Timeout | number;
                let isScanning = false;

                const stateSubscription = backgroundBleManager!.onStateChange((state) => {
                    if (state === 'PoweredOn' && !isScanning) {
                        isScanning = true;

                        backgroundBleManager!.startDeviceScan(null, null, (error, device) => {
                            if (error || !device) return;

                            // Check if this is a previously connected device
                            const wasPreviouslyConnected = previousDevices.some(
                                prevDevice => prevDevice.id === device.id
                            );

                            if (wasPreviouslyConnected && device.name) {
                                availableDevices.push(device);
                            }
                        });

                        // Stop scan after 8 seconds (shorter for background)
                        scanTimeout = setTimeout(async () => {
                            try {
                                await backgroundBleManager!.stopDeviceScan();
                            } catch (error) {
                                console.error('Error stopping background scan:', error);
                            }

                            stateSubscription.remove();

                            // Process results
                            await this.processBackgroundScanResults(availableDevices, previousDevices);
                            resolve();
                        }, 8000);
                    }
                }, true);

                // Fallback timeout
                setTimeout(() => {
                    if (scanTimeout) clearTimeout(scanTimeout);
                    stateSubscription.remove();
                    resolve();
                }, 10000);
            });

        } catch (error) {
            console.error('Background BLE check error:', error);
        }
    }

    private async processBackgroundScanResults(availableDevices: Device[], previousDevices: Device[]): Promise<void> {
        try {
            // Find devices that are no longer available
            const unavailableDevices = previousDevices.filter(prevDevice =>
                !availableDevices.some(device => device.id === prevDevice.id)
            );

            // Only notify about the currently connected device if it's unavailable
            for (const device of unavailableDevices) {
                if (currentConnectedDevice && currentConnectedDevice.id === device.id) {
                    await Notifications.scheduleNotificationAsync({
                        content: {
                            title: 'Device Lost',
                            body: `${device.name || 'Device'} is no longer available`,
                            data: {
                                type: 'device_lost',
                                deviceId: device.id,
                                deviceName: device.name
                            },
                        },
                        trigger: null,
                    });

                    await addDeviceNotification(
                        device.name || "Unknown Device",
                        device.id,
                        'disconnected',
                        'Device became unavailable during background scan'
                    );

                    currentConnectedDevice = null;
                    break; // Only notify once
                }
            }

            // Send notifications for newly available important devices
            for (const device of availableDevices) {
                if (!currentConnectedDevice) {
                    await Notifications.scheduleNotificationAsync({
                        content: {
                            title: 'Device Available',
                            body: `${device.name || 'Device'} is now available for connection`,
                            data: {
                                type: 'device_available',
                                deviceId: device.id,
                                deviceName: device.name
                            },
                        },
                        trigger: null,
                    });
                    break; // Only notify about one device
                }
            }
        } catch (error) {
            console.error('Error processing background scan results:', error);
        }
    }

    private async monitorActiveConnection(): Promise<void> {
        if (!currentConnectedDevice || !backgroundBleManager) return;

        try {
            // Try to check if device is still connected
            const isConnected = await currentConnectedDevice.isConnected();

            if (!isConnected) {
                await Notifications.scheduleNotificationAsync({
                    content: {
                        title: 'Connection Lost',
                        body: `Lost connection to ${currentConnectedDevice.name || 'device'}`,
                        data: {
                            type: 'connection_lost',
                            deviceId: currentConnectedDevice.id,
                            deviceName: currentConnectedDevice.name
                        },
                    },
                    trigger: null,
                });

                await addDeviceNotification(
                    currentConnectedDevice.name || "Unknown Device",
                    currentConnectedDevice.id,
                    'disconnected',
                    'Connection lost during background health check'
                );

                currentConnectedDevice = null;
            }
        } catch (error) {
            console.error('Background connection monitoring error:', error);

            if (currentConnectedDevice) {
                await addDeviceNotification(
                    currentConnectedDevice.name || "Unknown Device",
                    currentConnectedDevice.id,
                    'disconnected',
                    'Background connection check failed'
                );

                currentConnectedDevice = null;
            }
        }
    }

    async isServiceRunning(): Promise<boolean> {
        return this.isServiceActive;
    }

    getConnectionMonitoringStatus(): boolean {
        return connectionMonitoringActive;
    }

    getCurrentConnectedDevice(): Device | null {
        return currentConnectedDevice;
    }

    // Manual trigger for testing
    async triggerBackgroundCheck(): Promise<void> {
        await this.performBackgroundBLECheck();
        await this.monitorActiveConnection();
    }
}

export default BackgroundBLEService;