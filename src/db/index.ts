import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "./schema";
import { eq } from "drizzle-orm";

// Database connection
const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql, { schema });

// Helper functions
export async function getChatsByUserId(userId: string) {
  return await db.select().from(schema.chats).where(eq(schema.chats.userId, userId));
}

export async function getMessagesByChatId(chatId: string) {
  return await db.select().from(schema.messages).where(eq(schema.messages.chatId, chatId));
}

export async function createChat(userId: string, title: string) {
  return await db.insert(schema.chats).values({ userId, title }).returning();
}

export async function createMessage(chatId: string, role: "user" | "assistant" | "tool", content: Record<string, unknown>) {
  return await db.insert(schema.messages).values({ chatId, role, content }).returning();
}

// Re-export schema
export * from "./schema";
