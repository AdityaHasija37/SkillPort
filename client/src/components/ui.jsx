import { Link } from "react-router-dom";

import { initials } from "../lib/format.js";

export function Logo() {
  return (
    <Link to="/" className="logo" aria-label="SkillPort home">
      <span className="logo-mark" aria-hidden>
        <span>S</span>
        <span className="logo-p">P</span>
      </span>
      <span className="logo-word">
        SKILL<span className="logo-p">PORT</span>
      </span>
    </Link>
  );
}

export function ProgressBar({ value, label = "Progress", size = "md" }) {
  const pct = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div className={`progress progress-${size}`}>
      <div className="progress-track" role="progressbar" aria-label={label} aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
        <div className="progress-fill" style={{ width: `${pct}%` }} />
      </div>
      <span className="progress-value">{pct}%</span>
    </div>
  );
}

export function Avatar({ name, size = 36 }) {
  return (
    <span className="avatar" style={{ width: size, height: size, fontSize: size * 0.38 }} aria-hidden>
      {initials(name)}
    </span>
  );
}

export function Badge({ children, tone = "default" }) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}

export function Loading({ label = "Loading" }) {
  return (
    <div className="loading" role="status">
      <span className="spinner" aria-hidden />
      <span>{label}…</span>
    </div>
  );
}

export function ErrorNote({ error, onRetry }) {
  if (!error) return null;
  return (
    <div className="note note-error" role="alert">
      <span>{error.message ?? String(error)}</span>
      {onRetry && (
        <button type="button" className="btn btn-ghost btn-sm" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
}

export function Empty({ title, children, action }) {
  return (
    <div className="empty">
      <p className="empty-title">{title}</p>
      {children && <p className="muted">{children}</p>}
      {action}
    </div>
  );
}

export function Field({ label, name, error, hint, as = "input", children, ...props }) {
  const Tag = as;
  const id = props.id ?? `f-${name}`;
  const describedBy = [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(" ") || undefined;
  return (
    <div className={`field ${error ? "field-invalid" : ""}`}>
      <label htmlFor={id}>{label}</label>
      {hint && (
        <p id={`${id}-hint`} className="field-hint">
          {hint}
        </p>
      )}
      <Tag id={id} name={name} aria-invalid={Boolean(error)} aria-describedby={describedBy} {...props}>
        {children}
      </Tag>
      {error && (
        <p id={`${id}-error`} className="field-error">
          {error}
        </p>
      )}
    </div>
  );
}

/** Lesson text: blank lines start a new paragraph, `backticks` become inline code. */
export function RichText({ text }) {
  return (
    <div className="prose">
      {text.split(/\n{2,}/).map((para, i) => (
        <p key={i}>
          {para.split(/(`[^`]+`)/).map((part, j) => (part.startsWith("`") && part.endsWith("`") ? <code key={j}>{part.slice(1, -1)}</code> : part))}
        </p>
      ))}
    </div>
  );
}
