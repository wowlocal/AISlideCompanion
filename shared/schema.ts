import { pgTable, text, serial, integer, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const presentations = pgTable("presentations", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  slides: jsonb("slides").notNull().$type<Slide[]>(),
});

export const insertPresentationSchema = createInsertSchema(presentations).pick({
  title: true,
  slides: true,
});

export type Slide = {
  type: "title" | "content" | "image";
  content: string;
  notes?: string;
};

export type InsertPresentation = z.infer<typeof insertPresentationSchema>;
export type Presentation = typeof presentations.$inferSelect;
