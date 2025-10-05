-- Migration 021: Create Dynamic Content Management Tables
-- Creates tables for Blog, Testimonials, FAQ, Team Members, and Case Studies
-- All content is admin-controllable with CRUD operations

-- ============================================
-- BLOG POSTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS blog_posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Content
    title VARCHAR(500) NOT NULL,
    slug VARCHAR(500) UNIQUE NOT NULL,
    excerpt TEXT, -- Short summary for cards/listings
    content TEXT NOT NULL, -- Full blog content (supports markdown/HTML)

    -- SEO
    meta_title VARCHAR(60),
    meta_description VARCHAR(160),
    meta_keywords TEXT[], -- Array of keywords

    -- Media
    cover_image_url TEXT,
    cover_image_alt TEXT,

    -- Categorization
    category VARCHAR(100), -- 'technical', 'case-study', 'industry-insights', 'tutorial'
    tags TEXT[], -- Array of tags

    -- Author
    author_id UUID REFERENCES staff_profiles(id) ON DELETE SET NULL,
    author_name VARCHAR(255), -- Fallback if author_id is null

    -- Publishing
    is_published BOOLEAN DEFAULT FALSE,
    is_featured BOOLEAN DEFAULT FALSE,
    published_at TIMESTAMP WITH TIME ZONE,

    -- Analytics
    view_count INTEGER DEFAULT 0,
    read_time_minutes INTEGER, -- Estimated read time

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- TESTIMONIALS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS testimonials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Client info
    client_name VARCHAR(255) NOT NULL,
    client_position VARCHAR(255), -- e.g., "CTO", "Founder"
    client_company VARCHAR(255),
    client_email VARCHAR(255), -- For verification/contact

    -- Content
    message TEXT NOT NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5), -- 1-5 stars

    -- Project reference
    project_title VARCHAR(500),
    service_category service_category,
    project_year INTEGER,
    project_value DECIMAL(10,2), -- Optional: project budget/value

    -- Media
    client_image_url TEXT,
    client_image_alt TEXT,
    company_logo_url TEXT,

    -- Video testimonial
    video_url TEXT, -- YouTube/Vimeo embed URL
    video_thumbnail_url TEXT,

    -- Display settings
    is_published BOOLEAN DEFAULT FALSE,
    is_featured BOOLEAN DEFAULT FALSE, -- Show on homepage
    display_order INTEGER DEFAULT 0,

    -- Verification
    is_verified BOOLEAN DEFAULT FALSE,
    verified_at TIMESTAMP WITH TIME ZONE,
    verified_by_admin_id UUID REFERENCES staff_profiles(id) ON DELETE SET NULL,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- FAQ TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS faqs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Content
    question TEXT NOT NULL,
    answer TEXT NOT NULL, -- Supports markdown/HTML

    -- Categorization
    category VARCHAR(100) NOT NULL, -- 'general', 'services', 'technical', 'pricing', 'hiring'
    tags TEXT[],

    -- Display settings
    is_published BOOLEAN DEFAULT TRUE,
    display_order INTEGER DEFAULT 0, -- Order within category

    -- Analytics
    view_count INTEGER DEFAULT 0,
    helpful_count INTEGER DEFAULT 0, -- "Was this helpful?" positive votes
    not_helpful_count INTEGER DEFAULT 0,

    -- Related content
    related_service_category service_category,
    related_blog_post_id UUID REFERENCES blog_posts(id) ON DELETE SET NULL,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- TEAM MEMBERS TABLE (Beyond Leadership)
