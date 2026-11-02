import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    setupFiles: ["./test/setup.js"],
    // One in-memory MongoDB per test file; files run one at a time to keep startup cheap.
    fileParallelism: false,
    testTimeout: 20000,
    hookTimeout: 60000,
  },
});
