-- ============================================================================
-- Check Users in Database
-- Run this in SQL Server Management Studio (SSMS)
-- ============================================================================

USE marina_portal;
GO

PRINT '🔍 Checking users in database...';

-- Count total users
SELECT COUNT(*) as TotalUsers FROM users;
PRINT '📊 Total users found: ' + CAST((SELECT COUNT(*) FROM users) AS VARCHAR(10));

-- Show all users with their details
SELECT 
    id,
    email,
    firstName,
    lastName,
    phone,
    isActive,
    marinaId,
    marinaGroupId,
    createdAt,
    updatedAt
FROM users
ORDER BY createdAt DESC;

-- Show user roles
PRINT '🔐 User roles:';
SELECT 
    u.email,
    u.firstName + ' ' + u.lastName as FullName,
    ur.role,
    ur.marinaId
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.userId
ORDER BY u.email, ur.role;

-- Check for specific demo user
PRINT '🔍 Checking for demo user...';
SELECT 
    id,
    email,
    firstName,
    lastName,
    isActive,
    marinaId
FROM users 
WHERE email = 'demo@marina.com';

PRINT '✅ User check completed!';
GO

