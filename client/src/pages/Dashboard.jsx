import { Link } from "react-router-dom";

import { Empty, ErrorNote, Loading, ProgressBar } from "../components/ui.jsx";
import { api } from "../lib/api.js";
import { useAuth } from "../lib/auth.jsx";
import { ago } from "../lib/format.js";
import { useAsync } from "../lib/useAsync.js";

export default function Dashboard() {
  const { user } = useAuth();
  const { data, error, loading, reload } = useAsync(() => api.myEnrollments(), []);
  const items = data?.items ?? [];
  const inProgress = items.filter((e) => !e.completedAt);
  const completed = items.filter((e) => e.completedAt);

  return (
    <div className="container page">
      <div className="section-head">
        <div>
          <p className="eyebrow">My learning</p>
          <h1 className="h2">Hi {user.name.split(" ")[0]}, welcome back.</h1>
        </div>
        {user.role === "instructor" && <Link to="/teach" className="btn btn-ghost">Go to teaching</Link>}
      </div>

      <ErrorNote error={error} onRetry={reload} />
      {loading && !data && <Loading label="Loading your courses" />}

      {data && items.length === 0 && (
        <Empty title="You haven't enrolled in anything yet." action={<Link to="/" className="btn btn-primary">Find a course</Link>}>
          Every course is free. Pick one and your progress will show up here.
        </Empty>
      )}

      {data && items.length > 0 && (
        <div className="stats">
          <div className="stat"><span className="stat-value">{items.length}</span><span className="stat-label">Enrolled</span></div>
          <div className="stat"><span className="stat-value">{inProgress.length}</span><span className="stat-label">In progress</span></div>
          <div className="stat"><span className="stat-value">{completed.length}</span><span className="stat-label">Completed</span></div>
        </div>
      )}

      {inProgress.length > 0 && (
        <section aria-labelledby="continue">
          <h2 id="continue" className="h3">Continue learning</h2>
          <div className="grid grid-2">
            {inProgress.map((e) => (
              <article key={e.id} className="card learning-card">
                <p className="small muted">{e.course.category} · {e.course.instructor.name}</p>
                <h3 className="h4"><Link to={`/courses/${e.course.slug}`}>{e.course.title}</Link></h3>
                <ProgressBar value={e.progress} label={`${e.course.title} progress`} />
                <p className="small muted">Last opened {ago(e.lastAccessedAt)}</p>
                {e.nextLesson && (
                  <Link to={`/courses/${e.course.slug}/lessons/${e.nextLesson.id}`} className="btn btn-primary btn-sm">
                    Next: {e.nextLesson.title}
                  </Link>
                )}
              </article>
            ))}
          </div>
        </section>
      )}

      {completed.length > 0 && (
        <section aria-labelledby="completed">
          <h2 id="completed" className="h3">Completed</h2>
          <ul className="simple-list">
            {completed.map((e) => (
              <li key={e.id} className="card simple-row">
                <span className="lesson-num is-done" aria-hidden>✓</span>
                <Link to={`/courses/${e.course.slug}`}>{e.course.title}</Link>
                <span className="muted small">Finished {ago(e.completedAt)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
