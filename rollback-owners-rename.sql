-- ============================================================================
-- ROLLBACK: REVERT CUSTOMERS TABLE BACK TO OWNERS
-- ============================================================================
-- This script reverts the customers table back to owners if needed.
-- Only use this if you need to undo the rename operation.

USE marina_portal;
GO

-- Step 1: Disable foreign key constraints temporarily
PRINT 'Step 1: Disabling foreign key constraints...';

DECLARE @sql NVARCHAR(MAX) = '';
SELECT @sql = @sql + 'ALTER TABLE ' + QUOTENAME(SCHEMA_NAME(fk.schema_id)) + '.' + QUOTENAME(fk.parent_object_id) + 
               ' NOCHECK CONSTRAINT ' + QUOTENAME(fk.name) + ';' + CHAR(13)
FROM sys.foreign_keys fk
INNER JOIN sys.foreign_key_columns fkc ON fk.object_id = fkc.constraint_object_id
INNER JOIN sys.columns c ON fkc.referenced_object_id = c.object_id AND fkc.referenced_column_id = c.column_id
WHERE c.object_id = OBJECT_ID('customers');

EXEC sp_executesql @sql;
PRINT 'Foreign key constraints disabled.';

-- Step 2: Revert foreign key column names back to ownerId
PRINT 'Step 2: Reverting foreign key column names...';

-- Revert boats table
IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('boats') AND name = 'customerId')
BEGIN
    EXEC sp_rename 'boats.customerId', 'ownerId', 'COLUMN';
    PRINT 'boats.customerId reverted to boats.ownerId';
END

-- Revert contracts table
IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('contracts') AND name = 'customerId')
BEGIN
    EXEC sp_rename 'contracts.customerId', 'ownerId', 'COLUMN';
    PRINT 'contracts.customerId reverted to contracts.ownerId';
END

-- Revert invoices table
IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('invoices') AND name = 'customerId')
BEGIN
    EXEC sp_rename 'invoices.customerId', 'ownerId', 'COLUMN';
    PRINT 'invoices.customerId reverted to invoices.ownerId';
END

-- Revert payments table
IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('payments') AND name = 'customerId')
BEGIN
    EXEC sp_rename 'payments.customerId', 'ownerId', 'COLUMN';
    PRINT 'payments.customerId reverted to payments.ownerId';
END

-- Revert bookings table
IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('bookings') AND name = 'customerId')
BEGIN
    EXEC sp_rename 'bookings.customerId', 'ownerId', 'COLUMN';
    PRINT 'bookings.customerId reverted to bookings.ownerId';
END

-- Revert work_orders table
IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('work_orders') AND name = 'customerId')
BEGIN
    EXEC sp_rename 'work_orders.customerId', 'ownerId', 'COLUMN';
    PRINT 'work_orders.customerId reverted to work_orders.ownerId';
END

-- Step 3: Drop foreign key constraints
PRINT 'Step 3: Dropping foreign key constraints...';

DECLARE @drop_sql NVARCHAR(MAX) = '';
SELECT @drop_sql = @drop_sql + 'ALTER TABLE ' + QUOTENAME(SCHEMA_NAME(fk.schema_id)) + '.' + QUOTENAME(fk.parent_object_id) + 
                   ' DROP CONSTRAINT ' + QUOTENAME(fk.name) + ';' + CHAR(13)
FROM sys.foreign_keys fk
INNER JOIN sys.foreign_key_columns fkc ON fk.object_id = fkc.constraint_object_id
INNER JOIN sys.columns c ON fkc.referenced_object_id = c.object_id AND fkc.referenced_column_id = c.column_id
WHERE c.object_id = OBJECT_ID('customers');

EXEC sp_executesql @drop_sql;

-- Step 4: Rename table back to owners
PRINT 'Step 4: Renaming customers table back to owners...';
EXEC sp_rename 'customers', 'owners';
PRINT 'Table renamed back to owners successfully.';

-- Step 5: Recreate original foreign key constraints
PRINT 'Step 5: Recreating original foreign key constraints...';

-- boats.ownerId -> owners.id
IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('boats') AND name = 'ownerId')
BEGIN
    ALTER TABLE boats ADD CONSTRAINT FK_boats_owners 
    FOREIGN KEY (ownerId) REFERENCES owners(id);
    PRINT 'FK_boats_owners constraint recreated.';
END

-- contracts.ownerId -> owners.id
IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('contracts') AND name = 'ownerId')
BEGIN
    ALTER TABLE contracts ADD CONSTRAINT FK_contracts_owners 
    FOREIGN KEY (ownerId) REFERENCES owners(id);
    PRINT 'FK_contracts_owners constraint recreated.';
END

-- invoices.ownerId -> owners.id
IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('invoices') AND name = 'ownerId')
BEGIN
    ALTER TABLE invoices ADD CONSTRAINT FK_invoices_owners 
    FOREIGN KEY (ownerId) REFERENCES owners(id);
    PRINT 'FK_invoices_owners constraint recreated.';
END

-- payments.ownerId -> owners.id
IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('payments') AND name = 'ownerId')
BEGIN
    ALTER TABLE payments ADD CONSTRAINT FK_payments_owners 
    FOREIGN KEY (ownerId) REFERENCES owners(id);
    PRINT 'FK_payments_owners constraint recreated.';
END

-- bookings.ownerId -> owners.id
IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('bookings') AND name = 'ownerId')
BEGIN
    ALTER TABLE bookings ADD CONSTRAINT FK_bookings_owners 
    FOREIGN KEY (ownerId) REFERENCES owners(id);
    PRINT 'FK_bookings_owners constraint recreated.';
END

-- work_orders.ownerId -> owners.id
IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('work_orders') AND name = 'ownerId')
BEGIN
    ALTER TABLE work_orders ADD CONSTRAINT FK_work_orders_owners 
    FOREIGN KEY (ownerId) REFERENCES owners(id);
    PRINT 'FK_work_orders_owners constraint recreated.';
END

PRINT '';
PRINT 'Rollback completed successfully!';
PRINT 'Table reverted from customers back to owners';
PRINT 'All foreign key columns reverted from customerId back to ownerId';
PRINT 'Original constraints restored';
GO
