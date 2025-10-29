import type { Metadata } from "next";
import "./globals.css";
import Toaster from "./Toaster";

export const metadata: Metadata = {
  title: "nusense - Opinion Market Platform",
  description: "Social opinion market platform with blind voting and crypto staking",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
        <Toaster />
      </body>
    </html>
  );
}

