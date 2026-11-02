import { useState } from "react";
import { Link } from "react-router-dom";

import { ErrorNote, Field } from "../components/ui.jsx";
import { api } from "../lib/api.js";
import { useAuth } from "../lib/auth.jsx";

export default function Profile() {
  const { user, setUser } = useAuth();
  const [values, setValues] = useState({ name: user.name, headline: user.headline ?? "", bio: user.bio ?? "" });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(false);
  const bind = (name) => ({ name, value: values[name], error: errors[name], onChange: (e) => { setSaved(false); setValues({ ...values, [name]: e.target.value }); } });

  async function submit(e) {
    e.preventDefault();
    setErrors({});
    setError(null);
    try {
      const res = await api.updateProfile(values);
      setUser(res.user);
      setSaved(true);
    } catch (err) {
      setErrors(err.fieldErrors);
      if (!err.details.length) setError(err);
    }
  }

  return (
    <div className="container page narrow">
      <div className="section-head">
        <h1 className="h2">Your profile</h1>
        <Link to={`/u/${user.username}`} className="btn btn-ghost btn-sm">View public profile</Link>
      </div>
      <form className="card form-card" onSubmit={submit} noValidate>
        <ErrorNote error={error} />
        <Field label="Name" {...bind("name")} />
        <Field label="Headline" hint="One line, e.g. what you do or what you're learning" {...bind("headline")} />
        <Field label="About you" as="textarea" rows={5} {...bind("bio")} />
        <p className="small muted">Signed in as {user.email} · @{user.username} · {user.role}</p>
        <div className="row-actions">
          {saved && <span className="ok-text" role="status">Saved</span>}
          <button type="submit" className="btn btn-primary">Save profile</button>
        </div>
      </form>
    </div>
  );
}
