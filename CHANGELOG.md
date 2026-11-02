# Changelog

## 2.0.0 (2026-11-02)

A rebuild of the original prototype. Same idea and the same MERN stack; every feature now works end to end and is covered by tests.

### Fixed from v1

v1 could not run. These are the problems that stopped it, all resolved by the rebuild:

- `server/models/Course.js` had schema fields outside the schema object, a syntax error that crashed the API on start.
- Course creation checked `req.user.role`, which was never set, so nobody could create a course.
- `GET /api/courses/instructor` was declared after `GET /api/courses/:id`, so the instructor dashboard always hit the wrong route.
- Enrollment stored plain user ids, while progress and certificates expected `{ user, progress }` objects.
- The certificate route used `User` without importing it, and `pdfkit` was installed in the client instead of the server.
- A second `GET /api/courses` handler (search and filters) was unreachable.
- The client didn't compile: `App.js` imported a file that didn't exist, `Navbar` imported `useNavigate` twice and used an undefined `isLoggedIn`.
- The auth context called `/api/users/me`, which didn't exist, so a signed-in user was lost on every refresh.
- Instructor screens linked to `/create-course`, `/edit-course` and `/course-analytics`, none of which existed.
- `.env` files were committed (they only held local placeholders, but they're now ignored and replaced by `server/.env.example`).

### Added

- Learner and instructor roles chosen at sign-up, enforced in the API.
- Course authoring: create, edit, reorder lessons, draft and publish, delete.
- Catalog search, category and level filters, sorting and pagination.
- Lesson-by-lesson progress, a "continue where you left off" dashboard and PDF certificates on completion.
- Discussion threads and replies per course, open to enrolled learners and the instructor.
- Instructor dashboard with learners, average progress, completions and thread counts, plus a per-course learner list.
- Profiles and public instructor pages.
- Demo seed data, API and UI tests, ESLint and GitHub Actions CI.
- Accessibility: labelled form fields with linked errors, visible focus, skip link, keyboard-friendly navigation, reduced-motion support.

### Changed

- Create React App → Vite. Bootstrap → a small hand-written stylesheet with design tokens and dark mode.
- Express 4 → Express 5 (async errors handled centrally), with Helmet, CORS restricted to the client origin and rate-limited sign-in.
- Request validation with Zod, returning field-level messages the forms display inline.
- Lesson content is only sent to enrolled learners and the instructor; everyone else sees the outline.

### Removed

- The half-built Razorpay payment flow (never mounted, its dependency was missing). All courses are free in v2; paid courses are on the roadmap.
- Template filler (placeholder social links, "© 2023 Skill Share Platform").

## 1.0.0 (2024)

Original course project prototype. Its README is kept at [docs/archive/v1-README.md](docs/archive/v1-README.md).
