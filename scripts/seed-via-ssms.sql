-- ============================================================================
-- Database Seeding Script for Marina Portal
-- Run this script directly in SQL Server Management Studio (SSMS)
-- ============================================================================

USE marina_portal;
GO

-- Clear existing data (optional - comment out if you want to keep existing data)
PRINT '🧹 Clearing existing data...';
DELETE FROM work_orders;
DELETE FROM invoices;
DELETE FROM contracts;
DELETE FROM boats;
DELETE FROM berths;
DELETE FROM owners;
PRINT '✅ Existing data cleared';

-- ============================================================================
-- CREATE OWNERS/CUSTOMERS
-- ============================================================================
PRINT '👥 Creating owners...';

INSERT INTO owners (id, externalId, firstName, lastName, email, phone, address, isActive, marinaId, createdAt, updatedAt)
VALUES 
    ('owner-1', 'EXT001', 'John', 'Smith', 'john.smith@email.com', '+44 7700 900001', '123 Harbour View, Portsmouth, PO1 1AA', 1, 'marina-1', '2024-01-15', GETDATE()),
    ('owner-2', 'EXT002', 'Sarah', 'Johnson', 'sarah.johnson@email.com', '+44 7700 900002', '456 Marina Street, Southampton, SO1 2BB', 1, 'marina-1', '2024-02-20', GETDATE()),
    ('owner-3', 'EXT003', 'Michael', 'Brown', 'michael.brown@email.com', '+44 7700 900003', '789 Dock Road, Brighton, BN1 3CC', 1, 'marina-1', '2024-03-10', GETDATE()),
    ('owner-4', 'EXT004', 'Emma', 'Wilson', 'emma.wilson@email.com', '+44 7700 900004', '321 Quay Lane, Plymouth, PL1 4DD', 1, 'marina-1', '2024-04-05', GETDATE()),
    ('owner-5', 'EXT005', 'David', 'Taylor', 'david.taylor@email.com', '+44 7700 900005', '654 Harbour Drive, Weymouth, DT4 5EE', 1, 'marina-1', '2024-05-12', GETDATE());

PRINT '✅ Created 5 owners';

-- ============================================================================
-- CREATE BERTHS
-- ============================================================================
PRINT '⚓ Creating berths...';

INSERT INTO berths (id, externalId, berthNumber, length, beam, isAvailable, marinaId, createdAt, updatedAt)
VALUES 
    ('berth-1', 'B001', 'A1', 25.0, 8.0, 0, 'marina-1', '2024-01-01', GETDATE()),
    ('berth-2', 'B002', 'A2', 30.0, 10.0, 0, 'marina-1', '2024-01-01', GETDATE()),
    ('berth-3', 'B003', 'A3', 20.0, 6.0, 1, 'marina-1', '2024-01-01', GETDATE()),
    ('berth-4', 'B004', 'B1', 35.0, 12.0, 0, 'marina-1', '2024-01-01', GETDATE()),
    ('berth-5', 'B005', 'B2', 28.0, 9.0, 1, 'marina-1', '2024-01-01', GETDATE()),
    ('berth-6', 'B006', 'C1', 40.0, 15.0, 0, 'marina-1', '2024-01-01', GETDATE());

PRINT '✅ Created 6 berths';

-- ============================================================================
-- CREATE BOATS
-- ============================================================================
PRINT '🚤 Creating boats...';

