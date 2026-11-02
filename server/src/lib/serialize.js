import { progressFor } from "../models/Enrollment.js";

const instructorSummary = (i) => ({ id: i._id.toString(), name: i.name, username: i.username, headline: i.headline ?? "" });

/**
 * A course as the viewer may see it. Lesson content is for enrolled learners and the instructor;
 * everyone else gets the outline (titles and durations) so they can decide whether to enroll.
 */
export function courseForViewer(course, { owner = false, enrollment = null, enrollmentCount = 0 } = {}) {
  const canRead = owner || Boolean(enrollment);
  return {
    id: course.id,
    slug: course.slug,
    title: course.title,
    summary: course.summary,
    description: course.description,
    category: course.category,
    level: course.level,
    tags: course.tags,
    status: course.status,
    publishedAt: course.publishedAt ?? null,
    updatedAt: course.updatedAt,
    instructor: instructorSummary(course.instructor),
    lessonCount: course.lessonCount,
    totalMinutes: course.totalMinutes,
    enrollmentCount,
    lessons: course.lessons.map((l) => ({
      id: l.id,
      title: l.title,
      durationMinutes: l.durationMinutes,
      ...(canRead && { content: l.content }),
    })),
    viewer: {
      isOwner: owner,
      enrollment: enrollment && {
        progress: progressFor(enrollment, course),
        completedLessonIds: enrollment.completedLessons.map(String),
        completedAt: enrollment.completedAt ?? null,
      },
    },
  };
}

export const userSummary = (u) => (u ? { id: u._id.toString(), name: u.name, username: u.username, role: u.role } : null);
