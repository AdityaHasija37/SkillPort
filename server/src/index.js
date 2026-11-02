import { createApp } from "./app.js";
import { config } from "./config.js";
import { connect } from "./db.js";

await connect(config.mongoUri);
const app = createApp();
app.listen(config.port, () => {
  console.log(`SkillPort API listening on http://localhost:${config.port}`);
});
