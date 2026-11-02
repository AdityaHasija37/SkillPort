import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from "react-router-dom";

import { ErrorNote, Field } from "../components/ui.jsx";
import { useAuth } from "../lib/auth.jsx";

function useForm(initial) {
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState({});
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const bind = (name) => ({
    name,
    value: values[name],
    error: errors[name],
    onChange: (e) => setValues((v) => ({ ...v, [name]: e.target.value })),
  });
  async function submit(action) {
    setBusy(true);
    setErrors({});
    setError(null);
    try {
      await action(values);
    } catch (err) {
      setErrors(err.fieldErrors ?? {});
      if (!err.details?.length) setError(err);
    } finally {
      setBusy(false);
    }
  }
  return { values, setValues, bind, submit, error, busy };
}

export function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const form = useForm({ email: "", password: "" });
  if (user) return <Navigate to="/dashboard" replace />;

  return (
    <div className="container page auth">
      <div className="card auth-card">
        <h1>Welcome back</h1>
        <p className="muted">Sign in to pick up where you left off.</p>
        <ErrorNote error={form.error} />
        <form
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            form.submit(async (v) => {
              await login(v);
              navigate(location.state?.from ?? "/dashboard", { replace: true });
            });
          }}
        >
          <Field label="Email" type="email" autoComplete="email" required {...form.bind("email")} />
          <Field label="Password" type="password" autoComplete="current-password" required {...form.bind("password")} />
          <button type="submit" className="btn btn-primary btn-block" disabled={form.busy}>
            {form.busy ? "Signing in…" : "Sign in"}
          </button>
        </form>
        <p className="muted small center">
          New here? <Link to="/register">Create an account</Link>
        </p>
      </div>
    </div>
  );
}

export function Register() {
  const { user, register } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const form = useForm({ name: "", username: "", email: "", password: "", role: params.get("role") === "instructor" ? "instructor" : "learner" });
  if (user) return <Navigate to="/dashboard" replace />;

  const roles = [
    { value: "learner", title: "I want to learn", text: "Enroll in courses, track progress and join discussions." },
    { value: "instructor", title: "I want to teach", text: "Create courses and see how your learners are doing. You can still take courses too." },
  ];

  return (
    <div className="container page auth">
      <div className="card auth-card auth-card-wide">
        <h1>Join SkillPort</h1>
        <p className="muted">Free for learners and instructors.</p>
        <ErrorNote error={form.error} />
        <form
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            form.submit(async (v) => {
              const created = await register(v);
              navigate(created.role === "instructor" ? "/teach" : "/", { replace: true });
            });
          }}
        >
          <fieldset className="role-picker">
            <legend>How will you use SkillPort?</legend>
            {roles.map((r) => (
              <label key={r.value} className={`role-option ${form.values.role === r.value ? "is-selected" : ""}`}>
                <input
                  type="radio"
                  name="role"
                  value={r.value}
                  checked={form.values.role === r.value}
                  onChange={() => form.setValues((v) => ({ ...v, role: r.value }))}
                />
                <span className="role-title">{r.title}</span>
                <span className="muted small">{r.text}</span>
              </label>
            ))}
          </fieldset>
          <div className="row-2">
            <Field label="Full name" autoComplete="name" required {...form.bind("name")} />
            <Field label="Username" autoComplete="username" hint="Letters, numbers or underscores" required {...form.bind("username")} />
          </div>
          <Field label="Email" type="email" autoComplete="email" required {...form.bind("email")} />
          <Field label="Password" type="password" autoComplete="new-password" hint="At least 8 characters" required {...form.bind("password")} />
          <button type="submit" className="btn btn-primary btn-block" disabled={form.busy}>
            {form.busy ? "Creating your account…" : "Create account"}
          </button>
        </form>
        <p className="muted small center">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
