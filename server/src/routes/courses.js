import { Router } from "express";
import mongoose from "mongoose";

import { assertCanDiscuss, findEnrollment, isOwner, loadCourse } from "../lib/access.js";
import { writeCertificate } from "../lib/certificate.js";
import { badRequest, conflict, forbidden, notFoundError } from "../lib/http-error.js";
import { courseQuerySchema, courseSchema, courseUpdateSchema, threadSchema } from "../lib/schemas.js";
import { courseForViewer, userSummary } from "../lib/serialize.js";
import { slugify } from "../lib/slug.js";
import { optionalAuth, requireAuth, requireRole } from "../middleware/auth.js";
import { Course } from "../models/Course.js";
import { Enrollment, progressFor } from "../models/Enrollment.js";
import { Thread } from "../models/Thread.js";

const router = Router();

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

async function uniqueSlug(title, excludeId) {
  const base = slugify(title) || "course";
  let slug = base;
  for (let n = 2; await Course.exists({ slug, ...(excludeId && { _id: { $ne: excludeId } }) }); n += 1) {
    slug = `${base}-${n}`;
  }
  return slug;
}

const enrollmentCount = (courseId) => Enrollment.countDocuments({ course: courseId });

/* ---------------- Catalog ---------------- */

router.get("/", async (req, res) => {
  const { q, category, level, sort, page, limit } = courseQuerySchema.parse(req.query);

  const match = { status: "published" };
  if (category) match.category = category;
  if (level) match.level = level;
  if (q) {
    const rx = new RegExp(escapeRegex(q), "i");
    match.$or = [{ title: rx }, { summary: rx }, { tags: rx }];
  }

  const sortSpec = { newest: { publishedAt: -1 }, popular: { enrollmentCount: -1, publishedAt: -1 }, title: { title: 1 } }[sort];

  const [result] = await Course.aggregate([
    { $match: match },
    { $lookup: { from: "enrollments", localField: "_id", foreignField: "course", as: "_enrollments", pipeline: [{ $project: { _id: 1 } }] } },
    {
      $addFields: {
        enrollmentCount: { $size: "$_enrollments" },
        lessonCount: { $size: "$lessons" },
        totalMinutes: { $sum: "$lessons.durationMinutes" },
      },
    },
    { $project: { _enrollments: 0, lessons: 0, description: 0, __v: 0 } },
    { $facet: { items: [{ $sort: sortSpec }, { $skip: (page - 1) * limit }, { $limit: limit }], total: [{ $count: "n" }] } },
  ]);

  const items = await Course.populate(result.items, { path: "instructor", select: "name username" });
  const total = result.total[0]?.n ?? 0;
  res.json({
    items: items.map(({ _id, instructor, ...c }) => ({ id: _id.toString(), ...c, instructor: userSummary(instructor) })),
    total,
    page,
    pages: Math.max(1, Math.ceil(total / limit)),
  });
});

/* ---------------- Authoring ---------------- */

router.post("/", requireAuth, requireRole("instructor"), async (req, res) => {
  const data = courseSchema.parse(req.body);
  if (data.status === "published" && data.lessons.length === 0) throw badRequest("Add at least one lesson before publishing");
  const course = await Course.create({
    ...data,
    lessons: data.lessons.map(({ id: _id, ...l }) => l),
    slug: await uniqueSlug(data.title),
    instructor: req.user.id,
    publishedAt: data.status === "published" ? new Date() : undefined,
  });
  await course.populate("instructor", "name username headline");
  res.status(201).json({ course: courseForViewer(course, { owner: true }) });
});

router.patch("/:id", requireAuth, async (req, res) => {
  const course = await loadCourse(req.params.id, req.user);
  if (!isOwner(req.user, course)) throw forbidden("Only the instructor can edit this course");
  const data = courseUpdateSchema.parse(req.body);

  if (data.title && data.title !== course.title) course.slug = await uniqueSlug(data.title, course.id);
  if (data.lessons) {
    // Keep ids for lessons that were edited, so learners' progress on them survives.
    const existing = new Set(course.lessons.map((l) => l.id));
    data.lessons = data.lessons.map(({ id, ...l }) => (id && existing.has(id) ? { _id: id, ...l } : l));
  }
  course.set(data);
  if (course.status === "published") {
    if (course.lessons.length === 0) throw badRequest("Add at least one lesson before publishing");
    course.publishedAt ??= new Date();
  }
  await course.save();
  res.json({ course: courseForViewer(course, { owner: true, enrollmentCount: await enrollmentCount(course.id) }) });
});

