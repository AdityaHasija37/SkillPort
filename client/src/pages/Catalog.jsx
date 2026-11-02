import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import CourseCard from "../components/CourseCard.jsx";
import { Empty, ErrorNote, Loading } from "../components/ui.jsx";
import { api, CATEGORIES, LEVELS } from "../lib/api.js";
import { useAuth } from "../lib/auth.jsx";
import { plural } from "../lib/format.js";
import { useAsync } from "../lib/useAsync.js";

export default function Catalog() {
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const filters = {
    q: params.get("q") ?? "",
    category: params.get("category") ?? "",
    level: params.get("level") ?? "",
    sort: params.get("sort") ?? "newest",
    page: Number(params.get("page") ?? 1),
  };

  // Debounce typing so every keystroke doesn't hit the API.
  const [query, setQuery] = useState(filters.q);
  useEffect(() => {
    const t = setTimeout(() => {
      if (query !== filters.q) update({ q: query });
    }, 300);
    return () => clearTimeout(t);
  });

  function update(change) {
    const next = { ...filters, page: 1, ...change };
    setParams(
      Object.fromEntries(Object.entries(next).filter(([k, v]) => v && !(k === "sort" && v === "newest") && !(k === "page" && v === 1))),
      { replace: true },
    );
  }

  const { data, error, loading, reload } = useAsync(
    () => api.courses({ ...filters, limit: 9 }),
    [filters.q, filters.category, filters.level, filters.sort, filters.page],
  );
  const filtered = filters.q || filters.category || filters.level;

  return (
    <>
      <section className="hero">
        <div className="container hero-inner">
          <p className="eyebrow">Learn · Share · Grow</p>
          <h1>Learn from people who do the work.</h1>
          <p className="hero-lead">
            Short, practical courses taught by practitioners. Enroll for free, track your progress lesson by lesson, and ask questions in each course's discussion.
          </p>
          <div className="hero-actions">
            <a href="#catalog" className="btn btn-primary">
              Browse courses
            </a>
            <Link to={user?.role === "instructor" ? "/teach/new" : "/register?role=instructor"} className="btn btn-ghost">
              Teach a course
            </Link>
          </div>
        </div>
      </section>

      <section id="catalog" className="container page" aria-labelledby="catalog-title">
        <div className="section-head">
          <h2 id="catalog-title">Courses</h2>
          {data && <p className="muted">{plural(data.total, "course")}</p>}
        </div>

        <form className="filters" role="search" onSubmit={(e) => e.preventDefault()}>
          <label className="sr-only" htmlFor="q">
            Search courses
          </label>
          <input id="q" type="search" placeholder="Search by title, topic or tag" value={query} onChange={(e) => setQuery(e.target.value)} />
          <label className="sr-only" htmlFor="category">
            Category
          </label>
          <select id="category" value={filters.category} onChange={(e) => update({ category: e.target.value })}>
            <option value="">All categories</option>
            {CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
          <label className="sr-only" htmlFor="level">
            Level
          </label>
          <select id="level" value={filters.level} onChange={(e) => update({ level: e.target.value })}>
            <option value="">All levels</option>
            {LEVELS.map((l) => (
              <option key={l}>{l}</option>
            ))}
          </select>
          <label className="sr-only" htmlFor="sort">
            Sort by
          </label>
          <select id="sort" value={filters.sort} onChange={(e) => update({ sort: e.target.value })}>
            <option value="newest">Newest</option>
            <option value="popular">Most learners</option>
            <option value="title">A–Z</option>
          </select>
        </form>

        <ErrorNote error={error} onRetry={reload} />
        {loading && !data && <Loading label="Loading courses" />}
        {data && data.items.length === 0 && (
          <Empty
            title={filtered ? "No courses match those filters." : "No courses yet."}
            action={
              filtered && (
                <button type="button" className="btn btn-ghost" onClick={() => { setQuery(""); setParams({}); }}>
                  Clear filters
                </button>
              )
            }
          />
        )}
        {data && data.items.length > 0 && (
          <>
            <div className={`grid grid-3 ${loading ? "is-stale" : ""}`}>
              {data.items.map((c) => (
                <CourseCard key={c.id} course={c} />
              ))}
            </div>
            {data.pages > 1 && (
              <nav className="pager" aria-label="Pages">
                <button type="button" className="btn btn-ghost btn-sm" disabled={filters.page <= 1} onClick={() => update({ page: filters.page - 1 })}>
                  ← Previous
                </button>
                <span className="muted">
                  Page {data.page} of {data.pages}
                </span>
                <button type="button" className="btn btn-ghost btn-sm" disabled={filters.page >= data.pages} onClick={() => update({ page: filters.page + 1 })}>
                  Next →
                </button>
              </nav>
            )}
          </>
        )}
      </section>
    </>
  );
}
