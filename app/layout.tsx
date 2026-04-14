import type { Metadata } from "next";
import { Urbanist } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "../context/AuthContext";
import ClientOnly from "@/components/ClientOnly";
import Footer from "@/components/Footer";
import PageTransition from "@/components/PageTransition";
import { ToastProvider } from "@/components/Toast";

const urbanist = Urbanist({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-urbanist",
});

export const metadata: Metadata = {
  title: "Kunda - Wedding Planning Platform",
  description: "Connect with the best wedding vendors for your special day",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${urbanist.variable} font-sans antialiased`}
        style={{ backgroundColor: '#f0f4ff', color: '#111928', margin: 0, padding: 0 }}
      >
        <ClientOnly>
          <ToastProvider>
            <AuthProvider>
              <PageTransition>
                {children}
              </PageTransition>
              <Footer />
            </AuthProvider>
          </ToastProvider>
        </ClientOnly>
      </body>
    </html>
  );
}
