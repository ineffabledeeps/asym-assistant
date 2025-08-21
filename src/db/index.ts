import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";
import { eq } from "drizzle-orm";

// Database connection for Supabase/PostgreSQL
const connectionString = process.env.DATABASE_URL!;

// SSL configuration for Supabase (recommended approach)
const sslConfig = {
  rejectUnauthorized: false, // Allow self-signed certificates for Supabase
};

const sql = postgres(connectionString, { ssl: sslConfig });
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
