-- Populate All Missing Data - Complete Solution
-- Run this in SQL Server Management Studio (SSMS)

USE marina_portal;
GO

PRINT '🌱 Starting comprehensive data population...';

-- Step 1: Add 50 unique bookings
PRINT '📅 Step 1: Creating 50 unique bookings...';

DECLARE @i INT = 1;
WHILE @i <= 50
BEGIN
    INSERT INTO bookings (id, externalId, ownerId, boatId, berthId, startDate, endDate, status, totalAmount, marinaId, createdAt, updatedAt)
    VALUES 
        ('booking-' + CAST(@i AS VARCHAR),
         'BK' + RIGHT('000' + CAST(@i AS VARCHAR), 3),
         'owner-' + CAST((@i % 50) + 1 AS VARCHAR), -- Cycle through owners 1-50
         'boat-' + CAST((@i % 50) + 1 AS VARCHAR), -- Cycle through boats 1-50
         'berth-' + CAST((@i % 50) + 1 AS VARCHAR), -- Cycle through berths 1-50
         DATEADD(day, @i * 3, GETDATE()), -- Start dates spread out
         DATEADD(day, (@i * 3) + 7, GETDATE()), -- 7-day duration
         CASE 
            WHEN @i % 4 = 0 THEN 'ACTIVE'
            WHEN @i % 4 = 1 THEN 'PENDING'
            WHEN @i % 4 = 2 THEN 'COMPLETED'
            ELSE 'CANCELLED'
         END,
         150.00 + (@i * 25.50), -- Different amounts for each booking
         'marina-1',
         DATEADD(day, -@i, GETDATE()),
         GETDATE());
    
    SET @i = @i + 1;
END;
PRINT '✅ Created 50 unique bookings';

-- Step 2: Add 25 additional unique work orders (bringing total to 50)
PRINT '🔧 Step 2: Creating 25 additional unique work orders...';

SET @i = 26; -- Start from 26 since we already have 25
WHILE @i <= 50
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
         'owner-' + CAST((@i % 50) + 1 AS VARCHAR), -- Cycle through owners
         'boat-' + CAST((@i % 50) + 1 AS VARCHAR), -- Cycle through boats
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

-- Step 3: Add 50 unique payments
PRINT '💰 Step 3: Creating 50 unique payments...';

SET @i = 1;
WHILE @i <= 50
BEGIN
    INSERT INTO payments (id, externalId, amount, paymentDate, status, gateway, gatewayTransactionId, marinaId, ownerId, invoiceId, createdAt, updatedAt)
    VALUES 
        ('payment-' + CAST(@i AS VARCHAR),
         'PAY' + RIGHT('000' + CAST(@i AS VARCHAR), 3),
         100.00 + (@i * 18.75), -- Different amounts for each payment
         DATEADD(day, -@i * 2, GETDATE()), -- Payment dates spread out
         CASE 
            WHEN @i % 5 = 0 THEN 'completed'
            WHEN @i % 5 = 1 THEN 'pending'
            WHEN @i % 5 = 2 THEN 'failed'
            WHEN @i % 5 = 3 THEN 'processing'
            ELSE 'cancelled'
         END,
         CASE 
            WHEN @i % 3 = 0 THEN 'stripe'
            WHEN @i % 3 = 1 THEN 'paypal'
            ELSE 'bank_transfer'
         END,
         'TXN' + CAST(@i AS VARCHAR) + 'ABC' + CAST(@i * 7 AS VARCHAR), -- Unique transaction IDs
         'marina-1',
         'owner-' + CAST((@i % 50) + 1 AS VARCHAR), -- Cycle through owners
         'invoice-' + CAST((@i % 25) + 1 AS VARCHAR), -- Cycle through invoices 1-25
         DATEADD(day, -@i * 2, GETDATE()),
         GETDATE());
    
    SET @i = @i + 1;
END;
PRINT '✅ Created 50 unique payments';

-- Step 4: Verify all data
PRINT '🔍 Step 4: Verifying all data...';

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

-- Show sample data
PRINT '📊 Sample of new bookings:';
SELECT TOP 3 id, externalId, ownerId, boatId, berthId, status, totalAmount FROM bookings ORDER BY createdAt DESC;

PRINT '📊 Sample of new work orders:';
SELECT TOP 3 id, externalId, title, status, priority, totalCost FROM work_orders ORDER BY createdAt DESC;

PRINT '📊 Sample of new payments:';
SELECT TOP 3 id, externalId, amount, status, gateway, ownerId FROM payments ORDER BY createdAt DESC;

PRINT '🎉 Successfully populated all missing data!';
PRINT '📈 Expected final counts:';
PRINT '   - Owners: 50';
PRINT '   - Boats: 50';
PRINT '   - Berths: 50';
PRINT '   - Contracts: 50';
PRINT '   - Invoices: 25';
PRINT '   - Payments: 50';
PRINT '   - Bookings: 50';
PRINT '   - Work Orders: 50';
