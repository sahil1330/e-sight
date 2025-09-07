import { z } from 'zod';

export const emailSchema = z.object({
    email: z.string().email("Invalid email address").min(1, "Email is required").max(255, "Email must be less than 255 characters"),
});

export const verifyCodeSchema = z.object({
    code: z.string().min(6, "Verification code must be exactly 6 characters").max(6, "Verification code must be exactly 6 characters").regex(/^\d{6}$/, "Verification code must be a valid 6-digit number"),
});

export const resetPasswordSchema = z.object({
    newPassword: z.string().min(8, "Password must be at least 8 characters").max(100, "Password must be less than 100 characters"),
    confirmPassword: z.string().min(8, "Password must be at least 8 characters").max(100, "Password must be less than 100 characters"),
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
});

export type EmailFormData = z.infer<typeof emailSchema>;
export type VerifyCodeFormData = z.infer<typeof verifyCodeSchema>;
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
