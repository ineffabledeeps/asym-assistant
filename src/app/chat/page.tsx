"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import AuthGate from "@/components/AuthGate";
import Providers from "@/components/Providers";

export default function ChatPage() {
  return (
    <Providers>
      <ChatContent />
    </Providers>
  );
}

function ChatContent() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;
    if (!session?.user) {
      router.push("/");
    }
  }, [session, status, router]);

  if (status === "loading") {
    return <div>Loading...</div>;
  }

  if (!session?.user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Chat Assistant
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Welcome back, {session.user.name || session.user.email}!
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Your Chat
            </h2>
            <AuthGate />
          </div>
          
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 min-h-[400px] bg-gray-50 dark:bg-gray-900">
            <p className="text-gray-500 dark:text-gray-400 text-center">
              Chat interface will be implemented here...
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
