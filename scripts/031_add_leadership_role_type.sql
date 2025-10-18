-- Add role_type to distinguish leaders from team members
ALTER TABLE leadership_team
ADD COLUMN IF NOT EXISTS role_type VARCHAR(50) DEFAULT 'member';

-- Update existing records - you can manually set which ones are 'leader'
-- Example: UPDATE leadership_team SET role_type = 'leader' WHERE position ILIKE '%CEO%' OR position ILIKE '%CTO%' OR position ILIKE '%founder%';

COMMENT ON COLUMN leadership_team.role_type IS 'Role type: leader or member';
