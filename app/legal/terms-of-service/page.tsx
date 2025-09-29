import { LegalDocumentLayout } from "@/components/legal/legal-document-layout"
import { TableOfContents } from "@/components/legal/table-of-contents"

export const dynamic = 'force-dynamic'

export default function TermsOfServicePage() {
  return (
    <div className="flex flex-col lg:flex-row gap-8">
      <div className="lg:order-2">
        <TableOfContents />
      </div>

      <div className="flex-1 lg:order-1">
        <LegalDocumentLayout
          title="Terms of Service"
          description="Terms and conditions for using our services"
          lastUpdated="December 15, 2024"
          effectiveDate="December 15, 2024"
        >
          <h2 id="acceptance-of-terms">1. Acceptance of Terms</h2>
          <p>
            By accessing and using the services provided by Kamisoft Enterprises ("Company," "we," "our," or "us"),
            you ("Client," "you," or "your") agree to be bound by these Terms of Service ("Terms").
            If you do not agree to these Terms, please do not use our services.
          </p>
          <p>
            These Terms constitute a legally binding agreement between you and Kamisoft Enterprises,
            a subsidiary of Amor Group, located in Lagos, Nigeria.
          </p>

          <h2 id="description-of-services">2. Description of Services</h2>
          <p>Kamisoft Enterprises provides comprehensive software development services, including but not limited to:</p>
          <ul>
            <li>Full-stack web application development</li>
            <li>Mobile application development</li>
            <li>Blockchain and cryptocurrency solutions</li>
            <li>Fintech platform development</li>
            <li>Custom software development</li>
            <li>Technical consulting and advisory services</li>
            <li>System integration and API development</li>
            <li>Maintenance and support services</li>
          </ul>

          <h2 id="client-responsibilities">3. Client Responsibilities</h2>

          <h3 id="project-information">3.1 Project Information</h3>
          <p>Clients must provide:</p>
          <ul>
            <li>Clear and complete project requirements</li>
            <li>Necessary access credentials and permissions</li>
            <li>Timely feedback and approvals</li>
            <li>All relevant business information and documentation</li>
            <li>Compliance with all applicable laws and regulations</li>
          </ul>

          <h3 id="communication">3.2 Communication</h3>
          <p>Clients agree to:</p>
          <ul>
            <li>Maintain regular communication throughout the project</li>
            <li>Respond to requests for information within reasonable timeframes</li>
            <li>Participate in scheduled meetings and reviews</li>
            <li>Designate authorized representatives for decision-making</li>
          </ul>

          <h2 id="payment-terms">4. Payment Terms</h2>

          <h3 id="fees-payment">4.1 Fees and Payment</h3>
          <ul>
            <li>All fees are quoted in US Dollars (USD) unless otherwise specified</li>
            <li>Payment schedules and methods will be detailed in individual service agreements</li>
            <li>We accept various payment methods including bank transfers, cryptocurrency, and online payment platforms</li>
            <li>Late payments may incur additional fees as specified in service agreements</li>
          </ul>

          <h3 id="project-changes">4.2 Project Changes</h3>
          <p>
            Any changes to project scope, timeline, or requirements may result in additional costs.
            All changes must be approved in writing before implementation.
          </p>

          <h2 id="intellectual-property">5. Intellectual Property</h2>

          <h3 id="client-content">5.1 Client Content</h3>
          <p>
            Clients retain all rights to their existing intellectual property, content, and data
            provided to us for the project.
          </p>

          <h3 id="developed-solutions">5.2 Developed Solutions</h3>
          <p>
            Upon full payment of all fees, clients will receive ownership or appropriate licensing
            rights to custom-developed solutions as specified in individual service agreements.
          </p>

          <h3 id="proprietary-tools">5.3 Proprietary Tools and Methodologies</h3>
          <p>
            Kamisoft Enterprises retains all rights to our proprietary development tools,
            methodologies, and general knowledge gained during projects.
          </p>

          <h2 id="confidentiality">6. Confidentiality</h2>
          <p>We commit to:</p>
          <ul>
            <li>Maintaining strict confidentiality of all client information</li>
            <li>Using client information solely for project purposes</li>
            <li>Implementing appropriate security measures to protect confidential data</li>
            <li>Not disclosing client information to third parties without written consent</li>
            <li>Executing additional non-disclosure agreements when required</li>
          </ul>

          <h2 id="project-delivery">7. Project Delivery and Acceptance</h2>

          <h3 id="delivery-timelines">7.1 Delivery Timelines</h3>
          <p>
            Project timelines are estimates based on the information available at project initiation.
            Delays may occur due to factors including but not limited to:
          </p>
          <ul>
            <li>Changes in project scope or requirements</li>
            <li>Delayed client feedback or approvals</li>
            <li>Third-party service dependencies</li>
            <li>Technical challenges or unforeseen complications</li>
          </ul>

          <h3 id="testing-acceptance">7.2 Testing and Acceptance</h3>
          <p>
            All deliverables will undergo thorough testing before delivery. Clients have a reasonable
            period to review and test deliverables before final acceptance.
          </p>

          <h2 id="support-maintenance">8. Support and Maintenance</h2>
          <p>
            Post-delivery support and maintenance services are available under separate agreements.
            We provide various levels of support including:
          </p>
          <ul>
            <li>Bug fixes and security updates</li>
            <li>Performance optimization</li>
            <li>Feature enhancements</li>
            <li>Technical support and consultation</li>
            <li>System monitoring and maintenance</li>
          </ul>

          <h2 id="warranties-disclaimers">9. Warranties and Disclaimers</h2>

          <h3 id="service-warranty">9.1 Service Warranty</h3>
          <p>We warrant that our services will be performed with professional skill and care in accordance with industry standards.</p>

          <h3 id="disclaimer">9.2 Disclaimer</h3>
          <p>
            EXCEPT AS EXPRESSLY PROVIDED IN THESE TERMS, OUR SERVICES ARE PROVIDED "AS IS"
            WITHOUT WARRANTIES OF ANY KIND, WHETHER EXPRESS OR IMPLIED, INCLUDING BUT NOT
            LIMITED TO MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR NON-INFRINGEMENT.
          </p>

          <h2 id="limitation-liability">10. Limitation of Liability</h2>
          <p>
            TO THE MAXIMUM EXTENT PERMITTED BY LAW, KAMISOFT ENTERPRISES' TOTAL LIABILITY
            FOR ANY CLAIMS RELATING TO OUR SERVICES SHALL NOT EXCEED THE TOTAL AMOUNT PAID
            BY THE CLIENT FOR THE SPECIFIC SERVICE GIVING RISE TO THE CLAIM.
          </p>
          <p>
            WE SHALL NOT BE LIABLE FOR INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR
            PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO LOSS OF PROFITS, DATA, OR BUSINESS INTERRUPTION.
          </p>

          <h2 id="indemnification">11. Indemnification</h2>
          <p>
            Clients agree to indemnify and hold harmless Kamisoft Enterprises from any claims,
            damages, or expenses arising from:
          </p>
          <ul>
            <li>Client's use of our services</li>
            <li>Client's breach of these Terms</li>
            <li>Client's violation of any laws or third-party rights</li>
            <li>Content or data provided by the client</li>
          </ul>

          <h2 id="termination">12. Termination</h2>

          <h3 id="termination-by-client">12.1 Termination by Client</h3>
          <p>
            Clients may terminate services with written notice. Clients remain responsible for
            payment of all services rendered up to the termination date.
          </p>

          <h3 id="termination-by-company">12.2 Termination by Company</h3>
          <p>
            We may terminate services immediately if:
          </p>
          <ul>
            <li>Client breaches these Terms</li>
            <li>Client fails to make required payments</li>
            <li>Client engages in illegal or harmful activities</li>
            <li>Continuation of services would violate applicable laws</li>
          </ul>

          <h2 id="force-majeure">13. Force Majeure</h2>
          <p>
            Neither party shall be liable for delays or failures in performance resulting from
            circumstances beyond their reasonable control, including but not limited to:
            natural disasters, war, terrorism, government actions, or pandemics.
          </p>

          <h2 id="governing-law">14. Governing Law and Jurisdiction</h2>
          <p>
            These Terms shall be governed by and construed in accordance with the laws of Nigeria.
            Any disputes arising from these Terms shall be subject to the exclusive jurisdiction
            of the courts of Lagos, Nigeria.
          </p>

          <h2 id="dispute-resolution">15. Dispute Resolution</h2>
          <p>
            We encourage resolution of disputes through direct communication. If disputes cannot
            be resolved directly, parties agree to pursue mediation before initiating formal
            legal proceedings.
          </p>

          <h2 id="modifications">16. Modifications to Terms</h2>
          <p>
            We reserve the right to modify these Terms at any time. Clients will be notified
            of material changes, and continued use of our services constitutes acceptance of
            modified Terms.
          </p>

          <h2 id="severability">17. Severability</h2>
          <p>
            If any provision of these Terms is found to be invalid or unenforceable, the
            remaining provisions shall remain in full force and effect.
          </p>

          <h2 id="entire-agreement">18. Entire Agreement</h2>
          <p>
            These Terms, along with any specific service agreements, constitute the entire
            agreement between parties and supersede all prior negotiations, representations,
            or agreements relating to the subject matter.
          </p>

          <h2 id="contact-information">19. Contact Information</h2>
          <p>
            For questions about these Terms or our services, please contact us:
          </p>
          <div className="bg-muted/50 p-4 rounded-lg">
            <p><strong>Kamisoft Enterprises</strong></p>
            <p>Email: <a href="mailto:legal@kamisoftenterprises.online" className="text-primary hover:underline">legal@kamisoftenterprises.online</a></p>
            <p>General Contact: <a href="mailto:hello@kamisoftenterprises.online" className="text-primary hover:underline">hello@kamisoftenterprises.online</a></p>
            <p>Address: Lagos, Nigeria</p>
          </div>

          <h2 id="effective-date">20. Effective Date</h2>
          <p>
            These Terms are effective as of December 15, 2024, and were last updated on
            December 15, 2024.
          </p>
        </LegalDocumentLayout>
      </div>
    </div>
  )
}