import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mini Inventory System",
  description: "Compiled SML Core Runtime System Architecture",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body>{children}</body>
    </html>
  );
}