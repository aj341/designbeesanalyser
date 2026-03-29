import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import { existsSync } from "node:fs";
import path from "node:path";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

const frontendDistDir =
  process.env["WEB_DIST_DIR"] ??
  path.resolve(process.cwd(), "..", "website-analyser", "dist", "public");
const frontendIndexPath = path.join(frontendDistDir, "index.html");

if (existsSync(frontendIndexPath)) {
  app.use(express.static(frontendDistDir));
  app.get(/^(?!\/api(?:\/|$)).*/, (_req, res) => {
    res.sendFile(frontendIndexPath);
  });
  logger.info({ frontendDistDir }, "Serving built frontend assets");
} else {
  logger.info({ frontendDistDir }, "Frontend build not found; running in API-only mode");
}

export default app;
