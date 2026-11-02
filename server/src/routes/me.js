import { Router } from "express";

import { profileSchema } from "../lib/schemas.js";
import { requireAuth } from "../middleware/auth.js";
import { Enrollment, progressFor } from "../models/Enrollment.js";

const router = Router();
router.use(requireAuth);

router.get("/", (req, res) => res.json({ user: req.user }));

router.patch("/", async (req, res) => {
  req.user.set(profileSchema.parse(req.body));
  await req.user.save();
  res.json({ user: req.user });
});

/** Learner dashboard: every course I'm taking, most recently opened first. */
router.get("/enrollments", async (req, res) => {
  const enrollments = await Enrollment.find({ user: req.user.id })
    .sort({ lastAccessedAt: -1 })
    .populate({ path: "course", populate: { path: "instructor", select: "name username" } });

  const items = enrollments
    .filter((e) => e.course) // course was deleted
    .map((e) => {
      const course = e.course;
      const done = new Set(e.completedLessons.map(String));
      const nextLesson = course.lessons.find((l) => !done.has(l.id));
      return {
        id: e.id,
        enrolledAt: e.createdAt,
        lastAccessedAt: e.lastAccessedAt,
        completedAt: e.completedAt ?? null,
        progress: progressFor(e, course),
        nextLesson: nextLesson ? { id: nextLesson.id, title: nextLesson.title } : null,
        course: {
          id: course.id,
          slug: course.slug,
          title: course.title,
          summary: course.summary,
          category: course.category,
          level: course.level,
          lessonCount: course.lessonCount,
          instructor: { name: course.instructor.name, username: course.instructor.username },
        },
      };
    });
  res.json({ items });
});

export default router;
