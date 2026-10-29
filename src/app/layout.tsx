import "./globals.css";
import type { Metadata } from "next";
import { Anton, DM_Sans } from "next/font/google";
import AuthProvider from "@/components/AuthProvider";
import QueryProvider from "@/components/QueryProvider";
import SiteChrome from "@/components/SiteChrome";
import { ToastContainer } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';

const anton = Anton({ subsets: ["latin"], weight: "400", variable: "--font-display" });
const dmSans = DM_Sans({ subsets: ["latin"], weight: ["400", "500", "700"], variable: "--font-body" });

export const metadata: Metadata = {
  title: "NaanBite — Burgers, Naan & Bold Flavours",
  description: "Handcrafted burgers, warm naan and bold house sauces, made fresh at NaanBite.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${dmSans.className} ${anton.variable}`}>
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
