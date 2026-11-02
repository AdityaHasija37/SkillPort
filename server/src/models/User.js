import bcrypt from "bcryptjs";
import mongoose from "mongoose";

export const ROLES = ["learner", "instructor"];

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    username: { type: String, required: true, unique: true, lowercase: true, trim: true, match: /^[a-z0-9_]{3,24}$/ },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ROLES, default: "learner" },
    headline: { type: String, trim: true, maxlength: 120, default: "" },
    bio: { type: String, trim: true, maxlength: 1000, default: "" },
  },
  { timestamps: true },
);

userSchema.methods.setPassword = async function setPassword(password) {
  this.passwordHash = await bcrypt.hash(password, 12);
};

userSchema.methods.checkPassword = function checkPassword(password) {
  return bcrypt.compare(password, this.passwordHash);
};

/** The fields anyone may see about another user. */
userSchema.methods.toPublic = function toPublic() {
  const { id, name, username, role, headline, bio, createdAt } = this;
  return { id, name, username, role, headline, bio, createdAt };
};

// Same shape as the shared plugin, and the password hash never leaves the server.
userSchema.set("toJSON", {
  virtuals: true,
  versionKey: false,
  transform(_doc, ret) {
    ret.id = ret._id?.toString();
    delete ret._id;
    delete ret.passwordHash;
    return ret;
  },
});

export const User = mongoose.model("User", userSchema);
