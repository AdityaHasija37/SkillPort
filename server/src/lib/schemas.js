import { z } from "zod";

import { CATEGORIES, LEVELS, STATUSES } from "../models/Course.js";
import { ROLES } from "../models/User.js";

const text = (max, min = 1) => z.string().trim().min(min).max(max);

export const registerSchema = z.object({
  name: text(80),
  username: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9_]{3,24}$/, "3–24 characters: letters, numbers or underscores"),
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  password: z.string().min(8, "Use at least 8 characters").max(128),
  role: z.enum(ROLES).default("learner"),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  password: z.string().min(1, "Enter your password"),
});

export const profileSchema = z
  .object({
    name: text(80),
    headline: z.string().trim().max(120),
    bio: z.string().trim().max(1000),
  })
  .partial();

const lessonSchema = z.object({
  id: z.string().optional(),
  title: text(120),
  content: text(20000),
  durationMinutes: z.coerce.number().int().min(1).max(600),
});

export const courseSchema = z.object({
  title: text(120, 3),
  summary: text(200, 10),
  description: text(5000, 20),
  category: z.enum(CATEGORIES),
  level: z.enum(LEVELS),
  tags: z.array(z.string().trim().toLowerCase().min(1).max(30)).max(8).default([]),
  lessons: z.array(lessonSchema).max(100).default([]),
  status: z.enum(STATUSES).default("draft"),
});

export const courseUpdateSchema = courseSchema.partial();

export const courseQuerySchema = z.object({
  q: z.string().trim().max(100).optional(),
  category: z.enum(CATEGORIES).optional(),
  level: z.enum(LEVELS).optional(),
  sort: z.enum(["newest", "popular", "title"]).default("newest"),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(12),
});

export const threadSchema = z.object({
  title: text(140, 3),
  body: text(8000),
});

export const replySchema = z.object({
  body: text(4000),
});
