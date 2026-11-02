import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { ErrorNote, Field, Loading } from "../components/ui.jsx";
import { api, CATEGORIES, LEVELS } from "../lib/api.js";
import { minutes } from "../lib/format.js";

const blankLesson = () => ({ key: crypto.randomUUID(), title: "", content: "", durationMinutes: 10 });

const EMPTY = { title: "", summary: "", description: "", category: "Programming", level: "Beginner", tags: "", lessons: [blankLesson()] };

export default function CourseEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [values, setValues] = useState(id ? null : EMPTY);
  const [status, setStatus] = useState("draft");
  const [slug, setSlug] = useState(null);
  const [errors, setErrors] = useState({});
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!id) return;
    api
      .course(id)
      .then(({ course }) => {
        setStatus(course.status);
        setSlug(course.slug);
        setValues({
          ...course,
          tags: course.tags.join(", "),
          lessons: course.lessons.map((l) => ({ ...l, key: l.id })),
        });
      })
      .catch(setError);
  }, [id]);

  if (!values) return error ? <div className="container page"><ErrorNote error={error} /></div> : <Loading label="Loading course" />;

  const set = (name) => (e) => setValues((v) => ({ ...v, [name]: e.target.value }));
  const setLesson = (i, name, value) => setValues((v) => ({ ...v, lessons: v.lessons.map((l, j) => (j === i ? { ...l, [name]: value } : l)) }));
  const moveLesson = (i, dir) =>
    setValues((v) => {
      const lessons = [...v.lessons];
      [lessons[i], lessons[i + dir]] = [lessons[i + dir], lessons[i]];
      return { ...v, lessons };
    });
  const removeLesson = (i) => setValues((v) => ({ ...v, lessons: v.lessons.filter((_, j) => j !== i) }));
  const total = values.lessons.reduce((s, l) => s + (Number(l.durationMinutes) || 0), 0);

  async function save(nextStatus) {
    setBusy(true);
    setErrors({});
    setError(null);
    const payload = {
      title: values.title,
      summary: values.summary,
      description: values.description,
      category: values.category,
      level: values.level,
      tags: values.tags.split(",").map((t) => t.trim()).filter(Boolean),
      lessons: values.lessons.map(({ id: lessonId, title, content, durationMinutes }) => ({ ...(lessonId && { id: lessonId }), title, content, durationMinutes: Number(durationMinutes) })),
      status: nextStatus,
    };
    try {
      const { course } = id ? await api.updateCourse(id, payload) : await api.createCourse(payload);
      navigate(nextStatus === "published" ? `/courses/${course.slug}` : "/teach");
    } catch (err) {
      setErrors(err.fieldErrors ?? {});
      setError(err.details?.length ? new Error("Some fields need attention. Check the highlighted fields below.") : err);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!window.confirm("Delete this course? Enrollments and discussions will be deleted too.")) return;
    await api.deleteCourse(id);
    navigate("/teach");
  }

  return (
    <div className="container page narrow">
      <p className="crumbs">
        <Link to="/teach">Teaching</Link> <span aria-hidden>/</span> {id ? "Edit course" : "New course"}
      </p>
      <h1 className="h2">{id ? values.title || "Edit course" : "Create a course"}</h1>
      <ErrorNote error={error} />

      <form noValidate onSubmit={(e) => e.preventDefault()}>
        <section className="card form-card">
          <h2 className="h4">Basics</h2>
          <Field label="Title" name="title" value={values.title} onChange={set("title")} error={errors.title} />
          <Field label="Summary" name="summary" hint="One sentence shown on the course card (10–200 characters)" value={values.summary} onChange={set("summary")} error={errors.summary} />
          <Field label="Description" name="description" as="textarea" rows={5} hint="Who it's for, what they'll be able to do, and what they need to know first" value={values.description} onChange={set("description")} error={errors.description} />
          <div className="row-3">
            <Field label="Category" name="category" as="select" value={values.category} onChange={set("category")} error={errors.category}>
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </Field>
            <Field label="Level" name="level" as="select" value={values.level} onChange={set("level")} error={errors.level}>
              {LEVELS.map((l) => <option key={l}>{l}</option>)}
            </Field>
            <Field label="Tags" name="tags" hint="Comma separated" value={values.tags} onChange={set("tags")} error={errors.tags} />
          </div>
        </section>

        <section className="card form-card">
          <div className="section-head">
            <h2 className="h4">Lessons</h2>
            <span className="muted small">{values.lessons.length} lessons · {minutes(total)}</span>
          </div>
          {errors.lessons && <p className="field-error">{errors.lessons}</p>}
          <ol className="lesson-editor">
            {values.lessons.map((l, i) => (
              <li key={l.key} className="lesson-edit">
                <div className="lesson-edit-head">
                  <span className="lesson-num" aria-hidden>{i + 1}</span>
                  <span className="sr-only">Lesson {i + 1}</span>
                  <div className="row-actions">
                    <button type="button" className="btn btn-ghost btn-sm" disabled={i === 0} onClick={() => moveLesson(i, -1)} aria-label={`Move lesson ${i + 1} up`}>↑</button>
                    <button type="button" className="btn btn-ghost btn-sm" disabled={i === values.lessons.length - 1} onClick={() => moveLesson(i, 1)} aria-label={`Move lesson ${i + 1} down`}>↓</button>
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => removeLesson(i)} aria-label={`Remove lesson ${i + 1}`}>Remove</button>
                  </div>
                </div>
                <div className="row-lesson">
                  <Field label="Lesson title" name={`lesson-${i}-title`} value={l.title} onChange={(e) => setLesson(i, "title", e.target.value)} error={errors[`lessons.${i}.title`]} />
                  <Field label="Minutes" name={`lesson-${i}-minutes`} type="number" min={1} max={600} value={l.durationMinutes} onChange={(e) => setLesson(i, "durationMinutes", e.target.value)} error={errors[`lessons.${i}.durationMinutes`]} />
                </div>
                <Field label="Content" name={`lesson-${i}-content`} as="textarea" rows={5} hint="Leave a blank line between paragraphs. Wrap code in `backticks`." value={l.content} onChange={(e) => setLesson(i, "content", e.target.value)} error={errors[`lessons.${i}.content`]} />
              </li>
            ))}
          </ol>
          <button type="button" className="btn btn-ghost" onClick={() => setValues((v) => ({ ...v, lessons: [...v.lessons, blankLesson()] }))}>
            + Add lesson
          </button>
        </section>

        <div className="editor-bar">
          {id && <button type="button" className="btn btn-danger" onClick={remove} disabled={busy}>Delete course</button>}
          <span className="nav-spacer" />
          {slug && status === "published" && <Link to={`/courses/${slug}`} className="btn btn-ghost">View</Link>}
          <button type="button" className="btn btn-ghost" disabled={busy} onClick={() => save("draft")}>{status === "published" ? "Unpublish" : "Save draft"}</button>
          <button type="button" className="btn btn-primary" disabled={busy} onClick={() => save("published")}>{status === "published" ? "Save changes" : "Publish"}</button>
        </div>
      </form>
    </div>
  );
}
