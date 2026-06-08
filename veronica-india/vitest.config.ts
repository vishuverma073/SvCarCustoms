import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
    plugins: [tsconfigPaths()],
    test: {
        globals: true,
        environment: "node",
        coverage: {
            provider: "v8",
            reporter: ["text", "text-summary"],
            include: ["src/lib/**", "src/app/api/**"],
            exclude: ["src/db/**", "**/*.d.ts"],
        },
    },
});
