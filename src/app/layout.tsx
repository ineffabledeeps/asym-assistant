import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "asym-assistant",
  description: "Next.js App Router + TypeScript + Tailwind CSS + NextAuth",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
