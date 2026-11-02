import { Link } from "react-router-dom";

import { Badge, Empty, ErrorNote, Loading, ProgressBar } from "../components/ui.jsx";
import { api } from "../lib/api.js";
import { ago, plural } from "../lib/format.js";
import { useAsync } from "../lib/useAsync.js";

export default function Teach() {
  const { data, error, loading, reload } = useAsync(() => api.teaching(), []);

  return (
    <div className="container page">
      <div className="section-head">
        <div>
          <p className="eyebrow">Teaching</p>
          <h1 className="h2">Your courses</h1>
        </div>
        <Link to="/teach/new" className="btn btn-primary">New course</Link>
      </div>

      <ErrorNote error={error} onRetry={reload} />
      {loading && !data && <Loading label="Loading your courses" />}

      {data && data.items.length === 0 && (
        <Empty title="You haven't created a course yet." action={<Link to="/teach/new" className="btn btn-primary">Create your first course</Link>}>
          Start with a title and one lesson. You can save it as a draft and publish when it's ready.
        </Empty>
      )}

      {data && data.items.length > 0 && (
        <>
          <div className="stats">
            <div className="stat"><span className="stat-value">{data.totals.courses}</span><span className="stat-label">Courses</span></div>
            <div className="stat"><span className="stat-value">{data.totals.learners}</span><span className="stat-label">Learners</span></div>
            <div className="stat"><span className="stat-value">{data.totals.completions}</span><span className="stat-label">Completions</span></div>
          </div>

          <div className="table-wrap card">
            <table className="table">
              <thead>
                <tr>
                  <th scope="col">Course</th>
                  <th scope="col">Learners</th>
                  <th scope="col">Avg. progress</th>
                  <th scope="col">Completed</th>
                  <th scope="col">Threads</th>
                  <th scope="col"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <Link to={`/courses/${c.slug}`} className="strong">{c.title}</Link>
                      <div className="small muted row-meta">
                        {c.status === "draft" ? <Badge tone="warn">Draft</Badge> : <Badge tone="ok">Published</Badge>}
                        <span>{plural(c.lessonCount, "lesson")}</span>
                        <span>updated {ago(c.updatedAt)}</span>
                      </div>
                    </td>
                    <td data-label="Learners">{c.stats.learners}</td>
                    <td data-label="Avg. progress"><ProgressBar value={c.stats.averageProgress} label={`${c.title} average progress`} size="sm" /></td>
                    <td data-label="Completed">{c.stats.completions}</td>
                    <td data-label="Threads">{c.stats.threads}</td>
                    <td>
                      <div className="row-actions">
                        <Link to={`/teach/${c.id}/learners`} className="btn btn-ghost btn-sm">Learners</Link>
                        <Link to={`/teach/${c.id}/edit`} className="btn btn-ghost btn-sm">Edit</Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
