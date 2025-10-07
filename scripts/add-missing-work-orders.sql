-- Add Missing Work Orders with Unique IDs
-- Run this in SQL Server Management Studio (SSMS)

USE marina_portal;
GO

PRINT '🔧 Adding missing work orders with unique IDs...';

-- Check current work order count
SELECT 'Current Work Orders' as Status, COUNT(*) as TotalCount FROM work_orders;

-- Add 25 additional unique work orders (using IDs 51-75 to avoid conflicts)
PRINT '🔧 Creating 25 additional unique work orders...';

DECLARE @i INT = 51;
WHILE @i <= 75
BEGIN
    INSERT INTO work_orders (id, externalId, title, description, ownerId, boatId, status, priority, totalCost, requestedDate, completedDate, marinaId, createdAt, updatedAt)
    VALUES 
        ('workorder-' + CAST(@i AS VARCHAR),
         'WO' + RIGHT('000' + CAST(@i AS VARCHAR), 3),
         CASE 
            WHEN @i % 8 = 0 THEN 'Engine Maintenance'
            WHEN @i % 8 = 1 THEN 'Hull Cleaning'
            WHEN @i % 8 = 2 THEN 'Electrical Repair'
            WHEN @i % 8 = 3 THEN 'Plumbing Fix'
            WHEN @i % 8 = 4 THEN 'Navigation System'
            WHEN @i % 8 = 5 THEN 'Safety Equipment'
            WHEN @i % 8 = 6 THEN 'Paint Touch-up'
            ELSE 'General Inspection'
         END + ' - ' + CAST(@i AS VARCHAR),
         CASE 
            WHEN @i % 8 = 0 THEN 'Routine engine maintenance and oil change'
            WHEN @i % 8 = 1 THEN 'Professional hull cleaning and anti-fouling'
            WHEN @i % 8 = 2 THEN 'Electrical system diagnostics and repair'
            WHEN @i % 8 = 3 THEN 'Plumbing system maintenance and leak repair'
            WHEN @i % 8 = 4 THEN 'Navigation system calibration and testing'
            WHEN @i % 8 = 5 THEN 'Safety equipment inspection and replacement'
            WHEN @i % 8 = 6 THEN 'Paint touch-up and minor cosmetic repairs'
            ELSE 'Comprehensive vessel inspection and maintenance'
         END,
         'owner-' + CAST((@i % 50) + 1 AS VARCHAR), -- Cycle through owners 1-50
         'boat-' + CAST((@i % 50) + 1 AS VARCHAR), -- Cycle through boats 1-50
         CASE 
            WHEN @i % 5 = 0 THEN 'COMPLETED'
            WHEN @i % 5 = 1 THEN 'IN_PROGRESS'
            WHEN @i % 8 = 2 THEN 'PENDING'
            WHEN @i % 8 = 3 THEN 'SCHEDULED'
            ELSE 'ON_HOLD'
         END,
         CASE 
            WHEN @i % 4 = 0 THEN 'HIGH'
            WHEN @i % 4 = 1 THEN 'MEDIUM'
            WHEN @i % 4 = 2 THEN 'LOW'
            ELSE 'URGENT'
         END,
         200.00 + (@i * 15.75), -- Different total costs
         DATEADD(day, -@i * 2, GETDATE()), -- Requested dates spread out
         CASE 
            WHEN @i % 5 = 0 THEN DATEADD(day, -@i, GETDATE()) -- Completed orders have completion dates
            ELSE NULL -- Pending orders don't have completion dates yet
         END,
         'marina-1',
         DATEADD(day, -@i * 2, GETDATE()),
         GETDATE());
    
    SET @i = @i + 1;
END;
PRINT '✅ Created 25 additional unique work orders';

-- Verify final counts
PRINT '🔍 Final verification:';
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

-- Show sample of new work orders
PRINT '📊 Sample of new work orders:';
SELECT TOP 5 id, externalId, title, status, priority, totalCost, requestedDate FROM work_orders WHERE id LIKE 'workorder-5%' ORDER BY createdAt DESC;

PRINT '🎉 Successfully added missing work orders!';
PRINT '📈 Expected final counts:';
PRINT '   - Owners: 50';
PRINT '   - Boats: 50';
PRINT '   - Berths: 50';
PRINT '   - Contracts: 50';
PRINT '   - Invoices: 50';
PRINT '   - Payments: 50';
PRINT '   - Bookings: 50';
PRINT '   - Work Orders: 75 (50 original + 25 new)';
