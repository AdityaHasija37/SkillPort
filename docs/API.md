# API reference

Base URL: `/api`. Send JSON, receive JSON. Authenticated requests send `Authorization: Bearer <token>` from sign-in or registration (tokens last 7 days by default).

Errors always look like `{ "error": "message" }`. Validation errors add `details: [{ field, message }]`, where `field` is a path such as `lessons.0.title`.

| Status | Meaning |
| --- | --- |
| 400 | Invalid input, or an action that doesn't apply (e.g. enrolling in your own course) |
| 401 | Not signed in, or the token expired |
| 403 | Signed in but not allowed |
| 404 | Not found, including drafts you don't own and malformed ids |
| 409 | Duplicate (email, username, enrollment) |
| 429 | Too many sign-in attempts (20 per 15 minutes) |

## Auth

| Method | Path | Auth | Body | Returns |
| --- | --- | --- | --- | --- |
| POST | `/auth/register` | none | `name, username, email, password, role?` (`learner` default, or `instructor`) | `201 { token, user }` |
| POST | `/auth/login` | none | `email, password` | `{ token, user }` |

## Me

| Method | Path | Auth | Notes |
| --- | --- | --- | --- |
| GET | `/me` | user | `{ user }` |
| PATCH | `/me` | user | Any of `name, headline, bio` |
| GET | `/me/enrollments` | user | `{ items: [{ course, progress, nextLesson, lastAccessedAt, completedAt }] }`, most recent first |

## Users

| Method | Path | Auth | Notes |
| --- | --- | --- | --- |
| GET | `/users/:username` | none | Public profile and the published courses they teach |

## Courses

| Method | Path | Auth | Notes |
| --- | --- | --- | --- |
| GET | `/courses` | none | Query: `q, category, level, sort (newest\|popular\|title), page, limit (≤50)`. Returns `{ items, total, page, pages }` with `enrollmentCount, lessonCount, totalMinutes` |
| GET | `/courses/:idOrSlug` | optional | Course plus `viewer: { isOwner, enrollment }`. Lesson `content` only for enrolled learners and the instructor |
| POST | `/courses` | instructor | `title, summary, description, category, level, tags[], lessons[{ title, content, durationMinutes }], status` |
| PATCH | `/courses/:id` | owner | Any course field. Send lessons with their `id` to keep learners' progress on them |
| DELETE | `/courses/:id` | owner | Also deletes its enrollments and threads |
| POST | `/courses/:id/enroll` | user | `201 { course }` |
| DELETE | `/courses/:id/enroll` | user | `204` |
| POST | `/courses/:id/lessons/:lessonId/complete` | enrolled | `{ enrollment: { progress, completedLessonIds, completedAt } }` |
| DELETE | `/courses/:id/lessons/:lessonId/complete` | enrolled | Undo, same response |
| GET | `/courses/:id/certificate` | enrolled, completed | PDF download |
| GET | `/courses/:id/threads` | none | `{ items: [{ title, excerpt, author, replyCount, lastActivityAt }] }` |
| POST | `/courses/:id/threads` | enrolled or owner | `title, body` → `201 { thread: { id } }` |

Categories: `Programming, Design, Data, Business, Product, Languages, Other`. Levels: `Beginner, Intermediate, Advanced`. A course can only be published with at least one lesson.

## Threads

| Method | Path | Auth | Notes |
| --- | --- | --- | --- |
| GET | `/threads/:id` | none | Thread with replies; authors carry `isInstructor` |
| POST | `/threads/:id/replies` | enrolled or owner | `body` → `201 { thread }` |
| DELETE | `/threads/:id` | author or owner | `204` |

## Instructor

| Method | Path | Auth | Notes |
| --- | --- | --- | --- |
| GET | `/instructor/courses` | instructor | All my courses (drafts too) with `stats: { learners, completions, averageProgress, threads }` and `totals` |
| GET | `/instructor/courses/:id/learners` | owner | Each learner's progress, enrolled and last-active dates |

## Health

`GET /health` → `{ "status": "ok" }`
