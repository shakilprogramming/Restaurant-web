import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import AuthProvider from "@/components/AuthProvider";
import QueryProvider from "@/components/QueryProvider";
import SiteChrome from "@/components/SiteChrome";
import { ToastContainer } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Massimo Restaurant",
  description: "Freshly prepared meals from the Massimo restaurant menu.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <QueryProvider>
            <div>
              <SiteChrome>{children}</SiteChrome>
              <ToastContainer position="bottom-right" theme="dark" autoClose={3000}/>
            </div>
          </QueryProvider>
        </AuthProvider>
      </body>
    </html>
  );
}