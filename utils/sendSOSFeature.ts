import User from "@/schema/userSchema";
import axiosInstance from "./axiosInstance";

export async function sendSOS(userDetails: User, location: { latitude: number, longitude: number }) {
    // Implement the logic to send SOS message
    userDetails.connectedUsers?.map(async (caretaker) => {
        const response = await axiosInstance.post("/messages/send-sos", {
            phone: caretaker.phone,
            location: {
                latitude: location.latitude,
                longitude: location.longitude,
            },
            message: "I need help!, Please try to contact me.",
        })
        if (response.status === 200) {
            console.log("SOS message sent successfully");
            return response.data.message || "SOS message sent successfully";
        } else {
            console.error("Failed to send SOS message", response.data);
            return response.data.message || "Failed to send SOS message";
        }
    })

}