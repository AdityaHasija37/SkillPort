import { describe, expect, it } from "vitest";

import { api, signUp } from "./helpers.js";

describe("auth", () => {
  it("registers, signs in and returns the current user without the password hash", async () => {
    const { auth, user } = await signUp("instructor", { email: "maya@example.test" });
    expect(user.role).toBe("instructor");
    expect(user.passwordHash).toBeUndefined();

    const login = await api().post("/api/auth/login").send({ email: "MAYA@example.test", password: "correct-horse-battery" }).expect(200);
    expect(login.body.token).toBeTruthy();

    const me = await api().get("/api/me").set(auth).expect(200);
    expect(me.body.user.email).toBe("maya@example.test");
  });

  it("rejects duplicate emails and usernames", async () => {
    await signUp("learner", { email: "a@example.test", username: "taken" });
    await api()
      .post("/api/auth/register")
      .send({ name: "B", username: "other", email: "a@example.test", password: "long-enough-pw" })
      .expect(409);
    await api()
      .post("/api/auth/register")
      .send({ name: "B", username: "taken", email: "b@example.test", password: "long-enough-pw" })
      .expect(409);
  });

  it("validates input with field-level messages", async () => {
    const res = await api().post("/api/auth/register").send({ name: "", username: "x", email: "nope", password: "short" }).expect(400);
    expect(res.body.details.map((d) => d.field).sort()).toEqual(["email", "name", "password", "username"]);
  });

  it("gives the same error for unknown email and wrong password", async () => {
    await signUp("learner", { email: "real@example.test" });
    const wrong = await api().post("/api/auth/login").send({ email: "real@example.test", password: "nope-nope" }).expect(401);
    const unknown = await api().post("/api/auth/login").send({ email: "ghost@example.test", password: "nope-nope" }).expect(401);
    expect(wrong.body.error).toBe(unknown.body.error);
  });

  it("rejects missing and tampered tokens", async () => {
    await api().get("/api/me").expect(401);
    await api().get("/api/me").set({ Authorization: "Bearer not-a-token" }).expect(401);
  });

  it("updates the profile", async () => {
    const { auth } = await signUp();
    const res = await api().patch("/api/me").set(auth).send({ headline: "Learning SQL", bio: "Hi!" }).expect(200);
    expect(res.body.user.headline).toBe("Learning SQL");
  });
});
