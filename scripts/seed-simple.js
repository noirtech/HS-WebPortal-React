require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedDatabaseSimple() {
  console.log('🌱 Starting simple database seeding...');

  try {
    // Clear existing data
    console.log('🧹 Clearing existing data...');
    await prisma.workOrder.deleteMany();
    await prisma.invoice.deleteMany();
    await prisma.contract.deleteMany();
    await prisma.boat.deleteMany();
    await prisma.berth.deleteMany();
    await prisma.owner.deleteMany();

    // Create owners one by one
    console.log('👥 Creating owners...');
    
    const owner1 = await prisma.owner.create({
      data: {
        id: 'owner-1',
        externalId: 'EXT001',
        firstName: 'John',
        lastName: 'Smith',
        email: 'john.smith@email.com',
        phone: '+44 7700 900001',
        address: '123 Harbour View, Portsmouth, PO1 1AA',
        marinaId: 'marina-1',
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date()
      }
    });
    console.log('✅ Created owner 1');

    const owner2 = await prisma.owner.create({
      data: {
        id: 'owner-2',
        externalId: 'EXT002',
        firstName: 'Sarah',
        lastName: 'Johnson',
        email: 'sarah.johnson@email.com',
        phone: '+44 7700 900002',
        address: '456 Marina Street, Southampton, SO1 2BB',
        marinaId: 'marina-1',
        createdAt: new Date('2024-02-20'),
        updatedAt: new Date()
      }
    });
    console.log('✅ Created owner 2');

    const owner3 = await prisma.owner.create({
      data: {
        id: 'owner-3',
        externalId: 'EXT003',
        firstName: 'Michael',
        lastName: 'Brown',
        email: 'michael.brown@email.com',
        phone: '+44 7700 900003',
        address: '789 Dock Road, Brighton, BN1 3CC',
        marinaId: 'marina-1',
        createdAt: new Date('2024-03-10'),
        updatedAt: new Date()
      }
    });
    console.log('✅ Created owner 3');

    // Create berths one by one
    console.log('⚓ Creating berths...');
    
    const berth1 = await prisma.berth.create({
      data: {
        id: 'berth-1',
        externalId: 'B001',
        berthNumber: 'A1',
        length: 25.0,
        beam: 8.0,
        isAvailable: false,
        marinaId: 'marina-1',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date()
      }
    });
    console.log('✅ Created berth 1');

    const berth2 = await prisma.berth.create({
      data: {
        id: 'berth-2',
        externalId: 'B002',
        berthNumber: 'A2',
        length: 30.0,
        beam: 10.0,
        isAvailable: false,
        marinaId: 'marina-1',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date()
      }
    });
    console.log('✅ Created berth 2');

    const berth3 = await prisma.berth.create({
      data: {
        id: 'berth-3',
        externalId: 'B003',
        berthNumber: 'A3',
        length: 20.0,
        beam: 6.0,
        isAvailable: true,
        marinaId: 'marina-1',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date()
      }
    });
    console.log('✅ Created berth 3');

    // Create boats one by one
    console.log('🚤 Creating boats...');
    
    const boat1 = await prisma.boat.create({
      data: {
        id: 'boat-1',
        externalId: 'BOAT001',
        name: 'Sea Breeze',
        registration: 'GB123456',
        length: 22.0,
        beam: 7.5,
        isActive: true,
        marinaId: 'marina-1',
        ownerId: 'owner-1',
        berthId: 'berth-1',
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date()
      }
    });
    console.log('✅ Created boat 1');

    const boat2 = await prisma.boat.create({
      data: {
        id: 'boat-2',
        externalId: 'BOAT002',
        name: 'Ocean Explorer',
        registration: 'GB234567',
        length: 28.0,
        beam: 9.5,
        isActive: true,
        marinaId: 'marina-1',
        ownerId: 'owner-2',
        berthId: 'berth-2',
        createdAt: new Date('2024-02-20'),
        updatedAt: new Date()
      }
    });
    console.log('✅ Created boat 2');

    // Create contracts one by one
    console.log('📋 Creating contracts...');
    
    const contract1 = await prisma.contract.create({
      data: {
        id: 'contract-1',
        externalId: 'CON001',
        contractNumber: 'CTR-2024-001',
        startDate: new Date('2024-01-15'),
        endDate: new Date('2024-12-31'),
        monthlyRate: 450.00,
        status: 'ACTIVE',
        marinaId: 'marina-1',
        ownerId: 'owner-1',
        boatId: 'boat-1',
        berthId: 'berth-1',
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date()
      }
    });
    console.log('✅ Created contract 1');

    const contract2 = await prisma.contract.create({
      data: {
        id: 'contract-2',
        externalId: 'CON002',
        contractNumber: 'CTR-2024-002',
        startDate: new Date('2024-02-20'),
        endDate: new Date('2024-11-30'),
        monthlyRate: 550.00,
        status: 'ACTIVE',
        marinaId: 'marina-1',
        ownerId: 'owner-2',
        boatId: 'boat-2',
        berthId: 'berth-2',
        createdAt: new Date('2024-02-20'),
        updatedAt: new Date()
      }
    });
    console.log('✅ Created contract 2');

    // Create invoices one by one
    console.log('🧾 Creating invoices...');
    
    const invoice1 = await prisma.invoice.create({
      data: {
        id: 'invoice-1',
        externalId: 'INV001',
        invoiceNumber: 'INV-2024-001',
        issueDate: new Date('2024-01-15'),
        dueDate: new Date('2024-02-14'),
        status: 'PAID',
        subtotal: 360.00,
        tax: 90.00,
        total: 450.00,
        description: 'Monthly berth rental - January 2024',
        marinaId: 'marina-1',
        ownerId: 'owner-1',
        contractId: 'contract-1',
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date()
      }
    });
    console.log('✅ Created invoice 1');

    const invoice2 = await prisma.invoice.create({
      data: {
        id: 'invoice-2',
        externalId: 'INV002',
        invoiceNumber: 'INV-2024-002',
        issueDate: new Date('2024-02-15'),
        dueDate: new Date('2024-03-16'),
        status: 'PAID',
        subtotal: 440.00,
        tax: 110.00,
        total: 550.00,
        description: 'Monthly berth rental - February 2024',
        marinaId: 'marina-1',
        ownerId: 'owner-2',
        contractId: 'contract-2',
        createdAt: new Date('2024-02-15'),
        updatedAt: new Date()
      }
    });
    console.log('✅ Created invoice 2');

    // Create work orders one by one
    console.log('🔧 Creating work orders...');
    
    const workOrder1 = await prisma.workOrder.create({
      data: {
        id: 'workorder-1',
        externalId: 'WO001',
        description: 'Engine maintenance and oil change',
        status: 'COMPLETED',
        priority: 'MEDIUM',
        requestedDate: new Date('2024-01-20'),
        completedDate: new Date('2024-01-23'),
        totalCost: 250.00,
        marinaId: 'marina-1',
        boatId: 'boat-1',
        ownerId: 'owner-1',
        createdAt: new Date('2024-01-20'),
        updatedAt: new Date()
      }
    });
    console.log('✅ Created work order 1');

    const workOrder2 = await prisma.workOrder.create({
      data: {
        id: 'workorder-2',
        externalId: 'WO002',
        description: 'Hull cleaning and anti-fouling',
        status: 'COMPLETED',
        priority: 'LOW',
        requestedDate: new Date('2024-02-10'),
        completedDate: new Date('2024-02-12'),
        totalCost: 180.00,
        marinaId: 'marina-1',
        boatId: 'boat-2',
        ownerId: 'owner-2',
        createdAt: new Date('2024-02-10'),
        updatedAt: new Date()
      }
    });
    console.log('✅ Created work order 2');

    console.log('🎉 Simple database seeding completed successfully!');
    console.log('\n📊 Summary of created data:');
    console.log(`   👥 Owners: 3`);
    console.log(`   ⚓ Berths: 3`);
    console.log(`   🚤 Boats: 2`);
    console.log(`   📋 Contracts: 2`);
    console.log(`   🧾 Invoices: 2`);
    console.log(`   🔧 Work Orders: 2`);

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seeding
seedDatabaseSimple()
  .then(() => {
    console.log('✅ Seeding completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  });
