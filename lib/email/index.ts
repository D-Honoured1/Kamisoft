import nodemailer from 'nodemailer'

export interface EmailOptions {
  to: string | string[]
  subject: string
  text?: string
  html?: string
  cc?: string | string[]
  bcc?: string | string[]
  attachments?: Array<{
    filename: string
    content: Buffer | string
    contentType?: string
  }>
}

export interface ContactFormEmailData {
  name: string
  email: string
  phone?: string
  company?: string
  service?: string
  subject: string
  message: string
}

export interface ServiceRequestEmailData {
  name: string
  email: string
  phone?: string
  company?: string
  service_category: string
  request_type: string
  title: string
  description: string
  preferred_date?: string
  site_address?: string
}

export interface PaymentLinkEmailData {
  clientName: string
  clientEmail: string
  paymentLink: string
  projectCost: number
  splitAmount: number
  fullPaymentAmount: number
  discountPercent: number
  discountAmount: number
  linkExpiry: string
  serviceTitle?: string
}

export interface InvoiceEmailData {
  clientName: string
  clientEmail: string
  invoiceNumber: string
  invoiceDate: string
  totalAmount: number
  pdfBuffer: Buffer
  serviceTitle?: string
}

class EmailService {
  private transporter: nodemailer.Transporter

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
      tls: {
        rejectUnauthorized: false
      }
    })
  }

  async sendEmail(options: EmailOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
        return {
          success: false,
          error: 'Email configuration not set up properly'
        }
      }

      const info = await this.transporter.sendMail({
        from: process.env.FROM_EMAIL,
        to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
        cc: Array.isArray(options.cc) ? options.cc.join(', ') : options.cc,
        bcc: Array.isArray(options.bcc) ? options.bcc.join(', ') : options.bcc,
        subject: options.subject,
        text: options.text,
        html: options.html,
        attachments: options.attachments,
      })

      return {
        success: true,
        messageId: info.messageId
      }
    } catch (error: any) {
      console.error('Email sending failed:', error)
      return {
        success: false,
        error: error.message || 'Failed to send email'
      }
    }
  }

  async sendContactFormNotification(data: ContactFormEmailData): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333; border-bottom: 2px solid #0066cc; padding-bottom: 10px;">
          New Contact Form Submission
        </h2>

        <div style="background-color: #f9f9f9; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3 style="color: #0066cc; margin-top: 0;">Contact Details</h3>
          <p><strong>Name:</strong> ${data.name}</p>
          <p><strong>Email:</strong> <a href="mailto:${data.email}">${data.email}</a></p>
          ${data.phone ? `<p><strong>Phone:</strong> ${data.phone}</p>` : ''}
          ${data.company ? `<p><strong>Company:</strong> ${data.company}</p>` : ''}
          ${data.service ? `<p><strong>Service Interest:</strong> ${data.service}</p>` : ''}
        </div>

        <div style="background-color: #fff; padding: 20px; border-left: 4px solid #0066cc; margin: 20px 0;">
          <h3 style="color: #333; margin-top: 0;">Subject</h3>
          <p>${data.subject}</p>

          <h3 style="color: #333;">Message</h3>
          <p style="line-height: 1.6;">${data.message.replace(/\n/g, '<br>')}</p>
        </div>

        <div style="background-color: #f0f8ff; padding: 15px; border-radius: 5px; margin-top: 20px;">
          <p style="margin: 0; font-size: 14px; color: #666;">
            This email was sent from the Kamisoft Enterprises contact form on ${new Date().toLocaleDateString()}.
          </p>
        </div>
      </div>
    `

    const textContent = `
New Contact Form Submission

Contact Details:
Name: ${data.name}
Email: ${data.email}
${data.phone ? `Phone: ${data.phone}` : ''}
${data.company ? `Company: ${data.company}` : ''}
${data.service ? `Service Interest: ${data.service}` : ''}

Subject: ${data.subject}

Message:
${data.message}

