import type { Metadata } from "next";
import { LegalArticle } from "@/components/ui/LegalArticle";
import { Footer } from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Egan Lab collects, uses, and protects your information.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <>
      <div className="pt-28" />
      <LegalArticle eyebrow="privacy" title="Privacy policy" updated="August 7, 2026">
        <p>
          Egan Lab is operated by Colin Egan. This page explains what information we collect
          through this website and the client portal, why we collect it, and how you can
          control it. If anything here is unclear, email{" "}
          <a href="mailto:colinthomasegan5@gmail.com">colinthomasegan5@gmail.com</a>.
        </p>

        <h2>Information we collect</h2>
        <p>
          <strong>Contact form.</strong> When you fill out the contact form, we collect your
          name, email address, project type, budget range, and whatever you write in the
          message field. We use it only to respond to your inquiry and put together a proposal.
        </p>
        <p>
          <strong>Newsletter.</strong> If you subscribe from the footer, we collect your email
          address to send occasional updates. You can unsubscribe at any time.
        </p>
        <p>
          <strong>Client portal.</strong> If you&apos;re a client with portal access, we store
          your business name, a password (as a one-way bcrypt hash — we never store or see your
          actual password), and the project details, images, and files associated with your
          account.
        </p>

        <h2>Cookies</h2>
        <p>
          This site sets one cookie: <strong>portal_session</strong>, used only to keep client
          portal users signed in for up to seven days. It&apos;s first-party, marked{" "}
          <code>httpOnly</code>, and isn&apos;t used for tracking or advertising. We don&apos;t
          run analytics or third-party ad trackers on this site.
        </p>

        <h2>How we use your information</h2>
        <p>
          We use the information above to respond to inquiries, deliver the services you&apos;ve
          hired us for, and operate the client portal. We don&apos;t sell your information. We
          don&apos;t share it with third parties except the infrastructure providers that help
          us run this site and the portal — currently Supabase for data storage and Vercel for
          hosting — who process it on our behalf and don&apos;t use it for their own purposes.
        </p>

        <h2>Security</h2>
        <p>
          Portal passwords are hashed with bcrypt before storage — the plain-text password is
          never saved. Portal data is served only through authenticated server requests using
          credentials that never reach your browser. Traffic to this site is encrypted with
          HTTPS.
        </p>

        <h2>Your choices</h2>
        <p>
          You can ask us to access, correct, or delete the information we hold about you at any
          time by emailing{" "}
          <a href="mailto:colinthomasegan5@gmail.com">colinthomasegan5@gmail.com</a>. We&apos;ll
          respond within a reasonable time.
        </p>

        <h2>Children</h2>
        <p>
          This site isn&apos;t directed at children, and we don&apos;t knowingly collect
          information from anyone under 13.
        </p>

        <h2>Changes to this policy</h2>
        <p>
          If this policy changes, we&apos;ll update the date at the top of this page. Continued
          use of the site after a change means you accept the update.
        </p>
      </LegalArticle>
      <Footer />
    </>
  );
}
