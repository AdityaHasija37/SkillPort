import { Link, useParams } from "react-router-dom";

import { Avatar, Badge, ErrorNote, Loading } from "../components/ui.jsx";
import { api } from "../lib/api.js";
import { plural } from "../lib/format.js";
import { useAsync } from "../lib/useAsync.js";

export default function PublicProfile() {
  const { username } = useParams();
  const { data, error, loading } = useAsync(() => api.profile(username), [username]);

  if (loading && !data) return <Loading />;
  if (error) return <div className="container page"><ErrorNote error={error} /></div>;
  const { user, courses } = data;

  return (
    <div className="container page narrow">
      <div className="profile-head">
        <Avatar name={user.name} size={72} />
        <div>
          <h1 className="h2">{user.name}</h1>
          <p className="muted">@{user.username} · {user.role === "instructor" ? "Instructor" : "Learner"}</p>
          {user.headline && <p>{user.headline}</p>}
        </div>
      </div>
      {user.bio && <p className="lead-text">{user.bio}</p>}
      {courses.length > 0 && (
        <section>
          <h2 className="h3">Teaches</h2>
          <ul className="simple-list">
            {courses.map((c) => (
              <li key={c.id} className="card simple-row">
                <Link to={`/courses/${c.slug}`} className="strong">{c.title}</Link>
                <span className="small muted">{c.summary}</span>
                <span className="row-meta"><Badge tone="blue">{c.category}</Badge><Badge>{c.level}</Badge><span className="small muted">{plural(c.lessonCount, "lesson")}</span></span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
