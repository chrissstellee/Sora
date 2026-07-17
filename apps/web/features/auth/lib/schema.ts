import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().min(1, "Email is required").email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().optional(),
});

export type LoginValues = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  fullName: z.string().min(2, "Enter your full name"),
  organization: z.string().min(2, "Enter your organization"),
  email: z.string().min(1, "Corporate email is required").email("Enter a valid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Include at least one uppercase letter")
    .regex(/\d/, "Include at least one number"),
  agreeToTerms: z.boolean().refine((value) => value === true, {
    message: "You must agree to the Privacy Policy and Terms of Service",
  }),
});

export type RegisterValues = z.infer<typeof registerSchema>;
