import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { Avatar, Badge, ErrorNote, Field, Loading } from "../components/ui.jsx";
import { api } from "../lib/api.js";
import { useAuth } from "../lib/auth.jsx";
import { ago } from "../lib/format.js";
import { useAsync } from "../lib/useAsync.js";

function Post({ author, body, createdAt }) {
  return (
    <div className="post">
      <Avatar name={author?.name ?? "?"} />
      <div>
        <p className="post-meta">
          <strong>{author?.name ?? "Former member"}</strong>
          {author?.isInstructor && <Badge tone="blue">Instructor</Badge>}
          <span className="muted small">{ago(createdAt)}</span>
        </p>
        <p className="post-body">{body}</p>
      </div>
    </div>
  );
}

export default function ThreadPage() {
  const { slug, threadId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data, error, loading, reload, setData } = useAsync(() => Promise.all([api.thread(threadId), api.course(slug)]), [threadId, slug, user?.id]);
  const [reply, setReply] = useState("");
  const [replyError, setReplyError] = useState(null);
  const [busy, setBusy] = useState(false);

  if (loading && !data) return <Loading label="Loading thread" />;
  if (error) return <div className="container page"><ErrorNote error={error} onRetry={reload} /></div>;

  const [{ thread }, { course }] = data;
  const canPost = Boolean(course.viewer.enrollment) || course.viewer.isOwner;
  const canDelete = user && (thread.author?.id === user.id || course.viewer.isOwner);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setReplyError(null);
    try {
      const res = await api.reply(thread.id, { body: reply });
      setData(([, c]) => [res, c]);
      setReply("");
    } catch (err) {
      setReplyError(err.details?.length ? new Error(err.fieldErrors.body) : err);
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!window.confirm("Remove this thread and all its replies?")) return;
    await api.deleteThread(thread.id);
    navigate(`/courses/${slug}`);
  }

  return (
    <div className="container page narrow">
      <p className="crumbs">
        <Link to={`/courses/${slug}`}>{course.title}</Link> <span aria-hidden>/</span> Discussion
      </p>
      <div className="section-head">
        <h1 className="h2">{thread.title}</h1>
        {canDelete && <button type="button" className="btn btn-ghost btn-sm" onClick={remove}>Remove thread</button>}
      </div>
      <div className="card">
        <Post author={thread.author} body={thread.body} createdAt={thread.createdAt} />
      </div>

      <h2 className="h3 replies-title">{thread.replies.length ? `${thread.replies.length} ${thread.replies.length === 1 ? "reply" : "replies"}` : "No replies yet"}</h2>
      <ul className="replies">
        {thread.replies.map((r) => (
          <li key={r.id} className="card">
            <Post {...r} />
          </li>
        ))}
      </ul>

      {canPost ? (
        <form className="card reply-form" onSubmit={submit} noValidate>
          <Field label="Your reply" name="body" as="textarea" rows={3} value={reply} error={replyError?.message} onChange={(e) => setReply(e.target.value)} />
          <button type="submit" className="btn btn-primary" disabled={busy || !reply.trim()}>{busy ? "Posting…" : "Post reply"}</button>
        </form>
      ) : (
        <p className="note">
          {user ? "Enroll in the course to reply." : <><Link to="/login" state={{ from: `/courses/${slug}/discussion/${threadId}` }}>Sign in</Link> and enroll to reply.</>}
        </p>
      )}
    </div>
  );
}
