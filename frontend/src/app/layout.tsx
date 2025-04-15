import "./globals.css";
import { Inter } from "next/font/google";
import FlyonuiScript from "../components/FlyonuiScript";
import { AuthContextProvider } from "@/context/AuthContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "EmailAI - Manage Your Emails with AI-Powered Agents",
  description:
    "Create intelligent agents that respond to your emails, organize your inbox, and save you hours every week.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`min-h-screen bg-base-200 ${inter.className}`}>
        <AuthContextProvider>{children}</AuthContextProvider>
        <FlyonuiScript />
      </body>
    </html>
  );
}
