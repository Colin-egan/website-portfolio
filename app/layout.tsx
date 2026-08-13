import type { Metadata } from "next";
import { Geist, Geist_Mono, Outfit } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { LenisProvider } from "@/components/providers/LenisProvider";
import { Navbar } from "@/components/layout/Navbar";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
  display: "swap",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  weight: ["400", "500", "600", "700", "800", "900"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://eganlab.com"),
  title: {
    default: "Egan Lab — Premium Web Design & Automation",
    template: "%s | Egan Lab",
  },
  description:
    "Premium web design, development, and automation services. We build websites that win clients.",
  keywords: [
    "web design",
    "web development",
    "business automation",
    "Next.js",
    "freelance web designer",
    "Egan Lab",
  ],
  authors: [{ name: "Colin Egan", url: "https://eganlab.com" }],
  creator: "Colin Egan",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://eganlab.com",
    title: "Egan Lab — Premium Web Design & Automation",
    description:
      "Premium web design, development, and automation services. We build websites that win clients.",
    siteName: "Egan Lab",
  },
  twitter: {
    card: "summary_large_image",
    title: "Egan Lab — Premium Web Design & Automation",
    description: "Premium web design, development, and automation. Awwwards-quality sites.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-video-preview": -1, "max-image-preview": "large" },
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://eganlab.com/#organization",
      name: "Egan Lab",
      url: "https://eganlab.com",
      logo: "https://eganlab.com/egan-lab-logo.svg",
      description:
        "Premium web design, development, and automation services. We build websites that win clients.",
      email: "colinthomasegan5@gmail.com",
      founder: {
        "@type": "Person",
        name: "Colin Egan",
      },
      sameAs: ["https://github.com/Colin-egan"],
      serviceType: ["Web Design", "Web Development", "Business Automation"],
    },
    {
      "@type": "WebSite",
      "@id": "https://eganlab.com/#website",
      name: "Egan Lab",
      url: "https://eganlab.com",
      publisher: { "@id": "https://eganlab.com/#organization" },
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${geist.variable} ${geistMono.variable} ${outfit.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-dvh bg-background text-foreground overflow-x-hidden">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
        />
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2.5 focus:rounded-full focus:bg-amber-600 focus:text-white focus:text-sm focus:font-semibold focus:shadow-lg"
        >
          Skip to content
        </a>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange={false}
        >
          <LenisProvider>
            <Navbar />
            <main id="main-content">{children}</main>
          </LenisProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
