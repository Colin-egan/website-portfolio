import type { Metadata } from "next";
import { Inter, Inter_Tight } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { LenisProvider } from "@/components/providers/LenisProvider";
import { CustomCursor } from "@/components/ui/CustomCursor";
import { Navbar } from "@/components/layout/Navbar";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const interTight = Inter_Tight({
  subsets: ["latin"],
  variable: "--font-inter-tight",
  weight: ["400", "500", "600", "700", "800", "900"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://eganlabs.com"),
  title: {
    default: "Egan Labs — AI Tools Managed by Human Intelligence",
    template: "%s | Egan Labs",
  },
  description:
    "Premium web design, development, and automation services. We build websites that win clients — powered by AI, refined by humans.",
  keywords: [
    "web design",
    "web development",
    "AI automation",
    "Next.js",
    "freelance web designer",
    "Egan Labs",
  ],
  authors: [{ name: "Colin Egan", url: "https://eganlabs.com" }],
  creator: "Colin Egan",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://eganlabs.com",
    title: "Egan Labs — AI Tools Managed by Human Intelligence",
    description:
      "Premium web design, development, and automation services. We build websites that win clients.",
    siteName: "Egan Labs",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Egan Labs" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Egan Labs — AI Tools Managed by Human Intelligence",
    description: "Premium web design, development, and automation. Awwwards-quality sites.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-video-preview": -1, "max-image-preview": "large" },
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${interTight.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-screen bg-background text-foreground overflow-x-hidden">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange={false}
        >
          <LenisProvider>
            <CustomCursor />
            <Navbar />
            <main>{children}</main>
          </LenisProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
