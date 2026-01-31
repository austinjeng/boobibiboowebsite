import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  test: {
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/test/**/*.test.ts"],
    coverage: {
      provider: "v8",
      include: ["src/lib/**", "src/app/api/**"],
      exclude: ["src/test/**"],
      thresholds: {
        statements: 70,
        branches: 70,
        functions: 70,
        lines: 70,
      },
    },
  },
});
