import type { Metadata } from "next";
import Link from "next/link";
import LegalPage, { Contact, Fill } from "@/components/LegalPage";
import { LEGAL } from "@/lib/legal";
import { FIRST_LISTING_CENTS, MIN_BID_CENTS, STEP_CENTS, TOP_STEP_CENTS, usd } from "@/lib/pricing";

export const metadata: Metadata = {
  title: "Terms and Conditions – n8n Rank",
  description: "The rules for listing, ranking and promoting n8n workflows on n8n Rank.",
};

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms and Conditions"
      intro={`These terms apply to everyone who visits ${LEGAL.siteName}, and to anyone who submits, pays for or promotes a workflow on it. By using the site you agree to them. If you don't agree, please don't use the site.`}
    >
      <h2>1. Who we are</h2>
      <p>
        {LEGAL.siteName} (&quot;we&quot;, &quot;us&quot;) is run by <Fill value={LEGAL.operator} label="operator name" />. It is a
        directory and leaderboard where creators list n8n workflows and builders discover them. You can reach us at <Contact />.
      </p>
      <p>
        {LEGAL.siteName} is an independent project. It is <strong>not affiliated with, endorsed by or sponsored by n8n GmbH</strong>.
        &quot;n8n&quot; is a trademark of its owner and is used here only to describe the workflows listed.
      </p>

      <h2>2. Who can use the site</h2>
      <p>
        You must be at least 18 years old, or the age of majority where you live, to submit or pay for a listing. If you act for a
        business, you confirm you are allowed to accept these terms on its behalf.
      </p>

      <h2>3. Submitting a workflow</h2>
      <p>When you submit a workflow you confirm that:</p>
      <ul>
        <li>You created the workflow, or you have every right needed to list and sell it.</li>
        <li>Your title, description, image and buy link are accurate and not misleading. A buy link is required for every listing.</li>
        <li>
          You have <strong>removed any credentials, API keys, tokens, passwords or personal data</strong> from the workflow JSON
          before uploading it. You are responsible for anything left in the file.
        </li>
        <li>The workflow and the page your buy link points to are legal and follow the rules in section 4.</li>
      </ul>
      <p>
        You keep ownership of your workflow. You give us a worldwide, non-exclusive, royalty-free licence to store it, and to show
        its title, description, category, image and a diagram generated from it on the site and when promoting the site, for as
        long as it is listed. We do not publish your full workflow JSON. Only the diagram (node names, types and connections) is shown publicly.
      </p>

      <h2>4. What isn&apos;t allowed</h2>
      <ul>
        <li>Workflows or buy links that are illegal, fraudulent, or infringe someone else&apos;s copyright, trademark or other rights.</li>
        <li>Malware, phishing, spam tools, or workflows built to scrape, harass or track people without their consent.</li>
        <li>Adult, hateful or violent content, or content that exploits minors.</li>
        <li>Copying someone else&apos;s workflow and listing it as your own.</li>
        <li>Faking clicks or rankings, or interfering with the site, its payments or its security.</li>
      </ul>
      <p>We may remove any listing that breaks these rules, or that we reasonably believe puts users or the site at risk, with or without notice.</p>

      <h2>5. Pricing, positions and payments</h2>
      <p>
        There is no separate listing fee. To list a workflow you pay for the <strong>leaderboard position</strong> you choose. The price
        is always shown in US dollars before you pay, and is never lower than <strong>US${usd(MIN_BID_CENTS)}</strong> (except for the very first listing on an empty leaderboard, which is <strong>US${usd(FIRST_LISTING_CENTS)}</strong>).
      </p>
      <ul>
        <li>
          <strong>How the price is set.</strong> To take a position you pay the current price of that position plus US${usd(STEP_CENTS)}, or plus
          US${usd(TOP_STEP_CENTS)} for the top position (#1). The workflow that held the position moves down one place.
        </li>
        <li>
          <strong>Open position.</strong> If you choose the first open position below the paid listings, you pay the minimum of US${usd(MIN_BID_CENTS)}.
        </li>
        <li>
          <strong>Prices can change.</strong> Other creators can pay for positions at any time. We recalculate the price when you pay, and if it has
          changed we will show you the new total before anything is charged.
        </li>
        <li>
          <strong>Being outbid.</strong> A position you pay for can be taken by another creator who pays more. Unless we say otherwise when you pay,
          your position lasts until someone outbids it or the listing is removed. Being outbid does not entitle you to a refund.
        </li>
      </ul>
      <p>
        Payments are processed by PayPal and are also covered by PayPal&apos;s own terms. We never see or store your card or bank details.
        Your listing goes live once PayPal confirms the payment. Until then it is saved as a hidden draft, and unpaid drafts may be deleted.
      </p>
      <p>
        <strong>No refunds once listed.</strong> Once your payment is complete and your workflow is listed, the payment is{" "}
        <strong>non-refundable</strong>. That includes when you are outbid, when you change your mind, and when a listing is removed
        for breaking these terms.
      </p>
      <p>
        <strong>If it doesn&apos;t go live.</strong> If you pay but your listing doesn&apos;t go live because of a problem on our side, contact us at{" "}
        <Contact /> with your PayPal receipt and we will publish it or refund you. This doesn&apos;t limit any refund rights you have under
        the law where you live.
      </p>

      <h2>6. Rankings and results</h2>
      <p>
        Workflows are ranked by the highest position price paid first, then by clicks, then by how recently they were listed. Rankings
        change over time as creators pay for positions. The price attached to a position is shown publicly. We do not promise any number
        of views, clicks or sales.
      </p>

      <h2>7. Buying a workflow</h2>
      <p>
        &quot;Buy&quot; buttons take you to websites run by the creator or by other companies, such as Gumroad or Lemon Squeezy. Any purchase
        is between you and that seller, under their terms. We are not part of that sale and are not responsible for the product, its
        quality, delivery, support or refunds. Always check a workflow before running it on your own systems or data.
      </p>

      <h2>8. Saved workflows and shared lists</h2>
      <p>
        You can save workflows without an account. Your saved workflows are linked to an anonymous ID in your browser, so they are only
        there on the same browser, and clearing your cookies removes access to them. You can also create a shareable list. Anyone who
        has its link can see the list&apos;s name and the workflows in it, so don&apos;t put personal or private information in the name.
        We may remove a list that breaks section 4.
      </p>

      <h2>9. Our site</h2>
      <p>
        The site&apos;s design, code, logo and content (other than content submitted by creators) belong to us. You may not copy, scrape
        or resell the site or its listings without our written permission.
      </p>

      <h2>10. Disclaimers</h2>
      <p>
        The site and all listings are provided &quot;as is&quot; and &quot;as available&quot;. We do not review every workflow and make no promises
        that any workflow is safe, accurate, legal or fit for your purpose, or that the site will always be available or error-free.
      </p>

      <h2>11. Limitation of liability</h2>
      <p>
        As far as the law allows, we are not liable for any indirect or consequential loss, or for lost profits, data or business,
        arising from your use of the site or any listed workflow. Our total liability to you for any claim is limited to the fees
        you paid us in the 12 months before the claim. Nothing in these terms limits liability that cannot be limited by law.
      </p>

      <h2>12. Your responsibility</h2>
      <p>
        If you break these terms or the law through a listing you submitted, you agree to cover reasonable costs and claims we face
        as a result, including legal fees.
      </p>

      <h2>13. Changes and ending your use</h2>
      <p>
        We may update these terms. The date at the top shows the latest version, and continuing to use the site means you accept the
        update. We may suspend or close the site, or any listing, at any time. To remove your listing, email <Contact /> with its link.
      </p>

      <h2>14. Governing law</h2>
      <p>
        These terms are governed by the laws of <Fill value={LEGAL.governingLaw} label="country or state" />, and its courts will
        handle any dispute, unless the law where you live gives you the right to bring a claim locally.
      </p>

      <h2>15. Contact</h2>
      <p>
        Questions about these terms: <Contact /> or use our <Link href="/contact">Contact page</Link>. Please don&apos;t send us anything unlawful or
        abusive. See also our <Link href="/privacy">Privacy Policy</Link>.
      </p>
    </LegalPage>
  );
}
