import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "WASMagick",
  description: "WASMagick is a tool for converting images to different formats and sizes.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-black text-white font-google-sans-code">{children}</body>
    </html>
  );
}
