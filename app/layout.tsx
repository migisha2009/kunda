import type { Metadata } from "next";
import { Playfair_Display, Poppins } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "../context/AuthContext";
import ClientOnly from "@/components/ClientOnly";
import Footer from "@/components/Footer";
import PageTransition from "@/components/PageTransition";
import { ToastProvider } from "@/components/Toast";

const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "700", "900"],
  variable: "--font-playfair-display",
});

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-poppins",
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
        className={`${playfairDisplay.variable} ${poppins.variable} font-sans antialiased`}
        style={{ backgroundColor: 'var(--color-background)', color: '#111928', margin: 0, padding: 0 }}
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
