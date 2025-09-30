# Payment → Invoice → Email Flow Documentation

## Overview
This document explains the automated payment confirmation flow that generates invoices and sends professional emails with PDF attachments when a payment is successfully processed through Paystack.

## Flow Diagram
```
Customer Makes Payment (Paystack)
           ↓
Paystack Webhook Triggered
           ↓
handleChargeSuccess() validates payment
           ↓
Payment record updated in database
           ↓
generateInvoiceForPayment() called
           ↓
Invoice API generates PDF and stores in Supabase
           ↓
sendPaymentConfirmationEmail() called
           ↓
Professional HTML email sent with PDF attachment
           ↓
Customer receives confirmation + invoice
```

## Implementation Details

### 1. Auto Invoice Generation (lines 250-297)
**Function**: `generateInvoiceForPayment(paymentId: string, requestId: string)`

**What it does**:
- Checks if invoice already exists for this payment (prevents duplicates)
- Calls internal invoice generation API at `/api/invoices/generate`
- Stores invoice PDF in Supabase Storage bucket: `documents/invoices/`
- Marks invoice status as "sent"
- Returns the generated invoice object

**Key Features**:
- Idempotent (won't create duplicate invoices)
- Auto-generates invoice number (e.g., INV-2025-0001)
- Includes 7.5% VAT calculation for Nigerian tax compliance
- Stores PDF URL in database for later retrieval

### 2. Email Service Enhancement
**File**: `/lib/email/index.ts`

**Changes Made**:
- Added `attachments` field to `EmailOptions` interface
- Supports Buffer or string content
- Allows multiple attachments per email
- Compatible with nodemailer attachment format

**Interface**:
```typescript
export interface EmailOptions {
  attachments?: Array<{
    filename: string
    content: Buffer | string
    contentType?: string
  }>
}
```

### 3. Payment Confirmation Email (lines 299-427)
**Function**: `sendPaymentConfirmationEmail(paystackData: any)`

**What it does**:
- Fetches payment and service request details with client info
- Retrieves generated invoice from database
- Creates professional HTML email with company branding
- Downloads invoice PDF from Supabase Storage
- Converts PDF to Buffer for email attachment
- Sends email via nodemailer with PDF attached

**Email Content**:
- **Header**: Kamisoft Enterprises branding with blue gradient
- **Payment Details**: Amount, reference, method, date
- **Invoice Details**: Invoice number, total amount (if invoice exists)
- **Next Steps**: Explains what happens next based on payment type
- **Footer**: Company contact information
- **Attachment**: Invoice PDF (if available)

**Error Handling**:
- Continues sending email even if PDF attachment fails
- Logs all errors for debugging
- Graceful degradation (email sent without PDF if download fails)

## Integration Points

### Paystack Webhook Handler
**File**: `/app/api/webhooks/paystack/route.ts`

**Integration** (lines 148-163):
```typescript
async function handleChargeSuccess(data: any, webhookEventId: string) {
  // ... payment confirmation logic

  if (data.metadata?.requestId) {
    try {
      await updateServiceRequestStatus(data.metadata.requestId, data.metadata?.paymentType)

      // Auto-generate invoice for this payment
      await generateInvoiceForPayment(paymentId, data.metadata.requestId)

      // Send confirmation email with invoice
      await sendPaymentConfirmationEmail(data)
    } catch (notificationError: any) {
      console.error('Notification/invoice error:', notificationError)
    }
  }
}
```

## Testing the Flow

### Prerequisites
1. ✅ Supabase storage bucket "documents" must exist (make it public)
2. ✅ Invoice generation API must be working (`/api/invoices/generate`)
3. ✅ Email service must be configured with valid SMTP settings
4. ✅ @react-pdf/renderer dependency must be installed

**Environment Variables Required**:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SMTP_HOST=your_smtp_host
SMTP_PORT=587
SMTP_USER=your_smtp_username
SMTP_PASSWORD=your_smtp_password
FROM_EMAIL=support@kamisoftenterprises.online
NEXT_PUBLIC_BASE_URL=https://your-domain.com
```

### Test Scenario 1: New Payment (Happy Path)
1. Create a test payment link for a service request
2. Complete payment using Paystack test card: `4084 0840 8408 4081`
3. Verify Paystack webhook is triggered
4. Check server logs for:
   - "Payment confirmed via Paystack webhook"
   - "Invoice generated: INV-2025-XXXX"
   - "Payment confirmation email sent to: client@example.com"
5. Check client's email inbox for confirmation email
6. Verify PDF attachment is present and opens correctly
7. Check `invoices` table in database for new record

### Test Scenario 2: Duplicate Payment
1. Repeat the same payment (same paymentId)
2. Verify system logs "Invoice already exists for payment: xxx"
3. Verify no duplicate invoice is created in database
4. Email should still be sent with existing invoice

### Test Scenario 3: PDF Attachment Failure
1. Temporarily make Supabase storage bucket private
2. Trigger a payment
3. Verify email is still sent (without attachment)
4. Check logs for: "Could not attach PDF: [error]"
5. Verify payment is still confirmed in database

### Test Scenario 4: Email Service Failure
1. Use invalid SMTP credentials
2. Trigger a payment
3. Verify payment is still confirmed in database
4. Verify invoice is still generated
5. Check error logs for email failure details

## Monitoring & Debugging

### Key Log Messages
```
✅ Payment confirmed via Paystack webhook: [reference]
✅ Invoice generated: [invoice_number]
✅ Payment confirmation email sent to: [email]
⚠️  Could not attach PDF: [error]
❌ Notification/invoice error: [error]
```

### Database Queries for Verification

**Check if invoice was created**:
```sql
SELECT id, invoice_number, total_amount, status, pdf_url
FROM invoices
WHERE payment_id = 'payment-uuid-here'
ORDER BY created_at DESC;
```

**Check payment confirmation**:
```sql
SELECT id, payment_status, paystack_reference, confirmed_at, admin_notes
FROM payments
WHERE id = 'payment-uuid-here';
```

**View invoice metadata**:
```sql
SELECT metadata
FROM payments
WHERE paystack_reference = 'paystack-ref-here';
```

## Email Template Features

### Responsive Design
- Mobile-friendly layout
- Maximum width: 600px
- Professional color scheme (blue gradient header)

### Dynamic Content
- Shows different messages for full payment vs. split payment
- Conditionally displays invoice section if invoice exists
- Formats currency correctly (₦ for NGN, $ for USD)
- Nigerian date/time formatting

### Branding Elements
- Company name: Kamisoft Enterprises
- Email: support@kamisoftenterprises.online
- Phone: +234 803 639 2157
- Location: Lagos, Nigeria
- Website: www.kamisoftenterprises.online

## Error Handling Strategy

### Invoice Generation Failures
- Webhook still returns 200 OK to Paystack
- Payment confirmation is not blocked
- Error is logged for manual intervention
- Admin can manually generate invoice from dashboard

### Email Sending Failures
- Invoice generation still completes successfully
- PDF is stored in Supabase Storage
- Admin can resend email manually
- Client can download invoice from customer portal (if implemented)

### PDF Attachment Failures
- Email is sent without attachment
- Invoice URL can be shared manually
- System continues functioning
- Error logged for investigation

## Future Enhancements

### Potential Improvements
1. **Retry Logic**: Implement exponential backoff for failed emails
2. **Email Queue**: Use a queue system (Redis/Bull) for reliable delivery
3. **Email Templates**: Move HTML to separate template files
4. **Notification System**: Add SMS notifications for payment confirmation
5. **Customer Portal**: Allow clients to download invoices anytime
6. **Email Tracking**: Implement open/click tracking
7. **Multi-language**: Support multiple languages based on client preference

## Troubleshooting

### Issue: No email received
**Checks**:
1. Verify SMTP credentials are correct
2. Check spam/junk folder
3. Verify client email address is valid
4. Check server logs for email errors
5. Test email service with `/api/email/verify` endpoint

### Issue: Email received but no PDF attachment
**Checks**:
1. Verify Supabase storage bucket exists and is public
2. Check invoice.pdf_url is not null in database
3. Verify network connectivity to Supabase Storage
4. Check file exists at the PDF URL
5. Review server logs for "Could not attach PDF" errors

### Issue: Invoice not generated
**Checks**:
1. Verify `/api/invoices/generate` endpoint works
2. Check `@react-pdf/renderer` is installed
3. Verify service request has valid data
4. Check database permissions for invoices table
5. Review API logs for generation errors

### Issue: Webhook not triggering
**Checks**:
1. Verify webhook URL is configured in Paystack dashboard
2. Check webhook signature validation
3. Verify `PAYSTACK_SECRET_KEY` is correct
4. Review Paystack webhook logs in their dashboard
5. Test webhook manually using Paystack API

## Security Considerations

### Webhook Signature Verification
- All webhooks validate signature before processing
- Uses Paystack secret key for HMAC validation
- Rejects requests with invalid or missing signatures

### Email Content Sanitization
- All user data is escaped before insertion into HTML
- Template literals prevent XSS attacks
- No executable content in email body

### PDF Access Control
- PDFs stored in public bucket (by design for email attachments)
- Invoice numbers are non-sequential to prevent enumeration
- Consider adding URL signing for enhanced security

### Sensitive Data
- Payment metadata logged for debugging (be careful in production)
- Consider redacting sensitive fields in logs
- Ensure SMTP credentials are never logged

## Support & Maintenance

For issues or questions:
- **Email**: support@kamisoftenterprises.online
- **Documentation**: See INVOICE_SYSTEM_SETUP.md
- **Database Migrations**: See scripts/014_add_client_soft_delete.sql

Last Updated: September 30, 2025