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