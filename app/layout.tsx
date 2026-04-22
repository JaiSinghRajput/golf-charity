import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GolfPro Impact",
  description:
    "Subscription golf score platform with charity contributions and monthly prize draws."
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-background text-neutral-950">
        <div className="min-h-screen bg-[radial-gradient(circle_at_top,#f4f9ff_0%,#f8f7f4_40%,#fcfbf9_100%)]">
          <SiteHeader />
          <main>{children}</main>
        </div>
      </body>
    </html>
  );
}
