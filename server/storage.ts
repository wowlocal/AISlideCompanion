import { presentations, type Presentation, type InsertPresentation } from "@shared/schema";

export interface IStorage {
  createPresentation(presentation: InsertPresentation): Promise<Presentation>;
  getPresentation(id: number): Promise<Presentation | undefined>;
  getAllPresentations(): Promise<Presentation[]>;
  updatePresentation(id: number, presentation: Partial<InsertPresentation>): Promise<Presentation>;
}

export class MemStorage implements IStorage {
  private presentations: Map<number, Presentation>;
  private currentId: number;

  constructor() {
    this.presentations = new Map();
    this.currentId = 1;
  }

  async createPresentation(presentation: InsertPresentation): Promise<Presentation> {
    const id = this.currentId++;
    const newPresentation = { ...presentation, id };
    this.presentations.set(id, newPresentation);
    return newPresentation;
  }

  async getPresentation(id: number): Promise<Presentation | undefined> {
    return this.presentations.get(id);
  }

  async getAllPresentations(): Promise<Presentation[]> {
    return Array.from(this.presentations.values());
  }

  async updatePresentation(id: number, presentation: Partial<InsertPresentation>): Promise<Presentation> {
    const existing = await this.getPresentation(id);
    if (!existing) {
      throw new Error("Presentation not found");
    }
    const updated = { ...existing, ...presentation };
    this.presentations.set(id, updated);
    return updated;
  }
}

export const storage = new MemStorage();
