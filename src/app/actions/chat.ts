"use server";

import { getServerSession } from "next-auth";
import NextAuth from "@/lib/auth";
import { db } from "@/db";
import { chats, messages } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";

// Types for the actions
export interface CreateChatInput {
  title?: string;
}

export interface AppendMessageInput {
  chatId: string;
  role: "user" | "assistant" | "tool";
  content: Record<string, unknown>;
}

export interface ChatDTO {
  id: string;
  title: string;
  createdAt: Date;
  messageCount: number;
}

export interface MessageDTO {
  id: string;
  role: "user" | "assistant" | "tool";
  content: Record<string, unknown>;
  createdAt: Date;
}

export interface ChatWithMessagesDTO {
  id: string;
  title: string;
  createdAt: Date;
  messages: MessageDTO[];
}

// Helper function to get current user ID
async function getCurrentUserId(): Promise<string> {
  const session = await getServerSession(NextAuth) as { user?: { id: string } } | null;
  if (!session?.user?.id) {
    throw new Error("Unauthorized: User not authenticated");
  }
  return session.user.id;
}

/**
 * Create a new chat for the current user
 */
export async function createChat(input: CreateChatInput): Promise<ChatDTO> {
  const userId = await getCurrentUserId();
  
  const title = input.title || `Chat ${new Date().toLocaleString()}`;
  
  const [newChat] = await db
    .insert(chats)
    .values({
      userId,
      title,
    })
    .returning();

  revalidatePath("/chat");
  revalidatePath("/");
  
  return {
    id: newChat.id,
    title: newChat.title,
    createdAt: newChat.createdAt,
    messageCount: 0,
  };
}

/**
 * List all chats for the current user (latest first)
 */
export async function listChats(): Promise<ChatDTO[]> {
  const userId = await getCurrentUserId();
  
  const userChats = await db
    .select({
      id: chats.id,
      title: chats.title,
      createdAt: chats.createdAt,
    })
    .from(chats)
    .where(eq(chats.userId, userId))
    .orderBy(desc(chats.createdAt));

  // Get message count for each chat
  const chatsWithCounts = await Promise.all(
    userChats.map(async (chat) => {
      const messageCount = await db
        .select({ count: messages.id })
        .from(messages)
        .where(eq(messages.chatId, chat.id));
      
      return {
        ...chat,
        messageCount: messageCount.length,
      };
    })
  );

  return chatsWithCounts;
}

/**
 * Get a specific chat with all its messages
 */
export async function getChat(id: string): Promise<ChatWithMessagesDTO> {
  const userId = await getCurrentUserId();
  
  // Get chat and verify ownership
  const [chat] = await db
    .select()
    .from(chats)
    .where(eq(chats.id, id))
    .limit(1);

  if (!chat) {
    throw new Error("Chat not found");
  }

  if (chat.userId !== userId) {
    throw new Error("Unauthorized: Access denied to this chat");
  }

  // Get messages for this chat
  const chatMessages = await db
    .select({
      id: messages.id,
      role: messages.role,
      content: messages.content,
      createdAt: messages.createdAt,
    })
    .from(messages)
    .where(eq(messages.chatId, id))
    .orderBy(messages.createdAt);

  return {
    id: chat.id,
    title: chat.title,
    createdAt: chat.createdAt,
    messages: chatMessages.map(msg => ({
      ...msg,
      content: msg.content as Record<string, unknown>
    })),
  };
}

/**
 * Append a new message to a chat
 */
export async function appendMessage(input: AppendMessageInput): Promise<MessageDTO> {
  const userId = await getCurrentUserId();
  
  // Verify chat ownership
  const [chat] = await db
    .select()
    .from(chats)
    .where(eq(chats.id, input.chatId))
    .limit(1);

  if (!chat) {
    throw new Error("Chat not found");
  }

  if (chat.userId !== userId) {
    throw new Error("Unauthorized: Access denied to this chat");
  }

  const [newMessage] = await db
    .insert(messages)
    .values({
      chatId: input.chatId,
      role: input.role,
      content: input.content,
    })
    .returning();

  revalidatePath(`/chat/${input.chatId}`);
  revalidatePath("/chat");
  
  return {
    id: newMessage.id,
    role: newMessage.role,
    content: newMessage.content as Record<string, unknown>,
    createdAt: newMessage.createdAt,
  };
}
