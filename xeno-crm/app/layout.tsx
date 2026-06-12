import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Lumé CRM — AI-Native Marketing",
  description: "AI-powered CRM for Lumé Skincare",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.variable}>
        <div style={{ display: "flex", height: "100vh", background: "#f8f8f6" }}>
          <Sidebar />
          <main style={{ flex: 1, overflowY: "auto", minWidth: 0, display: "flex", flexDirection: "column" }}>
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}