-- ============================================
CREATE TABLE IF NOT EXISTS team_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Personal info
    full_name VARCHAR(255) NOT NULL,
    display_name VARCHAR(255), -- Nickname or preferred name
    position VARCHAR(255) NOT NULL,
    department VARCHAR(100), -- 'engineering', 'design', 'operations', 'management'

    -- Bio
    bio TEXT, -- Full bio (supports markdown)
    short_bio TEXT, -- One-liner for cards

    -- Professional details
    years_of_experience INTEGER,
    specializations TEXT[], -- e.g., ['React', 'Node.js', 'AWS']
    certifications TEXT[], -- e.g., ['CCNA', 'AWS Solutions Architect']
    education TEXT,

    -- Contact
    email VARCHAR(255),
    phone VARCHAR(50),

    -- Social links
    linkedin_url VARCHAR(500),
    github_url VARCHAR(500),
    twitter_url VARCHAR(500),
    portfolio_url VARCHAR(500),

    -- Media
    profile_image_url TEXT,
    profile_image_alt TEXT,
    cover_image_url TEXT,

    -- Team settings
    team_type VARCHAR(50) DEFAULT 'staff', -- 'leadership', 'staff', 'consultant', 'intern'
    is_public BOOLEAN DEFAULT TRUE, -- Show on public team page
    is_featured BOOLEAN DEFAULT FALSE,
    display_order INTEGER DEFAULT 0,

    -- Status
    employment_status VARCHAR(50) DEFAULT 'active', -- 'active', 'inactive', 'alumni'
    joined_date DATE,
    left_date DATE,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- CASE STUDIES TABLE (Enhanced Portfolio)
-- ============================================
CREATE TABLE IF NOT EXISTS case_studies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Basic info
    title VARCHAR(500) NOT NULL,
    slug VARCHAR(500) UNIQUE NOT NULL,
    subtitle VARCHAR(500),

    -- Client info
    client_name VARCHAR(255),
    client_industry VARCHAR(100),
    client_size VARCHAR(50), -- 'startup', 'sme', 'enterprise', 'government'
    is_client_confidential BOOLEAN DEFAULT FALSE,

    -- Project details
    service_category service_category NOT NULL,
    project_type VARCHAR(100), -- 'greenfield', 'enhancement', 'maintenance', 'migration'

    -- Story sections
    challenge TEXT NOT NULL, -- The problem
    solution TEXT NOT NULL, -- How we solved it
    results TEXT NOT NULL, -- Outcomes and metrics

    -- Metrics
    key_metrics JSONB, -- Flexible structure for various metrics
    -- Example: {"users": 10000, "performance_improvement": "95%", "roi": "250%"}

    -- Technologies
    technologies TEXT[] NOT NULL,
    tech_stack_frontend TEXT[],
    tech_stack_backend TEXT[],
    tech_stack_infrastructure TEXT[],

    -- Timeline
    project_duration_months INTEGER,
    team_size INTEGER,
    start_date DATE,
    completion_date DATE,

    -- Media
    featured_image_url TEXT,
    featured_image_alt TEXT,
    gallery_images JSONB, -- Array of {url, alt, caption}
    video_url TEXT,

    -- Links
    live_url VARCHAR(500),
    github_url VARCHAR(500),
    documentation_url VARCHAR(500),

    -- Testimonial link
    testimonial_id UUID REFERENCES testimonials(id) ON DELETE SET NULL,

    -- Publishing
    is_published BOOLEAN DEFAULT FALSE,
    is_featured BOOLEAN DEFAULT FALSE,
    published_at TIMESTAMP WITH TIME ZONE,

    -- Analytics
    view_count INTEGER DEFAULT 0,

    -- SEO
    meta_title VARCHAR(60),
    meta_description VARCHAR(160),
    meta_keywords TEXT[],

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- CONTENT ACTIVITY LOG (Audit Trail)
-- ============================================
CREATE TABLE IF NOT EXISTS content_activity_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- What changed
    table_name VARCHAR(100) NOT NULL, -- 'blog_posts', 'testimonials', etc.
    record_id UUID NOT NULL,
    action VARCHAR(50) NOT NULL, -- 'created', 'updated', 'deleted', 'published', 'unpublished'

    -- Who made the change
    admin_id UUID REFERENCES staff_profiles(id) ON DELETE SET NULL,
    admin_email VARCHAR(255),

    -- What changed (optional detailed tracking)
    changes JSONB, -- Store before/after values

    -- When
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Blog posts indexes
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published ON blog_posts(is_published) WHERE is_published = TRUE;
CREATE INDEX IF NOT EXISTS idx_blog_posts_featured ON blog_posts(is_featured) WHERE is_featured = TRUE;
CREATE INDEX IF NOT EXISTS idx_blog_posts_category ON blog_posts(category);
CREATE INDEX IF NOT EXISTS idx_blog_posts_author_id ON blog_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published_at ON blog_posts(published_at DESC) WHERE is_published = TRUE;
CREATE INDEX IF NOT EXISTS idx_blog_posts_tags ON blog_posts USING GIN(tags);

