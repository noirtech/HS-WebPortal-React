-- Migration script to rename customers table to owners
-- This preserves all existing data while aligning with the current schema

USE marina_portal;
GO

-- Check if customers table exists and has data
IF EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'customers')
BEGIN
    PRINT '✅ Customers table found';
    
    -- Get count of existing customers
    DECLARE @customerCount INT;
    SELECT @customerCount = COUNT(*) FROM customers;
    PRINT '📊 Found ' + CAST(@customerCount AS VARCHAR) + ' existing customers';
    
    -- Check if owners table already exists
    IF EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'owners')
    BEGIN
        PRINT '⚠️ Owners table already exists - dropping it first';
        DROP TABLE owners;
    END
    
    -- Rename customers table to owners
    EXEC sp_rename 'customers', 'owners';
    PRINT '✅ Successfully renamed customers table to owners';
    
    -- Verify the rename worked
    IF EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'owners')
    BEGIN
        PRINT '✅ Owners table now exists';
        
        -- Check data integrity
        DECLARE @ownerCount INT;
        SELECT @ownerCount = COUNT(*) FROM owners;
        PRINT '📊 Owners table now contains ' + CAST(@ownerCount AS VARCHAR) + ' records';
        
        IF @ownerCount = @customerCount
        BEGIN
            PRINT '✅ Data integrity verified - all records preserved';
        END
        ELSE
        BEGIN
            PRINT '❌ Data integrity issue - record count mismatch';
        END
    END
    ELSE
    BEGIN
        PRINT '❌ Failed to rename table';
    END
END
ELSE
BEGIN
    PRINT '❌ Customers table not found';
END

-- Check final state
PRINT '';
PRINT '🔍 Final table state:';
SELECT TABLE_NAME, TABLE_TYPE 
FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_TYPE = 'BASE TABLE' 
ORDER BY TABLE_NAME;

PRINT '';
PRINT 'Migration completed!';
