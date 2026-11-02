import cors from "cors";
import express from "express";
import helmet from "helmet";

import { config } from "./config.js";
import { errorHandler, notFound } from "./middleware/errors.js";
import authRoutes from "./routes/auth.js";
import courseRoutes from "./routes/courses.js";
import instructorRoutes from "./routes/instructor.js";
import meRoutes from "./routes/me.js";
import threadRoutes from "./routes/threads.js";
import userRoutes from "./routes/users.js";

export function createApp() {
  const app = express();

  app.disable("x-powered-by");
  app.use(helmet());
  app.use(cors({ origin: config.clientOrigin }));
  app.use(express.json({ limit: "200kb" }));

  app.get("/api/health", (_req, res) => res.json({ status: "ok" }));

  app.use("/api/auth", authRoutes);
  app.use("/api/me", meRoutes);
  app.use("/api/users", userRoutes);
  app.use("/api/courses", courseRoutes);
  app.use("/api/threads", threadRoutes);
  app.use("/api/instructor", instructorRoutes);

  app.use(notFound);
  app.use(errorHandler);
  return app;
}