INSERT INTO boats (id, externalId, name, registration, length, beam, isActive, marinaId, ownerId, createdAt, updatedAt)
VALUES 
    ('boat-1', 'BOAT001', 'Sea Breeze', 'GB123456', 22.0, 7.5, 1, 'marina-1', 'owner-1', '2024-01-15', GETDATE()),
    ('boat-2', 'BOAT002', 'Ocean Explorer', 'GB234567', 28.0, 9.5, 1, 'marina-1', 'owner-2', '2024-02-20', GETDATE()),
    ('boat-3', 'BOAT003', 'Harbour Master', 'GB345678', 18.0, 5.8, 0, 'marina-1', 'owner-3', '2024-03-10', GETDATE()),
    ('boat-4', 'BOAT004', 'Coastal Cruiser', 'GB456789', 32.0, 11.0, 1, 'marina-1', 'owner-4', '2024-04-05', GETDATE()),
    ('boat-5', 'BOAT005', 'Marina Queen', 'GB567890', 25.5, 8.2, 1, 'marina-1', 'owner-5', '2024-05-12', GETDATE()),
    ('boat-6', 'BOAT006', 'Sailing Spirit', 'GB678901', 26.0, 8.5, 1, 'marina-1', 'owner-1', '2024-06-01', GETDATE());

PRINT '✅ Created 6 boats';

-- ============================================================================
-- CREATE CONTRACTS
-- ============================================================================
PRINT '📋 Creating contracts...';

INSERT INTO contracts (id, externalId, contractNumber, startDate, endDate, status, monthlyRate, marinaId, ownerId, boatId, berthId, createdAt, updatedAt)
VALUES 
    ('contract-1', 'CON001', 'CTR-2024-001', '2024-01-15', '2024-12-31', 'ACTIVE', 450.00, 'marina-1', 'owner-1', 'boat-1', 'berth-1', '2024-01-15', GETDATE()),
    ('contract-2', 'CON002', 'CTR-2024-002', '2024-02-20', '2024-11-30', 'ACTIVE', 550.00, 'marina-1', 'owner-2', 'boat-2', 'berth-2', '2024-02-20', GETDATE()),
    ('contract-3', 'CON003', 'CTR-2024-003', '2024-03-10', '2024-09-30', 'EXPIRED', 350.00, 'marina-1', 'owner-3', 'boat-3', NULL, '2024-03-10', GETDATE()),
    ('contract-4', 'CON004', 'CTR-2024-004', '2024-04-05', '2024-12-31', 'ACTIVE', 650.00, 'marina-1', 'owner-4', 'boat-4', 'berth-4', '2024-04-05', GETDATE()),
    ('contract-5', 'CON005', 'CTR-2024-005', '2024-05-12', '2024-12-31', 'PENDING', 500.00, 'marina-1', 'owner-5', 'boat-5', 'berth-6', '2024-05-12', GETDATE()),
    ('contract-6', 'CON006', 'CTR-2024-006', '2024-06-01', '2024-12-31', 'ACTIVE', 400.00, 'marina-1', 'owner-1', 'boat-6', NULL, '2024-06-01', GETDATE());

PRINT '✅ Created 6 contracts';

-- ============================================================================
-- CREATE INVOICES WITH VARIED DATES AND AMOUNTS
-- ============================================================================
PRINT '🧾 Creating invoices...';

-- January invoices
INSERT INTO invoices (id, externalId, invoiceNumber, issueDate, dueDate, status, subtotal, tax, total, description, marinaId, ownerId, contractId, createdAt, updatedAt)
VALUES 
    ('invoice-1', 'INV001', 'INV-2024-001', '2024-01-15', '2024-02-14', 'PAID', 360.00, 90.00, 450.00, 'Monthly berth rental - January 2024', 'marina-1', 'owner-1', 'contract-1', '2024-01-15', GETDATE());

-- February invoices
INSERT INTO invoices (id, externalId, invoiceNumber, issueDate, dueDate, status, subtotal, tax, total, description, marinaId, ownerId, contractId, createdAt, updatedAt)
VALUES 
    ('invoice-2', 'INV002', 'INV-2024-002', '2024-02-15', '2024-03-16', 'PAID', 360.00, 90.00, 450.00, 'Monthly berth rental - February 2024', 'marina-1', 'owner-1', 'contract-1', '2024-02-15', GETDATE()),
    ('invoice-3', 'INV003', 'INV-2024-003', '2024-02-15', '2024-03-16', 'PAID', 440.00, 110.00, 550.00, 'Monthly berth rental - February 2024', 'marina-1', 'owner-2', 'contract-2', '2024-02-15', GETDATE());

