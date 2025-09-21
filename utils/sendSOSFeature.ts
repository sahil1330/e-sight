import User from "@/schema/userSchema";
import axiosInstance from "./axiosInstance";
import { addEmergencyNotification } from "./notificationHelpers";

export async function sendSOS(userDetails: User, location: { latitude: number, longitude: number }) {
    try {
        // Add local emergency notification for the user first
        await addEmergencyNotification(
            'sos',
            'active',
            'critical',
            `SOS triggered at coordinates: ${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}. Emergency messages sent to your caretakers.`
        );

        // Send SOS messages to all connected caretakers
        const results = await Promise.allSettled(
            userDetails.connectedUsers?.map(async (caretaker) => {
                const response = await axiosInstance.post("/messages/send-sos", {
                    phone: caretaker.phone,
                    location: {
                        latitude: location.latitude,
                        longitude: location.longitude,
                    },
                    message: "I need help!, Please try to contact me.",
                });
                
                if (response.status === 200) {
                    console.log(`SOS message sent successfully to ${caretaker.phone}`);
                    return response.data.message || "SOS message sent successfully";
                } else {
                    console.error(`Failed to send SOS message to ${caretaker.phone}`, response.data);
                    throw new Error(response.data.message || "Failed to send SOS message");
                }
            }) || []
        );

        // Check results and provide feedback
        const fulfilled = results.filter(result => result.status === 'fulfilled');
        const rejected = results.filter(result => result.status === 'rejected');

        if (rejected.length > 0) {
            console.warn(`${rejected.length} SOS messages failed to send`);
            // Update emergency notification with partial success status
            await addEmergencyNotification(
                'sos',
                'acknowledged',
                'high',
                `SOS partially sent: ${fulfilled.length} successful, ${rejected.length} failed out of ${results.length} caretakers.`
            );
        } else {
            console.log(`All ${fulfilled.length} SOS messages sent successfully`);
            // Update emergency notification with success status
            await addEmergencyNotification(
                'sos',
                'acknowledged',
                'medium',
                `SOS successfully sent to all ${fulfilled.length} caretakers.`
            );
        }

        return {
            success: fulfilled.length > 0,
            totalSent: fulfilled.length,
            totalFailed: rejected.length,
            message: fulfilled.length > 0 
                ? `SOS sent to ${fulfilled.length} caretaker(s)` 
                : "Failed to send SOS to any caretakers"
        };

    } catch (error) {
        console.error("Error in sendSOS function:", error);
        
        // Add error notification
        await addEmergencyNotification(
            'sos',
            'active',
            'critical',
            `SOS system error: ${error instanceof Error ? error.message : 'Unknown error'}. Please contact emergency services directly if needed.`
        );

        return {
            success: false,
            totalSent: 0,
            totalFailed: userDetails.connectedUsers?.length || 0,
            message: "SOS system error occurred"
        };
    }
}