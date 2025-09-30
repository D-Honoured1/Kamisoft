# Invoice System Setup Guide

## Overview
Complete invoice generation and management system for Kamisoft Enterprises with:
- Automatic invoice generation
- Professional PDF with company branding
- Nigerian VAT (7.5%) calculation
- Bank transfer details included
- Status tracking (draft, sent, paid, overdue, cancelled)
- Email delivery capability

## Installation

### 1. Install Required Dependencies

```bash
npm install @react-pdf/renderer
```

### 2. Set Up Supabase Storage Bucket

1. Go to your Supabase Dashboard → Storage
2. Create a new bucket called `documents`
3. Make it **public** (or set appropriate RLS policies)
4. This will store the generated invoice PDFs

### 3. Database Setup

Your `invoices` table is already set up! It includes:
- `id`, `request_id`, `payment_id`
- `invoice_number` (auto-generated: INV-2025-0001)
- `subtotal`, `tax_amount`, `total_amount`
- `status` (draft/sent/paid/overdue/cancelled)
- `pdf_url` (link to generated PDF)
- `due_date`

## Features Implemented

### 📄 **Invoice Service Library** (`lib/invoice/`)
- `InvoiceService` class with methods:
  - `generateInvoiceNumber()` - Auto-incrementing (INV-YEAR-XXXX)
  - `prepareInvoiceData()` - Extract data from service request
  - `createInvoice()` - Save to database
  - `updateInvoiceStatus()` - Mark as sent/paid/overdue
  - `getInvoice()` - Fetch invoice details
  - `listInvoices()` - Admin invoice list with filters

### 🎨 **PDF Template** (`lib/invoice/invoice-pdf-template.tsx`)
- Professional design with Kamisoft branding
- Company details (Logo area, contact info)
- Client billing information
- Itemized services table
- Tax calculation (7.5% VAT)
- Payment details (Kuda Bank & Moniepoint)
- Invoice number and dates
- Terms and notes

### 🔌 **API Routes**
1. **POST `/api/invoices/generate`**
   - Generate invoice for a service request
   - Create PDF and upload to Supabase Storage
   - Optional auto-send via email

2. **GET `/api/invoices/[id]`**
   - Get invoice details with related data

3. **PATCH `/api/invoices/[id]`**
   - Update invoice status

4. **GET `/api/invoices/list`**
   - List all invoices with filtering
   - Supports pagination

### 🖥️ **Admin UI Components**
- **InvoiceGenerator** (`components/admin/invoice-generator.tsx`)
  - Shows existing invoices for the request
  - Generate new invoice button
  - Option to auto-send via email
  - Download PDF button
  - View invoice details

## Usage

### From Admin Panel (Service Request Page)

1. Navigate to any approved service request with cost
2. Scroll to the "Invoice Management" card
3. Click "Generate Invoice" or "Generate & Send Invoice"
4. Invoice PDF is created and saved automatically
5. Download or view the invoice
6. Share with client

### Programmatic Usage

```typescript
import InvoiceService from '@/lib/invoice'

// Generate invoice for a service request
const invoiceData = await InvoiceService.prepareInvoiceData(
  requestId,
  paymentId // optional
)

const invoice = await InvoiceService.createInvoice(invoiceData, pdfUrl)

// Update status when payment received
await InvoiceService.updateInvoiceStatus(invoice.id, 'paid')

// List all unpaid invoices
const { invoices } = await InvoiceService.listInvoices({
  status: 'sent',
  limit: 20
})
```

## Invoice Details

### Tax Calculation
- **Nigerian VAT**: 7.5% applied to subtotal
- Formula: `total = subtotal + (subtotal * 0.075)`
- Adjust `taxRate` in `lib/invoice/index.ts` if needed

### Payment Terms
- **Default**: 30 days from invoice date
- Modify `dueDate` calculation in `prepareInvoiceData()` if needed

### Invoice Numbering
- Format: `INV-YYYY-XXXX`
- Example: `INV-2025-0001`, `INV-2025-0002`
- Auto-increments per year
- Resets to 0001 each new year

### Bank Details (Included in PDF)
- **Primary**: Kuda Bank - 3002495746
- **Alternative**: Moniepoint - 6417130337
- Account Name: Kamisoft Enterprises

## Customization

### Update Company Logo
Edit `lib/invoice/invoice-pdf-template.tsx`:
```tsx
<Image
  src="/path/to/logo.png"
  style={{ width: 150, height: 50 }}
/>
```

### Change Tax Rate
Edit `lib/invoice/index.ts`:
```typescript
const taxRate = 0.075 // Change to your rate (e.g., 0.15 for 15%)
```

### Modify Payment Terms
Edit `lib/invoice/index.ts`:
```typescript
dueDate.setDate(dueDate.getDate() + 30) // Change 30 to your days
```

### Custom PDF Styling
Edit `lib/invoice/invoice-pdf-template.tsx` styles:
```typescript
const styles = StyleSheet.create({
  // Customize colors, fonts, spacing, etc.
})
```

## Workflow Integration

### Automatic Invoice Generation
To auto-generate invoices when payment is completed, add to your payment webhook:

```typescript
// In payment webhook (e.g., Paystack)
if (paymentStatus === 'completed') {
  // Generate invoice
  const response = await fetch('/api/invoices/generate', {
    method: 'POST',
    body: JSON.stringify({
      requestId: payment.request_id,
      paymentId: payment.id,
      autoSend: true // Send to client automatically
    })
  })
}
```

### Email Integration (TODO)
To send invoices via email, integrate with your email service:
```typescript
// Add to /api/invoices/generate/route.ts
import { sendEmail } from '@/lib/email'

if (autoSend) {
  await sendEmail({
    to: invoiceData.clientEmail,
    subject: `Invoice ${invoiceNumber} from Kamisoft Enterprises`,
    html: emailTemplate,
    attachments: [{
      filename: `${invoiceNumber}.pdf`,
      content: pdfBuffer
    }]
  })
}
```

## Status Management

### Invoice Statuses
- **draft** - Created but not sent
- **sent** - Sent to client
- **paid** - Payment received
- **overdue** - Past due date
- **cancelled** - Voided/cancelled

### Update Status via API
```bash
curl -X PATCH /api/invoices/[id] \
  -H "Content-Type: application/json" \
  -d '{"status": "paid"}'
```

## Troubleshooting

### PDF Not Generating
- Check if `@react-pdf/renderer` is installed
- Verify Supabase Storage bucket `documents` exists and is accessible
- Check console for PDF rendering errors

### Invoice Number Conflicts
- Ensure database has unique constraint on `invoice_number`
- Check clock synchronization if running multiple instances

### Missing Storage Bucket
Create in Supabase:
```sql
-- Enable storage
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', true);
```

## Next Steps

1. ✅ Install dependencies: `npm install @react-pdf/renderer`
2. ✅ Create Supabase storage bucket: `documents`
3. ✅ Test invoice generation from service request page
4. ⏳ Add company logo to PDF template
5. ⏳ Integrate email sending
6. ⏳ Set up automated invoice generation on payment
7. ⏳ Create invoice list page for admin dashboard

## Support

For issues or questions:
- Email: support@kamisoftenterprises.online
- Check API logs in Vercel/Server logs
- Test PDF generation locally before deploying