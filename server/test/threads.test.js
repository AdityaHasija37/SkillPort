import { describe, expect, it } from "vitest";

import { api, createCourse, signUp } from "./helpers.js";

describe("discussion threads", () => {
  it("lets enrolled learners and the instructor discuss; others can only read", async () => {
    const maya = await signUp("instructor");
    const course = await createCourse(maya);
    const learner = await signUp();
    const outsider = await signUp();
    await api().post(`/api/courses/${course.id}/enroll`).set(learner.auth).expect(201);

    const post = { title: "Where does state live?", body: "How do you decide?" };
    await api().post(`/api/courses/${course.id}/threads`).set(outsider.auth).send(post).expect(403);
    const created = await api().post(`/api/courses/${course.id}/threads`).set(learner.auth).send(post).expect(201);
    const threadId = created.body.thread.id;

    await api().post(`/api/threads/${threadId}/replies`).set(outsider.auth).send({ body: "me too" }).expect(403);
    const replied = await api().post(`/api/threads/${threadId}/replies`).set(maya.auth).send({ body: "Closest shared parent." }).expect(201);
    expect(replied.body.thread.replies[0].author.isInstructor).toBe(true);

    const list = await api().get(`/api/courses/${course.id}/threads`).expect(200);
    expect(list.body.items[0]).toMatchObject({ title: post.title, replyCount: 1 });

    const read = await api().get(`/api/threads/${threadId}`).expect(200);
    expect(read.body.thread.replies).toHaveLength(1);
  });

  it("lets the author or the instructor remove a thread", async () => {
    const maya = await signUp("instructor");
    const course = await createCourse(maya);
    const [a, b] = [await signUp(), await signUp()];
    for (const u of [a, b]) await api().post(`/api/courses/${course.id}/enroll`).set(u.auth).expect(201);

    const t1 = (await api().post(`/api/courses/${course.id}/threads`).set(a.auth).send({ title: "First one", body: "x" })).body.thread.id;
    const t2 = (await api().post(`/api/courses/${course.id}/threads`).set(a.auth).send({ title: "Second one", body: "y" })).body.thread.id;

    await api().delete(`/api/threads/${t1}`).set(b.auth).expect(403);
    await api().delete(`/api/threads/${t1}`).set(a.auth).expect(204);
    await api().delete(`/api/threads/${t2}`).set(maya.auth).expect(204);
  });
});
