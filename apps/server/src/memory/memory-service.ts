import { db } from '../database/index.js';
import { memories, memoriesFts } from '../database/schema.js';
import { eq, like, or } from 'drizzle-orm';

export class MemoryService {
  private static instance: MemoryService;

  private constructor() {}

  public static getInstance(): MemoryService {
    if (!MemoryService.instance) {
      MemoryService.instance = new MemoryService();
    }
    return MemoryService.instance;
  }

  async saveMemory(projectId: string, type: string, content: string): Promise<string> {
    const id = 'mem-' + Math.random().toString(36).substring(7);
    await db.insert(memories).values({
      id,
      projectId,
      type,
      content,
      createdAt: new Date()
    });

    // Also insert into mock FTS table
    await db.insert(memoriesFts).values({
      id,
      content
    });

    return id;
  }

  async searchMemories(projectId: string, query: string): Promise<any[]> {
    // Return memories for this project matching text
    const results = await db
      .select()
      .from(memories)
      .where(
        or(
          like(memories.content, `%${query}%`),
          like(memories.type, `%${query}%`)
        )
      );

    // Filter by project id
    return results.filter(m => m.projectId === projectId);
  }

  async deleteMemory(id: string): Promise<void> {
    await db.delete(memories).where(eq(memories.id, id));
    await db.delete(memoriesFts).where(eq(memoriesFts.id, id));
  }

  async clearProjectMemories(projectId: string): Promise<void> {
    await db.delete(memories).where(eq(memories.projectId, projectId));
  }
}
