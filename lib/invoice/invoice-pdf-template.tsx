// lib/invoice/invoice-pdf-template.tsx - Professional Invoice PDF Template
import React from 'react'
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer'
import type { InvoiceData } from './index'

// Create styles for PDF
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
    backgroundColor: '#ffffff',
  },
  header: {
    marginBottom: 30,
    borderBottom: '2px solid #2563eb',
    paddingBottom: 20,
  },
  companyName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e40af',
    marginBottom: 5,
  },
  companyDetails: {
    fontSize: 9,
    color: '#6b7280',
    lineHeight: 1.5,
  },
  invoiceTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 20,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 30,
  },
  column: {
    width: '48%',
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  text: {
    fontSize: 10,
    color: '#4b5563',
    marginBottom: 4,
    lineHeight: 1.4,
  },
  textBold: {
    fontWeight: 'bold',
    color: '#111827',
  },
  table: {
    marginTop: 30,
    borderRadius: 4,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    padding: 10,
    borderBottom: '1px solid #d1d5db',
    fontWeight: 'bold',
  },
  tableRow: {
    flexDirection: 'row',
    padding: 10,
    borderBottom: '1px solid #e5e7eb',
  },
  tableCol1: {
    width: '50%',
  },
  tableCol2: {
    width: '15%',
    textAlign: 'right',
  },
  tableCol3: {
    width: '20%',
    textAlign: 'right',
  },
  tableCol4: {
    width: '15%',
    textAlign: 'right',
  },
  totalsSection: {
    marginTop: 20,
    marginLeft: 'auto',
    width: '50%',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 8,
    borderBottom: '1px solid #e5e7eb',
  },
  grandTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: '#f3f4f6',
    fontWeight: 'bold',
    fontSize: 12,
    borderRadius: 4,
    marginTop: 5,
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    left: 40,
    right: 40,
    borderTop: '1px solid #e5e7eb',
    paddingTop: 15,
  },
  footerText: {
    fontSize: 9,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 1.5,
  },
  badge: {
    backgroundColor: '#dbeafe',
    color: '#1e40af',
    padding: '4 8',
    borderRadius: 4,
    fontSize: 9,
    fontWeight: 'bold',
  },
})

interface InvoicePDFProps {
  invoiceNumber: string
  invoiceDate: string
  dueDate: string
  invoiceData: InvoiceData
  status: string
}

export const InvoicePDF = ({
  invoiceNumber,
  invoiceDate,
  dueDate,
  invoiceData,
  status,
}: InvoicePDFProps) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Header with Company Info */}
      <View style={styles.header}>
        <Text style={styles.companyName}>Kamisoft Enterprises</Text>
        <Text style={styles.companyDetails}>
          Software Development & IT Solutions{'\n'}
          Lagos, Nigeria{'\n'}
          Email: support@kamisoftenterprises.online{'\n'}
          Phone: +234 803 639 2157{'\n'}
          Website: www.kamisoftenterprises.online
        </Text>
      </View>

      {/* Invoice Title and Number */}
      <View style={{ marginBottom: 20 }}>
        <Text style={styles.invoiceTitle}>INVOICE</Text>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 }}>
          <View>
            <Text style={styles.text}>
              <Text style={styles.textBold}>Invoice #:</Text> {invoiceNumber}
            </Text>
            <Text style={styles.text}>
              <Text style={styles.textBold}>Date:</Text> {invoiceDate}
            </Text>
            <Text style={styles.text}>
              <Text style={styles.textBold}>Due Date:</Text> {dueDate}
            </Text>
          </View>
          <View style={styles.badge}>
            <Text>{status.toUpperCase()}</Text>
          </View>
        </View>
      </View>

      {/* Bill To / Service Details Row */}
      <View style={styles.row}>
        {/* Bill To */}
        <View style={styles.column}>
          <Text style={styles.sectionTitle}>Bill To:</Text>
          <Text style={[styles.text, styles.textBold]}>{invoiceData.clientName}</Text>
          {invoiceData.clientCompany && (
            <Text style={styles.text}>{invoiceData.clientCompany}</Text>
          )}
          <Text style={styles.text}>{invoiceData.clientEmail}</Text>
          {invoiceData.clientAddress && (
            <Text style={styles.text}>{invoiceData.clientAddress}</Text>
          )}
        </View>

        {/* Service Details */}
        <View style={styles.column}>
          <Text style={styles.sectionTitle}>Service Details:</Text>
          <Text style={[styles.text, styles.textBold]}>{invoiceData.serviceTitle}</Text>
          <Text style={styles.text}>
            Category: {invoiceData.serviceCategory.replace(/_/g, ' ').toUpperCase()}
          </Text>
        </View>
      </View>

      {/* Items Table */}
      <View style={styles.table}>
        {/* Table Header */}
        <View style={styles.tableHeader}>
          <Text style={styles.tableCol1}>Description</Text>
          <Text style={styles.tableCol2}>Qty</Text>
          <Text style={styles.tableCol3}>Unit Price</Text>
          <Text style={styles.tableCol4}>Amount</Text>
        </View>

        {/* Table Rows */}
        {invoiceData.items.map((item, index) => (
          <View key={index} style={styles.tableRow}>
            <Text style={styles.tableCol1}>{item.description}</Text>
            <Text style={styles.tableCol2}>{item.quantity}</Text>
            <Text style={styles.tableCol3}>${item.unitPrice.toLocaleString()}</Text>
            <Text style={styles.tableCol4}>${item.amount.toLocaleString()}</Text>
          </View>
        ))}
      </View>

      {/* Totals Section */}
      <View style={styles.totalsSection}>
        <View style={styles.totalRow}>
          <Text style={styles.text}>Subtotal:</Text>
          <Text style={styles.text}>${invoiceData.subtotal.toLocaleString()}</Text>
        </View>
        <View style={styles.totalRow}>
          <Text style={styles.text}>
            Tax ({(invoiceData.taxRate * 100).toFixed(1)}%):
          </Text>
          <Text style={styles.text}>${invoiceData.taxAmount.toLocaleString()}</Text>
        </View>
        <View style={styles.grandTotalRow}>
          <Text>TOTAL DUE:</Text>
          <Text>${invoiceData.totalAmount.toLocaleString()}</Text>
        </View>
      </View>

      {/* Payment Information */}
      <View style={{ marginTop: 30, padding: 15, backgroundColor: '#f9fafb', borderRadius: 4 }}>
        <Text style={[styles.sectionTitle, { marginBottom: 8 }]}>Payment Information:</Text>
        <Text style={styles.text}>
          <Text style={styles.textBold}>Bank Transfer:</Text>
        </Text>
        <Text style={styles.text}>• Kuda Bank - 3002495746 - Kamisoft Enterprises</Text>
        <Text style={styles.text}>• Moniepoint - 6417130337 - Kamisoft Enterprises</Text>
        <Text style={[styles.text, { marginTop: 8 }]}>
          Please use invoice number {invoiceNumber} as payment reference.
        </Text>
      </View>

      {/* Notes */}
      {invoiceData.notes && (
        <View style={{ marginTop: 20 }}>
          <Text style={styles.sectionTitle}>Notes:</Text>
          <Text style={styles.text}>{invoiceData.notes}</Text>
        </View>
      )}

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Thank you for your business!{'\n'}
          For any questions regarding this invoice, please contact support@kamisoftenterprises.online
        </Text>
      </View>
    </Page>
  </Document>
)

export default InvoicePDF