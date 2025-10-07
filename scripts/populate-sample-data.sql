-- Populate sample data for the newly created tables
-- This script adds sample owners, boats, and contracts to test the enhanced berth functionality

-- Sample owners data
INSERT INTO owners (id, firstName, lastName, email, phone, address, isActive, marinaId, createdAt, updatedAt)
VALUES 
    ('owner-1', 'John', 'Smith', 'john.smith@email.com', '+1 (555) 123-4567', '123 Ocean View Drive, Coastal City, CA 90210', 1, 'marina-1', GETDATE(), GETDATE()),
    ('owner-2', 'Sarah', 'Johnson', 'sarah.j@email.com', '+1 (555) 234-5678', '456 Harbor Lane, Coastal City, CA 90210', 1, 'marina-1', GETDATE(), GETDATE()),
    ('owner-3', 'Mike', 'Wilson', 'mike.wilson@email.com', '+1 (555) 345-6789', '789 Marina Way, Coastal City, CA 90210', 1, 'marina-1', GETDATE(), GETDATE()),
    ('owner-4', 'Emily', 'Davis', 'emily.davis@email.com', '+1 (555) 456-7890', '321 Dock Street, Coastal City, CA 90210', 1, 'marina-1', GETDATE(), GETDATE()),
    ('owner-5', 'David', 'Brown', 'david.brown@email.com', '+1 (555) 567-8901', '654 Sailor Road, Coastal City, CA 90210', 1, 'marina-1', GETDATE(), GETDATE())

-- Sample boats data
INSERT INTO boats (id, name, registration, length, beam, draft, isActive, marinaId, ownerId, createdAt, updatedAt)
VALUES 
    ('boat-1', 'Sea Breeze', 'CA1234AB', 12.5, 4.2, 1.8, 1, 'marina-1', 'owner-1', GETDATE(), GETDATE()),
    ('boat-2', 'Ocean Explorer', 'CA5678CD', 15.0, 5.0, 2.1, 1, 'marina-1', 'owner-2', GETDATE(), GETDATE()),
    ('boat-3', 'Marina Dream', 'CA9012EF', 10.0, 3.5, 1.5, 1, 'marina-1', 'owner-3', GETDATE(), GETDATE()),
    ('boat-4', 'Harbor Light', 'CA3456GH', 18.0, 6.0, 2.5, 1, 'marina-1', 'owner-4', GETDATE(), GETDATE()),
    ('boat-5', 'Coastal Star', 'CA7890IJ', 13.5, 4.5, 1.9, 1, 'marina-1', 'owner-5', GETDATE(), GETDATE())

-- Sample contracts data (assigning boats to berths)
INSERT INTO contracts (id, contractNumber, startDate, endDate, monthlyRate, status, notes, marinaId, berthId, boatId, ownerId, createdAt, updatedAt)
VALUES 
    ('contract-1', 'CON-2024-001', '2024-01-01', '2024-12-31', 450.00, 'ACTIVE', 'Premium berth with excellent views', 'marina-1', 'berth-1', 'boat-1', 'owner-1', GETDATE(), GETDATE()),
    ('contract-2', 'CON-2024-002', '2024-02-01', '2024-11-30', 580.00, 'ACTIVE', 'Large berth for motor yachts', 'marina-1', 'berth-10', 'boat-2', 'owner-2', GETDATE(), GETDATE()),
    ('contract-3', 'CON-2024-003', '2024-03-01', '2024-10-31', 380.00, 'ACTIVE', 'Standard berth, good access', 'marina-1', 'berth-2', 'boat-3', 'owner-3', GETDATE(), GETDATE()),
    ('contract-4', 'CON-2024-004', '2024-04-01', '2024-09-30', 520.00, 'ACTIVE', 'Deep water berth for larger vessels', 'marina-1', 'berth-3', 'boat-4', 'owner-4', GETDATE(), GETDATE()),
    ('contract-5', 'CON-2024-005', '2024-05-01', '2024-08-31', 420.00, 'ACTIVE', 'Convenient location near facilities', 'marina-1', 'berth-4', 'boat-5', 'owner-5', GETDATE(), GETDATE())

PRINT 'Sample data populated successfully!'
PRINT 'Created 5 owners, 5 boats, and 5 active contracts'
PRINT 'You can now test the enhanced berth functionality with real contract and boat data.'