This email was sent from the Kamisoft Enterprises contact form on ${new Date().toLocaleDateString()}.
    `

    return this.sendEmail({
      to: process.env.FROM_EMAIL || 'support@kamisoftenterprises.online',
      subject: `Contact Form: ${data.subject}`,
      text: textContent,
      html: htmlContent,
      cc: ['support@kamisoftenterprises.online'] // Optional: CC to support email
    })
  }

  async sendContactConfirmation(data: ContactFormEmailData): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="text-align: center; padding: 20px 0; border-bottom: 2px solid #0066cc;">
          <h1 style="color: #0066cc; margin: 0;">Kamisoft Enterprises</h1>
          <p style="color: #666; margin: 5px 0 0 0;">Technology Solutions & Services</p>
        </div>

        <div style="padding: 30px 20px;">
          <h2 style="color: #333;">Thank you for contacting us!</h2>

          <p>Dear ${data.name},</p>

          <p>We have received your inquiry and appreciate you taking the time to reach out to us. Our team will review your message and get back to you within 24-48 hours.</p>

          <div style="background-color: #f9f9f9; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3 style="color: #0066cc; margin-top: 0;">Your Submission Summary</h3>
            <p><strong>Subject:</strong> ${data.subject}</p>
            ${data.service ? `<p><strong>Service Interest:</strong> ${data.service}</p>` : ''}
            <p><strong>Submitted on:</strong> ${new Date().toLocaleDateString()}</p>
          </div>

          <p>In the meantime, feel free to explore our services and solutions on our website. If you have any urgent inquiries, you can also reach us directly at:</p>

          <div style="background-color: #f0f8ff; padding: 15px; border-radius: 5px;">
            <p style="margin: 0;"><strong>Email:</strong> support@kamisoftenterprises.online</p>
            <p style="margin: 5px 0 0 0;"><strong>Website:</strong> https://www.kamisoftenterprises.online</p>
          </div>

          <p>Thank you for choosing Kamisoft Enterprises!</p>

          <p>Best regards,<br>
          The Kamisoft Enterprises Team</p>
        </div>

        <div style="background-color: #333; color: #fff; text-align: center; padding: 20px;">
          <p style="margin: 0; font-size: 14px;">
            © ${new Date().getFullYear()} Kamisoft Enterprises. All rights reserved.
          </p>
        </div>
      </div>
    `

    const textContent = `
Thank you for contacting Kamisoft Enterprises!

Dear ${data.name},

We have received your inquiry and appreciate you taking the time to reach out to us. Our team will review your message and get back to you within 24-48 hours.

Your Submission Summary:
Subject: ${data.subject}
${data.service ? `Service Interest: ${data.service}` : ''}
Submitted on: ${new Date().toLocaleDateString()}

In the meantime, feel free to explore our services and solutions on our website. If you have any urgent inquiries, you can also reach us directly at:

Email: support@kamisoftenterprises.online
Website: https://www.kamisoftenterprises.online

Thank you for choosing Kamisoft Enterprises!

Best regards,
The Kamisoft Enterprises Team

© ${new Date().getFullYear()} Kamisoft Enterprises. All rights reserved.
    `

    return this.sendEmail({
      to: data.email,
      subject: 'Thank you for contacting Kamisoft Enterprises',
      text: textContent,
      html: htmlContent
    })
  }

  async sendServiceRequestNotification(data: ServiceRequestEmailData): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333; border-bottom: 2px solid #0066cc; padding-bottom: 10px;">
          New Service Request - Hire Us Form
        </h2>

        <div style="background-color: #f9f9f9; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3 style="color: #0066cc; margin-top: 0;">Client Details</h3>
          <p><strong>Name:</strong> ${data.name}</p>
          <p><strong>Email:</strong> <a href="mailto:${data.email}">${data.email}</a></p>
          ${data.phone ? `<p><strong>Phone:</strong> ${data.phone}</p>` : ''}
          ${data.company ? `<p><strong>Company:</strong> ${data.company}</p>` : ''}
        </div>

        <div style="background-color: #fff; padding: 20px; border-left: 4px solid #0066cc; margin: 20px 0;">
          <h3 style="color: #333; margin-top: 0;">Service Request Details</h3>
          <p><strong>Service Category:</strong> ${data.service_category}</p>
          <p><strong>Request Type:</strong> ${data.request_type === 'on_site' ? 'On-Site Service' : 'Digital/Remote'}</p>
          <p><strong>Title:</strong> ${data.title}</p>
          ${data.preferred_date ? `<p><strong>Preferred Date:</strong> ${new Date(data.preferred_date).toLocaleDateString()}</p>` : ''}
          ${data.site_address ? `<p><strong>Site Address:</strong> ${data.site_address}</p>` : ''}

          <h4 style="color: #333; margin-top: 20px;">Description:</h4>
          <p style="line-height: 1.6;">${data.description.replace(/\n/g, '<br>')}</p>
        </div>

        <div style="background-color: #f0f8ff; padding: 15px; border-radius: 5px; margin-top: 20px;">
          <p style="margin: 0; font-size: 14px; color: #666;">
            This service request was submitted via the Hire Us form on ${new Date().toLocaleDateString()}.
          </p>
        </div>
      </div>
    `

    const textContent = `
