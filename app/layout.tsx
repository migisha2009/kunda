import type { Metadata } from "next";
import { Jost, Cormorant_Garamond } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "../context/AuthContext";
import ClientOnly from "@/components/ClientOnly";

const jost = Jost({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-jost",
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-cormorant",
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
        className={`${jost.variable} ${cormorant.variable} font-sans antialiased`}
        style={{ backgroundColor: '#fdf9f5', color: '#3a2a1a', margin: 0, padding: 0 }}
      >
        <ClientOnly>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ClientOnly>
      </body>
    </html>
  );
}
