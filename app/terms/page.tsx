import type { Metadata } from "next";
import { LegalArticle } from "@/components/ui/LegalArticle";
import { Footer } from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "The terms that apply when you use this website or hire Egan Lab.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <>
      <div className="pt-28" />
      <LegalArticle eyebrow="terms" title="Terms of service" updated="August 7, 2026">
        <p>
          These terms apply when you use this website or hire Egan Lab (operated by Colin Egan)
          for web design, development, or automation work. By doing either, you agree to them.
          Questions go to{" "}
          <a href="mailto:colinthomasegan5@gmail.com">colinthomasegan5@gmail.com</a>.
        </p>

        <h2>Services</h2>
        <p>
          Egan Lab provides web design, development, and automation services as described on
          our <a href="/pricing">pricing page</a>. The specific scope, timeline, price, and
          revision policy for your project are agreed on separately, in writing, before work
          starts.
        </p>

        <h2>Client portal</h2>
        <p>
          If we build a portal for your project, access is provided for viewing project status
          and files. Keep your login credentials confidential — you&apos;re responsible for
          activity under your account. We may suspend access if we suspect it&apos;s being
          misused.
        </p>

        <h2>Payment</h2>
        <p>
          Payment terms, including deposits, milestones, and what&apos;s covered by revisions,
          are set out in your project agreement or on the pricing page for the package you
          choose. Work on a project may pause if an invoice goes unpaid past its due date.
        </p>

        <h2>Ownership</h2>
        <p>
          Once a project is paid in full, you own the final deliverables — the design and code
          created specifically for your project. We keep the right to display completed work in
          our own portfolio, including on our <a href="/work">work page</a>, unless you ask us
          in writing not to. Third-party assets used in your project — stock photography,
          licensed fonts, plugins — stay subject to their own licenses.
        </p>

        <h2>Your content</h2>
        <p>
          You&apos;re responsible for the accuracy and legality of any content, images, or files
          you provide us or upload through the client portal, and you confirm you have the
          rights to use them.
        </p>

        <h2>No guaranteed results</h2>
        <p>
          We aim for outcomes like the ones shown in our case studies, but results depend on
          factors outside our control — your market, how the site is used after launch, and
          third-party platforms. We don&apos;t guarantee specific business results.
        </p>

        <h2>Limitation of liability</h2>
        <p>
          To the extent permitted by law, Egan Lab isn&apos;t liable for indirect, incidental,
          or consequential damages arising from your use of our services or this site. Our total
          liability for any claim is limited to the amount you paid us for the relevant service.
        </p>

        <h2>Termination</h2>
        <p>
          Either party can end an engagement under the terms set out in the project agreement.
          Portal access ends when the engagement it&apos;s tied to ends.
        </p>

        <h2>Governing law</h2>
        <p>
          These terms are governed by the laws of the State of North Carolina, without regard
          to its conflict-of-law principles.
        </p>

        <h2>Changes to these terms</h2>
        <p>
          If these terms change, we&apos;ll update the date at the top of this page. Continued
          use of the site after a change means you accept the update.
        </p>
      </LegalArticle>
      <Footer />
    </>
  );
}
