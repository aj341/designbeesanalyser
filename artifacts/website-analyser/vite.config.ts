import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig(({ mode }) => {
  const workspaceRoot = path.resolve(import.meta.dirname, "..", "..");
  const env = loadEnv(mode, workspaceRoot, "");

  const rawPort = env.VITE_PORT ?? "5173";
  const port = Number(rawPort);
  const portNumber = Number.isNaN(port) || port <= 0 ? 5173 : port;
  const basePath = env.BASE_PATH ?? "/";
  const apiProxyTarget = env.VITE_API_PROXY_TARGET ?? "http://localhost:3000";

  return {
    base: basePath,
    envDir: workspaceRoot,
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        "@": path.resolve(import.meta.dirname, "src"),
        "@assets": path.resolve(
          import.meta.dirname,
          "..",
          "..",
          "attached_assets",
        ),
      },
      dedupe: ["react", "react-dom"],
    },
    root: path.resolve(import.meta.dirname),
    build: {
      outDir: path.resolve(import.meta.dirname, "dist/public"),
      emptyOutDir: true,
    },
    server: {
      port: portNumber,
      host: "0.0.0.0",
      allowedHosts: true,
      proxy: {
        "/api": {
          target: apiProxyTarget,
          changeOrigin: true,
        },
      },
      fs: {
        strict: true,
        deny: ["**/.*"],
      },
    },
    preview: {
      port: portNumber,
      host: "0.0.0.0",
      allowedHosts: true,
    },
  };
});
