// Consistent JSON for the API: `id` instead of `_id`, no `__v`.
export function toJSONPlugin(schema) {
  schema.set("toJSON", {
    virtuals: true,
    versionKey: false,
    transform(_doc, ret) {
      ret.id = ret._id?.toString();
      delete ret._id;
      return ret;
    },
  });
}
