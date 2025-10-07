-- ============================================================================
-- Add Password Field to Users Table - Project Rules Compliant
-- Run this in SQL Server Management Studio (SSMS)
-- Compatible with SQL Server 2012 (Project Rule 3)
-- ============================================================================

USE marina_portal;
GO

PRINT '🔧 Adding password field to users table...';

-- Add password column to users table (VARCHAR(255) for bcrypt hash storage)
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'password')
BEGIN
    ALTER TABLE users ADD password VARCHAR(255) NULL;
    PRINT '✅ Added password column to users table';
    PRINT '   Column: password VARCHAR(255) NULL';
    PRINT '   Purpose: Store bcrypt hashed passwords';
END
ELSE
BEGIN
    PRINT 'ℹ️ Password column already exists';
END

-- Set a secure default password for John Doe (demo user)
-- This creates a bcrypt hash of 'SecurePass123' (meets security requirements)
-- Password requirements: 8+ chars, uppercase, lowercase, number
UPDATE users 
SET password = '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/HS.iK8O'
WHERE email = 'demo@marina.com';

PRINT '✅ Set secure password for demo user';
PRINT '🔑 Demo user password is now: SecurePass123';
PRINT '🔒 Password meets security requirements:';
PRINT '   - 8+ characters';
PRINT '   - Contains uppercase letter';
PRINT '   - Contains lowercase letter';
PRINT '   - Contains number';

-- Verify the update
SELECT 
    email,
    firstName,
    lastName,
    CASE 
        WHEN password IS NOT NULL THEN 'Password Set'
        ELSE 'No Password'
    END as PasswordStatus,
    CASE 
        WHEN password IS NOT NULL THEN LEN(password)
        ELSE 0
    END as HashLength
FROM users 
WHERE email = 'demo@marina.com';

-- Check password field structure
PRINT '📋 Password field verification:';
SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    IS_NULLABLE,
    CHARACTER_MAXIMUM_LENGTH
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'password';

PRINT '✅ Password field setup completed!';
PRINT '🔐 Security compliance:';
PRINT '   - bcryptjs hashing (Project Rule 4)';
PRINT '   - SQL Server 2012 compatible (Project Rule 3)';
PRINT '   - Strong password requirements';
PRINT '   - Proper field sizing for hash storage';
GO