New Service Request - Hire Us Form

Client Details:
Name: ${data.name}
Email: ${data.email}
${data.phone ? `Phone: ${data.phone}` : ''}
${data.company ? `Company: ${data.company}` : ''}

Service Request Details:
Service Category: ${data.service_category}
Request Type: ${data.request_type === 'on_site' ? 'On-Site Service' : 'Digital/Remote'}
Title: ${data.title}
${data.preferred_date ? `Preferred Date: ${new Date(data.preferred_date).toLocaleDateString()}` : ''}
${data.site_address ? `Site Address: ${data.site_address}` : ''}

Description:
${data.description}

This service request was submitted via the Hire Us form on ${new Date().toLocaleDateString()}.
    `

    return this.sendEmail({
      to: process.env.FROM_EMAIL || 'support@kamisoftenterprises.online',
      subject: `New Service Request: ${data.title}`,
      text: textContent,
      html: htmlContent,
      cc: ['support@kamisoftenterprises.online']
    })
  }

  async sendServiceRequestConfirmation(data: ServiceRequestEmailData): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="text-align: center; padding: 20px 0; border-bottom: 2px solid #0066cc;">
          <h1 style="color: #0066cc; margin: 0;">Kamisoft Enterprises</h1>
          <p style="color: #666; margin: 5px 0 0 0;">Technology Solutions & Services</p>
        </div>

        <div style="padding: 30px 20px;">
          <h2 style="color: #333;">Thank you for your service request!</h2>

          <p>Dear ${data.name},</p>

          <p>We have received your service request and appreciate you choosing Kamisoft Enterprises. Our team will review your request and get back to you within 24-48 hours with a detailed proposal and cost estimate.</p>

          <div style="background-color: #f9f9f9; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3 style="color: #0066cc; margin-top: 0;">Your Request Summary</h3>
            <p><strong>Service:</strong> ${data.service_category}</p>
            <p><strong>Type:</strong> ${data.request_type === 'on_site' ? 'On-Site Service' : 'Digital/Remote'}</p>
            <p><strong>Title:</strong> ${data.title}</p>
            ${data.preferred_date ? `<p><strong>Preferred Date:</strong> ${new Date(data.preferred_date).toLocaleDateString()}</p>` : ''}
            <p><strong>Submitted on:</strong> ${new Date().toLocaleDateString()}</p>
          </div>

          <p><strong>What happens next?</strong></p>
          <ol style="line-height: 1.8;">
            <li>Our team will review your requirements</li>
            <li>We'll prepare a detailed proposal with cost estimates</li>
            <li>You'll receive a response within 24-48 hours</li>
            <li>Once approved, we'll schedule the work and begin delivery</li>
          </ol>

          <p>In the meantime, if you have any urgent questions, you can reach us directly at:</p>

          <div style="background-color: #f0f8ff; padding: 15px; border-radius: 5px;">
            <p style="margin: 0;"><strong>Email:</strong> support@kamisoftenterprises.online</p>
            <p style="margin: 5px 0 0 0;"><strong>Phone:</strong> +234 803 639 2157</p>
            <p style="margin: 5px 0 0 0;"><strong>Website:</strong> https://www.kamisoftenterprises.online</p>
          </div>

          <p>Thank you for choosing Kamisoft Enterprises!</p>

          <p>Best regards,<br>
          The Kamisoft Enterprises Team</p>
        </div>

        <div style="background-color: #333; color: #fff; text-align: center; padding: 20px;">
          <p style="margin: 0; font-size: 14px;">
            © ${new Date().getFullYear()} Kamisoft Enterprises. All rights reserved.
          </p>
        </div>
      </div>
    `

    const textContent = `
Thank you for your service request!

Dear ${data.name},

We have received your service request and appreciate you choosing Kamisoft Enterprises. Our team will review your request and get back to you within 24-48 hours with a detailed proposal and cost estimate.

Your Request Summary:
Service: ${data.service_category}
Type: ${data.request_type === 'on_site' ? 'On-Site Service' : 'Digital/Remote'}
Title: ${data.title}
${data.preferred_date ? `Preferred Date: ${new Date(data.preferred_date).toLocaleDateString()}` : ''}
Submitted on: ${new Date().toLocaleDateString()}

What happens next?
1. Our team will review your requirements
2. We'll prepare a detailed proposal with cost estimates
3. You'll receive a response within 24-48 hours
4. Once approved, we'll schedule the work and begin delivery

In the meantime, if you have any urgent questions, you can reach us directly at:

Email: support@kamisoftenterprises.online
Phone: +234 803 639 2157
Website: https://www.kamisoftenterprises.online

Thank you for choosing Kamisoft Enterprises!

Best regards,
The Kamisoft Enterprises Team

© ${new Date().getFullYear()} Kamisoft Enterprises. All rights reserved.
    `

    return this.sendEmail({
      to: data.email,
      subject: 'Service Request Received - Kamisoft Enterprises',
      text: textContent,
      html: htmlContent
    })
  }

  async sendPaymentLinkEmail(data: PaymentLinkEmailData): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const expiryDate = new Date(data.linkExpiry)
    const expiryFormatted = expiryDate.toLocaleString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="text-align: center; padding: 30px 20px; background: linear-gradient(135deg, #1e40af 0%, #2563eb 100%); color: white; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 28px;">Payment Link Ready!</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Kamisoft Enterprises</p>
        </div>

        <div style="padding: 30px 20px; background: #f9fafb;">
          <p style="font-size: 16px; color: #333; margin: 0 0 20px 0;">Dear ${data.clientName},</p>

          <p style="font-size: 15px; color: #555; line-height: 1.6;">
            Thank you for choosing Kamisoft Enterprises! Your payment link is now ready.
            ${data.serviceTitle ? `This is for your project: <strong>${data.serviceTitle}</strong>` : ''}
          </p>

          <!-- Payment Options -->
          <div style="background: white; padding: 25px; border-radius: 8px; margin: 25px 0; border: 2px solid #2563eb;">
            <h3 style="color: #1e40af; margin-top: 0; font-size: 18px;">Choose Your Payment Option:</h3>

            <div style="background: #f0f9ff; padding: 15px; border-radius: 6px; margin-bottom: 15px; border-left: 4px solid #3b82f6;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                <strong style="color: #1e40af; font-size: 16px;">Option 1: Split Payment (50/50)</strong>
                <span style="background: #3b82f6; color: white; padding: 4px 12px; border-radius: 12px; font-size: 12px;">Standard</span>
              </div>
              <p style="margin: 8px 0; color: #1e40af; font-size: 14px;">
                • Pay <strong>$${data.splitAmount.toFixed(2)}</strong> now to start<br>
                • Pay remaining <strong>$${data.splitAmount.toFixed(2)}</strong> upon completion
              </p>
            </div>

            <div style="background: #f0fdf4; padding: 15px; border-radius: 6px; border-left: 4px solid #10b981;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                <strong style="color: #059669; font-size: 16px;">Option 2: Full Payment</strong>
                <span style="background: #10b981; color: white; padding: 4px 12px; border-radius: 12px; font-size: 12px;">${data.discountPercent}% OFF</span>
              </div>
              <p style="margin: 8px 0; color: #059669; font-size: 14px;">
                • Original Price: <span style="text-decoration: line-through;">$${data.projectCost.toFixed(2)}</span><br>
                • Discount: <strong style="color: #10b981;">-$${data.discountAmount.toFixed(2)}</strong><br>
                • Pay Only: <strong style="font-size: 18px;">$${data.fullPaymentAmount.toFixed(2)}</strong>
              </p>
              <p style="margin: 8px 0 0 0; color: #10b981; font-weight: bold; font-size: 13px;">
                ✨ Save $${data.discountAmount.toFixed(2)} with full payment!
              </p>
            </div>
          </div>

          <!-- Payment Link Button -->
          <div style="text-align: center; margin: 30px 0;">
            <a href="${data.paymentLink}" style="display: inline-block; background: linear-gradient(135deg, #1e40af 0%, #2563eb 100%); color: white; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 6px rgba(37, 99, 235, 0.3);">
              Proceed to Payment →
            </a>
          </div>

          <!-- Link Expiry Warning -->
          <div style="background: #fff3cd; border: 1px solid #ffc107; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <p style="margin: 0; color: #856404; font-size: 14px;">
              <strong>⏰ Important:</strong> This payment link expires on <strong>${expiryFormatted}</strong> (1 hour from generation).
              Please complete your payment before then.
            </p>
          </div>

          <!-- What Happens Next -->
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h4 style="color: #1e40af; margin-top: 0;">What Happens Next?</h4>
            <ol style="color: #555; line-height: 1.8; padding-left: 20px;">
              <li>Click the payment button above</li>
              <li>Choose your preferred payment option</li>
              <li>Complete your payment securely</li>
              <li>Receive instant confirmation</li>
              <li>We'll begin work on your project immediately!</li>
            </ol>
          </div>

          <!-- Contact Info -->
          <div style="background: #f0f8ff; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <p style="margin: 0 0 10px 0; color: #333; font-weight: bold;">Need Help?</p>
            <p style="margin: 0; color: #555; font-size: 14px;">
              📧 Email: <a href="mailto:support@kamisoftenterprises.online" style="color: #2563eb;">support@kamisoftenterprises.online</a><br>
              📱 Phone: +234 803 639 2157<br>
              🌐 Website: <a href="https://www.kamisoftenterprises.online" style="color: #2563eb;">www.kamisoftenterprises.online</a>
            </p>
          </div>

          <p style="font-size: 14px; color: #666; margin-top: 30px;">
            Best regards,<br>
            <strong>The Kamisoft Enterprises Team</strong>
          </p>
        </div>

        <!-- Footer -->
        <div style="background: #1f2937; color: #9ca3af; text-align: center; padding: 20px; border-radius: 0 0 8px 8px;">
          <p style="margin: 0; font-size: 13px;">
            © ${new Date().getFullYear()} Kamisoft Enterprises. All rights reserved.
          </p>
          <p style="margin: 8px 0 0 0; font-size: 12px;">
            Lagos, Nigeria
          </p>
        </div>
      </div>
    `

    const textContent = `
