-- ============================================================================
-- Setup Password Field - Run this in SQL Server Management Studio (SSMS)
-- ============================================================================

USE marina_portal;
GO

PRINT '🔧 Adding password field to users table...';

-- Add password column to users table
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'password')
BEGIN
    ALTER TABLE users ADD password VARCHAR(255) NULL;
    PRINT '✅ Added password column to users table';
END
ELSE
BEGIN
    PRINT 'ℹ️ Password column already exists';
END

-- Set a secure password for John Doe (demo user)
-- This creates a bcrypt hash of 'SecurePass123'
UPDATE users 
SET password = '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/HS.iK8O'
WHERE email = 'demo@marina.com';

PRINT '✅ Set secure password for demo user';
PRINT '🔑 Demo user password is now: SecurePass123';

-- Verify the update
SELECT 
    email,
    firstName,
    lastName,
    CASE 
        WHEN password IS NOT NULL THEN 'Password Set'
        ELSE 'No Password'
    END as PasswordStatus
FROM users 
WHERE email = 'demo@marina.com';

PRINT '✅ Password field setup completed!';
GO

