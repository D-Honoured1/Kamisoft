import { LegalDocumentLayout } from "@/components/legal/legal-document-layout"
import { TableOfContents } from "@/components/legal/table-of-contents"

export const dynamic = 'force-dynamic'

export default function CookiePolicyPage() {
  return (
    <div className="flex flex-col lg:flex-row gap-8">
      <div className="lg:order-2">
        <TableOfContents />
      </div>

      <div className="flex-1 lg:order-1">
        <LegalDocumentLayout
          title="Cookie Policy"
          description="Information about cookies and similar technologies we use"
          lastUpdated="December 15, 2024"
          effectiveDate="December 15, 2024"
        >
          <h2 id="introduction">1. Introduction</h2>
          <p>
            This Cookie Policy explains how Kamisoft Enterprises ("we," "our," or "us") uses cookies
            and similar technologies when you visit our website or use our services. It explains what
            these technologies are, why we use them, and your rights to control our use of them.
          </p>
          <p>
            This policy should be read alongside our{" "}
            <a href="/legal/privacy-policy" className="text-primary hover:underline">
              Privacy Policy
            </a>, which provides more information about how we collect, use, and protect your personal data.
          </p>

          <h2 id="what-are-cookies">2. What Are Cookies?</h2>
          <p>
            Cookies are small text files that are placed on your device (computer, smartphone, tablet)
            when you visit a website. They are widely used to make websites work more efficiently and
            to provide information to website owners.
          </p>
          <p>
            Cookies can be "persistent" or "session" cookies. Persistent cookies remain on your device
            until they expire or are deleted, while session cookies are temporary and are deleted when
            you close your browser.
          </p>

          <h2 id="types-of-cookies">3. Types of Cookies We Use</h2>

          <h3 id="essential-cookies">3.1 Essential Cookies</h3>
          <p>These cookies are strictly necessary for our website to function properly. They include:</p>
          <ul>
            <li>Security cookies to authenticate users and prevent fraudulent use</li>
            <li>Session cookies to maintain your session while navigating our site</li>
            <li>Load balancing cookies to ensure website stability</li>
            <li>Preference cookies to remember your settings and choices</li>
          </ul>
          <p>These cookies cannot be disabled as they are essential for the website's operation.</p>

          <h3 id="performance-cookies">3.2 Performance and Analytics Cookies</h3>
          <p>These cookies help us understand how visitors interact with our website by collecting anonymous information:</p>
          <ul>
            <li>Page views and visitor counts</li>
            <li>Time spent on pages</li>
            <li>Bounce rates and exit pages</li>
            <li>Browser and device information</li>
            <li>Traffic sources and referral URLs</li>
          </ul>
          <p>We use this information to improve our website's performance and user experience.</p>

          <h3 id="functional-cookies">3.3 Functional Cookies</h3>
          <p>These cookies enable enhanced functionality and personalization:</p>
          <ul>
            <li>Remembering your preferences and settings</li>
            <li>Storing your language and region preferences</li>
            <li>Remembering your login status</li>
            <li>Customizing content based on your interests</li>
          </ul>

          <h3 id="marketing-cookies">3.4 Marketing and Advertising Cookies</h3>
          <p>These cookies are used to deliver relevant advertisements and measure their effectiveness:</p>
          <ul>
            <li>Tracking your browsing behavior across websites</li>
            <li>Building a profile of your interests</li>
            <li>Delivering targeted advertisements</li>
            <li>Measuring advertising campaign performance</li>
            <li>Limiting the number of times you see an advertisement</li>
          </ul>

          <h2 id="third-party-cookies">4. Third-Party Cookies</h2>
          <p>We may use third-party services that place their own cookies on your device:</p>

          <h3 id="analytics-services">4.1 Analytics Services</h3>
          <ul>
            <li><strong>Google Analytics:</strong> Helps us understand website usage and performance</li>
            <li><strong>Hotjar:</strong> Provides heatmaps and user behavior insights</li>
            <li><strong>Microsoft Clarity:</strong> Offers session recordings and analytics</li>
          </ul>

          <h3 id="social-media">4.2 Social Media</h3>
          <ul>
            <li><strong>LinkedIn:</strong> For professional networking integration</li>
            <li><strong>Twitter:</strong> For social media sharing functionality</li>
            <li><strong>GitHub:</strong> For development portfolio integration</li>
          </ul>

          <h3 id="communication-tools">4.3 Communication Tools</h3>
          <ul>
            <li><strong>Email service providers:</strong> For newsletter and communication management</li>
            <li><strong>Customer support platforms:</strong> For chat and support functionality</li>
          </ul>

          <h3 id="payment-processors">4.4 Payment Processors</h3>
          <ul>
            <li><strong>Stripe:</strong> For secure payment processing</li>
            <li><strong>PayPal:</strong> For alternative payment options</li>
            <li><strong>Cryptocurrency payment processors:</strong> For digital currency transactions</li>
          </ul>

          <h2 id="cookie-consent">5. Cookie Consent and Management</h2>

          <h3 id="consent">5.1 Your Consent</h3>
          <p>
            By continuing to use our website, you consent to our use of cookies as described in this policy.
            For non-essential cookies, we will ask for your explicit consent before placing them on your device.
          </p>

          <h3 id="managing-cookies">5.2 Managing Cookies</h3>
          <p>You have several options for managing cookies:</p>

          <h4>Browser Settings</h4>
          <p>Most web browsers allow you to control cookies through their settings:</p>
          <ul>
            <li>Block all cookies</li>
            <li>Block third-party cookies only</li>
            <li>Delete existing cookies</li>
            <li>Receive notifications when cookies are set</li>
          </ul>

          <h4>Opt-Out Tools</h4>
          <p>You can opt out of specific tracking and advertising cookies using these tools:</p>
          <ul>
            <li>Google Analytics Opt-out: <a href="https://tools.google.com/dlpage/gaoptout" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">Google Analytics Opt-out Browser Add-on</a></li>
            <li>Network Advertising Initiative: <a href="http://www.networkadvertising.org/choices/" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">NAI Opt-out</a></li>
            <li>Digital Advertising Alliance: <a href="http://www.aboutads.info/choices/" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">DAA Opt-out</a></li>
          </ul>

          <h2 id="browser-instructions">6. Browser-Specific Instructions</h2>

          <h3 id="chrome">6.1 Google Chrome</h3>
          <p>Settings → Privacy and Security → Cookies and other site data</p>

          <h3 id="firefox">6.2 Mozilla Firefox</h3>
          <p>Settings → Privacy & Security → Enhanced Tracking Protection</p>

          <h3 id="safari">6.3 Safari</h3>
          <p>Preferences → Privacy → Manage Website Data</p>

          <h3 id="edge">6.4 Microsoft Edge</h3>
          <p>Settings → Site permissions → Cookies and site data</p>

          <h2 id="mobile-devices">7. Mobile Devices</h2>

          <h3 id="ios">7.1 iOS (iPhone/iPad)</h3>
          <p>Settings → Safari → Privacy & Security</p>

          <h3 id="android">7.2 Android</h3>
          <p>Chrome app → Settings → Site settings → Cookies</p>

          <h2 id="consequences">8. Consequences of Disabling Cookies</h2>
          <p>If you choose to disable cookies, some features of our website may not function properly:</p>
          <ul>
            <li>You may need to re-enter information more frequently</li>
            <li>Some personalization features may not work</li>
            <li>Website performance may be affected</li>
            <li>You may see less relevant content and advertisements</li>
            <li>Some interactive features may not function</li>
          </ul>

          <h2 id="updates-to-policy">9. Updates to This Cookie Policy</h2>
          <p>
            We may update this Cookie Policy from time to time to reflect changes in technology,
            legislation, or our cookie practices. We will notify you of any material changes by:
          </p>
          <ul>
            <li>Posting an updated policy on our website</li>
            <li>Displaying a prominent notice about the changes</li>
            <li>Sending email notifications to registered users</li>
          </ul>

          <h2 id="data-protection-rights">10. Your Data Protection Rights</h2>
          <p>Under applicable data protection laws, you have the right to:</p>
          <ul>
            <li>Access information about the cookies we use</li>
            <li>Request deletion of cookie data</li>
            <li>Object to certain types of cookie processing</li>
            <li>Withdraw consent for non-essential cookies</li>
            <li>Receive information about data transfers to third countries</li>
          </ul>

          <h2 id="international-transfers">11. International Transfers</h2>
          <p>
            Some of our third-party service providers may transfer cookie data to countries outside
            Nigeria. We ensure that such transfers comply with applicable data protection laws and
            include appropriate safeguards to protect your information.
          </p>

          <h2 id="contact-information">12. Contact Information</h2>
          <p>
            If you have questions about this Cookie Policy or our use of cookies, please contact us:
          </p>
          <div className="bg-muted/50 p-4 rounded-lg">
            <p><strong>Kamisoft Enterprises</strong></p>
            <p>Email: <a href="mailto:privacy@kamisoftenterprises.online" className="text-primary hover:underline">privacy@kamisoftenterprises.online</a></p>
            <p>General Contact: <a href="mailto:hello@kamisoftenterprises.online" className="text-primary hover:underline">hello@kamisoftenterprises.online</a></p>
            <p>Address: Lagos, Nigeria</p>
          </div>

          <h2 id="effective-date">13. Effective Date</h2>
          <p>
            This Cookie Policy is effective as of December 15, 2024, and was last updated on
            December 15, 2024.
          </p>
        </LegalDocumentLayout>
      </div>
    </div>
  )
}