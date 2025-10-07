-- ============================================================================
-- RENAME OWNERS TABLE TO CUSTOMERS
-- ============================================================================
-- This script safely renames the 'owners' table to 'customers' and updates
-- all foreign key references throughout the database.

USE marina_portal;
GO

-- Step 1: Disable foreign key constraints temporarily
-- This prevents errors during the rename operation
PRINT 'Step 1: Disabling foreign key constraints...';

-- Get all foreign key constraints that reference the owners table
DECLARE @sql NVARCHAR(MAX) = '';
SELECT @sql = @sql + 'ALTER TABLE ' + QUOTENAME(SCHEMA_NAME(fk.schema_id)) + '.' + QUOTENAME(fk.parent_object_id) + 
               ' NOCHECK CONSTRAINT ' + QUOTENAME(fk.name) + ';' + CHAR(13)
FROM sys.foreign_keys fk
INNER JOIN sys.foreign_key_columns fkc ON fk.object_id = fkc.constraint_object_id
INNER JOIN sys.columns c ON fkc.referenced_object_id = c.object_id AND fkc.referenced_column_id = c.column_id
WHERE c.object_id = OBJECT_ID('owners');

EXEC sp_executesql @sql;
PRINT 'Foreign key constraints disabled.';

-- Step 2: Rename the table
PRINT 'Step 2: Renaming owners table to customers...';
EXEC sp_rename 'owners', 'customers';
PRINT 'Table renamed successfully.';

-- Step 3: Rename the primary key constraint (if it exists)
PRINT 'Step 3: Updating primary key constraint name...';
DECLARE @pk_name NVARCHAR(128);
SELECT @pk_name = name FROM sys.key_constraints WHERE parent_object_id = OBJECT_ID('customers') AND type = 'PK';
IF @pk_name IS NOT NULL
BEGIN
    EXEC sp_rename @pk_name, 'PK_customers', 'OBJECT';
    PRINT 'Primary key constraint renamed to PK_customers.';
END

-- Step 4: Update foreign key column names in related tables
PRINT 'Step 4: Updating foreign key column names...';

-- Update boats table
IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('boats') AND name = 'ownerId')
BEGIN
    EXEC sp_rename 'boats.ownerId', 'customerId', 'COLUMN';
    PRINT 'boats.ownerId renamed to boats.customerId';
END

-- Update contracts table
IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('contracts') AND name = 'ownerId')
BEGIN
    EXEC sp_rename 'contracts.ownerId', 'customerId', 'COLUMN';
    PRINT 'contracts.ownerId renamed to contracts.customerId';
END

-- Update invoices table
IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('invoices') AND name = 'ownerId')
BEGIN
    EXEC sp_rename 'invoices.ownerId', 'customerId', 'COLUMN';
    PRINT 'invoices.ownerId renamed to invoices.customerId';
END

-- Update payments table
IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('payments') AND name = 'ownerId')
BEGIN
    EXEC sp_rename 'payments.ownerId', 'customerId', 'COLUMN';
    PRINT 'payments.ownerId renamed to payments.customerId';
END

-- Update bookings table
IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('bookings') AND name = 'ownerId')
BEGIN
    EXEC sp_rename 'bookings.ownerId', 'customerId', 'COLUMN';
    PRINT 'bookings.ownerId renamed to bookings.customerId';
END

-- Update work_orders table
IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('work_orders') AND name = 'ownerId')
BEGIN
    EXEC sp_rename 'work_orders.ownerId', 'customerId', 'COLUMN';
    PRINT 'work_orders.ownerId renamed to work_orders.customerId';
END

-- Step 5: Drop old foreign key constraints and recreate them with new names
PRINT 'Step 5: Recreating foreign key constraints...';

-- Drop old foreign keys
DECLARE @drop_sql NVARCHAR(MAX) = '';
SELECT @drop_sql = @drop_sql + 'ALTER TABLE ' + QUOTENAME(SCHEMA_NAME(fk.schema_id)) + '.' + QUOTENAME(fk.parent_object_id) + 
                   ' DROP CONSTRAINT ' + QUOTENAME(fk.name) + ';' + CHAR(13)
FROM sys.foreign_keys fk
INNER JOIN sys.foreign_key_columns fkc ON fk.object_id = fkc.constraint_object_id
INNER JOIN sys.columns c ON fkc.referenced_object_id = c.object_id AND fkc.referenced_column_id = c.column_id
WHERE c.object_id = OBJECT_ID('customers');

EXEC sp_executesql @drop_sql;

-- Recreate foreign keys with new names
PRINT 'Recreating foreign key constraints...';

-- boats.customerId -> customers.id
IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('boats') AND name = 'customerId')
BEGIN
    ALTER TABLE boats ADD CONSTRAINT FK_boats_customers 
    FOREIGN KEY (customerId) REFERENCES customers(id);
    PRINT 'FK_boats_customers constraint created.';
END

-- contracts.customerId -> customers.id
IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('contracts') AND name = 'customerId')
BEGIN
    ALTER TABLE contracts ADD CONSTRAINT FK_contracts_customers 
    FOREIGN KEY (customerId) REFERENCES customers(id);
    PRINT 'FK_contracts_customers constraint created.';
END

-- invoices.customerId -> customers.id
IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('invoices') AND name = 'customerId')
BEGIN
    ALTER TABLE invoices ADD CONSTRAINT FK_invoices_customers 
    FOREIGN KEY (customerId) REFERENCES customers(id);
    PRINT 'FK_invoices_customers constraint created.';
END

-- payments.customerId -> customers.id
IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('payments') AND name = 'customerId')
BEGIN
    ALTER TABLE payments ADD CONSTRAINT FK_payments_customers 
    FOREIGN KEY (customerId) REFERENCES customers(id);
    PRINT 'FK_payments_customers constraint created.';
END

-- bookings.customerId -> customers.id
IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('bookings') AND name = 'customerId')
BEGIN
    ALTER TABLE bookings ADD CONSTRAINT FK_bookings_customers 
    FOREIGN KEY (customerId) REFERENCES customers(id);
    PRINT 'FK_bookings_customers constraint created.';
END

-- work_orders.customerId -> customers.id
IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('work_orders') AND name = 'customerId')
BEGIN
    ALTER TABLE work_orders ADD CONSTRAINT FK_work_orders_customers 
    FOREIGN KEY (customerId) REFERENCES customers(id);
    PRINT 'FK_work_orders_customers constraint created.';
END

-- Step 6: Update the @@map directive in Prisma schema
PRINT 'Step 6: Database table rename complete!';
PRINT '';
PRINT 'IMPORTANT: You must now update your Prisma schema files:';
PRINT '1. Change model name from "Owner" to "Customer"';
PRINT '2. Update @@map("owners") to @@map("customers")';
PRINT '3. Update all relationship field names from "owner" to "customer"';
PRINT '4. Update all foreign key field names from "ownerId" to "customerId"';
PRINT '5. Update all API routes and components to use new naming';
PRINT '';
PRINT 'Table rename operation completed successfully!';
PRINT 'Old table: owners -> New table: customers';
PRINT 'Old columns: ownerId -> New columns: customerId';
PRINT 'Old constraints: FK_*_owners -> New constraints: FK_*_customers';
GO
