import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import NextAuth from "@/lib/auth";
import { getChat } from "@/app/actions/chat";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ chatId: string }> }
) {
  try {
    // Verify authentication
    const session = await getServerSession(NextAuth) as { user?: { id: string } } | null;
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { chatId } = await params;
    
    // Get chat with messages (this already verifies ownership)
    const chat = await getChat(chatId);
    
    return NextResponse.json(chat.messages);
  } catch (error) {
    console.error("Error fetching chat messages:", error);
    if (error instanceof Error && error.message.includes("not found")) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 });
    }
    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
