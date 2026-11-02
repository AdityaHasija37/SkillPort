import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { Avatar, Badge, Empty, ErrorNote, Field, Loading, ProgressBar } from "../components/ui.jsx";
import { api } from "../lib/api.js";
import { useAuth } from "../lib/auth.jsx";
import { ago, minutes, plural } from "../lib/format.js";
import { useAsync } from "../lib/useAsync.js";

export async function downloadCertificate(course) {
  const res = await api.certificate(course.id);
  const url = URL.createObjectURL(await res.blob());
  const a = document.createElement("a");
  a.href = url;
  a.download = `skillport-${course.slug}-certificate.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function CourseDetail() {
  const { slug } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState("lessons");
  const [actionError, setActionError] = useState(null);
  const [busy, setBusy] = useState(false);
  const { data, error, loading, reload, setData } = useAsync(() => api.course(slug), [slug, user?.id]);

  if (loading && !data) return <Loading label="Loading course" />;
  if (error) return <div className="container page"><ErrorNote error={error} onRetry={error.status !== 404 ? reload : undefined} /></div>;

  const course = data.course;
  const enrollment = course.viewer.enrollment;
  const done = new Set(enrollment?.completedLessonIds ?? []);
  const nextLesson = course.lessons.find((l) => !done.has(l.id)) ?? course.lessons[0];

  async function act(fn) {
    setBusy(true);
    setActionError(null);
    try {
      await fn();
    } catch (err) {
      setActionError(err);
    } finally {
      setBusy(false);
    }
  }

  const enroll = () =>
    act(async () => {
      if (!user) return navigate("/login", { state: { from: `/courses/${slug}` } });
      const res = await api.enroll(course.id);
      setData(res);
    });

  return (
    <>
      <section className="course-hero">
        <div className="container course-hero-inner">
          <div>
            <p className="crumbs">
              <Link to="/">Courses</Link> <span aria-hidden>/</span> {course.category}
            </p>
            <h1>{course.title}</h1>
            <p className="hero-lead">{course.summary}</p>
            <div className="course-facts">
              <Badge tone="blue">{course.level}</Badge>
              {course.status === "draft" && <Badge tone="warn">Draft · only you can see this</Badge>}
              <span>{plural(course.lessonCount, "lesson")}</span>
              <span>{minutes(course.totalMinutes)}</span>
              <span>{plural(course.enrollmentCount, "learner")}</span>
            </div>
            <Link to={`/u/${course.instructor.username}`} className="instructor-chip">
              <Avatar name={course.instructor.name} size={40} />
              <span>
                <span className="small muted">Taught by</span>
                <br />
                <strong>{course.instructor.name}</strong>
              </span>
            </Link>
          </div>

          <aside className="card enroll-card" aria-label="Your progress">
            {course.viewer.isOwner ? (
              <>
                <p className="enroll-title">You teach this course</p>
                <div className="stack">
                  <Link to={`/teach/${course.id}/edit`} className="btn btn-primary btn-block">Edit course</Link>
                  <Link to={`/teach/${course.id}/learners`} className="btn btn-ghost btn-block">See learners</Link>
                </div>
              </>
            ) : enrollment ? (
              <>
                <p className="enroll-title">{enrollment.completedAt ? "Course complete 🎉" : "Your progress"}</p>
                <ProgressBar value={enrollment.progress} label="Course progress" size="lg" />
                <p className="muted small">{done.size} of {course.lessonCount} lessons done</p>
                <div className="stack">
                  {enrollment.completedAt ? (
                    <button type="button" className="btn btn-primary btn-block" disabled={busy} onClick={() => act(() => downloadCertificate(course))}>
                      Download certificate
                    </button>
                  ) : (
                    <Link to={`/courses/${slug}/lessons/${nextLesson.id}`} className="btn btn-primary btn-block">
                      {done.size ? "Continue learning" : "Start the first lesson"}
                    </Link>
                  )}
                </div>
              </>
            ) : (
              <>
                <p className="enroll-title">Free course</p>
                <p className="muted small">Enroll to read every lesson, track your progress and join the discussion.</p>
                <button type="button" className="btn btn-primary btn-block" disabled={busy || course.status !== "published"} onClick={enroll}>
                  {user ? "Enroll for free" : "Sign in to enroll"}
                </button>
              </>
            )}
            <ErrorNote error={actionError} />
          </aside>
        </div>
      </section>

      <div className="container page">
        <div className="tabs" role="tablist" aria-label="Course sections">
          {[
            ["lessons", "Lessons"],
            ["about", "About"],
            ["discussion", "Discussion"],
          ].map(([key, label]) => (
            <button key={key} type="button" role="tab" id={`tab-${key}`} aria-selected={tab === key} aria-controls={`panel-${key}`} className="tab" onClick={() => setTab(key)}>
              {label}
            </button>
          ))}
        </div>

        <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`}>
          {tab === "lessons" && (
            <ol className="lesson-list">
              {course.lessons.map((l, i) => {
                const canOpen = Boolean(enrollment) || course.viewer.isOwner;
                const inner = (
                  <>
                    <span className={`lesson-num ${done.has(l.id) ? "is-done" : ""}`} aria-hidden>{done.has(l.id) ? "✓" : i + 1}</span>
                    <span className="lesson-title">{l.title}</span>
                    <span className="muted small">{minutes(l.durationMinutes)}</span>
                    {done.has(l.id) && <span className="sr-only">(completed)</span>}
                  </>
                );
                return (
                  <li key={l.id}>
                    {canOpen ? (
                      <Link to={`/courses/${slug}/lessons/${l.id}`} className="lesson-row">{inner}</Link>
                    ) : (
                      <div className="lesson-row is-locked">{inner}<span className="small muted">Enroll to open</span></div>
                    )}
                  </li>
                );
              })}
            </ol>
          )}

          {tab === "about" && (
            <div className="about-course">
              <p className="lead-text">{course.description}</p>
              {course.tags.length > 0 && (
                <p className="tags">
                  {course.tags.map((t) => (
                    <Badge key={t}>#{t}</Badge>
                  ))}
                </p>
              )}
            </div>
          )}

          {tab === "discussion" && <Discussion course={course} canPost={Boolean(enrollment) || course.viewer.isOwner} />}
        </div>
      </div>
    </>
  );
}