-- March invoices
INSERT INTO invoices (id, externalId, invoiceNumber, issueDate, dueDate, status, subtotal, tax, total, description, marinaId, ownerId, contractId, createdAt, updatedAt)
VALUES 
    ('invoice-4', 'INV004', 'INV-2024-004', '2024-03-15', '2024-04-14', 'PAID', 360.00, 90.00, 450.00, 'Monthly berth rental - March 2024', 'marina-1', 'owner-1', 'contract-1', '2024-03-15', GETDATE()),
    ('invoice-5', 'INV005', 'INV-2024-005', '2024-03-15', '2024-04-14', 'PAID', 440.00, 110.00, 550.00, 'Monthly berth rental - March 2024', 'marina-1', 'owner-2', 'contract-2', '2024-03-15', GETDATE()),
    ('invoice-6', 'INV006', 'INV-2024-006', '2024-03-15', '2024-04-14', 'PAID', 280.00, 70.00, 350.00, 'Monthly berth rental - March 2024', 'marina-1', 'owner-3', 'contract-3', '2024-03-15', GETDATE());

-- April invoices
INSERT INTO invoices (id, externalId, invoiceNumber, issueDate, dueDate, status, subtotal, tax, total, description, marinaId, ownerId, contractId, createdAt, updatedAt)
VALUES 
    ('invoice-7', 'INV007', 'INV-2024-007', '2024-04-15', '2024-05-14', 'PAID', 360.00, 90.00, 450.00, 'Monthly berth rental - April 2024', 'marina-1', 'owner-1', 'contract-1', '2024-04-15', GETDATE()),
    ('invoice-8', 'INV008', 'INV-2024-008', '2024-04-15', '2024-05-14', 'PAID', 440.00, 110.00, 550.00, 'Monthly berth rental - April 2024', 'marina-1', 'owner-2', 'contract-2', '2024-04-15', GETDATE()),
    ('invoice-9', 'INV009', 'INV-2024-009', '2024-04-15', '2024-05-14', 'PAID', 520.00, 130.00, 650.00, 'Monthly berth rental - April 2024', 'marina-1', 'owner-4', 'contract-4', '2024-04-15', GETDATE());

-- May invoices
INSERT INTO invoices (id, externalId, invoiceNumber, issueDate, dueDate, status, subtotal, tax, total, description, marinaId, ownerId, contractId, createdAt, updatedAt)
VALUES 
    ('invoice-10', 'INV010', 'INV-2024-010', '2024-05-15', '2024-06-14', 'PAID', 360.00, 90.00, 450.00, 'Monthly berth rental - May 2024', 'marina-1', 'owner-1', 'contract-1', '2024-05-15', GETDATE()),
    ('invoice-11', 'INV011', 'INV-2024-011', '2024-05-15', '2024-06-14', 'PAID', 440.00, 110.00, 550.00, 'Monthly berth rental - May 2024', 'marina-1', 'owner-2', 'contract-2', '2024-05-15', GETDATE()),
    ('invoice-12', 'INV012', 'INV-2024-012', '2024-05-15', '2024-06-14', 'PENDING', 520.00, 130.00, 650.00, 'Monthly berth rental - May 2024', 'marina-1', 'owner-4', 'contract-4', '2024-05-15', GETDATE());