Payment Link Ready - Kamisoft Enterprises

Dear ${data.clientName},

Thank you for choosing Kamisoft Enterprises! Your payment link is now ready.
${data.serviceTitle ? `This is for your project: ${data.serviceTitle}` : ''}

CHOOSE YOUR PAYMENT OPTION:

Option 1: Split Payment (50/50) - Standard
• Pay $${data.splitAmount.toFixed(2)} now to start
• Pay remaining $${data.splitAmount.toFixed(2)} upon completion

Option 2: Full Payment - ${data.discountPercent}% OFF
• Original Price: $${data.projectCost.toFixed(2)}
• Discount: -$${data.discountAmount.toFixed(2)}
• Pay Only: $${data.fullPaymentAmount.toFixed(2)}
• Save $${data.discountAmount.toFixed(2)} with full payment!

PAYMENT LINK:
${data.paymentLink}

⏰ IMPORTANT: This link expires on ${expiryFormatted} (1 hour from generation).

WHAT HAPPENS NEXT?
1. Click the payment link above
2. Choose your preferred payment option
3. Complete your payment securely
4. Receive instant confirmation
5. We'll begin work on your project immediately!

NEED HELP?
📧 Email: support@kamisoftenterprises.online
📱 Phone: +234 803 639 2157
🌐 Website: www.kamisoftenterprises.online

