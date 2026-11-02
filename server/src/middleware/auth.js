import jwt from "jsonwebtoken";

import { config } from "../config.js";
import { forbidden, unauthorized } from "../lib/http-error.js";
import { User } from "../models/User.js";

export function signToken(user) {
  return jwt.sign({ sub: user.id, role: user.role }, config.jwtSecret, { expiresIn: config.jwtExpiresIn });
}

async function userFromRequest(req) {
  const header = req.get("authorization") ?? "";
  const [scheme, token] = header.split(" ");
  if (scheme !== "Bearer" || !token) return null;
  let payload;
  try {
    payload = jwt.verify(token, config.jwtSecret);
  } catch {
    throw unauthorized("Your session has expired, please sign in again");
  }
  // Load the user so role changes and deleted accounts take effect immediately.
  const user = await User.findById(payload.sub);
  if (!user) throw unauthorized();
  return user;
}

export async function requireAuth(req, _res, next) {
  const user = await userFromRequest(req);
  if (!user) throw unauthorized();
  req.user = user;
  next();
}

export async function optionalAuth(req, _res, next) {
  req.user = await userFromRequest(req);
  next();
}

export const requireRole =
  (...roles) =>
  (req, _res, next) => {
    if (!roles.includes(req.user?.role)) throw forbidden(`This needs a ${roles.join(" or ")} account`);
    next();
  };
