-- Add 10 Sample Contracts to the Database
-- This script creates sample contracts with realistic data for testing

-- First, let's check what customers and boats exist
PRINT 'Checking existing customers and boats...';
SELECT 'Customers' as TableName, COUNT(*) as Count FROM customers
UNION ALL
SELECT 'Boats' as TableName, COUNT(*) as Count FROM boats;

-- Create 10 sample contracts
PRINT 'Creating 10 sample contracts...';

-- Contract 1: Long-term berth rental
INSERT INTO contracts (id, externalId, contractNumber, startDate, endDate, status, monthlyRate, marinaId, customerId, boatId, berthId, createdAt, updatedAt)
VALUES 
('contract-001', 'EXT-CON-001', 'CON-2024-001', '2024-01-01', '2024-12-31', 'ACTIVE', 450.00, 'marina-1', 
 (SELECT TOP 1 id FROM customers WHERE marinaId = 'marina-1'), 
 (SELECT TOP 1 id FROM boats WHERE marinaId = 'marina-1'), 
 (SELECT TOP 1 id FROM berths WHERE marinaId = 'marina-1'), 
 GETDATE(), GETDATE());

-- Contract 2: Summer season contract
INSERT INTO contracts (id, externalId, contractNumber, startDate, endDate, status, monthlyRate, marinaId, customerId, boatId, berthId, createdAt, updatedAt)
VALUES 
('contract-002', 'EXT-CON-002', 'CON-2024-002', '2024-05-01', '2024-10-31', 'ACTIVE', 550.00, 'marina-1', 
 (SELECT TOP 1 id FROM customers WHERE marinaId = 'marina-1' ORDER BY NEWID()), 
 (SELECT TOP 1 id FROM boats WHERE marinaId = 'marina-1' ORDER BY NEWID()), 
 (SELECT TOP 1 id FROM berths WHERE marinaId = 'marina-1' ORDER BY NEWID()), 
 GETDATE(), GETDATE());

-- Contract 3: Winter storage contract
INSERT INTO contracts (id, externalId, contractNumber, startDate, endDate, status, monthlyRate, marinaId, customerId, boatId, berthId, createdAt, updatedAt)
VALUES 
('contract-003', 'EXT-CON-003', 'CON-2024-003', '2024-11-01', '2025-03-31', 'ACTIVE', 350.00, 'marina-1', 
 (SELECT TOP 1 id FROM customers WHERE marinaId = 'marina-1' ORDER BY NEWID()), 
 (SELECT TOP 1 id FROM boats WHERE marinaId = 'marina-1' ORDER BY NEWID()), 
 (SELECT TOP 1 id FROM berths WHERE marinaId = 'marina-1' ORDER BY NEWID()), 
 GETDATE(), GETDATE());

-- Contract 4: Premium berth contract
INSERT INTO contracts (id, externalId, contractNumber, startDate, endDate, status, monthlyRate, marinaId, customerId, boatId, berthId, createdAt, updatedAt)
VALUES 
('contract-004', 'EXT-CON-004', 'CON-2024-004', '2024-03-15', '2024-11-15', 'ACTIVE', 650.00, 'marina-1', 
 (SELECT TOP 1 id FROM customers WHERE marinaId = 'marina-1' ORDER BY NEWID()), 
 (SELECT TOP 1 id FROM boats WHERE marinaId = 'marina-1' ORDER BY NEWID()), 
 (SELECT TOP 1 id FROM berths WHERE marinaId = 'marina-1' ORDER BY NEWID()), 
 GETDATE(), GETDATE());

-- Contract 5: Short-term contract
INSERT INTO contracts (id, externalId, contractNumber, startDate, endDate, status, monthlyRate, marinaId, customerId, boatId, berthId, createdAt, updatedAt)
VALUES 
('contract-005', 'EXT-CON-005', 'CON-2024-005', '2024-06-01', '2024-08-31', 'ACTIVE', 600.00, 'marina-1', 
 (SELECT TOP 1 id FROM customers WHERE marinaId = 'marina-1' ORDER BY NEWID()), 
 (SELECT TOP 1 id FROM boats WHERE marinaId = 'marina-1' ORDER BY NEWID()), 
 (SELECT TOP 1 id FROM berths WHERE marinaId = 'marina-1' ORDER BY NEWID()), 
 GETDATE(), GETDATE());

