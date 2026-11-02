import { Router } from "express";

import { notFoundError } from "../lib/http-error.js";
import { Course } from "../models/Course.js";
import { User } from "../models/User.js";

const router = Router();

/** Public profile, with the courses this person teaches. */
router.get("/:username", async (req, res) => {
  const user = await User.findOne({ username: req.params.username.toLowerCase() });
  if (!user) throw notFoundError("User");
  const courses = await Course.find({ instructor: user.id, status: "published" })
    .sort({ publishedAt: -1 })
    .select("title slug summary category level lessons");
  res.json({
    user: user.toPublic(),
    courses: courses.map((c) => ({
      id: c.id,
      slug: c.slug,
      title: c.title,
      summary: c.summary,
      category: c.category,
      level: c.level,
      lessonCount: c.lessonCount,
    })),
  });
});

export default router;
