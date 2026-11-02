import { Link } from "react-router-dom";

import { minutes, plural } from "../lib/format.js";
import { Badge } from "./ui.jsx";

export default function CourseCard({ course }) {
  return (
    <article className="card course-card">
      <div className="course-card-top">
        <Badge tone="blue">{course.category}</Badge>
        <Badge>{course.level}</Badge>
      </div>
      <h3 className="course-card-title">
        <Link to={`/courses/${course.slug}`} className="stretched">
          {course.title}
        </Link>
      </h3>
      <p className="muted course-card-summary">{course.summary}</p>
      <p className="course-card-meta">
        <span>{course.instructor?.name}</span>
        <span aria-hidden>·</span>
        <span>{plural(course.lessonCount, "lesson")}</span>
        <span aria-hidden>·</span>
        <span>{minutes(course.totalMinutes)}</span>
      </p>
      <p className="course-card-learners">{plural(course.enrollmentCount ?? 0, "learner")}</p>
    </article>
  );
}
