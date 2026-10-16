import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "Finsight · Marketing workspace",
  description:
    "From product facts to thoughtful campaigns. A Claude-powered marketing workspace with human review.",
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
