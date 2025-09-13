-- Enable Row Level Security (RLS) for all tables
-- This ensures data security and proper access control

-- Enable RLS on all tables
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE leadership_team ENABLE ROW LEVEL SECURITY;

-- Staff profiles policies (users can manage their own profile)
CREATE POLICY "staff_profiles_select_own" ON staff_profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "staff_profiles_update_own" ON staff_profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "staff_profiles_insert_own" ON staff_profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Admin-only policies for sensitive data
-- Only admin users can access client data, requests, payments, etc.

-- Clients - Admin only
CREATE POLICY "clients_admin_all" ON clients
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM staff_profiles 
            WHERE id = auth.uid() AND is_admin = true
        )
    );

-- Service requests - Admin only
CREATE POLICY "service_requests_admin_all" ON service_requests
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM staff_profiles 
            WHERE id = auth.uid() AND is_admin = true
        )
    );

-- Payments - Admin only
CREATE POLICY "payments_admin_all" ON payments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM staff_profiles 
            WHERE id = auth.uid() AND is_admin = true
        )
    );

-- Invoices - Admin only
CREATE POLICY "invoices_admin_all" ON invoices
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM staff_profiles 
            WHERE id = auth.uid() AND is_admin = true
        )
    );

-- Staff assignments - Admin can manage all, staff can view their own
CREATE POLICY "staff_assignments_admin_all" ON staff_assignments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM staff_profiles 
            WHERE id = auth.uid() AND is_admin = true
        )
    );

CREATE POLICY "staff_assignments_staff_select_own" ON staff_assignments
    FOR SELECT USING (staff_id = auth.uid());

-- Portfolio projects - Admin can manage, public can view published
CREATE POLICY "portfolio_admin_all" ON portfolio_projects
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM staff_profiles 
            WHERE id = auth.uid() AND is_admin = true
        )
    );

CREATE POLICY "portfolio_public_select" ON portfolio_projects
    FOR SELECT USING (is_published = true);

-- Products - Admin can manage, public can view active
CREATE POLICY "products_admin_all" ON products
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM staff_profiles 
            WHERE id = auth.uid() AND is_admin = true
        )
    );

CREATE POLICY "products_public_select" ON products
    FOR SELECT USING (is_active = true);

-- Leadership team - Admin can manage, public can view active
CREATE POLICY "leadership_admin_all" ON leadership_team
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM staff_profiles 
            WHERE id = auth.uid() AND is_admin = true
        )
    );

CREATE POLICY "leadership_public_select" ON leadership_team
    FOR SELECT USING (is_active = true);
