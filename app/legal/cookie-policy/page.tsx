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
          title="Cookies Policy"
          description="Information about cookies and similar technologies we use"
          lastUpdated="September 29, 2025"
          effectiveDate="September 29, 2025"
        >
          <p>
            This Cookies Policy explains what Cookies are and how We use them. You should read this policy so You can understand what type of cookies We use, or the information We collect using Cookies and how that information is used.
          </p>
          <p>
            Cookies do not typically contain any information that personally identifies a user, but personal information that we store about You may be linked to the information stored in and obtained from Cookies. For further information on how We use, store and keep your personal data secure, see our <a href="/legal/privacy-policy" className="text-primary hover:underline">Privacy Policy</a>.
          </p>
          <p>
            We do not store sensitive personal information, such as mailing addresses, account passwords, etc. in the Cookies We use.
          </p>

          <h2 id="interpretation-definitions">Interpretation and Definitions</h2>

          <h3 id="interpretation">Interpretation</h3>
          <p>
            The words whose initial letters are capitalized have meanings defined under the following conditions. The following definitions shall have the same meaning regardless of whether they appear in singular or in plural.
          </p>

          <h3 id="definitions">Definitions</h3>
          <p>For the purposes of this Cookies Policy:</p>
          <ul>
            <li><strong>Company</strong> (referred to as either "the Company", "We", "Us" or "Our" in this Cookies Policy) refers to Kamisoft Enterprises, Lagos, Nigeria.</li>
            <li><strong>Cookies</strong> means small files that are placed on Your computer, mobile device or any other device by a website, containing details of your browsing history on that website among its many uses.</li>
            <li><strong>Website</strong> refers to Kamisoft Enterprises, accessible from <a href="https://www.kamisoftenterprises.online" className="text-primary hover:underline">https://www.kamisoftenterprises.online</a></li>
            <li><strong>You</strong> means the individual accessing or using the Website, or a company, or any legal entity on behalf of which such individual is accessing or using the Website, as applicable.</li>
          </ul>

          <h2 id="use-of-cookies">The Use of the Cookies</h2>

          <h3 id="type-of-cookies">Type of Cookies We Use</h3>
          <p>
            Cookies can be "Persistent" or "Session" Cookies. Persistent Cookies remain on your personal computer or mobile device when You go offline, while Session Cookies are deleted as soon as You close your web browser.
          </p>
          <p>
            We use both session and persistent Cookies for the purposes set out below:
          </p>

          <h4 id="necessary-cookies">Necessary / Essential Cookies</h4>
          <p><strong>Type:</strong> Session Cookies</p>
          <p><strong>Administered by:</strong> Us</p>
          <p>
            <strong>Purpose:</strong> These Cookies are essential to provide You with services available through the Website and to enable You to use some of its features. They help to authenticate users and prevent fraudulent use of user accounts. Without these Cookies, the services that You have asked for cannot be provided, and We only use these Cookies to provide You with those services.
          </p>

          <h4 id="functionality-cookies">Functionality Cookies</h4>
          <p><strong>Type:</strong> Persistent Cookies</p>
          <p><strong>Administered by:</strong> Us</p>
          <p>
            <strong>Purpose:</strong> These Cookies allow us to remember choices You make when You use the Website, such as remembering your login details or language preference. The purpose of these Cookies is to provide You with a more personal experience and to avoid You having to re-enter your preferences every time You use the Website.
          </p>

          <h2 id="your-choices">Your Choices Regarding Cookies</h2>
          <p>
            If You prefer to avoid the use of Cookies on the Website, first You must disable the use of Cookies in your browser and then delete the Cookies saved in your browser associated with this website. You may use this option for preventing the use of Cookies at any time.
          </p>
          <p>
            If You do not accept Our Cookies, You may experience some inconvenience in your use of the Website and some features may not function properly.
          </p>
          <p>
            If You'd like to delete Cookies or instruct your web browser to delete or refuse Cookies, please visit the help pages of your web browser.
          </p>

          <h3 id="browser-instructions">Browser-Specific Instructions</h3>
          <ul>
            <li>
              <strong>Chrome web browser:</strong> Please visit this page from Google: <a href="https://support.google.com/accounts/answer/32050" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">https://support.google.com/accounts/answer/32050</a>
            </li>
            <li>
              <strong>Internet Explorer web browser:</strong> Please visit this page from Microsoft: <a href="http://support.microsoft.com/kb/278835" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">http://support.microsoft.com/kb/278835</a>
            </li>
            <li>
              <strong>Firefox web browser:</strong> Please visit this page from Mozilla: <a href="https://support.mozilla.org/en-US/kb/delete-cookies-remove-info-websites-stored" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">https://support.mozilla.org/en-US/kb/delete-cookies-remove-info-websites-stored</a>
            </li>
            <li>
              <strong>Safari web browser:</strong> Please visit this page from Apple: <a href="https://support.apple.com/guide/safari/manage-cookies-and-website-data-sfri11471/mac" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">https://support.apple.com/guide/safari/manage-cookies-and-website-data-sfri11471/mac</a>
            </li>
            <li>
              <strong>For any other web browser:</strong> Please visit your web browser's official web pages.
            </li>
          </ul>

          <h2 id="more-information">More Information about Cookies</h2>
          <p>
            You can learn more about cookies: <a href="https://www.freeprivacypolicy.com/blog/cookies/" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">Cookies: What Do They Do?</a>
          </p>

          <h2 id="contact-us">Contact Us</h2>
          <p>If you have any questions about this Cookies Policy, You can contact us:</p>
          <ul>
            <li>By email: <a href="mailto:support@kamisoftenterprises.online" className="text-primary hover:underline">support@kamisoftenterprises.online</a></li>
            <li>By visiting this page on our website: <a href="https://www.kamisoftenterprises.online/contact" className="text-primary hover:underline">https://www.kamisoftenterprises.online/contact</a></li>
          </ul>
        </LegalDocumentLayout>
      </div>
    </div>
  )
}