"use server";

import { getServerSession } from "next-auth";
import NextAuth from "@/lib/auth";
import { db } from "@/db";
import { chats, messages } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import {
  createChatInputSchema,
  appendMessageInputSchema,
  type CreateChatInput,
  type AppendMessageInput,
  type ChatDTO,
  type MessageDTO,
  type ChatWithMessagesDTO,
} from "@/lib/schemas";

// Helper function to get current user ID
async function getCurrentUserId(): Promise<string> {
  console.log("🔍 getCurrentUserId: Checking authentication");
  const session = await getServerSession(NextAuth) as { user?: { id: string } } | null;
  console.log("🔍 getCurrentUserId: Session data:", session);
  
  if (!session?.user?.id) {
    console.error("❌ getCurrentUserId: No session or user ID");
    throw new Error("Unauthorized: User not authenticated");
  }
  
  console.log("✅ getCurrentUserId: User authenticated:", session.user.id);
  return session.user.id;
}

/**
 * Create a new chat for the current user
 */
export async function createChat(input: CreateChatInput): Promise<ChatDTO> {
  console.log("🔍 createChat: Starting with input:", input);
  const userId = await getCurrentUserId();
  console.log("🔍 createChat: User ID:", userId);
  
  // Validate input
  const validatedInput = createChatInputSchema.parse(input);
  console.log("🔍 createChat: Validated input:", validatedInput);
  
  const title = validatedInput.title || `Chat ${new Date().toLocaleString()}`;
  console.log("🔍 createChat: Chat title:", title);
  
  console.log("🔍 createChat: Inserting into database with userId:", userId, "title:", title);
  
  try {
    const [newChat] = await db
      .insert(chats)
      .values({
        userId,
        title,
      })
      .returning();
    
    console.log("✅ createChat: Database insert successful:", newChat.id);
    
    revalidatePath("/chat");
    revalidatePath("/");
    
    const result = {
      id: newChat.id,
      title: newChat.title,
      createdAt: newChat.createdAt,
      messageCount: 0,
    };
    
    console.log("✅ createChat: Returning result:", result);
    return result;
  } catch (error) {
    console.error("❌ createChat: Database insert failed:", error);
    throw error;
  }
}

/**
 * List all chats for the current user (latest first)
 */
export async function listChats(): Promise<ChatDTO[]> {
  console.log("🔍 listChats: Starting for user");
  const userId = await getCurrentUserId();
  console.log("🔍 listChats: User ID:", userId);
  
  try {
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

    console.log("✅ listChats: Found", chatsWithCounts.length, "chats");
    return chatsWithCounts;
  } catch (error) {
    console.error("❌ listChats: Database query failed:", error);
    throw error;
  }
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
  
  // Validate input
  const validatedInput = appendMessageInputSchema.parse(input);
  
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
      chatId: validatedInput.chatId,
      role: validatedInput.role,
      content: validatedInput.content,
    })
    .returning();

  revalidatePath(`/chat/${validatedInput.chatId}`);
  revalidatePath("/chat");
  
  return {
    id: newMessage.id,
    role: newMessage.role,
    content: newMessage.content as Record<string, unknown>,
    createdAt: newMessage.createdAt,
  };
}
