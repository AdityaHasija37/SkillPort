# Product brief

## Problem

People who are good at something (a senior engineer, an analyst, a designer) often want to teach it, but the options are heavy: build an audience on a big marketplace, or cobble together slides, a shared drive and a group chat. Learners face the mirror image: short, practical courses from practitioners are scattered, there's no single place to track how far you've got, and questions get lost in comment sections.

## Who it's for

- **Learners** who want short, practical courses and a clear sense of progress, and who learn better when they can ask questions.
- **Instructors**: practitioners who want to publish a small course quickly and see whether people are actually getting through it.

## What SkillPort does

One place to find a course, enroll, work through it lesson by lesson and discuss it, with a dashboard on each side:

1. **Discover.** A catalog with search, category, level and sort. Anyone can see a course's outline before enrolling.
2. **Learn.** Enroll for free, read lessons, mark them complete, and resume from the next unfinished lesson. A certificate when you finish.
3. **Discuss.** Each course has threads where enrolled learners and the instructor talk. Instructor replies are labelled.
4. **Teach.** Write a course as a list of lessons, keep it in draft until it's ready, then publish.
5. **See what's working.** Per course: learners, average progress, completions, threads; per learner: progress and last activity.

## Scope decisions for v2

| In | Out (for now) | Why |
| --- | --- | --- |
| Free enrollment | Payments | v1's payment flow never worked; validating that people finish courses comes before charging for them |
| Text lessons with simple formatting | Video and file uploads | Needs storage and hosting; text keeps courses quick to write |
| Threads with replies | Real-time chat, notifications | Async threads fit course questions; notifications are the next step |
| Two roles (learner, instructor) | Admin moderation tools | Instructors can remove threads in their own courses |

## Success measures

If this were live, these are the numbers I'd watch, with the one that matters most first:

- **Lesson completion rate**: share of enrolled learners who finish at least half the course. The core signal that courses are useful.
- **Time to first lesson**: how quickly a new enrollment opens lesson 1.
- **Questions answered**: share of threads with an instructor reply within two days.
- **Instructor activation**: share of instructor sign-ups who publish a course within a week.

The instructor dashboard already surfaces the inputs for the first and third (average progress, completions, threads).
