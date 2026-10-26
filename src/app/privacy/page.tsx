import type { Metadata } from "next";
import Link from "next/link";
import LegalPage, { Contact, Fill } from "@/components/LegalPage";
import { LEGAL } from "@/lib/legal";
import { CookieSettingsButton } from "@/components/Analytics";

export const metadata: Metadata = {
  title: "Privacy Policy – n8n Rank",
  description: "What information n8n Rank collects, why, and the choices you have.",
};

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      intro={`${LEGAL.siteName} doesn't have user accounts and doesn't use advertising trackers. If you accept analytics cookies, we use Google Analytics to count visits. This page explains the small amount of information we do handle, why we need it, and how to ask us to delete it.`}
    >
      <h2>1. Who is responsible</h2>
      <p>
        {LEGAL.siteName} is run by <Fill value={LEGAL.operator} label="operator name" />, which is responsible for your information
        under this policy. Contact: <Contact />.
      </p>

      <h2>2. What we collect</h2>
      <p><strong>When you browse the site</strong></p>
      <ul>
        <li>
          Like any website, our hosting providers automatically process technical data such as your IP address, browser type and the
          pages you request, to deliver the site and keep it secure.
        </li>
        <li>
          Only if you accept analytics cookies, we use Google Analytics to measure how the site is used: the pages you view, how you arrived, your approximate location
          (from your IP address, which Google Analytics does not store in full), and your device, browser and screen size. It does not
          receive your name or email.
        </li>
      </ul>
      <p><strong>When you submit a workflow</strong></p>
      <ul>
        <li>The workflow JSON file you upload.</li>
        <li>The title, description, category, image and buy link you enter. These are shown publicly on your listing, along with the price paid for its leaderboard position.</li>
        <li>
          An anonymous ID stored in a cookie, which links your submission and payment to your browser. It doesn&apos;t contain your name
          or email.
        </li>
      </ul>
      <p>
        Your full workflow JSON is not shown publicly. We only show a diagram of its node names, types and connections. Please
        remove any credentials or personal data from the file before uploading it.
      </p>
      <p><strong>When you save workflows or share a list</strong></p>
      <ul>
        <li>The workflows you save, linked to the same anonymous ID (no name or email).</li>
        <li>
          If you create a shareable list, its name and the workflows in it. <strong>Anyone with the link can see them</strong>, so
          please don&apos;t put personal information in the list name.
        </li>
      </ul>
      <p><strong>When you contact us</strong></p>
      <ul>
        <li>
          The mobile number, email address and message you enter on the <Link href="/contact">Contact page</Link>. We use them only to
          reply to you, and keep them in our database until we&apos;ve dealt with your request (or as long as the law requires).
        </li>
      </ul>
      <p><strong>When you pay</strong></p>
      <ul>
        <li>
          Payments are handled by PayPal. You enter your payment details with PayPal, not with us, and we never receive your card or
          bank details. We store the PayPal order ID, the amount, the payment status and the leaderboard position you bought, so we can publish your listing, rank it correctly and handle refunds.
        </li>
      </ul>

      <h2>3. Why we use it</h2>
      <ul>
        <li>To publish and display your listing, rank it, and take payment for it. We need this to provide the service you asked for.</li>
        <li>To remember your saved workflows and shared list. We need this to provide the feature you asked for.</li>
        <li>To prevent spam, fraud and abuse, and to keep the site secure. This is our legitimate interest.</li>
        <li>To understand which pages are useful and improve the site, using Google Analytics, only if you accept analytics cookies. This is based on your consent.</li>
        <li>To keep payment records and meet tax and accounting rules. This is a legal obligation.</li>
      </ul>
      <p>We don&apos;t sell your information, use it for advertising, or make automated decisions about you.</p>

      <h2 id="cookies">4. Cookies</h2>
      <ul>
        <li>
          <strong>vid</strong>: an anonymous visitor ID, set the first time you submit a workflow, save a workflow or create a list. It ties
          your submissions, payments and saved workflows to your browser, and lasts up to 2 years. It is essential for those features, so
          there is no option to turn it off. If you never use them, it is never set.
        </li>
        <li>
          <strong>_ga, _ga_*</strong>: set by Google Analytics to tell visitors apart and count visits. They are only set if you accept, and last up to 2 years.
        </li>
        <li>
          <strong>PayPal</strong>: when the checkout loads, PayPal may set its own cookies for payment and fraud prevention. See{" "}
          <a href="https://www.paypal.com/myaccount/privacy/privacyhub" target="_blank" rel="noopener noreferrer">PayPal&apos;s privacy statement</a>.
        </li>
      </ul>
      <p>
        We don&apos;t use advertising or social-media tracking cookies. Analytics stays off until you accept. You can change your choice at any time:{" "}
        <CookieSettingsButton />.
      </p>

      <h2>5. Who we share it with</h2>
      <p>We only share information with companies that help us run the site, and only for that purpose:</p>
      <ul>
        <li><strong>Supabase</strong>: database and file storage for listings and images.</li>
        <li><strong>PayPal</strong>: payment processing.</li>
        <li><strong>Google Analytics</strong>: website usage statistics.</li>
        <li><strong><Fill value={LEGAL.hostingProvider} label="hosting provider" /></strong>: website hosting.</li>
      </ul>
      <p>
        Some information is public by design: your listing, its buy link, and the price attached to its leaderboard position.
      </p>
      <p>
        We may also share information if the law requires it, or to protect our rights or the safety of others. When you click a
        buy link, you leave our site and the seller&apos;s own privacy policy applies.
      </p>
      <p>
        These providers may store data outside your country. Where the law requires it, they protect it with safeguards such as
        standard contractual clauses.
      </p>

      <h2>6. How long we keep it</h2>
      <ul>
        <li>Published listings: until you ask us to remove them, or we remove them.</li>
        <li>Unpaid submissions: drafts that never reached PayPal are deleted automatically after about 24 hours.</li>
        <li>Saved workflows and shared lists: until you remove them, or you ask us to delete them.</li>
        <li>Contact messages: until we have dealt with your request, or as long as the law requires.</li>
        <li>Payment records: for as long as tax and accounting law requires.</li>
      </ul>

      <h2>7. Your rights</h2>
      <p>
        Depending on where you live (for example under the GDPR in the EU and UK, or CCPA in California), you may have the right to
        see, correct, delete or export your information, or to object to how we use it. Because there are no accounts, email{" "}
        <Contact /> with the link to your listing, shared list or your PayPal order ID, so we can confirm it&apos;s yours. We&apos;ll reply within 30
        days. You can also complain to your local data protection authority.
      </p>

      <h2>8. Security</h2>
      <p>
        Data is sent over HTTPS. Your workflow JSON and payment records can only be read by our server, not by the public site. No
        system is perfectly secure, but we work to protect your information.
      </p>

      <h2>9. Children</h2>
      <p>The site is not meant for anyone under 18, and we don&apos;t knowingly collect information from children.</p>

      <h2>10. Changes</h2>
      <p>
        If we change this policy, we&apos;ll update the date at the top of this page. Questions: <Contact />. See also our{" "}
        <Link href="/terms">Terms and Conditions</Link>.
      </p>
    </LegalPage>
  );
}
