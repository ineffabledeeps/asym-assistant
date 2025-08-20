import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import NextAuth from "@/lib/auth";
import { listChats, getChat, createChat, MessageDTO } from "@/app/actions/chat";
import ChatPanel from "@/components/ChatPanel";
import Navbar from "@/components/Navbar";
import Providers from "@/components/Providers";

interface ChatPageProps {
  searchParams: { chat?: string };
}

export default async function ChatPage({ searchParams }: ChatPageProps) {
  // Server-side authentication check
  const session = await getServerSession(NextAuth) as { user?: { id: string } } | null;
  if (!session?.user?.id) {
    redirect("/");
  }

  // Load user's chat history
  const chats = await listChats();
  
  let selectedChatId: string | null = null;
  let selectedChatMessages: MessageDTO[] = [];
  let isNewChat = false;

  // Handle chat selection from search params
  if (searchParams.chat) {
    try {
      const chat = await getChat(searchParams.chat);
      // getChat already verifies ownership, so if it succeeds, the chat belongs to the user
      selectedChatId = chat.id;
      selectedChatMessages = chat.messages || [];
    } catch (error) {
      console.error("Failed to load chat:", error);
      // If chat loading fails, we'll create a new one
    }
  }

  // If no chat is selected or loading failed, create a new chat
  if (!selectedChatId) {
    try {
      const newChat = await createChat({ title: "New Chat" });
      selectedChatId = newChat.id;
      isNewChat = true;
      // Don't redirect here - let the client handle the navigation
      // This prevents infinite redirects
    } catch (error) {
      console.error("Failed to create new chat:", error);
      // Fallback: just show the chat list without a selected chat
    }
  }

  return (
    <Providers>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navbar />
        <ChatPanel 
          initialChats={chats} 
          selectedChatId={selectedChatId}
          initialMessages={selectedChatMessages}
          isNewChat={isNewChat}
        />
      </div>
    </Providers>
  );
}
