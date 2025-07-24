import { create } from "zustand";

interface LocationState {
    latitude: number | null;
    longitude: number | null;
    updateLocation: (latitude: number, longitude: number) => void;
}

const useLocation = create<LocationState>((set) => ({
    latitude: null,
    longitude: null,
    updateLocation: (latitude, longitude) => set((state) => ({
        latitude: state.latitude === null ? latitude : state.latitude,
        longitude: state.longitude === null ? longitude : state.longitude,
    }))
}))

export default useLocation;