router.delete("/:id", requireAuth, async (req, res) => {
  const course = await loadCourse(req.params.id, req.user);
  if (!isOwner(req.user, course)) throw forbidden("Only the instructor can delete this course");
  await Promise.all([Enrollment.deleteMany({ course: course.id }), Thread.deleteMany({ course: course.id }), course.deleteOne()]);
  res.status(204).end();
});

/* ---------------- Detail ---------------- */

router.get("/:id", optionalAuth, async (req, res) => {
  const course = await loadCourse(req.params.id, req.user);
  const enrollment = await findEnrollment(req.user, course);
  res.json({
    course: courseForViewer(course, { owner: isOwner(req.user, course), enrollment, enrollmentCount: await enrollmentCount(course.id) }),
  });
});

/* ---------------- Enrollment & progress ---------------- */

router.post("/:id/enroll", requireAuth, async (req, res) => {
  const course = await loadCourse(req.params.id, req.user);
  if (course.status !== "published") throw badRequest("This course isn't published yet");
  if (isOwner(req.user, course)) throw badRequest("You teach this course");
  if (await findEnrollment(req.user, course)) throw conflict("You're already enrolled");
  const enrollment = await Enrollment.create({ user: req.user.id, course: course.id });
  res.status(201).json({
    course: courseForViewer(course, { enrollment, enrollmentCount: await enrollmentCount(course.id) }),
  });
});

router.delete("/:id/enroll", requireAuth, async (req, res) => {
  const course = await loadCourse(req.params.id, req.user);
  const { deletedCount } = await Enrollment.deleteOne({ user: req.user.id, course: course.id });
  if (!deletedCount) throw notFoundError("Enrollment");
  res.status(204).end();
});

async function setLessonDone(req, res, done) {
  const course = await loadCourse(req.params.id, req.user);
  const enrollment = await findEnrollment(req.user, course);
  if (!enrollment) throw forbidden("Enroll in this course to track progress");
  const lesson = course.lessons.id(req.params.lessonId);
  if (!lesson) throw notFoundError("Lesson");

  const lessonId = new mongoose.Types.ObjectId(lesson.id);
  if (done) enrollment.completedLessons.addToSet(lessonId);
  else enrollment.completedLessons.pull(lessonId);

  const progress = progressFor(enrollment, course);
  enrollment.completedAt = progress === 100 ? (enrollment.completedAt ?? new Date()) : undefined;
  enrollment.lastAccessedAt = new Date();
  await enrollment.save();

  res.json({
    enrollment: { progress, completedLessonIds: enrollment.completedLessons.map(String), completedAt: enrollment.completedAt ?? null },
  });
}

router.post("/:id/lessons/:lessonId/complete", requireAuth, (req, res) => setLessonDone(req, res, true));
router.delete("/:id/lessons/:lessonId/complete", requireAuth, (req, res) => setLessonDone(req, res, false));

router.get("/:id/certificate", requireAuth, async (req, res) => {
  const course = await loadCourse(req.params.id, req.user);
  const enrollment = await findEnrollment(req.user, course);
  if (!enrollment?.completedAt) throw forbidden("Finish every lesson to get your certificate");

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="skillport-${course.slug}-certificate.pdf"`);
  writeCertificate(res, {
    learnerName: req.user.name,
    courseTitle: course.title,
    instructorName: course.instructor.name,
    completedAt: enrollment.completedAt,
    certificateId: enrollment.id,
  });
});

/* ---------------- Discussions ---------------- */

router.get("/:id/threads", async (req, res) => {
  const course = await loadCourse(req.params.id);
  const threads = await Thread.find({ course: course.id })
    .sort({ lastActivityAt: -1 })
    .select("-replies.body")
    .populate("author", "name username role");
  res.json({
    items: threads.map((t) => ({
      id: t.id,
      title: t.title,
      excerpt: t.body.slice(0, 180),
      author: userSummary(t.author),
      replyCount: t.replyCount,
      createdAt: t.createdAt,
      lastActivityAt: t.lastActivityAt,
    })),
  });
});

router.post("/:id/threads", requireAuth, async (req, res) => {
  const course = await loadCourse(req.params.id, req.user);
  await assertCanDiscuss(req.user, course);
  const thread = await Thread.create({ ...threadSchema.parse(req.body), course: course.id, author: req.user.id });
  res.status(201).json({ thread: { id: thread.id } });
});

export default router;
