// Resets the database to a small, realistic demo: two instructors, three learners, six courses,
// enrollments at different stages and a few discussion threads. Run with `npm run seed`.
import { config } from "./config.js";
import { connect, disconnect } from "./db.js";
import { slugify } from "./lib/slug.js";
import { Course } from "./models/Course.js";
import { Enrollment } from "./models/Enrollment.js";
import { Thread } from "./models/Thread.js";
import { User } from "./models/User.js";

export const DEMO_PASSWORD = "skillport-demo";

const people = [
  { name: "Maya Chen", username: "maya", email: "maya@skillport.dev", role: "instructor", headline: "Frontend engineer · teaches React and accessibility", bio: "I've shipped design systems at two startups and love turning confusing UI code into something a team can reason about." },
  { name: "Rohan Mehta", username: "rohan", email: "rohan@skillport.dev", role: "instructor", headline: "Data analyst · SQL, spreadsheets and storytelling", bio: "Ten years of turning messy exports into decisions. I teach the 20% of SQL you'll use every day." },
  { name: "Priya Nair", username: "priya", email: "priya@skillport.dev", role: "learner", headline: "Career switcher, ops to product", bio: "" },
  { name: "Sam Okafor", username: "sam", email: "sam@skillport.dev", role: "learner", headline: "CS sophomore", bio: "" },
  { name: "Lena Fischer", username: "lena", email: "lena@skillport.dev", role: "learner", headline: "Marketing lead learning to code", bio: "" },
];

const lesson = (title, durationMinutes, content) => ({ title, durationMinutes, content });

const courses = [
  {
    instructor: "maya",
    title: "React Fundamentals: Components to Hooks",
    summary: "Build a real app while learning components, props, state, effects and when not to use them.",
    description:
      "A hands-on introduction to modern React. We build a small reading-list app from scratch, one concept per lesson, and finish with a refactor that uses custom hooks. You should be comfortable with basic JavaScript (arrays, objects, functions).",
    category: "Programming",
    level: "Beginner",
    tags: ["react", "javascript", "hooks"],
    lessons: [
      lesson("Thinking in components", 18, "Break a screen into a component tree. Decide what each piece owns.\n\nExercise: sketch the reading-list app and label every component."),
      lesson("Props and composition", 22, "Pass data down with props. Use `children` to build flexible layout components instead of prop explosions."),
      lesson("State with useState", 25, "Local state, updater functions and why you should never mutate state directly."),
      lesson("Effects without footguns", 30, "What `useEffect` is for (syncing with the outside world) and the common cases where you don't need it."),
      lesson("Custom hooks", 20, "Extract `useLocalStorage` and `useFetch` so components read like a description of the UI."),
    ],
  },
  {
    instructor: "maya",
    title: "Accessible Forms That People Can Finish",
    summary: "Labels, errors, focus and keyboard support: the form patterns that work for everyone.",
    description:
      "Most form problems are accessibility problems. This short course covers the patterns that make forms usable with a keyboard, a screen reader or a shaky hand on a phone, with before/after examples you can copy.",
    category: "Design",
    level: "Intermediate",
    tags: ["accessibility", "forms", "ux"],
    lessons: [
      lesson("Labels and instructions", 15, "Every input needs a programmatic label. Placeholders are not labels."),
      lesson("Errors people can recover from", 20, "Say what went wrong and how to fix it, next to the field, and move focus sensibly."),
      lesson("Keyboard and focus", 18, "Tab order, visible focus and not trapping people inside custom widgets."),
    ],
  },
  {
    instructor: "rohan",
    title: "SQL for Everyday Analysis",
    summary: "SELECT, JOIN, GROUP BY and window functions on a real sales dataset.",
    description:
      "Learn the SQL that answers 90% of business questions. Every lesson starts from a question a manager actually asked, then builds the query step by step.",
    category: "Data",
    level: "Beginner",
    tags: ["sql", "analytics"],
    lessons: [
      lesson("Asking a table a question", 20, "SELECT, WHERE and ORDER BY. Reading a schema before you write a query."),
      lesson("Joining tables", 28, "INNER vs LEFT joins, and how to spot a join that silently duplicates rows."),
      lesson("Grouping and aggregates", 25, "GROUP BY, HAVING, and the difference between counting rows and counting customers."),
      lesson("Window functions", 32, "Running totals, rankings and month-over-month change without self-joins."),
    ],
  },
  {
    instructor: "rohan",
    title: "Dashboards Stakeholders Actually Read",
    summary: "Pick the metric, cut the clutter and write the headline before you build the chart.",
    description:
      "A practical course on reporting: choosing the few numbers that matter, designing a one-screen dashboard and writing the summary that goes with it.",
    category: "Business",
    level: "Intermediate",
    tags: ["dashboards", "metrics", "communication"],
    lessons: [
      lesson("Start from the decision", 16, "Who reads this, and what will they do differently after reading it?"),
      lesson("Choosing the right chart", 22, "Bars for comparison, lines for change over time, tables when people need exact numbers."),
      lesson("The written summary", 14, "Three sentences: what happened, why, and what we should do."),
    ],
  },
  {
    instructor: "maya",
    title: "Writing a Product Spec Engineers Love",
    summary: "Problem, users, scope and success metrics on two pages, with a template.",
    description:
      "A short, opinionated guide to writing specs that get read: lead with the problem, be explicit about what's out of scope, and define success before anyone writes code.",
    category: "Product",
    level: "Beginner",
    tags: ["product", "writing", "specs"],
    lessons: [
      lesson("The problem statement", 12, "Who has the problem, how often, and what it costs them today."),
      lesson("Scope and non-goals", 15, "Writing down what you won't build saves more time than anything else in the doc."),
      lesson("Success metrics", 18, "One primary metric, a couple of guardrails, and how you'll measure them."),
    ],
  },
  {
    instructor: "rohan",
    title: "Spreadsheet Modelling Basics",
    summary: "Build a clean, auditable model: inputs, calculations and outputs on separate sheets.",
    description: "Draft: lessons coming soon.",
    category: "Business",
    level: "Beginner",
    tags: ["spreadsheets", "modelling"],
    status: "draft",
    lessons: [lesson("Structure before formulas", 15, "Inputs, calculations, outputs. Colour-code inputs so nobody overwrites a formula.")],
  },
];

