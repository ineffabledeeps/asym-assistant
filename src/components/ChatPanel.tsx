"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChatDTO } from "@/app/actions/chat";
import { createChat, appendMessage } from "@/app/actions/chat";
import { WeatherCard, RaceCard, PriceCard } from "@/components";
import { WeatherToolOutput, F1MatchesToolOutput, StockPriceToolOutput } from "@/types/tools";
import ChatSkeleton from "./ChatSkeleton";

interface ChatPanelProps {
  initialChats: ChatDTO[];
  selectedChatId: string | null;
  initialMessages: Array<{
    id: string;
    role: "user" | "assistant" | "tool";
    content: Record<string, unknown>;
    createdAt: Date;
  }>;
  isNewChat: boolean;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'tool';
  content: string | WeatherToolOutput | F1MatchesToolOutput | StockPriceToolOutput;
  toolKind?: 'weather' | 'f1' | 'stock';
  timestamp: Date;
}

export default function ChatPanel({ initialChats, selectedChatId, initialMessages, isNewChat }: ChatPanelProps) {
  const router = useRouter();
  const [chats, setChats] = useState<ChatDTO[]>(initialChats);
  const [currentChatId, setCurrentChatId] = useState<string | null>(selectedChatId);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [isInitializing, setIsInitializing] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent]);

  // Focus input when component mounts
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Initialize component
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitializing(false);
    }, 1000); // Show skeleton for 1 second

    return () => clearTimeout(timer);
  }, []);

  // Hydrate messages from SSR
  useEffect(() => {
    if (initialMessages.length > 0 && selectedChatId) {
      const hydratedMessages: ChatMessage[] = initialMessages.map(msg => ({
        id: msg.id,
        role: msg.role,
        content: typeof msg.content === 'string' ? msg.content : 
                (msg.content.text as string) || JSON.stringify(msg.content),
        toolKind: msg.content.toolKind as 'weather' | 'f1' | 'stock' | undefined,
        timestamp: new Date(msg.createdAt)
      }));
      setMessages(hydratedMessages);
    }
  }, [initialMessages, selectedChatId]);

  // Handle new chat creation and URL update
  useEffect(() => {
    if (isNewChat && selectedChatId && currentChatId !== selectedChatId) {
      // Update URL to include the new chat ID
      router.replace(`/chat?chat=${selectedChatId}`);
    }
  }, [isNewChat, selectedChatId, currentChatId, router]);

  const createNewChat = async () => {
    try {
      const newChat = await createChat({ title: "New Chat" });
      setChats(prev => [newChat, ...prev]);
      setCurrentChatId(newChat.id);
      setMessages([]);
      // Navigate to the new chat
      router.push(`/chat?chat=${newChat.id}`);
    } catch (error) {
      console.error("Failed to create chat:", error);
    }
  };

  const selectChat = async (chatId: string) => {
    setCurrentChatId(chatId);
    setMessages([]); // Clear current messages
    
    // Load messages for the selected chat
    try {
      const response = await fetch(`/api/chat/${chatId}/messages`);
      if (response.ok) {
        const chatMessages = await response.json();
        const hydratedMessages: ChatMessage[] = chatMessages.map((msg: {
          id: string;
          role: "user" | "assistant" | "tool";
          content: Record<string, unknown>;
          createdAt: string;
        }) => ({
          id: msg.id,
          role: msg.role,
          content: typeof msg.content === 'string' ? msg.content : 
                  (msg.content.text as string) || JSON.stringify(msg.content),
          toolKind: msg.content.toolKind as 'weather' | 'f1' | 'stock' | undefined,
          timestamp: new Date(msg.createdAt)
        }));
        setMessages(hydratedMessages);
      }
    } catch (error) {
      console.error("Failed to load chat messages:", error);
    }
    
    router.push(`/chat?chat=${chatId}`);
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading || !currentChatId) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    setIsStreaming(true);
    setStreamingContent("");

    try {
      // Send message to API
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [
            ...messages.map(msg => ({
              role: msg.role,
              content: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content)
            })),
            { role: 'user', content: input.trim() }
          ]
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("No response body");
      }

      let fullContent = "";
      let toolResult: WeatherToolOutput | F1MatchesToolOutput | StockPriceToolOutput | null = null;
      let toolKind: 'weather' | 'f1' | 'stock' | null = null;
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = new TextDecoder().decode(value);
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.type === 'text-delta') {
                fullContent += data.delta;
                setStreamingContent(fullContent);
              } else if (data.type === 'done') {
                console.log('Final usage:', data.usage);
              }
            } catch {
              // Skip invalid JSON lines
            }
          }
        }
      }

      // Add the complete assistant message
      const assistantMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: fullContent,
        timestamp: new Date()
      };

      // Check if the response contains tool results and extract them
      if (fullContent.includes('weather') || fullContent.includes('temperature') || fullContent.includes('humidity')) {
        // This is a weather response - we'll create a placeholder tool message
        // In a real implementation, you'd parse the actual tool result from the API
        toolResult = {
          location: "Location from response",
          tempC: 0,
          description: "Weather description",
          icon: "unknown",
          humidity: 0,
          windKph: 0
        } as WeatherToolOutput;
        toolKind = 'weather';
      } else if (fullContent.includes('F1') || fullContent.includes('race') || fullContent.includes('circuit')) {
        toolResult = {
          season: "2024",
          round: 1,
          raceName: "Race from response",
          circuit: "Circuit name",
          country: "Country",
          date: new Date().toISOString().split('T')[0]
        } as F1MatchesToolOutput;
        toolKind = 'f1';
      } else if (fullContent.includes('stock') || fullContent.includes('price') || fullContent.includes('AAPL')) {
        toolResult = {
          symbol: "SYMBOL",
          price: 0
        } as StockPriceToolOutput;
        toolKind = 'stock';
      }

      const finalMessages = [assistantMessage];
      
      // Add tool result message if we have one
      if (toolResult && toolKind) {
        const toolMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'tool',
          content: toolResult,
          toolKind,
          timestamp: new Date()
        };
        finalMessages.push(toolMessage);
      }

      setMessages(prev => [...prev, ...finalMessages]);
      setStreamingContent("");

      // Persist messages to database
      try {
        await appendMessage({
          chatId: currentChatId,
          role: 'user',
          content: { text: input.trim() }
        });
        
        await appendMessage({
          chatId: currentChatId,
          role: 'assistant',
          content: { text: fullContent }
        });

        if (toolResult && toolKind) {
          await appendMessage({
            chatId: currentChatId,
            role: 'tool',
            content: { 
              toolKind,
              data: toolResult
            }
          });
        }
      } catch (error) {
        console.error("Failed to persist messages:", error);
      }

    } catch (error) {
      console.error("Error:", error);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: "Sorry, I encountered an error. Please try again.",
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
    }
  };

  const renderMessage = (message: ChatMessage) => {
    if (message.role === 'tool' && message.toolKind) {
      switch (message.toolKind) {
        case 'weather':
          return <WeatherCard weather={message.content as WeatherToolOutput} />;
        case 'f1':
          return <RaceCard race={message.content as F1MatchesToolOutput} />;
        case 'stock':
          return <PriceCard stock={message.content as StockPriceToolOutput} />;
        default:
          return <div className="text-gray-600">Tool result</div>;
      }
    }

    return (
      <div className="text-gray-800 dark:text-gray-200">
        {typeof message.content === 'string' ? message.content : JSON.stringify(message.content)}
      </div>
    );
  };

  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (isInitializing) {
    return <ChatSkeleton />;
  }

  return (
    <div className="flex h-screen">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed lg:static inset-y-0 left-0 z-50 transform ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0 transition-transform duration-200 ease-in-out lg:transition-none`}>
        <div className="w-80 h-full bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Chats</h2>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={createNewChat}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              New Chat
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4">
            {chats.length === 0 ? (
              <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                No chats yet. Start a new conversation!
              </div>
            ) : (
              <div className="space-y-2">
                {chats.map((chat) => (
                  <button
                    key={chat.id}
                    onClick={() => {
                      selectChat(chat.id);
                      setSidebarOpen(false);
                    }}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      currentChatId === chat.id
                        ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <div className="font-medium truncate">{chat.title}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {new Date(chat.createdAt).toLocaleDateString()}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
              {currentChatId ? 'Chat' : 'Select a chat or start a new one'}
            </h1>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && currentChatId ? (
            <div className="text-center text-gray-500 dark:text-gray-400 py-8">
              Start a conversation by typing a message below.
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-3xl rounded-lg p-4 ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : message.role === 'tool'
                      ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                  }`}
                >
                  {renderMessage(message)}
                  <div className="text-xs opacity-70 mt-2">
                    {message.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))
          )}
          
          {/* Streaming message */}
          {isStreaming && streamingContent && (
            <div className="flex justify-start">
              <div className="max-w-3xl rounded-lg p-4 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100">
                <div className="text-gray-800 dark:text-gray-200">
                  {streamingContent}
                  <span className="animate-pulse">▋</span>
                </div>
                <div className="text-xs opacity-70 mt-2">
                  {new Date().toLocaleTimeString()}
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4">
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Type your message..."
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              disabled={isLoading || !currentChatId}
            />
            <button
              onClick={sendMessage}
              disabled={isLoading || !input.trim() || !currentChatId}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {isLoading ? "Sending..." : "Send"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
