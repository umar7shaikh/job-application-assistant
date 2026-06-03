import { z } from "zod";
import { aiProviderIds } from "@builder/shared";

export const signupSchema = z.object({
  name: z.string().trim().min(1, "Enter your name").max(120),
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  password: z
    .string()
    .min(8, "Use at least 8 characters")
    .max(200, "That password is too long"),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  password: z.string().min(1, "Enter your password"),
});

export const secretsSchema = z.object({
  apifyKey: z.string().trim().max(500).optional(),
  rapidApiKey: z.string().trim().max(500).optional(),
  aiProvider: z.enum(aiProviderIds).optional(),
  aiKey: z.string().trim().max(500).optional(),
});
