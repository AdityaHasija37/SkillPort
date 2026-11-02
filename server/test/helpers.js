import request from "supertest";

import { createApp } from "../src/app.js";

export const app = createApp();
export const api = () => request(app);

let n = 0;
export async function signUp(role = "learner", overrides = {}) {
  n += 1;
  const body = {
    name: `Person ${n}`,
    username: `person_${n}`,
    email: `person${n}@example.test`,
    password: "correct-horse-battery",
    role,
    ...overrides,
  };
  const res = await api().post("/api/auth/register").send(body).expect(201);
  return { token: res.body.token, user: res.body.user, auth: { Authorization: `Bearer ${res.body.token}` } };
}

export const sampleCourse = (overrides = {}) => ({
  title: "Intro to Testing",
  summary: "Write tests that catch real bugs and survive refactors.",
  description: "A practical introduction to automated testing for web developers.",
  category: "Programming",
  level: "Beginner",
  tags: ["testing"],
  lessons: [
    { title: "Why test", content: "Confidence to change code.", durationMinutes: 10 },
    { title: "Your first test", content: "Arrange, act, assert.", durationMinutes: 15 },
  ],
  status: "published",
  ...overrides,
});

export async function createCourse(instructor, overrides) {
  const res = await api().post("/api/courses").set(instructor.auth).send(sampleCourse(overrides)).expect(201);
  return res.body.course;
}
