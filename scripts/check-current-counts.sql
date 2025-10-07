-- Check Current Database Record Counts
-- Run this in SQL Server Management Studio (SSMS)

USE marina_portal;
GO

PRINT '🔍 Checking current database record counts...';

-- Check all table counts
SELECT 'owners' as TableName, COUNT(*) as TotalCount FROM owners
UNION ALL
SELECT 'boats', COUNT(*) FROM boats
UNION ALL
SELECT 'berths', COUNT(*) FROM berths
UNION ALL
SELECT 'contracts', COUNT(*) FROM contracts
UNION ALL
SELECT 'invoices', COUNT(*) FROM invoices
UNION ALL
SELECT 'payments', COUNT(*) FROM payments
UNION ALL
SELECT 'bookings', COUNT(*) FROM bookings
UNION ALL
SELECT 'work_orders', COUNT(*) FROM work_orders;

-- Check sample data from key tables
PRINT '📊 Sample data from bookings:';
SELECT TOP 3 id, externalId, ownerId, boatId, berthId, status, totalAmount FROM bookings ORDER BY createdAt DESC;

PRINT '📊 Sample data from work_orders:';
SELECT TOP 3 id, externalId, title, ownerId, boatId, status, priority, totalCost FROM work_orders ORDER BY createdAt DESC;

PRINT '📊 Sample data from payments:';
SELECT TOP 3 id, externalId, amount, ownerId, invoiceId, status FROM payments ORDER BY createdAt DESC;