-- Testimonials indexes
CREATE INDEX IF NOT EXISTS idx_testimonials_published ON testimonials(is_published) WHERE is_published = TRUE;
CREATE INDEX IF NOT EXISTS idx_testimonials_featured ON testimonials(is_featured) WHERE is_featured = TRUE;
CREATE INDEX IF NOT EXISTS idx_testimonials_rating ON testimonials(rating);
CREATE INDEX IF NOT EXISTS idx_testimonials_service_category ON testimonials(service_category);
CREATE INDEX IF NOT EXISTS idx_testimonials_display_order ON testimonials(display_order);

-- FAQ indexes
CREATE INDEX IF NOT EXISTS idx_faqs_category ON faqs(category);
CREATE INDEX IF NOT EXISTS idx_faqs_published ON faqs(is_published) WHERE is_published = TRUE;
CREATE INDEX IF NOT EXISTS idx_faqs_display_order ON faqs(category, display_order);
CREATE INDEX IF NOT EXISTS idx_faqs_tags ON faqs USING GIN(tags);

-- Team members indexes
CREATE INDEX IF NOT EXISTS idx_team_members_public ON team_members(is_public) WHERE is_public = TRUE;
CREATE INDEX IF NOT EXISTS idx_team_members_team_type ON team_members(team_type);
CREATE INDEX IF NOT EXISTS idx_team_members_department ON team_members(department);
CREATE INDEX IF NOT EXISTS idx_team_members_display_order ON team_members(team_type, display_order);
CREATE INDEX IF NOT EXISTS idx_team_members_employment_status ON team_members(employment_status);

-- Case studies indexes
CREATE INDEX IF NOT EXISTS idx_case_studies_slug ON case_studies(slug);
CREATE INDEX IF NOT EXISTS idx_case_studies_published ON case_studies(is_published) WHERE is_published = TRUE;
CREATE INDEX IF NOT EXISTS idx_case_studies_featured ON case_studies(is_featured) WHERE is_featured = TRUE;
CREATE INDEX IF NOT EXISTS idx_case_studies_service_category ON case_studies(service_category);
CREATE INDEX IF NOT EXISTS idx_case_studies_published_at ON case_studies(published_at DESC) WHERE is_published = TRUE;
CREATE INDEX IF NOT EXISTS idx_case_studies_technologies ON case_studies USING GIN(technologies);

