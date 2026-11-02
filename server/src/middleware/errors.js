import mongoose from "mongoose";
import { ZodError } from "zod";

import { HttpError } from "../lib/http-error.js";

export function notFound(req, res) {
  res.status(404).json({ error: `No route for ${req.method} ${req.path}` });
}

// Express 5 forwards rejected promises here, so route handlers can simply throw.
export function errorHandler(err, _req, res, _next) {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: err.message, ...(err.details && { details: err.details }) });
  }
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: "Some fields need attention",
      details: err.issues.map((i) => ({ field: i.path.join("."), message: i.message })),
    });
  }
  if (err instanceof mongoose.Error.CastError) {
    return res.status(404).json({ error: "Resource not found" });
  }
  if (err?.code === 11000) {
    const field = Object.keys(err.keyPattern ?? {})[0] ?? "value";
    return res.status(409).json({ error: `That ${field} is already taken` });
  }
  if (err?.type === "entity.parse.failed") {
    return res.status(400).json({ error: "Request body is not valid JSON" });
  }
  console.error(err);
  res.status(500).json({ error: "Something went wrong on our side" });
}
