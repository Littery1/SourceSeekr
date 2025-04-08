import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "@/components/theme-provider";
import Navbar from "@/components/Navbar/page";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SourceSeekr - GitHub Repository Recommendations",
  description: "Get personalized GitHub repository recommendations based on your interests and profile.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider>
          <SessionProvider>
            <div className="min-h-screen flex flex-col">
              <Navbar />
              <main className="flex-1 container mx-auto px-4 py-8">
                {children}
              </main>
              <footer className="bg-card border-t border-border py-8">
                <div className="container mx-auto px-4">
                  <div className="flex flex-col md:flex-row justify-between items-center">
                    <div className="flex items-center mb-4 md:mb-0">
                      <span className="text-primary font-semibold text-xl">SourceSeekr</span>
                    </div>
                    <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-8 text-center md:text-left">
                      <div>
                        <h3 className="font-medium mb-2">Features</h3>
                        <ul className="space-y-1 text-muted-foreground">
                          <li>Repository Recommendations</li>
                          <li>GitHub Integration</li>
                          <li>Personal Profile</li>
                          <li>Saved Repositories</li>
                        </ul>
                      </div>
                      <div>
                        <h3 className="font-medium mb-2">Links</h3>
                        <ul className="space-y-1 text-muted-foreground">
                          <li><a href="/about" className="hover:text-primary transition-colors">About</a></li>
                          <li><a href="/explore" className="hover:text-primary transition-colors">Explore</a></li>
                          <li><a href="/saved" className="hover:text-primary transition-colors">Saved</a></li>
                        </ul>
                      </div>
                    </div>
                  </div>
                  <div className="mt-8 pt-8 border-t border-border text-center text-muted-foreground text-sm">
                    <p>© {new Date().getFullYear()} SourceSeekr. All rights reserved.</p>
                  </div>
                </div>
              </footer>
            </div>
            <Toaster position="bottom-right" />
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}