import { LegalDocumentLayout } from "@/components/legal/legal-document-layout"
import { TableOfContents } from "@/components/legal/table-of-contents"

export const dynamic = 'force-dynamic'

export default function PrivacyPolicyPage() {
  return (
    <div className="flex flex-col lg:flex-row gap-8">
      <div className="lg:order-2">
        <TableOfContents />
      </div>

      <div className="flex-1 lg:order-1">
        <LegalDocumentLayout
          title="Privacy Policy"
          description="How we collect, use, and protect your personal information"
          lastUpdated="December 15, 2024"
          effectiveDate="December 15, 2024"
        >
          <h2 id="introduction">1. Introduction</h2>
          <p>
            Kamisoft Enterprises ("we," "our," or "us") is committed to protecting your privacy.
            This Privacy Policy explains how we collect, use, disclose, and safeguard your
            information when you visit our website, use our services, or engage with us in any capacity.
          </p>
          <p>
            Please read this Privacy Policy carefully. If you do not agree with the terms of
            this Privacy Policy, please do not access our website or use our services.
          </p>

          <h2 id="information-we-collect">2. Information We Collect</h2>

          <h3 id="personal-information">2.1 Personal Information</h3>
          <p>We may collect personal information that you voluntarily provide to us when you:</p>
          <ul>
            <li>Contact us through our website or email</li>
            <li>Request our services or consultations</li>
            <li>Subscribe to our newsletter or marketing communications</li>
            <li>Participate in surveys, contests, or promotions</li>
            <li>Create an account with us</li>
          </ul>
          <p>This information may include:</p>
          <ul>
            <li>Name and contact information (email address, phone number, mailing address)</li>
            <li>Business information (company name, job title, industry)</li>
            <li>Project requirements and technical specifications</li>
            <li>Payment information (processed securely through third-party providers)</li>
            <li>Communication preferences</li>
          </ul>

          <h3 id="automatically-collected-information">2.2 Automatically Collected Information</h3>
          <p>When you visit our website, we may automatically collect certain information, including:</p>
          <ul>
            <li>IP address and location data</li>
            <li>Browser type and version</li>
            <li>Operating system</li>
            <li>Referral URLs</li>
            <li>Pages viewed and time spent on our website</li>
            <li>Device information and screen resolution</li>
          </ul>

          <h2 id="how-we-use-information">3. How We Use Your Information</h2>
          <p>We may use the information we collect for various purposes, including:</p>
          <ul>
            <li>Providing, maintaining, and improving our services</li>
            <li>Processing service requests and managing client relationships</li>
            <li>Communicating with you about projects, updates, and promotional offers</li>
            <li>Analyzing website usage and optimizing user experience</li>
            <li>Ensuring the security and integrity of our systems</li>
            <li>Complying with legal obligations and resolving disputes</li>
            <li>Developing new products and services</li>
            <li>Sending administrative information and service updates</li>
          </ul>

          <h2 id="information-sharing">4. Information Sharing and Disclosure</h2>
          <p>We do not sell, trade, or rent your personal information to third parties. We may share your information only in the following circumstances:</p>

          <h3 id="service-providers">4.1 Service Providers</h3>
          <p>We may share information with trusted third-party service providers who assist us in:</p>
          <ul>
            <li>Website hosting and maintenance</li>
            <li>Payment processing</li>
            <li>Email marketing and communication</li>
            <li>Analytics and performance monitoring</li>
            <li>Customer support services</li>
          </ul>

          <h3 id="legal-compliance">4.2 Legal Compliance</h3>
          <p>We may disclose your information if required to do so by law or in good faith belief that such disclosure is necessary to:</p>
          <ul>
            <li>Comply with legal processes or government requests</li>
            <li>Enforce our terms of service</li>
            <li>Protect our rights, property, or safety</li>
            <li>Protect the rights, property, or safety of our users or others</li>
          </ul>

          <h2 id="data-security">5. Data Security</h2>
          <p>
            We implement appropriate technical and organizational security measures to protect
            your personal information against unauthorized access, alteration, disclosure, or destruction.
            These measures include:
          </p>
          <ul>
            <li>Encryption of data in transit and at rest</li>
            <li>Regular security assessments and updates</li>
            <li>Access controls and employee training</li>
            <li>Secure coding practices and vulnerability management</li>
            <li>Regular backups and disaster recovery procedures</li>
          </ul>
          <p>
            However, no method of transmission over the internet or electronic storage is 100% secure.
            While we strive to use commercially acceptable means to protect your information,
            we cannot guarantee absolute security.
          </p>

          <h2 id="data-retention">6. Data Retention</h2>
          <p>
            We retain personal information for as long as necessary to fulfill the purposes outlined
            in this Privacy Policy, unless a longer retention period is required or permitted by law.
            When determining retention periods, we consider:
          </p>
          <ul>
            <li>The nature and sensitivity of the information</li>
            <li>Our ongoing relationship with you</li>
            <li>Legal and regulatory requirements</li>
            <li>Our legitimate business interests</li>
          </ul>

          <h2 id="your-rights">7. Your Rights and Choices</h2>
          <p>You have certain rights regarding your personal information, including:</p>
          <ul>
            <li><strong>Access:</strong> Request information about the personal data we hold about you</li>
            <li><strong>Correction:</strong> Request correction of inaccurate or incomplete information</li>
            <li><strong>Deletion:</strong> Request deletion of your personal information (subject to legal requirements)</li>
            <li><strong>Portability:</strong> Request a copy of your data in a structured format</li>
            <li><strong>Opt-out:</strong> Unsubscribe from marketing communications at any time</li>
            <li><strong>Restriction:</strong> Request limitation of processing in certain circumstances</li>
          </ul>
          <p>
            To exercise these rights, please contact us at{" "}
            <a href="mailto:support@kamisoftenterprises.online" className="text-primary hover:underline">
              support@kamisoftenterprises.online
            </a>
          </p>

          <h2 id="cookies-tracking">8. Cookies and Tracking Technologies</h2>
          <p>
            We use cookies and similar tracking technologies to enhance your experience on our website.
            For detailed information about our use of cookies, please see our{" "}
            <a href="/legal/cookie-policy" className="text-primary hover:underline">
              Cookie Policy
            </a>.
          </p>

          <h2 id="third-party-links">9. Third-Party Links and Services</h2>
          <p>
            Our website may contain links to third-party websites or services that are not owned
            or controlled by us. We are not responsible for the privacy practices of these third parties.
            We encourage you to review their privacy policies before providing any personal information.
          </p>

          <h2 id="international-transfers">10. International Data Transfers</h2>
          <p>
            As we operate globally, your information may be transferred to and processed in countries
            other than your own. We ensure that such transfers comply with applicable data protection
            laws and implement appropriate safeguards to protect your information.
          </p>

          <h2 id="children-privacy">11. Children's Privacy</h2>
          <p>
            Our services are not directed to individuals under the age of 18. We do not knowingly
            collect personal information from children under 18. If we become aware that we have
            collected personal information from a child under 18, we will take steps to delete such information.
          </p>

          <h2 id="changes-to-policy">12. Changes to This Privacy Policy</h2>
          <p>
            We may update this Privacy Policy from time to time to reflect changes in our practices,
            technology, legal requirements, or other factors. We will notify you of any material
            changes by:
          </p>
          <ul>
            <li>Posting the updated policy on our website</li>
            <li>Sending an email notification to registered users</li>
            <li>Displaying a prominent notice on our website</li>
          </ul>
          <p>
            Your continued use of our services after any changes indicates your acceptance of the
            updated Privacy Policy.
          </p>

          <h2 id="contact-information">13. Contact Information</h2>
          <p>
            If you have questions, concerns, or requests regarding this Privacy Policy or our
            data practices, please contact us:
          </p>
          <div className="bg-muted/50 p-4 rounded-lg">
            <p><strong>Kamisoft Enterprises</strong></p>
            <p>Email: <a href="mailto:support@kamisoftenterprises.online" className="text-primary hover:underline">support@kamisoftenterprises.online</a></p>
            <p>General Contact: <a href="mailto:support@kamisoftenterprises.online" className="text-primary hover:underline">support@kamisoftenterprises.online</a></p>
            <p>Address: Lagos, Nigeria</p>
          </div>

          <h2 id="effective-date">14. Effective Date</h2>
          <p>
            This Privacy Policy is effective as of December 15, 2024, and was last updated on
            December 15, 2024.
          </p>
        </LegalDocumentLayout>
      </div>
    </div>
  )
}