Best regards,
The Kamisoft Enterprises Team

© ${new Date().getFullYear()} Kamisoft Enterprises. All rights reserved.
Lagos, Nigeria
    `

    return this.sendEmail({
      to: data.clientEmail,
      subject: `Payment Link Ready - Kamisoft Enterprises${data.serviceTitle ? ` | ${data.serviceTitle}` : ''}`,
      text: textContent,
      html: htmlContent
    })
  }

  async sendInvoiceEmail(data: InvoiceEmailData): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="text-align: center; padding: 30px 20px; background: linear-gradient(135deg, #1e40af 0%, #2563eb 100%); color: white; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 28px;">Invoice Ready!</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Kamisoft Enterprises</p>
        </div>

        <div style="padding: 30px 20px; background: #f9fafb;">
          <p style="font-size: 16px; color: #333; margin: 0 0 20px 0;">Dear ${data.clientName},</p>

          <p style="font-size: 15px; color: #555; line-height: 1.6;">
            Thank you for your business! Your invoice is attached to this email.
            ${data.serviceTitle ? `This invoice is for: <strong>${data.serviceTitle}</strong>` : ''}
          </p>

          <div style="background: white; padding: 25px; border-radius: 8px; margin: 25px 0; border: 2px solid #2563eb;">
            <h3 style="color: #1e40af; margin-top: 0; font-size: 18px;">Invoice Details:</h3>
            <div style="background: #f0f9ff; padding: 15px; border-radius: 6px;">
              <p style="margin: 8px 0; color: #1e40af; font-size: 14px;">
                <strong>Invoice Number:</strong> ${data.invoiceNumber}<br>
                <strong>Date:</strong> ${data.invoiceDate}<br>
                <strong>Total Amount:</strong> <span style="font-size: 18px; font-weight: bold;">$${data.totalAmount.toFixed(2)}</span>
              </p>
            </div>
          </div>

          <div style="background: #fff3cd; border: 1px solid #ffc107; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <p style="margin: 0; color: #856404; font-size: 14px;">
              📎 <strong>Invoice PDF attached to this email</strong><br>
              Please download and keep it for your records.
            </p>
          </div>

          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h4 style="color: #1e40af; margin-top: 0;">Need Help?</h4>
            <p style="color: #555; margin: 5px 0;">If you have any questions about this invoice, please contact us:</p>
          </div>

          <div style="background: #f0f8ff; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <p style="margin: 0; color: #555; font-size: 14px;">
              📧 Email: <a href="mailto:support@kamisoftenterprises.online" style="color: #2563eb;">support@kamisoftenterprises.online</a><br>
              📱 Phone: +234 803 639 2157<br>
              🌐 Website: <a href="https://www.kamisoftenterprises.online" style="color: #2563eb;">www.kamisoftenterprises.online</a>
            </p>
          </div>

          <p style="font-size: 14px; color: #666; margin-top: 30px;">
            Best regards,<br>
            <strong>The Kamisoft Enterprises Team</strong>
          </p>
        </div>

        <div style="background: #1f2937; color: #9ca3af; text-align: center; padding: 20px; border-radius: 0 0 8px 8px;">
          <p style="margin: 0; font-size: 13px;">
            © ${new Date().getFullYear()} Kamisoft Enterprises. All rights reserved.
          </p>
          <p style="margin: 8px 0 0 0; font-size: 12px;">
            Lagos, Nigeria
          </p>
        </div>
      </div>
    `

    const textContent = `
Invoice Ready - Kamisoft Enterprises

Dear ${data.clientName},

Thank you for your business! Your invoice is attached to this email.
${data.serviceTitle ? `This invoice is for: ${data.serviceTitle}` : ''}

INVOICE DETAILS:
Invoice Number: ${data.invoiceNumber}
Date: ${data.invoiceDate}
Total Amount: $${data.totalAmount.toFixed(2)}

📎 Invoice PDF attached to this email
Please download and keep it for your records.

NEED HELP?
If you have any questions about this invoice, please contact us:

📧 Email: support@kamisoftenterprises.online
📱 Phone: +234 803 639 2157
🌐 Website: www.kamisoftenterprises.online

Best regards,
The Kamisoft Enterprises Team

© ${new Date().getFullYear()} Kamisoft Enterprises. All rights reserved.
Lagos, Nigeria
    `

    return this.sendEmail({
      to: data.clientEmail,
      subject: `Invoice ${data.invoiceNumber} - Kamisoft Enterprises${data.serviceTitle ? ` | ${data.serviceTitle}` : ''}`,
      text: textContent,
      html: htmlContent,
      attachments: [{
        filename: `${data.invoiceNumber}.pdf`,
        content: data.pdfBuffer,
        contentType: 'application/pdf'
      }]
    })
  }

  async verifyConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      await this.transporter.verify()
      return { success: true }
    } catch (error: any) {
      console.error('Email connection verification failed:', error)
      return {
        success: false,
        error: error.message || 'Failed to verify email connection'
      }
    }
  }
}

export const emailService = new EmailService()
export default emailService