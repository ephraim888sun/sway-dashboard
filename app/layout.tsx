import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ViewpointGroupProvider } from "@/lib/viewpoint-group-context";
import { SWRConfig } from "swr";
import { swrConfig } from "@/lib/swr-config";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Leader Influence Dashboard | Sway",
  description:
    "Leader Influence Dashboard Take-Home Project - Build a dashboard that helps leaders understand their political influence and discover where to grow it next.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <SWRConfig value={swrConfig}>
          <ViewpointGroupProvider>{children}</ViewpointGroupProvider>
        </SWRConfig>
      </body>
    </html>
  );
}
