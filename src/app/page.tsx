import Image from "next/image";
import Link from "next/link";
import AuthGate from "@/components/AuthGate";
import Providers from "@/components/Providers";

export default function Home() {
  return (
    <Providers>
      <HomeContent />
    </Providers>
  );
}

function HomeContent() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto p-6">
        <header className="text-center mb-12">
          <Image
            className="dark:invert mx-auto mb-6"
            src="/next.svg"
            alt="Next.js logo"
            width={180}
            height={38}
            priority
          />
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            asym-assistant
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Next.js App Router + TypeScript + Tailwind CSS + NextAuth
          </p>
        </header>

        <main className="space-y-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              Authentication
            </h2>
            <AuthGate />
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              Features
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                  🔐 OAuth Authentication
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Sign in with Google or GitHub using NextAuth v5
                </p>
              </div>
              <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                  💬 Protected Chat
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Access the chat interface after authentication
                </p>
                <Link
                  href="/chat"
                  className="inline-block mt-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
                >
                  Go to Chat
                </Link>
              </div>
              <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                  🎨 Modern UI
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Built with Tailwind CSS and responsive design
                </p>
              </div>
              <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                  ⚡ App Router
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Next.js 15 with App Router and server components
                </p>
              </div>
            </div>
          </div>
        </main>

        <footer className="text-center mt-12 text-gray-500 dark:text-gray-400">
          <p>Built with Next.js, TypeScript, and Tailwind CSS</p>
        </footer>
      </div>
    </div>
  );
}