-- June invoices
INSERT INTO invoices (id, externalId, invoiceNumber, issueDate, dueDate, status, subtotal, tax, total, description, marinaId, ownerId, contractId, createdAt, updatedAt)
VALUES 
    ('invoice-13', 'INV013', 'INV-2024-013', '2024-06-15', '2024-07-14', 'PAID', 360.00, 90.00, 450.00, 'Monthly berth rental - June 2024', 'marina-1', 'owner-1', 'contract-1', '2024-06-15', GETDATE()),
    ('invoice-14', 'INV014', 'INV-2024-014', '2024-06-15', '2024-07-14', 'PAID', 440.00, 110.00, 550.00, 'Monthly berth rental - June 2024', 'marina-1', 'owner-2', 'contract-2', '2024-06-15', GETDATE()),
    ('invoice-15', 'INV015', 'INV-2024-015', '2024-06-15', '2024-07-14', 'PAID', 520.00, 130.00, 650.00, 'Monthly berth rental - June 2024', 'marina-1', 'owner-4', 'contract-4', '2024-06-15', GETDATE()),
    ('invoice-16', 'INV016', 'INV-2024-016', '2024-06-15', '2024-07-14', 'PAID', 320.00, 80.00, 400.00, 'Monthly berth rental - June 2024', 'marina-1', 'owner-1', 'contract-6', '2024-06-15', GETDATE());

-- July invoices
INSERT INTO invoices (id, externalId, invoiceNumber, issueDate, dueDate, status, subtotal, tax, total, description, marinaId, ownerId, contractId, createdAt, updatedAt)
VALUES 
    ('invoice-17', 'INV017', 'INV-2024-017', '2024-07-15', '2024-08-14', 'PAID', 360.00, 90.00, 450.00, 'Monthly berth rental - July 2024', 'marina-1', 'owner-1', 'contract-1', '2024-07-15', GETDATE()),
    ('invoice-18', 'INV018', 'INV-2024-018', '2024-07-15', '2024-08-14', 'PAID', 440.00, 110.00, 550.00, 'Monthly berth rental - July 2024', 'marina-1', 'owner-2', 'contract-2', '2024-07-15', GETDATE()),
    ('invoice-19', 'INV019', 'INV-2024-019', '2024-07-15', '2024-08-14', 'PAID', 520.00, 130.00, 650.00, 'Monthly berth rental - July 2024', 'marina-1', 'owner-4', 'contract-4', '2024-07-15', GETDATE()),
    ('invoice-20', 'INV020', 'INV-2024-020', '2024-07-15', '2024-08-14', 'PAID', 320.00, 80.00, 400.00, 'Monthly berth rental - July 2024', 'marina-1', 'owner-1', 'contract-6', '2024-07-15', GETDATE());

-- August invoices
INSERT INTO invoices (id, externalId, invoiceNumber, issueDate, dueDate, status, subtotal, tax, total, description, marinaId, ownerId, contractId, createdAt, updatedAt)
VALUES 
    ('invoice-21', 'INV021', 'INV-2024-021', '2024-08-15', '2024-09-14', 'PAID', 360.00, 90.00, 450.00, 'Monthly berth rental - August 2024', 'marina-1', 'owner-1', 'contract-1', '2024-08-15', GETDATE()),
    ('invoice-22', 'INV022', 'INV-2024-022', '2024-08-15', '2024-09-14', 'PAID', 440.00, 110.00, 550.00, 'Monthly berth rental - August 2024', 'marina-1', 'owner-2', 'contract-2', '2024-08-15', GETDATE()),
    ('invoice-23', 'INV023', 'INV-2024-023', '2024-08-15', '2024-09-14', 'PAID', 520.00, 130.00, 650.00, 'Monthly berth rental - August 2024', 'marina-1', 'owner-4', 'contract-4', '2024-08-15', GETDATE()),
    ('invoice-24', 'INV024', 'INV-2024-024', '2024-08-15', '2024-09-14', 'PAID', 320.00, 80.00, 400.00, 'Monthly berth rental - August 2024', 'marina-1', 'owner-1', 'contract-6', '2024-08-15', GETDATE()),
    ('invoice-25', 'INV025', 'INV-2024-025', '2024-08-15', '2024-09-14', 'PENDING', 400.00, 100.00, 500.00, 'Monthly berth rental - August 2024', 'marina-1', 'owner-5', 'contract-5', '2024-08-15', GETDATE());

PRINT '✅ Created 25 invoices';

-- ============================================================================
-- CREATE WORK ORDERS
-- ============================================================================
PRINT '🔧 Creating work orders...';

