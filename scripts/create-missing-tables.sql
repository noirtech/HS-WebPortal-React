-- Create missing tables for full berth functionality
-- This script adds the contracts, boats, and owners tables that are referenced in the Prisma schema

-- Create owners table
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='owners' AND xtype='U')
BEGIN
    CREATE TABLE owners (
        id NVARCHAR(255) PRIMARY KEY,
        firstName NVARCHAR(255) NOT NULL,
        lastName NVARCHAR(255) NOT NULL,
        email NVARCHAR(255),
        phone NVARCHAR(255),
        address NVARCHAR(500),
        isActive BIT DEFAULT 1,
        createdAt DATETIME2 DEFAULT GETDATE(),
        updatedAt DATETIME2 DEFAULT GETDATE(),
        marinaId NVARCHAR(255) NOT NULL
    )
    PRINT 'Created owners table'
END
ELSE
BEGIN
    PRINT 'owners table already exists'
END

-- Create boats table
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='boats' AND xtype='U')
BEGIN
    CREATE TABLE boats (
        id NVARCHAR(255) PRIMARY KEY,
        name NVARCHAR(255) NOT NULL,
        registration NVARCHAR(255),
        length FLOAT NOT NULL,
        beam FLOAT,
        draft FLOAT,
        isActive BIT DEFAULT 1,
        createdAt DATETIME2 DEFAULT GETDATE(),
        updatedAt DATETIME2 DEFAULT GETDATE(),
        marinaId NVARCHAR(255) NOT NULL,
        ownerId NVARCHAR(255) NOT NULL
    )
    PRINT 'Created boats table'
END
ELSE
BEGIN
    PRINT 'boats table already exists'
END

-- Create contracts table
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='contracts' AND xtype='U')
BEGIN
    CREATE TABLE contracts (
        id NVARCHAR(255) PRIMARY KEY,
        contractNumber NVARCHAR(255) UNIQUE NOT NULL,
        startDate DATETIME2 NOT NULL,
        endDate DATETIME2 NOT NULL,
        monthlyRate FLOAT NOT NULL,
        status NVARCHAR(50) DEFAULT 'ACTIVE',
        notes NVARCHAR(1000),
        createdAt DATETIME2 DEFAULT GETDATE(),
        updatedAt DATETIME2 DEFAULT GETDATE(),
        marinaId NVARCHAR(255) NOT NULL,
        berthId NVARCHAR(255) NOT NULL,
        boatId NVARCHAR(255) NOT NULL,
        ownerId NVARCHAR(255) NOT NULL
    )
    PRINT 'Created contracts table'
END
ELSE
BEGIN
    PRINT 'contracts table already exists'
END

-- Add foreign key constraints
-- Note: These will only work if the referenced tables exist and have the correct structure

-- Add foreign key for boats.ownerId -> owners.id
IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_boats_owners')
BEGIN
    ALTER TABLE boats ADD CONSTRAINT FK_boats_owners 
    FOREIGN KEY (ownerId) REFERENCES owners(id)
    PRINT 'Added foreign key constraint FK_boats_owners'
END

-- Add foreign key for boats.marinaId -> marinas.id (if marinas table exists)
IF EXISTS (SELECT * FROM sysobjects WHERE name='marinas' AND xtype='U')
    AND NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_boats_marinas')
BEGIN
    ALTER TABLE boats ADD CONSTRAINT FK_boats_marinas 
    FOREIGN KEY (marinaId) REFERENCES marinas(id)
    PRINT 'Added foreign key constraint FK_boats_marinas'
END

-- Add foreign key for contracts.berthId -> berths.id
IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_contracts_berths')
BEGIN
    ALTER TABLE contracts ADD CONSTRAINT FK_contracts_berths 
    FOREIGN KEY (berthId) REFERENCES berths(id)
    PRINT 'Added foreign key constraint FK_contracts_berths'
END

-- Add foreign key for contracts.boatId -> boats.id
IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_contracts_boats')
BEGIN
    ALTER TABLE contracts ADD CONSTRAINT FK_contracts_boats 
    FOREIGN KEY (boatId) REFERENCES boats(id)
    PRINT 'Added foreign key constraint FK_contracts_boats'
END

-- Add foreign key for contracts.ownerId -> owners.id
IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_contracts_owners')
BEGIN
    ALTER TABLE contracts ADD CONSTRAINT FK_contracts_owners 
    FOREIGN KEY (ownerId) REFERENCES owners(id)
    PRINT 'Added foreign key constraint FK_contracts_owners'
END

-- Add foreign key for contracts.marinaId -> marinas.id (if marinas table exists)
IF EXISTS (SELECT * FROM sysobjects WHERE name='marinas' AND xtype='U')
    AND NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_contracts_marinas')
BEGIN
    ALTER TABLE contracts ADD CONSTRAINT FK_contracts_marinas 
    FOREIGN KEY (marinaId) REFERENCES marinas(id)
    PRINT 'Added foreign key constraint FK_contracts_marinas'
END

-- Add foreign key for owners.marinaId -> marinas.id (if marinas table exists)
IF EXISTS (SELECT * FROM sysobjects WHERE name='marinas' AND xtype='U')
    AND NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_owners_marinas')
BEGIN
    ALTER TABLE owners ADD CONSTRAINT FK_owners_marinas 
    FOREIGN KEY (marinaId) REFERENCES marinas(id)
    PRINT 'Added foreign key constraint FK_owners_marinas'
END

PRINT 'Table creation script completed successfully!'
PRINT 'You can now populate these tables with sample data to test the enhanced berth functionality.'