-- Activity log indexes
CREATE INDEX IF NOT EXISTS idx_content_activity_log_table_record ON content_activity_log(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_content_activity_log_admin_id ON content_activity_log(admin_id);
CREATE INDEX IF NOT EXISTS idx_content_activity_log_created_at ON content_activity_log(created_at DESC);

-- ============================================
-- UPDATE TRIGGERS
-- ============================================
CREATE TRIGGER update_blog_posts_updated_at
    BEFORE UPDATE ON blog_posts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_testimonials_updated_at
    BEFORE UPDATE ON testimonials
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_faqs_updated_at
    BEFORE UPDATE ON faqs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_team_members_updated_at
    BEFORE UPDATE ON team_members
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_case_studies_updated_at
    BEFORE UPDATE ON case_studies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- AUTO-GENERATE SLUG FUNCTION
-- ============================================
CREATE OR REPLACE FUNCTION generate_slug_from_title()
RETURNS TRIGGER AS $$
BEGIN
    -- Only generate slug if it's not provided
    IF NEW.slug IS NULL OR NEW.slug = '' THEN
        NEW.slug := lower(regexp_replace(
            regexp_replace(NEW.title, '[^a-zA-Z0-9\s-]', '', 'g'),
            '\s+', '-', 'g'
        )) || '-' || substr(md5(random()::text), 1, 8);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply slug generation triggers
CREATE TRIGGER generate_blog_post_slug
    BEFORE INSERT ON blog_posts
    FOR EACH ROW EXECUTE FUNCTION generate_slug_from_title();

CREATE TRIGGER generate_case_study_slug
    BEFORE INSERT ON case_studies
    FOR EACH ROW EXECUTE FUNCTION generate_slug_from_title();

-- ============================================
-- RLS POLICIES (Row Level Security)
-- ============================================

-- Enable RLS on all new tables
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_studies ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_activity_log ENABLE ROW LEVEL SECURITY;

-- Public read access for published content
CREATE POLICY "Public read access to published blog posts"
    ON blog_posts FOR SELECT
    USING (is_published = TRUE);

CREATE POLICY "Public read access to published testimonials"
    ON testimonials FOR SELECT
    USING (is_published = TRUE);

CREATE POLICY "Public read access to published FAQs"
    ON faqs FOR SELECT
    USING (is_published = TRUE);

CREATE POLICY "Public read access to public team members"
    ON team_members FOR SELECT
    USING (is_public = TRUE AND employment_status = 'active');

CREATE POLICY "Public read access to published case studies"
    ON case_studies FOR SELECT
    USING (is_published = TRUE);

-- Admin full access (requires authenticated user with is_admin = true)
CREATE POLICY "Admins have full access to blog posts"
    ON blog_posts FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM staff_profiles
            WHERE id = auth.uid() AND is_admin = TRUE
        )
    );

CREATE POLICY "Admins have full access to testimonials"
    ON testimonials FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM staff_profiles
            WHERE id = auth.uid() AND is_admin = TRUE
        )
    );

CREATE POLICY "Admins have full access to FAQs"
    ON faqs FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM staff_profiles
            WHERE id = auth.uid() AND is_admin = TRUE
        )
    );

CREATE POLICY "Admins have full access to team members"
    ON team_members FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM staff_profiles
            WHERE id = auth.uid() AND is_admin = TRUE
        )
    );

CREATE POLICY "Admins have full access to case studies"
    ON case_studies FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM staff_profiles
            WHERE id = auth.uid() AND is_admin = TRUE
        )
    );

CREATE POLICY "Admins have read access to activity log"
    ON content_activity_log FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM staff_profiles
            WHERE id = auth.uid() AND is_admin = TRUE
        )
    );

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to log content activity
CREATE OR REPLACE FUNCTION log_content_activity(
    p_table_name VARCHAR,
    p_record_id UUID,
    p_action VARCHAR,
    p_changes JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_log_id UUID;
    v_admin_email VARCHAR;
BEGIN
    -- Get admin email from auth.users
    SELECT email INTO v_admin_email
    FROM auth.users
    WHERE id = auth.uid();

    -- Insert activity log
    INSERT INTO content_activity_log (
        table_name, record_id, action, admin_id, admin_email, changes
    )
    VALUES (
        p_table_name, p_record_id, p_action, auth.uid(), v_admin_email, p_changes
    )
    RETURNING id INTO v_log_id;

    RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment view count
CREATE OR REPLACE FUNCTION increment_view_count(
    p_table_name VARCHAR,
    p_record_id UUID
)
RETURNS VOID AS $$
BEGIN
    EXECUTE format(
        'UPDATE %I SET view_count = view_count + 1 WHERE id = $1',
        p_table_name
    ) USING p_record_id;
END;
$$ LANGUAGE plpgsql;
