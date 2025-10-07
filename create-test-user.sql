-- Create test user for Marina Management Portal
-- Run this script in SQL Server Management Studio

USE marina_portal;
GO

-- Clear existing data (if any)
DELETE FROM payments;
DELETE FROM invoices;
DELETE FROM contracts;
DELETE FROM bookings;
DELETE FROM work_orders;
DELETE FROM boats;
DELETE FROM berths;
DELETE FROM owners;
DELETE FROM user_roles;
DELETE FROM users;
DELETE FROM marinas;
DELETE FROM marina_groups;
GO

-- Create Marina Group
INSERT INTO marina_groups (id, name, description, createdAt, updatedAt)
VALUES ('marina-group-1', 'Harbor View Marina Group', 'Premium marina management group serving the coastal community', GETDATE(), GETDATE());

-- Create Marina
INSERT INTO marinas (id, name, code, address, phone, email, timezone, isActive, isOnline, lastSyncAt, createdAt, updatedAt, marinaGroupId)
VALUES ('marina-1', 'Harbor View Marina', 'HVM001', '123 Harbor Drive, Coastal City, CA 90210', '+1 (555) 123-4567', 'info@harborviewmarina.com', 'America/Los_Angeles', 1, 1, NULL, GETDATE(), GETDATE(), 'marina-group-1');

-- Create Demo User
INSERT INTO users (id, email, firstName, lastName, phone, isActive, lastLoginAt, createdAt, updatedAt, marinaId, marinaGroupId)
VALUES ('user-1', 'demo@marina.com', 'John', 'Doe', '+1 (555) 987-6543', 1, NULL, GETDATE(), GETDATE(), 'marina-1', 'marina-group-1');

-- Create User Roles
INSERT INTO user_roles (id, userId, role, marinaId, createdAt)
VALUES ('role-1', 'user-1', 'MARINA_ADMIN', 'marina-1', GETDATE());

INSERT INTO user_roles (id, userId, role, marinaId, createdAt)
VALUES ('role-2', 'user-1', 'SUPER_ADMIN', 'marina-1', GETDATE());

-- Create Demo Owner
INSERT INTO owners (id, externalId, firstName, lastName, email, phone, address, isActive, createdAt, updatedAt, marinaId)
VALUES ('owner-1', 'EXT001', 'John', 'Smith', 'john.smith@email.com', '+1 (555) 111-2222', '456 Oak Street, Coastal City, CA 90210', 1, GETDATE(), GETDATE(), 'marina-1');

-- Create Demo Boat (using correct column names from schema)
INSERT INTO boats (id, externalId, name, registration, length, beam, draft, isActive, createdAt, updatedAt, ownerId, marinaId)
VALUES ('boat-1', 'BOAT001', 'Sea Breeze', 'CA1234AB', 32.5, 12.0, 4.2, 1, GETDATE(), GETDATE(), 'owner-1', 'marina-1');

-- Create Demo Berth (using correct column names from schema)
INSERT INTO berths (id, externalId, berthNumber, length, beam, isAvailable, isActive, createdAt, updatedAt, marinaId)
VALUES ('berth-1', 'BERTH001', 'A1', 40.0, 15.0, 1, 1, GETDATE(), GETDATE(), 'marina-1');

-- Create Demo Contract
INSERT INTO contracts (id, externalId, contractNumber, startDate, endDate, monthlyRate, status, createdAt, updatedAt, ownerId, boatId, berthId, marinaId)
VALUES ('contract-1', 'CON001', 'CON-2024-001', '2024-01-01', '2024-12-31', 450.00, 'ACTIVE', GETDATE(), GETDATE(), 'owner-1', 'boat-1', 'berth-1', 'marina-1');

PRINT 'Test data created successfully!';
PRINT 'You can now sign in with: demo@marina.com';
GO
