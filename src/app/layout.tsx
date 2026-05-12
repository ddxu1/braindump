import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BrainDump - Stream to Stack Notes",
  description: "Stream your thoughts, stack your actions",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
