import type { Metadata } from "next";
import "./globals.css";
import Toaster from "./Toaster";
import Providers from "@/components/WagmiProvider";

export const metadata: Metadata = {
  title: "numo - Crypto Requests",
  description: "Request and send crypto payments easily",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>
          {children}
        </Providers>
        <Toaster />
      </body>
    </html>
  );
}

