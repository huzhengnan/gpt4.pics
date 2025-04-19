import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

const geist = Geist({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'GPT4.PICS - AI Image Generation',
  description: 'Create stunning AI-generated images with GPT4.PICS',
  metadataBase: new URL('https://gpt4.pics'),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${geist.className} antialiased bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white min-h-screen flex flex-col`}>
        <AuthProvider>
          <Header />
          <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
