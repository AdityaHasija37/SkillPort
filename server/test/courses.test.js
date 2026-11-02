import { describe, expect, it } from "vitest";

import { api, createCourse, sampleCourse, signUp } from "./helpers.js";

describe("courses", () => {
  it("only instructors can create courses", async () => {
    const learner = await signUp("learner");
    await api().post("/api/courses").set(learner.auth).send(sampleCourse()).expect(403);
    await api().post("/api/courses").send(sampleCourse()).expect(401);
  });

  it("creates a course with a unique slug and computed totals", async () => {
    const maya = await signUp("instructor");
    const a = await createCourse(maya);
    const b = await createCourse(maya);
    expect(a.slug).toBe("intro-to-testing");
    expect(b.slug).toBe("intro-to-testing-2");
    expect(a.lessonCount).toBe(2);
    expect(a.totalMinutes).toBe(25);
  });

  it("won't publish a course without lessons", async () => {
    const maya = await signUp("instructor");
    await api().post("/api/courses").set(maya.auth).send(sampleCourse({ lessons: [] })).expect(400);
  });

  it("hides drafts from everyone but their instructor", async () => {
    const maya = await signUp("instructor");
    const other = await signUp("instructor");
    const draft = await createCourse(maya, { status: "draft", title: "Secret draft" });

    const catalog = await api().get("/api/courses").expect(200);
    expect(catalog.body.items).toHaveLength(0);
    await api().get(`/api/courses/${draft.id}`).expect(404);
    await api().get(`/api/courses/${draft.id}`).set(other.auth).expect(404);
    await api().get(`/api/courses/${draft.slug}`).set(maya.auth).expect(200);
  });

  it("searches and filters the catalog", async () => {
    const maya = await signUp("instructor");
    await createCourse(maya, { title: "SQL basics", category: "Data", tags: ["sql"] });
    await createCourse(maya, { title: "Figma for beginners", category: "Design", level: "Beginner" });
    await createCourse(maya, { title: "Advanced SQL", category: "Data", level: "Advanced" });

    const sql = await api().get("/api/courses?q=sql").expect(200);
    expect(sql.body.items.map((c) => c.title).sort()).toEqual(["Advanced SQL", "SQL basics"]);

    const advancedData = await api().get("/api/courses?category=Data&level=Advanced").expect(200);
    expect(advancedData.body.items.map((c) => c.title)).toEqual(["Advanced SQL"]);

    const paged = await api().get("/api/courses?limit=2&page=2&sort=title").expect(200);
    expect(paged.body).toMatchObject({ total: 3, page: 2, pages: 2 });
    expect(paged.body.items).toHaveLength(1);

    await api().get("/api/courses?level=Expert").expect(400);
  });

  it("sorts by popularity using enrollment counts", async () => {
    const maya = await signUp("instructor");
    const quiet = await createCourse(maya, { title: "Quiet course" });
    const busy = await createCourse(maya, { title: "Busy course" });
    for (let i = 0; i < 2; i += 1) {
      const learner = await signUp();
      await api().post(`/api/courses/${busy.id}/enroll`).set(learner.auth).expect(201);
    }
    const res = await api().get("/api/courses?sort=popular").expect(200);
    expect(res.body.items.map((c) => c.id)).toEqual([busy.id, quiet.id]);
    expect(res.body.items[0].enrollmentCount).toBe(2);
  });

  it("shows lesson content only to enrolled learners and the instructor", async () => {
    const maya = await signUp("instructor");
    const course = await createCourse(maya);
    const learner = await signUp();

    const outline = await api().get(`/api/courses/${course.id}`).set(learner.auth).expect(200);
    expect(outline.body.course.lessons[0].content).toBeUndefined();

    await api().post(`/api/courses/${course.id}/enroll`).set(learner.auth).expect(201);
    const full = await api().get(`/api/courses/${course.id}`).set(learner.auth).expect(200);
    expect(full.body.course.lessons[0].content).toBe("Confidence to change code.");
  });

  it("lets only the owner edit or delete, and keeps lesson ids on edit", async () => {
    const maya = await signUp("instructor");
    const rohan = await signUp("instructor");
    const course = await createCourse(maya);

    await api().patch(`/api/courses/${course.id}`).set(rohan.auth).send({ title: "Hijacked" }).expect(403);

    const [first, second] = course.lessons;
    const edited = await api()
      .patch(`/api/courses/${course.id}`)
      .set(maya.auth)
      .send({ title: "Testing, properly", lessons: [{ ...second, content: "Updated" }, { title: "New lesson", content: "x", durationMinutes: 5 }] })
      .expect(200);
    expect(edited.body.course.slug).toBe("testing-properly");
    expect(edited.body.course.lessons[0].id).toBe(second.id);
    expect(edited.body.course.lessons.map((l) => l.id)).not.toContain(first.id);

    await api().delete(`/api/courses/${course.id}`).set(rohan.auth).expect(403);
    await api().delete(`/api/courses/${course.id}`).set(maya.auth).expect(204);
    await api().get(`/api/courses/${course.id}`).expect(404);
  });

  it("returns 404 for malformed ids instead of crashing", async () => {
    await api().get("/api/courses/not-a-real-course").expect(404);
    await api().get("/api/threads/123").expect(404);
  });
});
