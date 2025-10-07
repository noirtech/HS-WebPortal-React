-- ============================================================================
-- Update/Create John Doe User Script
-- Run this in SQL Server Management Studio (SSMS)
-- ============================================================================

USE marina_portal;
GO

PRINT '🔧 Updating user to John Doe...';

-- First, check if John Doe user exists
IF EXISTS (SELECT 1 FROM users WHERE email = 'demo@marina.com')
BEGIN
    PRINT '✅ User demo@marina.com already exists, updating to John Doe...';
    
    UPDATE users 
    SET 
        firstName = 'John',
        lastName = 'Doe',
        phone = '+44 7700 900000',
        isActive = 1,
        updatedAt = GETDATE()
    WHERE email = 'demo@marina.com';
    
    PRINT '✅ User updated to John Doe';
END
ELSE
BEGIN
    PRINT '❌ User demo@marina.com not found, creating John Doe...';
    
    -- Ensure marina and marina group exist first
    IF NOT EXISTS (SELECT 1 FROM marina_groups WHERE id = 'marina-group-1')
    BEGIN
        INSERT INTO marina_groups (id, name, description, createdAt, updatedAt)
        VALUES ('marina-group-1', 'Harbor View Marina Group', 'Premium marina management group serving the coastal community', GETDATE(), GETDATE());
        PRINT '✅ Created marina group';
    END
    
    IF NOT EXISTS (SELECT 1 FROM marinas WHERE id = 'marina-1')
    BEGIN
        INSERT INTO marinas (id, name, code, address, phone, email, timezone, isActive, isOnline, lastSyncAt, createdAt, updatedAt, marinaGroupId)
        VALUES ('marina-1', 'Harbor View Marina', 'HVM001', '123 Harbour Drive, Portsmouth, PO1 1AA', '+44 23 9283 1234', 'info@harborviewmarina.co.uk', 'Europe/London', 1, 1, NULL, GETDATE(), GETDATE(), 'marina-group-1');
        PRINT '✅ Created marina';
    END
    
    -- Create John Doe user
    INSERT INTO users (id, email, firstName, lastName, phone, isActive, lastLoginAt, createdAt, updatedAt, marinaId, marinaGroupId)
    VALUES ('user-1', 'demo@marina.com', 'John', 'Doe', '+44 7700 900000', 1, NULL, GETDATE(), GETDATE(), 'marina-1', 'marina-group-1');
    
    PRINT '✅ Created John Doe user';
    
    -- Create user roles
    INSERT INTO user_roles (id, userId, role, marinaId, createdAt)
    VALUES ('role-1', 'user-1', 'MARINA_ADMIN', 'marina-1', GETDATE());
    
    INSERT INTO user_roles (id, userId, role, marinaId, createdAt)
    VALUES ('role-2', 'user-1', 'SUPER_ADMIN', 'marina-1', GETDATE());
    
    PRINT '✅ Created user roles';
END

-- Verify the user was created/updated correctly
SELECT 
    u.id,
    u.email,
    u.firstName,
    u.lastName,
    u.phone,
    u.isActive,
    u.marinaId,
    u.marinaGroupId,
    ur.role
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.userId
WHERE u.email = 'demo@marina.com';

PRINT '✅ Script completed successfully!';
PRINT '🔑 You can now sign in with: demo@marina.com (any password)';
GO
