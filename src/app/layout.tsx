import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Slide Maker",
  description: "Upload an English passage image and generate slide-ready drafts."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
