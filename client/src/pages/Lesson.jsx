import { useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";

import { ErrorNote, Loading, ProgressBar, RichText } from "../components/ui.jsx";
import { api } from "../lib/api.js";
import { minutes } from "../lib/format.js";
import { useAsync } from "../lib/useAsync.js";
import { downloadCertificate } from "./CourseDetail.jsx";

export default function Lesson() {
  const { slug, lessonId } = useParams();
  const { data, error, loading, reload, setData } = useAsync(() => api.course(slug), [slug]);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState(null);

  if (loading && !data) return <Loading label="Loading lesson" />;
  if (error) return <div className="container page"><ErrorNote error={error} onRetry={reload} /></div>;

  const course = data.course;
  const enrollment = course.viewer.enrollment;
  if (!enrollment && !course.viewer.isOwner) return <Navigate to={`/courses/${slug}`} replace />;

  const index = course.lessons.findIndex((l) => l.id === lessonId);
  if (index === -1) return <Navigate to={`/courses/${slug}`} replace />;
  const lesson = course.lessons[index];
  const prev = course.lessons[index - 1];
  const next = course.lessons[index + 1];
  const done = new Set(enrollment?.completedLessonIds ?? []);
  const isDone = done.has(lesson.id);

  async function toggle() {
    setBusy(true);
    setActionError(null);
    try {
      const res = await api.setLessonDone(course.id, lesson.id, !isDone);
      setData((d) => ({ course: { ...d.course, viewer: { ...d.course.viewer, enrollment: res.enrollment } } }));
    } catch (err) {
      setActionError(err);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="container page lesson-layout">
      <aside className="lesson-nav" aria-label="Lessons in this course">
        <Link to={`/courses/${slug}`} className="small">← {course.title}</Link>
        {enrollment && <ProgressBar value={enrollment.progress} label="Course progress" size="sm" />}
        <ol>
          {course.lessons.map((l, i) => (
            <li key={l.id}>
              <Link to={`/courses/${slug}/lessons/${l.id}`} className={`lesson-nav-link ${l.id === lesson.id ? "is-current" : ""}`} aria-current={l.id === lesson.id ? "page" : undefined}>
                <span className={`lesson-num ${done.has(l.id) ? "is-done" : ""}`} aria-hidden>{done.has(l.id) ? "✓" : i + 1}</span>
                <span>{l.title}</span>
              </Link>
            </li>
          ))}
        </ol>
      </aside>

      <article className="lesson-body">
        <p className="eyebrow">Lesson {index + 1} of {course.lessons.length} · {minutes(lesson.durationMinutes)}</p>
        <h1>{lesson.title}</h1>
        <RichText text={lesson.content} />

        <ErrorNote error={actionError} />
        <div className="lesson-actions">
          {enrollment && (
            <button type="button" className={`btn ${isDone ? "btn-ghost" : "btn-primary"}`} disabled={busy} onClick={toggle} aria-pressed={isDone}>
              {isDone ? "✓ Completed · undo" : "Mark as complete"}
            </button>
          )}
          {enrollment?.completedAt && (
            <button type="button" className="btn btn-ghost" onClick={() => downloadCertificate(course).catch(setActionError)}>
              Download certificate
            </button>
          )}
        </div>

        <nav className="lesson-pager" aria-label="Lesson navigation">
          {prev ? <Link to={`/courses/${slug}/lessons/${prev.id}`} className="btn btn-ghost">← {prev.title}</Link> : <span />}
          {next ? <Link to={`/courses/${slug}/lessons/${next.id}`} className="btn btn-ghost">{next.title} →</Link> : <Link to={`/courses/${slug}`} className="btn btn-ghost">Back to course</Link>}
        </nav>
      </article>
    </div>
  );
}
