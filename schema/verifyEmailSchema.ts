import { z } from 'zod';
export const verifyEmailSchema = z.object({
    email: z.string().email("Invailid email address").min(1, "Email is required").max(255, "Email must be less than 255 characters"),
    code: z.string().min(6, "Verification code must be exactly 6 characters").max(6, "Verification code must be exactly 6 characters").regex(/^\d{6}$/, "Verification code must be a valid 6-digit number"),
})