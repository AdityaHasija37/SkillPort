import mongoose from "mongoose";

import { toJSONPlugin } from "./plugins.js";

const enrollmentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true, index: true },
    completedLessons: [{ type: mongoose.Schema.Types.ObjectId }],
    completedAt: { type: Date },
    lastAccessedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

// One enrollment per learner per course.
enrollmentSchema.index({ user: 1, course: 1 }, { unique: true });

/** Percent complete, counted only against lessons that still exist in the course. */
export function progressFor(enrollment, course) {
  const lessonIds = new Set(course.lessons.map((l) => l.id));
  if (lessonIds.size === 0) return 0;
  const done = enrollment.completedLessons.filter((id) => lessonIds.has(id.toString())).length;
  return Math.round((done / lessonIds.size) * 100);
}

enrollmentSchema.plugin(toJSONPlugin);

export const Enrollment = mongoose.model("Enrollment", enrollmentSchema);
