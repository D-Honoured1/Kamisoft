# Kamisoft Enterprises

A comprehensive technology services platform built with Next.js, Supabase, and modern web technologies.

## Features

- **Public Website**: Professional company website with services, portfolio, and contact information
- **Client Intake System**: Interactive service request form with chat-style interface
- **Payment Processing**: Integrated payment system with Stripe and Paystack support
- **Admin Dashboard**: Complete management system for requests, clients, and portfolio
- **Authentication**: Secure admin authentication with Supabase Auth
- **Responsive Design**: Mobile-first design with dark/light theme support

## Tech Stack

- **Frontend**: Next.js 14, React 19, TypeScript
- **Styling**: Tailwind CSS v4, Radix UI components
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Payments**: Stripe, Paystack
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account
- Stripe account (for payments)

### Installation

1. Clone the repository:
\`\`\`bash
git clone https://github.com/your-username/kamisoft-enterprises.git
cd kamisoft-enterprises
\`\`\`

2. Install dependencies:
\`\`\`bash
npm install
\`\`\`

3. Set up environment variables:
\`\`\`bash
cp .env.example .env.local
\`\`\`
Fill in your Supabase, Stripe, and other configuration values.

4. Set up the database:
\`\`\`bash
# Run the SQL scripts in order:
# 1. scripts/001_create_core_tables.sql
# 2. scripts/002_enable_rls_and_policies.sql  
# 3. scripts/003_seed_initial_data.sql
\`\`\`

5. Start the development server:
\`\`\`bash
npm run dev
\`\`\`

Visit `http://localhost:3000` to see the application.

## Deployment

### Vercel Deployment

1. Connect your GitHub repository to Vercel
2. Set up environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Manual Deployment

\`\`\`bash
npm run build
npm start
\`\`\`

## Project Structure

\`\`\`
├── app/                    # Next.js app directory
│   ├── admin/             # Admin dashboard pages
│   ├── api/               # API routes
│   ├── (public pages)/    # Public website pages
├── components/            # Reusable components
├── lib/                   # Utilities and configurations
│   ├── supabase/         # Supabase client setup
│   ├── types/            # TypeScript type definitions
├── scripts/              # Database scripts
└── public/               # Static assets
\`\`\`

## Environment Variables

See `.env.example` for all required environment variables.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is proprietary software owned by Kamisoft Enterprises.

## Support

For support, email support@kamisoftenterprises.online or visit our website.
