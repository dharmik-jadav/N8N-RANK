import type { Metadata } from "next";
import Link from "next/link";
import LegalPage, { Contact, Fill } from "@/components/LegalPage";
import { LEGAL } from "@/lib/legal";
import { LISTING_PRICE_USD } from "@/lib/pricing";

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
        <li>Your title, description, image and buy link are accurate and not misleading.</li>
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

      <h2>5. Listing fee and payments</h2>
      <p>
        Listing a workflow costs a one-time fee, currently <strong>US${LISTING_PRICE_USD}</strong>, shown before you pay. Payments
        are processed by PayPal and are also covered by PayPal&apos;s own terms. We never see or store your card or bank details. Your
        listing goes live once PayPal confirms the payment.
      </p>
      <p>
        Where we offer paid placement or bids for higher positions, the price, duration and rules are shown before you pay. A higher
        position can be outbid by other creators unless we say otherwise.
      </p>
      <p>
        <strong>Refunds.</strong> If you pay but your listing doesn&apos;t go live because of a problem on our side, contact us at{" "}
        <Contact /> with your PayPal receipt and we will publish it or refund you. Apart from that, fees are non-refundable, including
        when a listing is removed for breaking these terms. This doesn&apos;t limit any refund rights you have under the law where you live.
      </p>

      <h2>6. Rankings and results</h2>
      <p>
        Positions on the leaderboard are based on paid placement, clicks and how recently a workflow was listed, and they change over
        time. We do not promise any number of views, clicks or sales.
      </p>

      <h2>7. Buying a workflow</h2>
      <p>
        &quot;Buy&quot; buttons take you to websites run by the creator or by other companies, such as Gumroad or Lemon Squeezy. Any purchase
        is between you and that seller, under their terms. We are not part of that sale and are not responsible for the product, its
        quality, delivery, support or refunds. Always check a workflow before running it on your own systems or data.
      </p>

      <h2>8. Our site</h2>
      <p>
        The site&apos;s design, code, logo and content (other than content submitted by creators) belong to us. You may not copy, scrape
        or resell the site or its listings without our written permission.
      </p>

      <h2>9. Disclaimers</h2>
      <p>
        The site and all listings are provided &quot;as is&quot; and &quot;as available&quot;. We do not review every workflow and make no promises
        that any workflow is safe, accurate, legal or fit for your purpose, or that the site will always be available or error-free.
      </p>

      <h2>10. Limitation of liability</h2>
      <p>
        As far as the law allows, we are not liable for any indirect or consequential loss, or for lost profits, data or business,
        arising from your use of the site or any listed workflow. Our total liability to you for any claim is limited to the fees
        you paid us in the 12 months before the claim. Nothing in these terms limits liability that cannot be limited by law.
      </p>

      <h2>11. Your responsibility</h2>
      <p>
        If you break these terms or the law through a listing you submitted, you agree to cover reasonable costs and claims we face
        as a result, including legal fees.
      </p>

      <h2>12. Changes and ending your use</h2>
      <p>
        We may update these terms. The date at the top shows the latest version, and continuing to use the site means you accept the
        update. We may suspend or close the site, or any listing, at any time. To remove your listing, email <Contact /> with its link.
      </p>

      <h2>13. Governing law</h2>
      <p>
        These terms are governed by the laws of <Fill value={LEGAL.governingLaw} label="country or state" />, and its courts will
        handle any dispute, unless the law where you live gives you the right to bring a claim locally.
      </p>

      <h2>14. Contact</h2>
      <p>
        Questions about these terms: <Contact />. See also our <Link href="/privacy">Privacy Policy</Link>.
      </p>
    </LegalPage>
  );
}
