import type { Metadata } from "next";
import "./globals.css";
import Toaster from "./Toaster";
import Providers from "@/components/WagmiProvider";
import SidebarWrapper from "@/components/SidebarWrapper";
import { Poppins } from "next/font/google";

const poppins = Poppins({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-poppins',
});

export const metadata: Metadata = {
  title: "Blockbook - Crypto Requests",
  description: "Request and send crypto payments easily",
  icons: {
    icon: [
      { url: "/favicon-48x48.png", sizes: "48x48", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className={poppins.variable}>
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

