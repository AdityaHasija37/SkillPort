import mongoose from "mongoose";

import { toJSONPlugin } from "./plugins.js";

const replySchema = new mongoose.Schema(
  {
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    body: { type: String, required: true, trim: true, maxlength: 4000 },
  },
  { timestamps: true },
);
replySchema.plugin(toJSONPlugin);

const threadSchema = new mongoose.Schema(
  {
    course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true, index: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true, trim: true, maxlength: 140 },
    body: { type: String, required: true, trim: true, maxlength: 8000 },
    replies: { type: [replySchema], default: [] },
    lastActivityAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true },
);

threadSchema.virtual("replyCount").get(function replyCount() {
  return (this.replies ?? []).length;
});

threadSchema.plugin(toJSONPlugin);

export const Thread = mongoose.model("Thread", threadSchema);
