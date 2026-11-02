# Architecture

```
Browser (React, Vite)  ──/api──▶  Express 5 API  ──▶  MongoDB (Mongoose)
   pages, auth context              routes → access rules → models
   fetch client + JWT               Zod validation, central errors
```

In development Vite proxies `/api` to the API, so the browser only ever talks to one origin. In production the API sets CORS to `CLIENT_ORIGIN`, and the client can point at it with `VITE_API_URL`.

## Data model

| Collection | Key fields | Notes |
| --- | --- | --- |
| `users` | name, username, email, passwordHash, role (`learner` \| `instructor`), headline, bio | Password hash is never selected or serialized |
| `courses` | title, slug, summary, description, category, level, tags, instructor, lessons[], status (`draft` \| `published`), publishedAt | Lessons are embedded subdocuments with stable ids |
| `enrollments` | user, course, completedLessons[], completedAt, lastAccessedAt | Unique on (user, course) |
| `threads` | course, author, title, body, replies[], lastActivityAt | Replies are embedded; threads sort by latest activity |

**Why enrollments are their own collection:** v1 embedded enrolled students inside each course, which made "my courses" a scan of every course and let a popular course document grow without bound. A separate collection gives cheap queries both ways (by learner for the dashboard, by course for instructor stats) and a uniqueness guarantee.

**Progress** is derived, not stored: `completed lessons that still exist ÷ current lessons`. If an instructor deletes a lesson, nobody's percentage goes stale, and editing a lesson keeps its id, so learners keep credit for it.

## Access rules

Enforced on the server in `server/src/lib/access.js` and the routes. The client only hides buttons.

| Action | Who |
| --- | --- |
| See a published course and its outline | Anyone |
| Read lesson content | Enrolled learners and the course's instructor |
| See a draft | Its instructor only (everyone else gets 404, so drafts aren't discoverable) |
| Create a course | Instructors |
| Edit, publish, delete a course; see its learners | That course's instructor |
| Enroll | Any signed-in user except the course's instructor |
| Mark lessons complete, download certificate | The enrolled learner (certificate only after completion) |
| Read discussions | Anyone |
| Post threads and replies | Enrolled learners and the instructor |
| Remove a thread | Its author or the course's instructor |

## Request flow

1. `requireAuth` / `optionalAuth` verifies the JWT and loads the user from the database, so role changes and deleted accounts take effect immediately.
2. Route handlers parse input with Zod schemas from `lib/schemas.js`.
3. `loadCourse` resolves an id or slug and applies the draft rule.
4. Serializers in `lib/serialize.js` shape the response for this viewer (for example, stripping lesson content).
5. Anything thrown (HTTP errors, Zod errors, bad ids, duplicate keys) is turned into a consistent `{ error, details? }` response by `middleware/errors.js`. Express 5 forwards async errors automatically.

## Client

- `lib/api.js`: a small `fetch` wrapper. It adds the bearer token, raises `ApiError` with field-level details, and broadcasts a sign-out event on any 401.
- `lib/auth.jsx`: the session (token in `localStorage`, user restored from `/api/me` on load).
- `lib/useAsync.js`: loading, error and data state for each page's fetch, with reload.
- Pages are plain components per route; `RequireAuth` guards signed-in and instructor-only routes.

## Testing

- **API:** each test file gets a fresh in-memory MongoDB. Tests cover the rules above (who can and can't do each thing), validation, search and sorting, progress math, certificates and the seed.
- **Client:** UI primitives, formatting, and the sign-in flow with `fetch` mocked.