export async function seed() {
  await Promise.all([User.deleteMany({}), Course.deleteMany({}), Enrollment.deleteMany({}), Thread.deleteMany({})]);

  const users = {};
  for (const p of people) {
    const user = new User(p);
    await user.setPassword(DEMO_PASSWORD);
    users[p.username] = await user.save();
  }

  const day = 24 * 60 * 60 * 1000;
  const created = {};
  for (const [i, c] of courses.entries()) {
    const status = c.status ?? "published";
    created[c.title] = await Course.create({
      ...c,
      status,
      slug: slugify(c.title),
      instructor: users[c.instructor]._id,
      publishedAt: status === "published" ? new Date(Date.now() - (30 - i * 4) * day) : undefined,
    });
  }

  const enroll = async (username, title, lessonsDone, daysAgo) => {
    const course = created[title];
    const completedLessons = course.lessons.slice(0, lessonsDone).map((l) => l._id);
    return Enrollment.create({
      user: users[username]._id,
      course: course._id,
      completedLessons,
      completedAt: lessonsDone === course.lessons.length ? new Date(Date.now() - daysAgo * day) : undefined,
      lastAccessedAt: new Date(Date.now() - daysAgo * day),
    });
  };

  const react = "React Fundamentals: Components to Hooks";
  const sql = "SQL for Everyday Analysis";
  const forms = "Accessible Forms That People Can Finish";
  const spec = "Writing a Product Spec Engineers Love";
  const dash = "Dashboards Stakeholders Actually Read";

  await enroll("priya", react, 2, 1);
  await enroll("priya", spec, 3, 4);
  await enroll("priya", sql, 1, 6);
  await enroll("sam", react, 5, 2);
  await enroll("sam", sql, 4, 3);
  await enroll("lena", react, 1, 5);
  await enroll("lena", forms, 2, 2);
  await enroll("lena", dash, 0, 7);

  const thread = (title, username, subject, body, replies = []) =>
    Thread.create({
      course: created[title]._id,
      author: users[username]._id,
      title: subject,
      body,
      replies: replies.map(([who, text]) => ({ author: users[who]._id, body: text })),
      lastActivityAt: new Date(),
    });

  await thread(react, "priya", "When should state live in the parent?", "In lesson 3 the filter state moved up to the list. How do you decide where state belongs before you start?", [
    ["maya", "Put it in the closest component that every reader of that state shares. Start low and lift it when a sibling needs it."],
    ["sam", "This clicked for me when I drew the tree from lesson 1 and circled who reads what."],
  ]);
  await thread(react, "lena", "useEffect running twice?", "My fetch runs twice in development. Is something wrong with my code?", [
    ["maya", "That's React's Strict Mode checking your effect cleans up after itself. It only happens in development."],
  ]);
  await thread(sql, "sam", "LEFT JOIN returning more rows than the left table", "I joined orders to payments and now have more rows than orders. Why?", [
    ["rohan", "One order has several payments, so each order repeats once per payment. Aggregate payments first, then join."],
  ]);

  return { users, courses: created };
}

// Run directly: `node src/seed.js`
if (import.meta.url === `file://${process.argv[1]}`) {
  await connect(config.mongoUri);
  await seed();
  console.log(`Seeded ${people.length} people and ${courses.length} courses. Every demo account uses the password "${DEMO_PASSWORD}".`);
  await disconnect();
}
