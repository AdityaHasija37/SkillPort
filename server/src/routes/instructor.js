import { Router } from "express";

import { isOwner, loadCourse } from "../lib/access.js";
import { forbidden } from "../lib/http-error.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { Course } from "../models/Course.js";
import { Enrollment, progressFor } from "../models/Enrollment.js";
import { Thread } from "../models/Thread.js";

const router = Router();
router.use(requireAuth, requireRole("instructor"));

/** Instructor dashboard: every course I teach (drafts included), with how learners are doing. */
router.get("/courses", async (req, res) => {
  const courses = await Course.find({ instructor: req.user.id }).sort({ updatedAt: -1 });
  const ids = courses.map((c) => c._id);
  const [enrollments, threadCounts] = await Promise.all([
    Enrollment.find({ course: { $in: ids } }),
    Thread.aggregate([{ $match: { course: { $in: ids } } }, { $group: { _id: "$course", n: { $sum: 1 } } }]),
  ]);
  const threadsBy = new Map(threadCounts.map((t) => [t._id.toString(), t.n]));

  const items = courses.map((course) => {
    const mine = enrollments.filter((e) => e.course.toString() === course.id);
    const progress = mine.map((e) => progressFor(e, course));
    return {
      id: course.id,
      slug: course.slug,
      title: course.title,
      status: course.status,
      category: course.category,
      level: course.level,
      lessonCount: course.lessonCount,
      updatedAt: course.updatedAt,
      stats: {
        learners: mine.length,
        completions: mine.filter((e) => e.completedAt).length,
        averageProgress: progress.length ? Math.round(progress.reduce((a, b) => a + b, 0) / progress.length) : 0,
        threads: threadsBy.get(course.id) ?? 0,
      },
    };
  });

  const totals = items.reduce(
    (t, c) => ({ courses: t.courses + 1, learners: t.learners + c.stats.learners, completions: t.completions + c.stats.completions }),
    { courses: 0, learners: 0, completions: 0 },
  );
  res.json({ items, totals });
});

/** Who is taking one of my courses, and how far they've got. */
router.get("/courses/:id/learners", async (req, res) => {
  const course = await loadCourse(req.params.id, req.user);
  if (!isOwner(req.user, course)) throw forbidden();
  const enrollments = await Enrollment.find({ course: course.id }).sort({ lastAccessedAt: -1 }).populate("user", "name username");
  res.json({
    course: { id: course.id, title: course.title, slug: course.slug, lessonCount: course.lessonCount },
    items: enrollments
      .filter((e) => e.user)
      .map((e) => ({
        id: e.id,
        learner: { name: e.user.name, username: e.user.username },
        progress: progressFor(e, course),
        enrolledAt: e.createdAt,
        lastAccessedAt: e.lastAccessedAt,
        completedAt: e.completedAt ?? null,
      })),
  });
});

export default router;
