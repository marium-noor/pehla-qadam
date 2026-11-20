import type { Metadata, Viewport } from "next";
import "@fontsource-variable/inter";
import "@fontsource/noto-nastaliq-urdu/400.css";
import "@fontsource/noto-nastaliq-urdu/600.css";
import "./globals.css";
import { LangProvider } from "@/components/LangProvider";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ChatWidget } from "@/components/ChatWidget";

export const metadata: Metadata = {
  title: "Pehla Qadam | پہلا قدم",
  description:
    "A Shariah-first weekly guide to your first investment in Pakistan. One short lesson by email each week, in Urdu or English. Free to start.",
  openGraph: {
    title: "Pehla Qadam",
    description: "Your first investment, one lesson a week. Halal first. Urdu first.",
    type: "website",
  },
};

export const viewport: Viewport = { themeColor: "#ffffff", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <body className="font-sans text-ink antialiased">
        <LangProvider>
          <Header />
          <main>{children}</main>
          <Footer />
          <ChatWidget />
        </LangProvider>
      </body>
    </html>
  );
}