function Discussion({ course, canPost }) {
  const { data, error, loading, reload } = useAsync(() => api.threads(course.id), [course.id]);
  const [form, setForm] = useState({ title: "", body: "" });
  const [errors, setErrors] = useState({});
  const [postError, setPostError] = useState(null);
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  async function submit(e) {
    e.preventDefault();
    setErrors({});
    setPostError(null);
    try {
      const { thread } = await api.createThread(course.id, form);
      navigate(`/courses/${course.slug}/discussion/${thread.id}`);
    } catch (err) {
      setErrors(err.fieldErrors);
      if (!err.details.length) setPostError(err);
    }
  }

  return (
    <div className="discussion">
      <div className="section-head">
        <h2 className="h3">Questions and discussion</h2>
        {canPost && !open && (
          <button type="button" className="btn btn-primary btn-sm" onClick={() => setOpen(true)}>
            Start a thread
          </button>
        )}
      </div>
      {!canPost && <p className="note">Enrolled learners and the instructor can post here. Anyone can read.</p>}

      {open && (
        <form className="card thread-form" onSubmit={submit} noValidate>
          <ErrorNote error={postError} />
          <Field label="Title" name="title" value={form.title} error={errors.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="What's your question?" />
          <Field label="Details" name="body" as="textarea" rows={4} value={form.body} error={errors.body} onChange={(e) => setForm({ ...form, body: e.target.value })} />
          <div className="row-actions">
            <button type="button" className="btn btn-ghost" onClick={() => setOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Post thread</button>
          </div>
        </form>
      )}

      <ErrorNote error={error} onRetry={reload} />
      {loading && !data && <Loading label="Loading discussion" />}
      {data && data.items.length === 0 && <Empty title="No threads yet.">{canPost ? "Ask the first question." : "Be the first to ask once you enroll."}</Empty>}
      {data && data.items.length > 0 && (
        <ul className="thread-list">
          {data.items.map((t) => (
            <li key={t.id} className="card thread-row">
              <Avatar name={t.author?.name ?? "?"} />
              <div>
                <Link to={`/courses/${course.slug}/discussion/${t.id}`} className="thread-title stretched">{t.title}</Link>
                <p className="muted small">{t.excerpt}</p>
                <p className="small muted">
                  {t.author?.name ?? "Former member"} · {ago(t.createdAt)} · {plural(t.replyCount, "reply", "replies")}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
