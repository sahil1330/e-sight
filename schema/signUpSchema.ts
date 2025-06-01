import { z } from "zod"
export const signUpSchema = z.object({
    fullName: z.string().min(1, "Full name is required"),
    email: z.string().email("Invalid email address").min(1, "Email is required").max(255, "Email must be less than 255 characters"),
    phone: z.string().min(10, "Phone number must be at least 10 characters").max(10, "Phone number must be exactly 10 characters").regex(/^\d{10}$/, "Phone number must be a valid 10-digit number"),
    password: z.string().min(8, "Password must  be at least 8 characters").max(60, "Password must be less than 60 characters"),
    confirmPassword: z.string().min(8, "Confirm password must be at least 8 characters").max(60, "Confirm password must be less than 60 characters"),
    role: z.enum(["blind", "caretaker"], {
        errorMap: () => ({ message: "Role must be either 'blind' or 'caretaker'" }),
    })
}).refine((data) => data.password === data.confirmPassword, {
    message: "Password and confirm password must match",
    path: ["confirmPassword"],
})