import { z } from 'zod';
export const signInSchema = z.object({
    identifier: z.string().min(1, "Email is required").max(255, "Email must be less than 255 characters"),
    password: z.string().min(8, "Password must be at least 8 characters").max(60, "Password must be less than 60 characters"),
})