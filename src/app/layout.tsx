import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import BackToTop from "@/components/BackToTop";
import Analytics from "@/components/Analytics";
import SavesProvider from "@/components/Saves";
import ToastProvider from "@/components/Toast";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: "n8n Rank – Get your n8n workflow listed. Rise higher.",
  description:
    "Bid for the top 3 slots and get your n8n workflow discovered by thousands of automation builders.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${jakarta.variable} h-full antialiased`}>
      {/* Browser extensions (e.g. ColorZilla adds cz-shortcut-listen) add attributes to <body> before React loads; ignore that one mismatch. */}
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <ToastProvider>
          <SavesProvider>{children}</SavesProvider>
        </ToastProvider>
        <BackToTop />
        <Analytics />
      </body>
    </html>
  );
}
