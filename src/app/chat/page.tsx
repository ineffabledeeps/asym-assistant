import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { listChats, getChat } from "@/app/actions/chat";
import { MessageDTO, ChatDTO } from "@/lib/schemas";
import ChatPanel from "@/components/ChatPanel";
import Navbar from "@/components/Navbar";
import Providers from "@/components/Providers";

interface ChatPageProps {
  searchParams: { chat?: string };
}

export default async function ChatPage({ searchParams }: ChatPageProps) {
  // Await searchParams to fix Next.js warning
  const params = await searchParams;
  console.log("🔍 ChatPage: Starting with searchParams:", params);
  
  // Server-side authentication check
  const session = await getServerSession(authOptions) as any;
  console.log("🔍 ChatPage: Session data:", session);
  console.log("🔍 ChatPage: Session.user:", session?.user);
  console.log("🔍 ChatPage: Session.user.id:", session?.user?.id);
  console.log("🔍 ChatPage: Session keys:", session ? Object.keys(session) : "null");
  console.log("🔍 ChatPage: User keys:", session?.user ? Object.keys(session.user) : "null");
  
  if (!session?.user?.id) {
    console.log("❌ ChatPage: No session or user ID, redirecting to /");
    redirect("/");
  }
  
  console.log("✅ ChatPage: User authenticated:", session.user.id);

  // Load user's chat history
  console.log("🔍 ChatPage: Loading chats for user:", session.user.id);
  let chats: ChatDTO[] = [];
  try {
    chats = await listChats();
    console.log("✅ ChatPage: Loaded chats:", chats.length);
  } catch (error) {
    console.error("❌ ChatPage: Failed to load chats:", error);
    chats = [];
  }
  
  let selectedChatId: string | null = null;
  let selectedChatMessages: MessageDTO[] = [];
  let isNewChat = false;

  // Handle chat selection from search params
  if (params.chat) {
    console.log("🔍 ChatPage: Loading specific chat:", params.chat);
    try {
      const chat = await getChat(params.chat);
      console.log("✅ ChatPage: Loaded chat:", chat.id, "with", chat.messages.length, "messages");
      // getChat already verifies ownership, so if it succeeds, the chat belongs to the user
      selectedChatId = chat.id;
      selectedChatMessages = chat.messages || [];
    } catch (error) {
      console.error("❌ ChatPage: Failed to load chat:", error);
      // If chat loading fails, we'll create a new one
    }
  }

  // If no chat is selected, we'll let the client create one when needed
  if (!selectedChatId) {
    console.log("🔍 ChatPage: No chat selected, will create on client");
    isNewChat = true;
  }

  console.log("🔍 ChatPage: Rendering with:", {
    chatsCount: chats.length,
    selectedChatId,
    messagesCount: selectedChatMessages.length,
    isNewChat
  });

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
