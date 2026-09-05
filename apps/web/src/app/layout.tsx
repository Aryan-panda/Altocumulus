import type { Metadata } from "next";
import { Inter } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
// Using a generic local font fallback since Geist may not be installed in node_modules,
// but Next.js needs a valid configuration. We'll stick to basic mono fallback if needed,
// but for now we can just use Inter for sans. Let's just define standard fonts if localFont fails.
// Assuming the user had it working before, we can just use standard sans-serif and monospace.

export const metadata: Metadata = {
  title: "Altocumulus | Decentralized GPU Compute",
  description: "High-performance, peer-to-peer GPU execution engine.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} antialiased selection:bg-accent selection:text-white`}>
        {children}
      </body>
    </html>
  );
}
