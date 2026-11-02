import { Link, useParams } from "react-router-dom";

import { Avatar, Empty, ErrorNote, Loading, ProgressBar } from "../components/ui.jsx";
import { api } from "../lib/api.js";
import { ago } from "../lib/format.js";
import { useAsync } from "../lib/useAsync.js";

export default function Learners() {
  const { id } = useParams();
  const { data, error, loading, reload } = useAsync(() => api.learners(id), [id]);

  if (loading && !data) return <Loading label="Loading learners" />;
  if (error) return <div className="container page"><ErrorNote error={error} onRetry={reload} /></div>;

  return (
    <div className="container page">
      <p className="crumbs"><Link to="/teach">Teaching</Link> <span aria-hidden>/</span> {data.course.title}</p>
      <h1 className="h2">Learners</h1>
      {data.items.length === 0 ? (
        <Empty title="Nobody has enrolled yet.">Share the course link: <Link to={`/courses/${data.course.slug}`}>/courses/{data.course.slug}</Link></Empty>
      ) : (
        <div className="table-wrap card">
          <table className="table">
            <thead>
              <tr>
                <th scope="col">Learner</th>
                <th scope="col">Progress</th>
                <th scope="col">Enrolled</th>
                <th scope="col">Last active</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((e) => (
                <tr key={e.id}>
                  <td>
                    <span className="person"><Avatar name={e.learner.name} size={30} /> <Link to={`/u/${e.learner.username}`}>{e.learner.name}</Link></span>
                  </td>
                  <td data-label="Progress">{e.completedAt ? <strong>Completed</strong> : <ProgressBar value={e.progress} label={`${e.learner.name} progress`} size="sm" />}</td>
                  <td data-label="Enrolled">{ago(e.enrolledAt)}</td>
                  <td data-label="Last active">{ago(e.lastAccessedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
