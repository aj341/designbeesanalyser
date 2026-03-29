import fs from "node:fs";
import path from "node:path";

const workspaceRoot = path.resolve(import.meta.dirname, "..");
const userAgent = process.env.npm_config_user_agent ?? "";

for (const fileName of ["package-lock.json", "yarn.lock"]) {
  const filePath = path.join(workspaceRoot, fileName);
  if (fs.existsSync(filePath)) {
    fs.rmSync(filePath, { force: true });
  }
}

if (!userAgent.startsWith("pnpm/")) {
  console.error("Use pnpm instead.");
  process.exit(1);
}
