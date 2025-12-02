import type { Metadata } from "next";
import "./globals.css";
import Toaster from "./Toaster";
import Providers from "@/components/WagmiProvider";

export const metadata: Metadata = {
  title: "Xelli - Crypto Requests",
  description: "Request and send crypto payments easily",
  icons: {
    icon: "/websitelogo.png",
    shortcut: "/websitelogo.png",
    apple: "/websitelogo.png",
  },
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

