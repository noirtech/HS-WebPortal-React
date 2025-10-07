-- ============================================================================
-- VERIFICATION: TEST OWNERS TO CUSTOMERS MIGRATION
-- ============================================================================
-- This script verifies that all database changes have been applied correctly.

USE marina_portal;
GO

PRINT '🔍 VERIFYING OWNERS TO CUSTOMERS MIGRATION...';
PRINT '================================================';
PRINT '';

-- Test 1: Check if owners table still exists
PRINT 'Test 1: Checking if owners table still exists...';
IF EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'owners')
BEGIN
    PRINT '❌ FAILED: owners table still exists!';
END
ELSE
BEGIN
    PRINT '✅ PASSED: owners table has been renamed successfully.';
END

-- Test 2: Check if customers table exists
PRINT '';
PRINT 'Test 2: Checking if customers table exists...';
IF EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'customers')
BEGIN
    PRINT '✅ PASSED: customers table exists.';
    
    -- Check table structure
    PRINT '   Table structure:';
    SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'customers'
    ORDER BY ORDINAL_POSITION;
END
ELSE
BEGIN
    PRINT '❌ FAILED: customers table does not exist!';
END

-- Test 3: Check if all ownerId columns have been renamed to customerId
PRINT '';
PRINT 'Test 3: Checking if ownerId columns have been renamed to customerId...';

DECLARE @ownerIdCount INT = 0;
DECLARE @customerIdCount INT = 0;

SELECT @ownerIdCount = COUNT(*) 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE COLUMN_NAME = 'ownerId';

SELECT @customerIdCount = COUNT(*) 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE COLUMN_NAME = 'customerId';

IF @ownerIdCount = 0 AND @customerIdCount > 0
BEGIN
    PRINT '✅ PASSED: All ownerId columns have been renamed to customerId.';
    PRINT '   Found ' + CAST(@customerIdCount AS VARCHAR) + ' customerId columns.';
    
    -- Show which tables have customerId columns
    PRINT '   Tables with customerId columns:';
    SELECT TABLE_NAME, COLUMN_NAME 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE COLUMN_NAME = 'customerId'
    ORDER BY TABLE_NAME;
END
ELSE
BEGIN
    PRINT '❌ FAILED: Column rename incomplete!';
    PRINT '   ownerId columns found: ' + CAST(@ownerIdCount AS VARCHAR);
    PRINT '   customerId columns found: ' + CAST(@customerIdCount AS VARCHAR);
END

-- Test 4: Check foreign key constraints
PRINT '';
PRINT 'Test 4: Checking foreign key constraints...';

DECLARE @oldConstraintCount INT = 0;
DECLARE @newConstraintCount INT = 0;

SELECT @oldConstraintCount = COUNT(*) 
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
WHERE CONSTRAINT_NAME LIKE '%owners%';

SELECT @newConstraintCount = COUNT(*) 
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
WHERE CONSTRAINT_NAME LIKE '%customers%';

IF @oldConstraintCount = 0 AND @newConstraintCount > 0
BEGIN
    PRINT '✅ PASSED: Foreign key constraints have been updated.';
    PRINT '   Found ' + CAST(@newConstraintCount AS VARCHAR) + ' customer-related constraints.';
    
    -- Show the new constraints
    PRINT '   New constraints:';
    SELECT CONSTRAINT_NAME, TABLE_NAME, COLUMN_NAME 
    FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
    WHERE CONSTRAINT_NAME LIKE '%customers%'
    ORDER BY TABLE_NAME;
END
ELSE
BEGIN
    PRINT '❌ FAILED: Foreign key constraint update incomplete!';
    PRINT '   Old constraints found: ' + CAST(@oldConstraintCount AS VARCHAR);
    PRINT '   New constraints found: ' + CAST(@newConstraintCount AS VARCHAR);
END

-- Test 5: Test data integrity by running sample queries
PRINT '';
PRINT 'Test 5: Testing data integrity with sample queries...';

-- Test boats query
PRINT '   Testing boats query...';
BEGIN TRY
    DECLARE @boatCount INT;
    SELECT @boatCount = COUNT(*) FROM boats;
    PRINT '   ✅ boats table accessible, contains ' + CAST(@boatCount AS VARCHAR) + ' records.';
    
    -- Test a JOIN query
    DECLARE @joinTestCount INT;
    SELECT @joinTestCount = COUNT(*) 
    FROM boats b 
    LEFT JOIN customers c ON b.customerId = c.id;
    PRINT '   ✅ JOIN between boats and customers works, returned ' + CAST(@joinTestCount AS VARCHAR) + ' records.';
