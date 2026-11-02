# Decisions

Short records of the choices behind v2, so the trade-offs are visible.

### 1. Rebuild rather than patch v1
v1 had syntax errors, unreachable routes and a client that didn't compile, and its data model (students embedded in courses) didn't support the features it promised. Patching would have meant rewriting most files anyway, so v2 is a rebuild that keeps the idea, the stack and the git history.

### 2. Keep MERN, modernise the tooling
The project is a MERN portfolio piece, so the stack stays: React, Express, MongoDB, JWT. The tooling moves to current defaults: Vite (Create React App is deprecated), Express 5 for native async error handling, and Zod for validation the client can display.

### 3. Enrollments as a separate collection; progress derived
This makes the learner dashboard and the instructor stats cheap queries, gives a unique (user, course) index, and keeps progress correct when lessons are added or removed. See [ARCHITECTURE.md](ARCHITECTURE.md).

### 4. Free courses; payments removed
The Razorpay flow in v1 was never wired in. Charging only makes sense once people finish courses, so v2 measures that first. Stripe-based paid courses are the top roadmap item.

### 5. Outline public, content gated
Anyone can see what a course covers (titles and durations) to decide whether to enroll, but lesson text goes only to enrolled learners and the instructor. This is enforced in the API response, not just hidden in the UI.

### 6. Drafts return 404 to others
Unpublished courses respond exactly like missing ones, so draft titles and slugs can't be discovered by guessing ids.

### 7. Discussions open to read, gated to post
Reading threads helps people decide whether to enroll. Posting is limited to enrolled learners and the instructor, which keeps threads on topic without needing moderation tools yet.

### 8. Tokens in localStorage
This is simple and enough for a portfolio app with no third-party scripts. A production version would move to httpOnly cookies with CSRF protection.

### 9. No UI framework
A single stylesheet with tokens keeps the bundle small (about 67 kB gzipped JS) and the look specific to SkillPort, with light and dark themes.

### 10. Repo-only, no hosted demo (yet)
Hosting needs a managed MongoDB. The app runs locally with one `npm run dev` and seeded demo data. Hosting it means an Atlas cluster plus an API host; nothing in the code needs to change.
