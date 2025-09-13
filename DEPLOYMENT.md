# Deployment Guide for Kamisoft Enterprises

## Pre-Deployment Checklist

### 1. Environment Setup
- [ ] Supabase project created and configured
- [ ] Database tables created using provided SQL scripts
- [ ] Row Level Security (RLS) policies enabled
- [ ] Stripe account set up with API keys
- [ ] Paystack account configured (optional)
- [ ] Domain name configured (if using custom domain)

### 2. Environment Variables
Ensure all required environment variables are set in your deployment platform:

**Required:**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_PUBLISHABLE_KEY`
- `SITE_URL`

**Optional:**
- `PAYSTACK_SECRET_KEY`
- `PAYSTACK_PUBLIC_KEY`
- `NEXT_PUBLIC_GA_ID`

### 3. Database Setup

Run these SQL scripts in your Supabase SQL editor in order:

1. `scripts/001_create_core_tables.sql` - Creates all necessary tables
2. `scripts/002_enable_rls_and_policies.sql` - Sets up security policies
3. `scripts/003_seed_initial_data.sql` - Adds initial data

### 4. Vercel Deployment

1. **Connect Repository:**
   - Link your GitHub repository to Vercel
   - Select the main branch for production deployments

2. **Configure Environment Variables:**
   - Go to Project Settings > Environment Variables
   - Add all required environment variables
   - Ensure production values are used

3. **Deploy:**
   - Push to main branch triggers automatic deployment
   - Monitor build logs for any issues

### 5. Post-Deployment Verification

- [ ] Public website loads correctly
- [ ] Admin login works
- [ ] Service request form submits successfully
- [ ] Payment processing works (test mode)
- [ ] Database connections are stable
- [ ] Email notifications work (if configured)

### 6. Production Checklist

- [ ] SSL certificate is active
- [ ] Custom domain configured (if applicable)
- [ ] Analytics tracking enabled
- [ ] Error monitoring set up
- [ ] Backup strategy implemented
- [ ] Performance monitoring active

## Troubleshooting

### Common Issues

1. **Build Failures:**
   - Check TypeScript errors
   - Verify all environment variables are set
   - Ensure database connection is working

2. **Authentication Issues:**
   - Verify Supabase URL and keys
   - Check RLS policies are enabled
   - Ensure redirect URLs are configured

3. **Payment Issues:**
   - Verify Stripe/Paystack keys
   - Check webhook endpoints
   - Test in sandbox mode first

### Support

For deployment support, contact the development team or refer to the main README.md file.
