import { Device } from "react-native-ble-plx";
import { create } from "zustand";

interface PreviousDevicesState {
    previouslyConnectedDevices: Device[];
}

interface DeviceSlice {
    connectedDevice: Device | null;
    setConnectedDevice: (device: Device | null) => void;
}

export const usePreviousDeviceStore = create<PreviousDevicesState>((set) => ({
    previouslyConnectedDevices: [],
    setPreviouslyConnectedDevices: (devices) => set({ previouslyConnectedDevices: devices }),
}));

export const useDeviceStore = create<DeviceSlice>((set) => ({
    connectedDevice: null,
    setConnectedDevice: (device) => set({ connectedDevice: device }),
}));

