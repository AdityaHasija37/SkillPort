const TOKEN_KEY = "skillport.token";

export const tokenStore = {
  get: () => {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  set: (token) => {
    try {
      if (token) localStorage.setItem(TOKEN_KEY, token);
      else localStorage.removeItem(TOKEN_KEY);
    } catch {
      /* storage unavailable (private mode); the session just won't persist */
    }
  },
};

export class ApiError extends Error {
  constructor(status, body) {
    super(body?.error ?? `Request failed (${status})`);
    this.status = status;
    this.details = body?.details ?? [];
  }

  /** Field errors as { field: message }, for forms. */
  get fieldErrors() {
    return Object.fromEntries(this.details.map((d) => [d.field, d.message]));
  }
}

const BASE = import.meta.env.VITE_API_URL ?? "/api";

export async function request(path, { method = "GET", body, raw = false } = {}) {
  const headers = {};
  const token = tokenStore.get();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers["Content-Type"] = "application/json";

  let res;
  try {
    res = await fetch(`${BASE}${path}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  } catch {
    throw new ApiError(0, { error: "Can't reach SkillPort. Check that the API is running." });
  }

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    if (res.status === 401) window.dispatchEvent(new Event("skillport:unauthorized"));
    throw new ApiError(res.status, data);
  }
  if (raw) return res;
  if (res.status === 204) return null;
  return res.json();
}

const qs = (params) => {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== "" && v !== null);
  return entries.length ? `?${new URLSearchParams(entries)}` : "";
};

export const api = {
  register: (data) => request("/auth/register", { method: "POST", body: data }),
  login: (data) => request("/auth/login", { method: "POST", body: data }),
  me: () => request("/me"),
  updateProfile: (data) => request("/me", { method: "PATCH", body: data }),
  myEnrollments: () => request("/me/enrollments"),
  profile: (username) => request(`/users/${encodeURIComponent(username)}`),

  courses: (params = {}) => request(`/courses${qs(params)}`),
  course: (idOrSlug) => request(`/courses/${encodeURIComponent(idOrSlug)}`),
  createCourse: (data) => request("/courses", { method: "POST", body: data }),
  updateCourse: (id, data) => request(`/courses/${id}`, { method: "PATCH", body: data }),
  deleteCourse: (id) => request(`/courses/${id}`, { method: "DELETE" }),
  enroll: (id) => request(`/courses/${id}/enroll`, { method: "POST" }),
  unenroll: (id) => request(`/courses/${id}/enroll`, { method: "DELETE" }),
  setLessonDone: (id, lessonId, done) =>
    request(`/courses/${id}/lessons/${lessonId}/complete`, { method: done ? "POST" : "DELETE" }),
  certificate: (id) => request(`/courses/${id}/certificate`, { raw: true }),

  threads: (courseId) => request(`/courses/${courseId}/threads`),
  createThread: (courseId, data) => request(`/courses/${courseId}/threads`, { method: "POST", body: data }),
  thread: (id) => request(`/threads/${id}`),
  reply: (id, data) => request(`/threads/${id}/replies`, { method: "POST", body: data }),
  deleteThread: (id) => request(`/threads/${id}`, { method: "DELETE" }),

  teaching: () => request("/instructor/courses"),
  learners: (courseId) => request(`/instructor/courses/${courseId}/learners`),
};

export const CATEGORIES = ["Programming", "Design", "Data", "Business", "Product", "Languages", "Other"];
export const LEVELS = ["Beginner", "Intermediate", "Advanced"];
