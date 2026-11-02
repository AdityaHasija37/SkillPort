import { describe, expect, it } from "vitest";

import { seed } from "../src/seed.js";
import { api } from "./helpers.js";

describe("demo seed", () => {
  it("produces a working demo: published catalog, sign-in and a learner dashboard", async () => {
    await seed();
    const catalog = await api().get("/api/courses").expect(200);
    expect(catalog.body.total).toBe(5); // the sixth course is a draft

    const login = await api().post("/api/auth/login").send({ email: "priya@skillport.dev", password: "skillport-demo" }).expect(200);
    const mine = await api().get("/api/me/enrollments").set({ Authorization: `Bearer ${login.body.token}` }).expect(200);
    expect(mine.body.items).toHaveLength(3);
    expect(mine.body.items.find((e) => e.course.title.startsWith("Writing a Product Spec")).progress).toBe(100);
  });
});