END TRY
BEGIN CATCH
    PRINT '   ❌ boats query failed: ' + ERROR_MESSAGE();
END CATCH

-- Test contracts query
PRINT '   Testing contracts query...';
BEGIN TRY
    DECLARE @contractCount INT;
    SELECT @contractCount = COUNT(*) FROM contracts;
    PRINT '   ✅ contracts table accessible, contains ' + CAST(@contractCount AS VARCHAR) + ' records.';
    
    -- Test a JOIN query
    DECLARE @contractJoinCount INT;
    SELECT @contractJoinCount = COUNT(*) 
    FROM contracts c 
    LEFT JOIN customers cust ON c.customerId = cust.id;
    PRINT '   ✅ JOIN between contracts and customers works, returned ' + CAST(@contractJoinCount AS VARCHAR) + ' records.';
END TRY
BEGIN CATCH
    PRINT '   ❌ contracts query failed: ' + ERROR_MESSAGE();
END CATCH

-- Test 6: Check for any remaining references to 'owners'
PRINT '';
PRINT 'Test 6: Checking for any remaining references to owners...';

DECLARE @remainingReferences INT = 0;
SELECT @remainingReferences = COUNT(*) 
FROM sys.sql_expression_dependencies 
WHERE referenced_entity_name = 'owners';

IF @remainingReferences = 0
BEGIN
    PRINT '✅ PASSED: No remaining references to owners table found.';
END
ELSE
BEGIN
    PRINT '❌ FAILED: Found ' + CAST(@remainingReferences AS VARCHAR) + ' remaining references to owners table.';
    PRINT '   These need to be updated:';
    SELECT * FROM sys.sql_expression_dependencies 
    WHERE referenced_entity_name = 'owners';
END

-- Test 7: Verify table relationships
PRINT '';
PRINT 'Test 7: Verifying table relationships...';

-- Check if we can access customer data through related tables
BEGIN TRY
    DECLARE @customerAccessCount INT;
    SELECT @customerAccessCount = COUNT(DISTINCT c.id)
    FROM customers c
    INNER JOIN boats b ON c.id = b.customerId;
    
    PRINT '✅ PASSED: Can access customers through boats relationship.';
    PRINT '   Found ' + CAST(@customerAccessCount AS VARCHAR) + ' customers with boats.';
END TRY
BEGIN CATCH
    PRINT '❌ FAILED: Cannot access customers through boats relationship: ' + ERROR_MESSAGE();
END CATCH

-- Final Summary
PRINT '';
PRINT '================================================';
PRINT '🏁 MIGRATION VERIFICATION COMPLETE';
PRINT '================================================';
PRINT '';

-- Count total issues
DECLARE @totalIssues INT = 0;
IF EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'owners') SET @totalIssues = @totalIssues + 1;
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'customers') SET @totalIssues = @totalIssues + 1;
IF @ownerIdCount > 0 SET @totalIssues = @totalIssues + 1;
IF @customerIdCount = 0 SET @totalIssues = @totalIssues + 1;
IF @oldConstraintCount > 0 SET @totalIssues = @totalIssues + 1;
IF @newConstraintCount = 0 SET @totalIssues = @totalIssues + 1;
IF @remainingReferences > 0 SET @totalIssues = @totalIssues + 1;

IF @totalIssues = 0
BEGIN
    PRINT '🎉 SUCCESS: All migration tests passed!';
    PRINT '   The owners to customers migration has been completed successfully.';
    PRINT '';
    PRINT 'Next steps:';
    PRINT '1. Update your Prisma schema files';
    PRINT '2. Update your API routes and components';
    PRINT '3. Update your TypeScript types';
    PRINT '4. Restart your development server';
    PRINT '5. Test your application functionality';
END
ELSE
BEGIN
    PRINT '⚠️  WARNING: ' + CAST(@totalIssues AS VARCHAR) + ' migration issues found.';
    PRINT '   Please review the failed tests above and fix any issues.';
    PRINT '   You may need to run the migration script again or manually fix some items.';
END

PRINT '';
PRINT 'Migration verification completed at: ' + CAST(GETDATE() AS VARCHAR);
GO
