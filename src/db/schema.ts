import { pgTable, text, timestamp, uuid, jsonb, pgEnum } from "drizzle-orm/pg-core";

// Role enum for messages
export const messageRoleEnum = pgEnum("message_role", ["user", "assistant", "tool"]);

// Chats table
export const chats = pgTable("chats", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull(),
  title: text("title").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Messages table
export const messages = pgTable("messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  chatId: uuid("chat_id").references(() => chats.id, { onDelete: "cascade" }).notNull(),
  role: messageRoleEnum("role").notNull(),
  content: jsonb("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Types for TypeScript
export type Chat = typeof chats.$inferSelect;
export type NewChat = typeof chats.$inferInsert;
export type Message = typeof messages.$inferSelect;
export type NewMessage = typeof messages.$inferInsert;