INSERT INTO work_orders (id, externalId, description, status, priority, requestedDate, completedDate, totalCost, marinaId, boatId, ownerId, createdAt, updatedAt)
VALUES 
    ('workorder-1', 'WO001', 'Engine maintenance and oil change', 'COMPLETED', 'MEDIUM', '2024-01-20', '2024-01-23', 250.00, 'marina-1', 'boat-1', 'owner-1', '2024-01-20', GETDATE()),
    ('workorder-2', 'WO002', 'Hull cleaning and anti-fouling', 'COMPLETED', 'LOW', '2024-02-10', '2024-02-12', 180.00, 'marina-1', 'boat-2', 'owner-2', '2024-02-10', GETDATE()),
    ('workorder-3', 'WO003', 'Electrical system inspection', 'COMPLETED', 'HIGH', '2024-03-05', '2024-03-06', 320.00, 'marina-1', 'boat-3', 'owner-3', '2024-03-05', GETDATE()),
    ('workorder-4', 'WO004', 'Propeller repair and balancing', 'IN_PROGRESS', 'MEDIUM', '2024-04-15', NULL, NULL, 'marina-1', 'boat-4', 'owner-4', '2024-04-15', GETDATE()),
    ('workorder-5', 'WO005', 'Navigation equipment upgrade', 'PENDING', 'LOW', '2024-05-20', NULL, NULL, 'marina-1', 'boat-5', 'owner-5', '2024-05-20', GETDATE()),
    ('workorder-6', 'WO006', 'Safety equipment inspection', 'COMPLETED', 'HIGH', '2024-06-10', '2024-06-11', 150.00, 'marina-1', 'boat-6', 'owner-1', '2024-06-10', GETDATE()),
    ('workorder-7', 'WO007', 'Bilge pump replacement', 'COMPLETED', 'MEDIUM', '2024-07-05', '2024-07-07', 280.00, 'marina-1', 'boat-1', 'owner-1', '2024-07-05', GETDATE()),
    ('workorder-8', 'WO008', 'Deck hardware maintenance', 'PENDING', 'LOW', '2024-08-12', NULL, NULL, 'marina-1', 'boat-2', 'owner-2', '2024-08-12', GETDATE());

PRINT '✅ Created 8 work orders';

-- ============================================================================
-- VERIFICATION AND SUMMARY
-- ============================================================================
PRINT '';
PRINT '🎉 Database seeding completed successfully!';
PRINT '';

-- Count records in each table
DECLARE @ownerCount INT, @berthCount INT, @boatCount INT, @contractCount INT, @invoiceCount INT, @workOrderCount INT;

SELECT @ownerCount = COUNT(*) FROM owners;
SELECT @berthCount = COUNT(*) FROM berths;
SELECT @boatCount = COUNT(*) FROM boats;
SELECT @contractCount = COUNT(*) FROM contracts;
SELECT @invoiceCount = COUNT(*) FROM invoices;
SELECT @workOrderCount = COUNT(*) FROM work_orders;

PRINT '📊 Summary of created data:';
PRINT '   👥 Owners: ' + CAST(@ownerCount AS VARCHAR);
PRINT '   ⚓ Berths: ' + CAST(@berthCount AS VARCHAR);
PRINT '   🚤 Boats: ' + CAST(@boatCount AS VARCHAR);
PRINT '   📋 Contracts: ' + CAST(@contractCount AS VARCHAR);
PRINT '   🧾 Invoices: ' + CAST(@invoiceCount AS VARCHAR);
PRINT '   🔧 Work Orders: ' + CAST(@workOrderCount AS VARCHAR);

PRINT '';
PRINT '🔍 Final table state:';
SELECT TABLE_NAME, TABLE_TYPE 
FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_TYPE = 'BASE TABLE' 
ORDER BY TABLE_NAME;

PRINT '';
PRINT '✅ Seeding completed! You can now test the reports with rich data.';
