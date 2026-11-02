import mongoose from "mongoose";

import { toJSONPlugin } from "./plugins.js";

export const CATEGORIES = ["Programming", "Design", "Data", "Business", "Product", "Languages", "Other"];
export const LEVELS = ["Beginner", "Intermediate", "Advanced"];
export const STATUSES = ["draft", "published"];

const lessonSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 120 },
  content: { type: String, required: true, maxlength: 20000 },
  durationMinutes: { type: Number, required: true, min: 1, max: 600 },
});
lessonSchema.plugin(toJSONPlugin);

const courseSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 120 },
    slug: { type: String, required: true, unique: true },
    summary: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, required: true, maxlength: 5000 },
    category: { type: String, enum: CATEGORIES, required: true },
    level: { type: String, enum: LEVELS, required: true },
    tags: [{ type: String, trim: true, lowercase: true, maxlength: 30 }],
    instructor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    lessons: { type: [lessonSchema], default: [] },
    status: { type: String, enum: STATUSES, default: "draft", index: true },
    publishedAt: { type: Date },
  },
  { timestamps: true },
);

courseSchema.index({ title: "text", summary: "text", description: "text", tags: "text" });

courseSchema.virtual("totalMinutes").get(function totalMinutes() {
  return (this.lessons ?? []).reduce((sum, l) => sum + (l.durationMinutes ?? 0), 0);
});

courseSchema.virtual("lessonCount").get(function lessonCount() {
  return (this.lessons ?? []).length;
});

courseSchema.plugin(toJSONPlugin);

export const Course = mongoose.model("Course", courseSchema);
