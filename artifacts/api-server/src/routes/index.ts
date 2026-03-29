import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import analysesRouter from "./analyses/index.js";
import { createReadStream, existsSync } from "fs";
import { join } from "path";
import { type Request, type Response } from "express";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/analyses", analysesRouter);

router.get("/screenshots/:filename", (req: Request, res: Response) => {
  const filename = String(req.params.filename);

  if (!/^[a-zA-Z0-9_\-]+\.png$/.test(filename)) {
    res.status(400).json({ error: "Invalid filename" });
    return;
  }

  const filePath = join(process.cwd(), "screenshots", filename);

  if (!existsSync(filePath)) {
    res.status(404).json({ error: "Screenshot not found" });
    return;
  }

  res.setHeader("Content-Type", "image/png");
  res.setHeader("Cache-Control", "public, max-age=86400");
  createReadStream(filePath).pipe(res);
});

export default router;
