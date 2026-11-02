import { Router } from "express";
import rateLimit from "express-rate-limit";

import { config } from "../config.js";
import { conflict, unauthorized } from "../lib/http-error.js";
import { loginSchema, registerSchema } from "../lib/schemas.js";
import { signToken } from "../middleware/auth.js";
import { User } from "../models/User.js";

const router = Router();

// Slow down password guessing; off in tests so suites can sign in freely.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  skip: () => config.isTest,
  message: { error: "Too many attempts. Try again in a few minutes." },
});

router.post("/register", authLimiter, async (req, res) => {
  const { password, ...fields } = registerSchema.parse(req.body);
  if (await User.exists({ email: fields.email })) throw conflict("An account with that email already exists");
  if (await User.exists({ username: fields.username })) throw conflict("That username is taken");

  const user = new User(fields);
  await user.setPassword(password);
  await user.save();
  res.status(201).json({ token: signToken(user), user });
});

router.post("/login", authLimiter, async (req, res) => {
  const { email, password } = loginSchema.parse(req.body);
  const user = await User.findOne({ email }).select("+passwordHash");
  // Same message for unknown email and wrong password, so accounts can't be probed.
  if (!user || !(await user.checkPassword(password))) throw unauthorized("Email or password is incorrect");
  res.json({ token: signToken(user), user });
});

export default router;
