import type { Express } from "express";
import { createServer } from "http";
import { storage } from "./storage";
import { insertPresentationSchema } from "@shared/schema";

export async function registerRoutes(app: Express) {
  app.get("/api/presentations", async (_req, res) => {
    const presentations = await storage.getAllPresentations();
    res.json(presentations);
  });

  app.get("/api/presentations/:id", async (req, res) => {
    const presentation = await storage.getPresentation(Number(req.params.id));
    if (!presentation) {
      res.status(404).json({ message: "Presentation not found" });
      return;
    }
    res.json(presentation);
  });

  app.post("/api/presentations", async (req, res) => {
    const result = insertPresentationSchema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({ message: "Invalid presentation data" });
      return;
    }
    const presentation = await storage.createPresentation(result.data);
    res.json(presentation);
  });

  app.patch("/api/presentations/:id", async (req, res) => {
    const result = insertPresentationSchema.partial().safeParse(req.body);
    if (!result.success) {
      res.status(400).json({ message: "Invalid presentation data" });
      return;
    }
    try {
      const presentation = await storage.updatePresentation(
        Number(req.params.id),
        result.data
      );
      res.json(presentation);
    } catch (error) {
      res.status(404).json({ message: "Presentation not found" });
    }
  });

  return createServer(app);
}
