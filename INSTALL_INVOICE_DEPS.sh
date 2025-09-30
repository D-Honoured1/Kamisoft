#!/bin/bash
# Install Invoice System Dependencies

echo "📦 Installing Invoice System Dependencies..."
echo ""

npm install @react-pdf/renderer

echo ""
echo "✅ Installation Complete!"
echo ""
echo "📋 Next Steps:"
echo "1. Create Supabase storage bucket named 'documents' (make it public)"
echo "2. Test invoice generation from service request details page"
echo "3. See INVOICE_SYSTEM_SETUP.md for full documentation"
echo ""