-- Contract 6: Year-round contract
INSERT INTO contracts (id, externalId, contractNumber, startDate, endDate, status, monthlyRate, marinaId, customerId, boatId, berthId, createdAt, updatedAt)
VALUES 
('contract-006', 'EXT-CON-006', 'CON-2024-006', '2024-01-01', '2024-12-31', 'ACTIVE', 500.00, 'marina-1', 
 (SELECT TOP 1 id FROM customers WHERE marinaId = 'marina-1' ORDER BY NEWID()), 
 (SELECT TOP 1 id FROM boats WHERE marinaId = 'marina-1' ORDER BY NEWID()), 
 (SELECT TOP 1 id FROM berths WHERE marinaId = 'marina-1' ORDER BY NEWID()), 
 GETDATE(), GETDATE());

-- Contract 7: Spring contract
INSERT INTO contracts (id, externalId, contractNumber, startDate, endDate, status, monthlyRate, marinaId, customerId, boatId, berthId, createdAt, updatedAt)
VALUES 
('contract-007', 'EXT-CON-007', 'CON-2024-007', '2024-04-01', '2024-09-30', 'ACTIVE', 575.00, 'marina-1', 
 (SELECT TOP 1 id FROM customers WHERE marinaId = 'marina-1' ORDER BY NEWID()), 
 (SELECT TOP 1 id FROM boats WHERE marinaId = 'marina-1' ORDER BY NEWID()), 
 (SELECT TOP 1 id FROM berths WHERE marinaId = 'marina-1' ORDER BY NEWID()), 
 GETDATE(), GETDATE());

-- Contract 8: Fall contract
INSERT INTO contracts (id, externalId, contractNumber, startDate, endDate, status, monthlyRate, marinaId, customerId, boatId, berthId, createdAt, updatedAt)
VALUES 
('contract-008', 'EXT-CON-008', 'CON-2024-008', '2024-09-01', '2024-12-31', 'ACTIVE', 425.00, 'marina-1', 
 (SELECT TOP 1 id FROM customers WHERE marinaId = 'marina-1' ORDER BY NEWID()), 
 (SELECT TOP 1 id FROM boats WHERE marinaId = 'marina-1' ORDER BY NEWID()), 
 (SELECT TOP 1 id FROM berths WHERE marinaId = 'marina-1' ORDER BY NEWID()), 
 GETDATE(), GETDATE());

-- Contract 9: Extended summer contract
INSERT INTO contracts (id, externalId, contractNumber, startDate, endDate, status, monthlyRate, marinaId, customerId, boatId, berthId, createdAt, updatedAt)
VALUES 
('contract-009', 'EXT-CON-009', 'CON-2024-009', '2024-04-15', '2024-10-15', 'ACTIVE', 525.00, 'marina-1', 
 (SELECT TOP 1 id FROM customers WHERE marinaId = 'marina-1' ORDER BY NEWID()), 
 (SELECT TOP 1 id FROM boats WHERE marinaId = 'marina-1' ORDER BY NEWID()), 
 (SELECT TOP 1 id FROM berths WHERE marinaId = 'marina-1' ORDER BY NEWID()), 
 GETDATE(), GETDATE());

-- Contract 10: Holiday season contract
INSERT INTO contracts (id, externalId, contractNumber, startDate, endDate, status, monthlyRate, marinaId, customerId, boatId, berthId, createdAt, updatedAt)
VALUES 
('contract-010', 'EXT-CON-010', 'CON-2024-010', '2024-12-01', '2025-02-28', 'ACTIVE', 400.00, 'marina-1', 
 (SELECT TOP 1 id FROM customers WHERE marinaId = 'marina-1' ORDER BY NEWID()), 
 (SELECT TOP 1 id FROM boats WHERE marinaId = 'marina-1' ORDER BY NEWID()), 
 (SELECT TOP 1 id FROM berths WHERE marinaId = 'marina-1' ORDER BY NEWID()), 
 GETDATE(), GETDATE());

-- Verify the contracts were created
PRINT 'Verifying contracts were created...';
SELECT 
    c.id,
    c.contractNumber,
    c.startDate,
    c.endDate,
    c.status,
    c.monthlyRate,
    cust.firstName + ' ' + cust.lastName as CustomerName,
    b.name as BoatName,
    ber.berthNumber as BerthNumber
FROM contracts c
LEFT JOIN customers cust ON c.customerId = cust.id
LEFT JOIN boats b ON c.boatId = b.id
LEFT JOIN berths ber ON c.berthId = ber.id
WHERE c.id LIKE 'contract-%'
ORDER BY c.contractNumber;

PRINT 'Sample contracts created successfully!';
PRINT 'Total contracts in database: ' + CAST((SELECT COUNT(*) FROM contracts) AS VARCHAR(10));
