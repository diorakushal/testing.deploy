import type { Metadata } from "next";
import "./globals.css";
import Toaster from "./Toaster";
import Providers from "@/components/WagmiProvider";
import SidebarWrapper from "@/components/SidebarWrapper";

export const metadata: Metadata = {
  title: "Zemme - Crypto Requests",
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
    <html lang="en" suppressHydrationWarning>
      <body className="bg-white" suppressHydrationWarning>
        <Providers>
          <SidebarWrapper>
            {children}
          </SidebarWrapper>
        </Providers>
        <Toaster />
      </body>
    </html>
  );
}

