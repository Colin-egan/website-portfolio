import type { Metadata } from "next";
import { Inter, Inter_Tight } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { LenisProvider } from "@/components/providers/LenisProvider";
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
      className={`${inter.variable} ${interTight.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-screen bg-background text-foreground overflow-x-hidden">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
        />
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange={false}
        >
          <LenisProvider>
            <Navbar />
            <main>{children}</main>
          </LenisProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
