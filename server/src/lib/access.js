import mongoose from "mongoose";

import { forbidden, notFoundError } from "./http-error.js";
import { Course } from "../models/Course.js";
import { Enrollment } from "../models/Enrollment.js";

export const isOwner = (user, course) => Boolean(user) && course.instructor._id.toString() === user.id;

/** Find a course by id or slug. Drafts are visible only to their instructor. */
export async function loadCourse(idOrSlug, user) {
  const filter = mongoose.isValidObjectId(idOrSlug) ? { _id: idOrSlug } : { slug: idOrSlug };
  const course = await Course.findOne(filter).populate("instructor", "name username headline role");
  if (!course) throw notFoundError("Course");
  if (course.status !== "published" && !isOwner(user, course)) throw notFoundError("Course");
  return course;
}

export async function findEnrollment(user, course) {
  if (!user) return null;
  return Enrollment.findOne({ user: user.id, course: course.id });
}

/** Discussions are for people taking or teaching the course. */
export async function assertCanDiscuss(user, course) {
  if (isOwner(user, course)) return;
  if (await findEnrollment(user, course)) return;
  throw forbidden("Enroll in this course to join the discussion");
}
