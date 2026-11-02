import { Router } from "express";

import { assertCanDiscuss, isOwner, loadCourse } from "../lib/access.js";
import { forbidden, notFoundError } from "../lib/http-error.js";
import { replySchema } from "../lib/schemas.js";
import { userSummary } from "../lib/serialize.js";
import { requireAuth } from "../middleware/auth.js";
import { Thread } from "../models/Thread.js";

const router = Router();

async function loadThread(id) {
  const thread = await Thread.findById(id).populate("author", "name username role").populate("replies.author", "name username role");
  if (!thread) throw notFoundError("Thread");
  return thread;
}

function threadJSON(thread, course) {
  const instructorId = course.instructor._id.toString();
  const person = (u) => u && { ...userSummary(u), isInstructor: u._id.toString() === instructorId };
  return {
    id: thread.id,
    title: thread.title,
    body: thread.body,
    author: person(thread.author),
    createdAt: thread.createdAt,
    course: { id: course.id, slug: course.slug, title: course.title },
    replies: thread.replies.map((r) => ({ id: r.id, body: r.body, author: person(r.author), createdAt: r.createdAt })),
  };
}

router.get("/:id", async (req, res) => {
  const thread = await loadThread(req.params.id);
  const course = await loadCourse(thread.course.toString());
  res.json({ thread: threadJSON(thread, course) });
});

router.post("/:id/replies", requireAuth, async (req, res) => {
  const thread = await loadThread(req.params.id);
  const course = await loadCourse(thread.course.toString(), req.user);
  await assertCanDiscuss(req.user, course);
  thread.replies.push({ ...replySchema.parse(req.body), author: req.user.id });
  thread.lastActivityAt = new Date();
  await thread.save();
  const fresh = await loadThread(thread.id);
  res.status(201).json({ thread: threadJSON(fresh, course) });
});

router.delete("/:id", requireAuth, async (req, res) => {
  const thread = await loadThread(req.params.id);
  const course = await loadCourse(thread.course.toString(), req.user);
  const isAuthor = thread.author?._id.toString() === req.user.id;
  if (!isAuthor && !isOwner(req.user, course)) throw forbidden("Only the author or the instructor can remove this thread");
  await thread.deleteOne();
  res.status(204).end();
});

export default router;
