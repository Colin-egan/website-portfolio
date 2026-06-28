"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUp, Mail } from "lucide-react";
import { useState } from "react";
import { Logo } from "@/components/ui/Logo";

function GitHubIcon({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12Z" />
    </svg>
  );
}

function XIcon({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function LinkedInIcon({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

const socialLinks = [
  { label: "X / Twitter", href: "https://twitter.com", Icon: XIcon },
  { label: "GitHub", href: "https://github.com/Colin-egan", Icon: GitHubIcon },
  { label: "LinkedIn", href: "https://linkedin.com", Icon: LinkedInIcon },
  { label: "Email", href: "mailto:colinthomasegan5@gmail.com", Icon: Mail },
];

const footerLinks = {
  Services: [
    { label: "Web Design", href: "/#services" },
    { label: "Development", href: "/#services" },
    { label: "Automation", href: "/#services" },
  ],
  Company: [
    { label: "Work", href: "/work" },
    { label: "Process", href: "/#process" },
    { label: "Contact", href: "/contact" },
  ],
  Pricing: [
    { label: "Website Build", href: "/pricing" },
    { label: "Management", href: "/pricing" },
    { label: "Automation", href: "/pricing" },
  ],
};

function BackToTopButton() {
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  return (
    <motion.button
      onClick={scrollToTop}
      className="w-12 h-12 rounded-full border border-white/15 flex items-center justify-center hover:border-purple-500/50 hover:bg-purple-500/10 transition-all duration-300 group"
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.9 }}
    >
      <ArrowUp size={18} className="group-hover:text-purple-400 transition-colors" />
    </motion.button>
  );
}

export function Footer() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.includes("@")) {
      setSubscribed(true);
      setEmail("");
    }
  };

  return (
    <footer className="border-t border-white/5 bg-card/50 pt-20 pb-10">
      <div className="max-w-7xl mx-auto px-6">
        {/* Big wordmark */}
        <div className="overflow-hidden mb-16">
          <motion.h2
            className="font-display font-black text-[clamp(4rem,15vw,12rem)] leading-none text-gradient opacity-20 select-none"
            initial={{ y: 80 }}
            whileInView={{ y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          >
            EGAN LABS
          </motion.h2>
        </div>

        {/* Main footer content */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-10 mb-16">
          {/* Brand */}
          <div className="col-span-2">
            <Link href="/" className="inline-block mb-4 group">
              <Logo
                iconSize={28}
                className="text-white group-hover:text-purple-300 transition-colors duration-200"
                textClassName="text-lg"
              />
            </Link>
            <p className="text-muted-foreground text-sm mb-6 max-w-xs leading-relaxed">
              AI tools managed by human intelligence. We build websites that win clients — and automations that scale businesses.
            </p>

            {/* Newsletter */}
            {!subscribed ? (
              <form onSubmit={handleSubscribe} className="flex gap-2">
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  type="email"
                  className="flex-1 bg-background border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500/50 transition-colors placeholder:text-muted-foreground/40"
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium transition-colors whitespace-nowrap"
                >
                  Subscribe
                </button>
              </form>
            ) : (
              <motion.p
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-sm text-purple-400"
              >
                ✓ You're subscribed!
              </motion.p>
            )}
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">{category}</h3>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 border-t border-white/5">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Egan Labs. All rights reserved.
          </p>

          <div className="flex items-center gap-1">
            {socialLinks.map(({ label, href, Icon }) => (
              <a
                key={label}
                href={href}
                aria-label={label}
                className="w-9 h-9 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all"
              >
                <Icon size={15} />
              </a>
            ))}
          </div>

          <BackToTopButton />
        </div>
      </div>
    </footer>
  );
}
