-- Seed initial data for Kamisoft Enterprises
-- This includes leadership team, initial products, and sample portfolio projects

-- Insert leadership team
INSERT INTO leadership_team (name, position, bio, email, display_order, is_active) VALUES
(
    'Daniel Austen',
    'Chief Executive Officer',
    'Visionary leader with over 10 years of experience in technology and business development. Founded Kamisoft Enterprises in 2015 with a mission to deliver cutting-edge software solutions across Africa and beyond.',
    'daniel@kamisoft.com',
    1,
    true
),
(
    'Sarah Johnson',
    'Chief Operating Officer', 
    'Operations expert with extensive experience in scaling technology companies. Ensures smooth delivery of all client projects and manages our growing team of developers.',
    'sarah@kamisoft.com',
    2,
    true
),
(
    'Michael Chen',
    'Chief Technology Officer',
    'Technical architect with deep expertise in full-stack development, blockchain, and AI. Leads our technical strategy and ensures we stay at the forefront of technology trends.',
    'michael@kamisoft.com',
    3,
    true
);

-- Insert flagship products
INSERT INTO products (name, description, category, features, pricing_model, product_url, is_active, launch_date) VALUES
(
    'Forex Bot',
    'Advanced automated trading bot for forex markets with AI-powered analysis and risk management.',
    'Fintech',
    ARRAY['AI-powered trading signals', 'Risk management', 'Real-time market analysis', '24/7 automated trading', 'Portfolio diversification'],
    'subscription',
    'https://forexbot.kamisoft.com',
    true,
    '2023-06-15'
),
(
    'Brain-Clip',
    'Revolutionary gaming platform that combines entertainment with cognitive training and skill development.',
    'Gaming',
    ARRAY['Cognitive training games', 'Skill assessment', 'Progress tracking', 'Multiplayer challenges', 'Leaderboards'],
    'free',
    'https://brainclip.kamisoft.com',
    true,
    '2023-09-20'
),
(
    'E-commerce Platform',
    'Comprehensive e-commerce solution similar to AliExpress, built for African markets with local payment integration.',
    'E-commerce',
    ARRAY['Multi-vendor marketplace', 'Local payment gateways', 'Inventory management', 'Order tracking', 'Mobile-first design'],
    'custom',
    'https://marketplace.kamisoft.com',
    true,
    '2024-01-10'
),
(
    'Enterprise CRM',
    'Customer relationship management system designed for growing businesses with advanced analytics and automation.',
    'Enterprise Software',
    ARRAY['Contact management', 'Sales pipeline', 'Email automation', 'Analytics dashboard', 'Integration APIs'],
    'subscription',
    'https://crm.kamisoft.com',
    true,
    '2023-11-30'
),
(
    'Blockchain Identity',
    'Decentralized identity verification system using blockchain technology for secure and private authentication.',
    'Blockchain',
    ARRAY['Decentralized identity', 'Biometric verification', 'Zero-knowledge proofs', 'Cross-platform compatibility', 'Privacy-first design'],
    'custom',
    'https://identity.kamisoft.com',
    true,
    '2024-03-15'
);

-- Insert sample portfolio projects
INSERT INTO portfolio_projects (title, description, service_category, client_name, technologies, completion_date, is_featured, is_published) VALUES
(
    'Banking Mobile App',
    'Complete mobile banking solution with biometric authentication, real-time transactions, and advanced security features.',
    'fintech_platforms',
    'First Bank Nigeria',
    ARRAY['React Native', 'Node.js', 'PostgreSQL', 'Redis', 'AWS'],
    '2023-12-15',
    true,
    true
),
(
    'E-learning Platform',
    'Comprehensive online learning management system with video streaming, interactive quizzes, and progress tracking.',
    'full_stack_development',
    'University of Lagos',
    ARRAY['Next.js', 'TypeScript', 'Prisma', 'Supabase', 'Vercel'],
    '2023-10-20',
    true,
    true
),
(
    'Supply Chain DApp',
    'Blockchain-based supply chain tracking system ensuring transparency and authenticity of products.',
    'blockchain_solutions',
    'Dangote Group',
    ARRAY['Solidity', 'Web3.js', 'React', 'IPFS', 'Ethereum'],
    '2024-02-28',
    true,
    true
),
(
    'Hospital Management System',
    'Complete hospital management solution with patient records, appointment scheduling, and billing integration.',
    'full_stack_development',
    'Lagos State Hospital',
    ARRAY['Vue.js', 'Laravel', 'MySQL', 'Docker', 'AWS'],
    '2023-08-10',
    false,
    true
),
(
    'Cryptocurrency Exchange',
    'Secure cryptocurrency trading platform with advanced charting, order matching, and wallet integration.',
    'blockchain_solutions',
    'CryptoNaira',
    ARRAY['React', 'Node.js', 'MongoDB', 'WebSocket', 'Kubernetes'],
    '2024-01-25',
    true,
    true
),
(
    'IoT Smart Home System',
    'Comprehensive IoT solution for smart home automation with mobile app control and AI-powered optimization.',
    'ai_automation',
    'Smart Living Ltd',
    ARRAY['Python', 'TensorFlow', 'React Native', 'MQTT', 'Raspberry Pi'],
    '2023-11-05',
    false,
    true
);

-- Generate invoice numbers sequence
CREATE SEQUENCE IF NOT EXISTS invoice_number_seq START 1000;

-- Function to generate invoice numbers
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TEXT AS $$
BEGIN
    RETURN 'KE-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(nextval('invoice_number_seq')::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- Set default invoice number generation
ALTER TABLE invoices ALTER COLUMN invoice_number SET DEFAULT generate_invoice_number();
