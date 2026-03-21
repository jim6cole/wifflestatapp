import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
// This is now our Pancake/Hamburger Nav
import Sidebar from "../components/sidebar"; 

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "wRC | Wiffle Reporting & Control",
  description: "The global platform for Wiffleball statistics and league management.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-slate-950 text-white`}>
        {/* We removed the 'flex' container that was pinning the sidebar.
          The Sidebar (Pancake) now handles its own fixed positioning.
        */}
        <Sidebar />

        <main className="min-h-screen">
          {children}
        </main>
      </body>
    </html>
  );
}