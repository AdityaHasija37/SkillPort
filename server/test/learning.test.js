import { describe, expect, it } from "vitest";

import { api, createCourse, signUp } from "./helpers.js";

async function setup() {
  const maya = await signUp("instructor", { name: "Maya Chen" });
  const course = await createCourse(maya);
  const learner = await signUp("learner", { name: "Priya Nair" });
  return { maya, course, learner };
}

describe("enrollment and progress", () => {
  it("enrolls once, and not in your own course", async () => {
    const { maya, course, learner } = await setup();
    await api().post(`/api/courses/${course.id}/enroll`).set(learner.auth).expect(201);
    await api().post(`/api/courses/${course.id}/enroll`).set(learner.auth).expect(409);
    await api().post(`/api/courses/${course.id}/enroll`).set(maya.auth).expect(400);
  });

  it("tracks progress per lesson, completes the course and issues a certificate", async () => {
    const { course, learner } = await setup();
    await api().post(`/api/courses/${course.id}/enroll`).set(learner.auth).expect(201);
    const [one, two] = course.lessons;

    const half = await api().post(`/api/courses/${course.id}/lessons/${one.id}/complete`).set(learner.auth).expect(200);
    expect(half.body.enrollment).toMatchObject({ progress: 50, completedAt: null });

    // Marking the same lesson twice doesn't double count.
    await api().post(`/api/courses/${course.id}/lessons/${one.id}/complete`).set(learner.auth).expect(200);
    await api().get(`/api/courses/${course.id}/certificate`).set(learner.auth).expect(403);

    const done = await api().post(`/api/courses/${course.id}/lessons/${two.id}/complete`).set(learner.auth).expect(200);
    expect(done.body.enrollment.progress).toBe(100);
    expect(done.body.enrollment.completedAt).toBeTruthy();

    const pdf = await api().get(`/api/courses/${course.id}/certificate`).set(learner.auth).buffer(true).parse((res, cb) => {
      const chunks = [];
      res.on("data", (c) => chunks.push(c));
      res.on("end", () => cb(null, Buffer.concat(chunks)));
    }).expect(200);
    expect(pdf.headers["content-type"]).toBe("application/pdf");
    expect(pdf.body.subarray(0, 4).toString()).toBe("%PDF");

    const undone = await api().delete(`/api/courses/${course.id}/lessons/${two.id}/complete`).set(learner.auth).expect(200);
    expect(undone.body.enrollment).toMatchObject({ progress: 50, completedAt: null });
  });

  it("requires enrollment to track progress", async () => {
    const { course, learner } = await setup();
    await api().post(`/api/courses/${course.id}/lessons/${course.lessons[0].id}/complete`).set(learner.auth).expect(403);
  });

  it("lists my enrollments with progress and the next lesson", async () => {
    const { course, learner } = await setup();
    await api().post(`/api/courses/${course.id}/enroll`).set(learner.auth).expect(201);
    await api().post(`/api/courses/${course.id}/lessons/${course.lessons[0].id}/complete`).set(learner.auth).expect(200);

    const res = await api().get("/api/me/enrollments").set(learner.auth).expect(200);
    expect(res.body.items).toHaveLength(1);
    expect(res.body.items[0]).toMatchObject({ progress: 50, nextLesson: { title: "Your first test" }, course: { title: "Intro to Testing" } });
  });

  it("unenrolls", async () => {
    const { course, learner } = await setup();
    await api().post(`/api/courses/${course.id}/enroll`).set(learner.auth).expect(201);
    await api().delete(`/api/courses/${course.id}/enroll`).set(learner.auth).expect(204);
    await api().delete(`/api/courses/${course.id}/enroll`).set(learner.auth).expect(404);
  });
});

describe("instructor dashboard", () => {
  it("summarises learners, completions and average progress per course", async () => {
    const { maya, course, learner } = await setup();
    const other = await signUp();
    await api().post(`/api/courses/${course.id}/enroll`).set(learner.auth).expect(201);
    await api().post(`/api/courses/${course.id}/enroll`).set(other.auth).expect(201);
    for (const l of course.lessons) {
      await api().post(`/api/courses/${course.id}/lessons/${l.id}/complete`).set(learner.auth).expect(200);
    }
    await createCourse(maya, { status: "draft", title: "Work in progress" });

    const res = await api().get("/api/instructor/courses").set(maya.auth).expect(200);
    expect(res.body.totals).toEqual({ courses: 2, learners: 2, completions: 1 });
    const stats = res.body.items.find((c) => c.id === course.id).stats;
    expect(stats).toMatchObject({ learners: 2, completions: 1, averageProgress: 50 });

    const learners = await api().get(`/api/instructor/courses/${course.id}/learners`).set(maya.auth).expect(200);
    expect(learners.body.items.map((i) => i.progress).sort()).toEqual([0, 100]);
  });

  it("is for instructors, and only for their own courses", async () => {
    const { course, learner } = await setup();
    const rohan = await signUp("instructor");
    await api().get("/api/instructor/courses").set(learner.auth).expect(403);
    await api().get(`/api/instructor/courses/${course.id}/learners`).set(rohan.auth).expect(403);
  });
});
