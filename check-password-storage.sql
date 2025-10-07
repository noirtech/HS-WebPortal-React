-- ============================================================================
-- Check Password Storage in Database
-- Run this in SQL Server Management Studio (SSMS)
-- ============================================================================

USE marina_portal;
GO

PRINT '🔍 Checking password storage in database...';

-- Show the users table structure
PRINT '📋 Users table structure:';
SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    IS_NULLABLE,
    CHARACTER_MAXIMUM_LENGTH,
    COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'users'
ORDER BY ORDINAL_POSITION;

PRINT '';

-- Show where the password is stored
PRINT '🔐 Password storage details:';
SELECT 
    id,
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
    END as HashLength,
    CASE 
        WHEN password IS NOT NULL THEN LEFT(password, 20) + '...'
        ELSE 'NULL'
    END as PasswordHashPreview,
    marinaId,
    isActive,
    createdAt,
    updatedAt
FROM users
ORDER BY createdAt DESC;

PRINT '';

-- Show specific demo user password details
PRINT '👤 Demo user password details:';
SELECT 
    'John Doe' as UserName,
    email,
    CASE 
        WHEN password IS NOT NULL THEN 'Yes'
        ELSE 'No'
    END as HasPassword,
    CASE 
        WHEN password IS NOT NULL THEN LEN(password)
        ELSE 0
    END as HashLength,
    CASE 
        WHEN password IS NOT NULL THEN LEFT(password, 30) + '...'
        ELSE 'NULL'
    END as PasswordHashStart,
    CASE 
        WHEN password LIKE '$2a$%' THEN 'bcrypt (correct format)'
        WHEN password LIKE '$2b$%' THEN 'bcrypt (newer format)'
        WHEN password IS NULL THEN 'No password set'
        ELSE 'Unknown format'
    END as HashType
FROM users 
WHERE email = 'demo@marina.com';

PRINT '';

-- Show table location and database info
PRINT '🗄️ Database and table information:';
SELECT 
    DB_NAME() as DatabaseName,
    'users' as TableName,
    'password' as ColumnName,
    'VARCHAR(255)' as DataType,
    'bcrypt hash storage' as Purpose;

PRINT '';
PRINT '✅ Password storage check completed!';
PRINT '📝 Summary:';
PRINT '   - Database: marina_portal';
PRINT '   - Table: users';
PRINT '   - Column: password (VARCHAR(255))';
PRINT '   - Format: bcrypt hash';
PRINT '   - Demo user: demo@marina.com';
PRINT '   - Password: SecurePass123 (hashed)';
GO

