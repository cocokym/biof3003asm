import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Toaster } from 'react-hot-toast';

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Heart Lens",
  description: "Monitor your pulse",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full bg-gray-50 dark:bg-gray-900">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased h-full text-gray-900 dark:text-gray-100 transition-colors duration-300`}
      >
        <div className="min-h-full flex flex-col">
          {/* Header */}
          <header className="bg-white dark:bg-gray-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-center items-center h-16">
                <h1 className="text-5xl font-bold text-gray-900 dark:text-gray-100 text-center">
                  Heart Lens
                </h1>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 dark:bg-gray-800">
            {children}
          </main>

          {/* Footer */}
          <footer className="bg-gray-100 dark:bg-gray-800 py-4">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                © 2025 Heart Lens. All rights reserved.
              </p>
            </div>
          </footer>
        </div>

        {/* Toaster for Notifications */}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              style: {
                background: '#4caf50',
              },
            },
            error: {
              style: {
                background: '#f44336',
              },
            },
          }}
        />
      </body>
    </html>
  );
}
