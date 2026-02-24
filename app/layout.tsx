import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

export const dynamic = 'force-dynamic'

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Hamilton George Care — Policy Platform",
  description: "Policy and procedure management for Hamilton George Care",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
