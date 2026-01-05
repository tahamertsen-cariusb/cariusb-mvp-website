import type { Metadata } from "next";
import { Inter, Outfit, Space_Grotesk } from "next/font/google";
import "../styles/globals.css";
import { GlobalDecorations } from "@/components/layout/GlobalDecorations";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { ErrorBoundaryProvider } from "@/components/providers/ErrorBoundaryProvider";
import { validateEnvOnStartup } from "@/lib/env";

// Validate environment variables on startup (server-side only)
if (typeof window === 'undefined') {
  try {
    validateEnvOnStartup();
  } catch (error) {
    // In production, throw error to prevent deployment with invalid env vars
    if (process.env.NODE_ENV === 'production') {
      console.error('❌ Environment validation failed:', error);
      throw error;
    }
  }
}

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: "CARI - AI-Powered Car Visualization Studio",
  description: "Transform your car photos into viral masterpieces. Change rims, paint, bodykits, and generate cinematic AI videos — all in seconds.",
  keywords: ["car visualization", "AI", "car design", "photo editing", "automotive"],
  authors: [{ name: "CARI" }],
  openGraph: {
    title: "CARI - AI-Powered Car Visualization Studio",
    description: "Transform your car photos into viral masterpieces with AI.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${outfit.variable} ${spaceGrotesk.variable}`} style={{ backgroundColor: '#030303' }}>
      <body style={{ backgroundColor: '#030303', margin: 0, padding: 0, minHeight: '100vh' }}>
        <a href="#main-content" className="skipToContent">
          Skip to main content
        </a>
        <ErrorBoundaryProvider>
          <AuthProvider>
            <GlobalDecorations />
            {children}
          </AuthProvider>
        </ErrorBoundaryProvider>
      </body>
    </html>
  );
}

