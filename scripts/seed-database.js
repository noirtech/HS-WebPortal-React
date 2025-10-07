require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedDatabase() {
  console.log('🌱 Starting database seeding...');

  try {
    // Clear existing data (optional - comment out if you want to keep existing data)
    console.log('🧹 Clearing existing data...');
    await prisma.workOrder.deleteMany();
    await prisma.invoice.deleteMany();
    await prisma.contract.deleteMany();
    await prisma.boat.deleteMany();
    await prisma.berth.deleteMany();
    await prisma.owner.deleteMany();

    // Create owners/customers
    console.log('👥 Creating owners...');
    const owners = await Promise.all([
      prisma.owner.create({
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
      }),
      prisma.owner.create({
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
      }),
      prisma.owner.create({
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
      }),
      prisma.owner.create({
        data: {
          id: 'owner-4',
          externalId: 'EXT004',
          firstName: 'Emma',
          lastName: 'Wilson',
          email: 'emma.wilson@email.com',
          phone: '+44 7700 900004',
          address: '321 Quay Lane, Plymouth, PL1 4DD',
          marinaId: 'marina-1',
          createdAt: new Date('2024-04-05'),
          updatedAt: new Date()
        }
      }),
      prisma.owner.create({
        data: {
          id: 'owner-5',
          externalId: 'EXT005',
          firstName: 'David',
          lastName: 'Taylor',
          email: 'david.taylor@email.com',
          phone: '+44 7700 900005',
          address: '654 Harbour Drive, Weymouth, DT4 5EE',
          marinaId: 'marina-1',
          createdAt: new Date('2024-05-12'),
          updatedAt: new Date()
        }
      })
    ]);

    console.log(`✅ Created ${owners.length} owners`);

    // Create berths
    console.log('⚓ Creating berths...');
    const berths = await Promise.all([
      prisma.berth.create({
        data: {
          id: 'berth-1',
          externalId: 'B001',
          berthNumber: 'A1',
          length: 25.0,
          beam: 8.0,
          isAvailable: false,
          marinaId: 'marina-1',
          marinaGroupId: 'marina-group-1',
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date()
        }
      }),
      prisma.berth.create({
        data: {
          id: 'berth-2',
          externalId: 'B002',
          berthNumber: 'A2',
          length: 30.0,
          beam: 10.0,
          isAvailable: false,
          marinaId: 'marina-1',
          marinaGroupId: 'marina-group-1',
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date()
        }
      }),
      prisma.berth.create({
        data: {
          id: 'berth-3',
          externalId: 'B003',
          berthNumber: 'A3',
          length: 20.0,
          beam: 6.0,
          isAvailable: true,
          marinaId: 'marina-1',
          marinaGroupId: 'marina-group-1',
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date()
        }
      }),
      prisma.berth.create({
        data: {
          id: 'berth-4',
          externalId: 'B004',
          berthNumber: 'B1',
          length: 35.0,
          beam: 12.0,
          isAvailable: false,
          marinaId: 'marina-1',
          marinaGroupId: 'marina-group-1',
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date()
        }
      }),
      prisma.berth.create({
        data: {
          id: 'berth-5',
          externalId: 'B005',
          berthNumber: 'B2',
          length: 28.0,
          beam: 9.0,
          isAvailable: true,
          marinaId: 'marina-1',
          marinaGroupId: 'marina-group-1',
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date()
        }
      }),
      prisma.berth.create({
        data: {
          id: 'berth-6',
          externalId: 'B006',
          berthNumber: 'C1',
          length: 40.0,
          beam: 15.0,
          isAvailable: false,
          marinaId: 'marina-1',
          marinaGroupId: 'marina-group-1',
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date()
        }
      })
    ]);

    console.log(`✅ Created ${berths.length} berths`);

    // Create boats
    console.log('🚤 Creating boats...');
    const boats = await Promise.all([
      prisma.boat.create({
        data: {
          id: 'boat-1',
          externalId: 'BOAT001',
          name: 'Sea Breeze',
          registrationNumber: 'GB123456',
          length: 22.0,
          beam: 7.5,
          draft: 2.2,
          isActive: true,
          marinaId: 'marina-1',
          marinaGroupId: 'marina-group-1',
          ownerId: 'owner-1',
          berthId: 'berth-1',
          createdAt: new Date('2024-01-15'),
          updatedAt: new Date()
        }
      }),
      prisma.boat.create({
        data: {
          id: 'boat-2',
          externalId: 'BOAT002',
          name: 'Ocean Explorer',
          registrationNumber: 'GB234567',
          length: 28.0,
          beam: 9.5,
          draft: 2.8,
          isActive: true,
          marinaId: 'marina-1',
          marinaGroupId: 'marina-group-1',
          ownerId: 'owner-2',
          berthId: 'berth-2',
          createdAt: new Date('2024-02-20'),
          updatedAt: new Date()
        }
      }),
      prisma.boat.create({
        data: {
          id: 'boat-3',
          externalId: 'BOAT003',
          name: 'Harbour Master',
          registrationNumber: 'GB345678',
          length: 18.0,
          beam: 5.8,
          draft: 1.8,
          isActive: false,
          marinaId: 'marina-1',
          marinaGroupId: 'marina-group-1',
          ownerId: 'owner-3',
          berthId: null,
          createdAt: new Date('2024-03-10'),
          updatedAt: new Date()
        }
      }),
      prisma.boat.create({
        data: {
          id: 'boat-4',
          externalId: 'BOAT004',
          name: 'Coastal Cruiser',
          registrationNumber: 'GB456789',
          length: 32.0,
          beam: 11.0,
          draft: 3.2,
          isActive: true,
          marinaId: 'marina-1',
          marinaGroupId: 'marina-group-1',
          ownerId: 'owner-4',
          berthId: 'berth-4',
          createdAt: new Date('2024-04-05'),
          updatedAt: new Date()
        }
      }),
      prisma.boat.create({
        data: {
          id: 'boat-5',
          externalId: 'BOAT005',
          name: 'Marina Queen',
          registrationNumber: 'GB567890',
          length: 25.5,
          beam: 8.2,
          draft: 2.4,
          isActive: true,
          marinaId: 'marina-1',
          marinaGroupId: 'marina-group-1',
          ownerId: 'owner-5',
          berthId: 'berth-6',
          createdAt: new Date('2024-05-12'),
          updatedAt: new Date()
        }
      }),
      prisma.boat.create({
        data: {
          id: 'boat-6',
          externalId: 'BOAT006',
          name: 'Sailing Spirit',
          registrationNumber: 'GB678901',
          length: 26.0,
          beam: 8.5,
          draft: 2.6,
          isActive: true,
          marinaId: 'marina-1',
          marinaGroupId: 'marina-group-1',
          ownerId: 'owner-1',
          berthId: null,
          createdAt: new Date('2024-06-01'),
          updatedAt: new Date()
        }
      })
    ]);

    console.log(`✅ Created ${boats.length} boats`);

    // Create contracts
    console.log('📋 Creating contracts...');
    const contracts = await Promise.all([
      prisma.contract.create({
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
      }),
      prisma.contract.create({
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
      }),
      prisma.contract.create({
        data: {
          id: 'contract-3',
          externalId: 'CON003',
          contractNumber: 'CTR-2024-003',
          startDate: new Date('2024-03-10'),
          endDate: new Date('2024-09-30'),
          monthlyRate: 350.00,
          status: 'EXPIRED',
          marinaId: 'marina-1',
          ownerId: 'owner-3',
          boatId: 'boat-3',
          berthId: null,
          createdAt: new Date('2024-03-10'),
          updatedAt: new Date()
        }
      }),
      prisma.contract.create({
        data: {
          id: 'contract-4',
          externalId: 'CON004',
          contractNumber: 'CTR-2024-004',
          startDate: new Date('2024-04-05'),
          endDate: new Date('2024-12-31'),
          monthlyRate: 650.00,
          status: 'ACTIVE',
          marinaId: 'marina-1',
          ownerId: 'owner-4',
          boatId: 'boat-4',
          berthId: 'berth-4',
          createdAt: new Date('2024-04-05'),
          updatedAt: new Date()
        }
      }),
      prisma.contract.create({
        data: {
          id: 'contract-5',
          externalId: 'CON005',
          contractNumber: 'CTR-2024-005',
          startDate: new Date('2024-05-12'),
          endDate: new Date('2024-12-31'),
          monthlyRate: 500.00,
          status: 'PENDING',
          marinaId: 'marina-1',
          ownerId: 'owner-5',
          boatId: 'boat-5',
          berthId: 'berth-6',
          createdAt: new Date('2024-05-12'),
          updatedAt: new Date()
        }
      }),
      prisma.contract.create({
        data: {
          id: 'contract-6',
          externalId: 'CON006',
          contractNumber: 'CTR-2024-006',
          startDate: new Date('2024-06-01'),
          endDate: new Date('2024-12-31'),
          monthlyRate: 400.00,
          status: 'ACTIVE',
          marinaId: 'marina-1',
          ownerId: 'owner-1',
          boatId: 'boat-6',
          berthId: null,
          createdAt: new Date('2024-06-01'),
          updatedAt: new Date()
        }
      })
    ]);

    console.log(`✅ Created ${contracts.length} contracts`);

    // Create invoices with varied dates and amounts
    console.log('🧾 Creating invoices...');
    const invoiceData = [
      { month: 1, amount: 450.00, status: 'PAID' },
      { month: 2, amount: 450.00, status: 'PAID' },
      { month: 2, amount: 550.00, status: 'PAID' },
      { month: 3, amount: 450.00, status: 'PAID' },
      { month: 3, amount: 550.00, status: 'PAID' },
      { month: 3, amount: 350.00, status: 'PAID' },
      { month: 4, amount: 450.00, status: 'PAID' },
      { month: 4, amount: 550.00, status: 'PAID' },
      { month: 4, amount: 650.00, status: 'PAID' },
      { month: 5, amount: 450.00, status: 'PAID' },
      { month: 5, amount: 550.00, status: 'PAID' },
      { month: 5, amount: 650.00, status: 'PENDING' },
      { month: 6, amount: 450.00, status: 'PAID' },
      { month: 6, amount: 550.00, status: 'PAID' },
      { month: 6, amount: 650.00, status: 'PAID' },
      { month: 6, amount: 400.00, status: 'PAID' },
      { month: 7, amount: 450.00, status: 'PAID' },
      { month: 7, amount: 550.00, status: 'PAID' },
      { month: 7, amount: 650.00, status: 'PAID' },
      { month: 7, amount: 400.00, status: 'PAID' },
      { month: 8, amount: 450.00, status: 'PAID' },
      { month: 8, amount: 550.00, status: 'PAID' },
      { month: 8, amount: 650.00, status: 'PAID' },
      { month: 8, amount: 400.00, status: 'PAID' },
      { month: 8, amount: 500.00, status: 'PENDING' }
    ];

    const invoices = await Promise.all(
      invoiceData.map((data, index) => {
        const date = new Date(2024, data.month - 1, 15);
        return prisma.invoice.create({
          data: {
            id: `invoice-${index + 1}`,
            externalId: `INV${String(index + 1).padStart(3, '0')}`,
            invoiceNumber: `INV-2024-${String(index + 1).padStart(3, '0')}`,
            issueDate: date,
            dueDate: new Date(date.getTime() + 30 * 24 * 60 * 60 * 1000),
            status: data.status,
            subtotal: data.amount * 0.8,
            tax: data.amount * 0.2,
            total: data.amount,
            description: `Monthly berth rental - ${date.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}`,
            marinaId: 'marina-1',
            ownerId: `owner-${(index % 5) + 1}`,
            contractId: `contract-${(index % 6) + 1}`,
            createdAt: date,
            updatedAt: new Date()
          }
        });
      })
    );

    console.log(`✅ Created ${invoices.length} invoices`);

    // Create work orders
    console.log('🔧 Creating work orders...');
    const workOrderData = [
      { description: 'Engine maintenance and oil change', status: 'COMPLETED', daysToComplete: 3 },
      { description: 'Hull cleaning and anti-fouling', status: 'COMPLETED', daysToComplete: 2 },
      { description: 'Electrical system inspection', status: 'COMPLETED', daysToComplete: 1 },
      { description: 'Propeller repair and balancing', status: 'IN_PROGRESS', daysToComplete: null },
      { description: 'Navigation equipment upgrade', status: 'PENDING', daysToComplete: null },
      { description: 'Safety equipment inspection', status: 'COMPLETED', daysToComplete: 1 },
      { description: 'Bilge pump replacement', status: 'COMPLETED', daysToComplete: 2 },
      { description: 'Deck hardware maintenance', status: 'PENDING', daysToComplete: null }
    ];

    const workOrders = await Promise.all(
      workOrderData.map((data, index) => {
        const startDate = new Date(2024, Math.floor(Math.random() * 8), Math.floor(Math.random() * 28) + 1);
        const completedDate = data.status === 'COMPLETED' 
          ? new Date(startDate.getTime() + data.daysToComplete * 24 * 60 * 60 * 1000)
          : null;

        return prisma.workOrder.create({
          data: {
            id: `workorder-${index + 1}`,
            externalId: `WO${String(index + 1).padStart(3, '0')}`,
            description: data.description,
            status: data.status,
            priority: ['LOW', 'MEDIUM', 'HIGH'][Math.floor(Math.random() * 3)],
            requestedDate: startDate,
            completedDate: completedDate,
            totalCost: data.status === 'COMPLETED' ? Math.floor(Math.random() * 500) + 100 : null,
            marinaId: 'marina-1',
            boatId: `boat-${(index % 6) + 1}`,
            ownerId: `owner-${(index % 5) + 1}`,
            createdAt: startDate,
            updatedAt: new Date()
          }
        });
      })
    );

    console.log(`✅ Created ${workOrders.length} work orders`);

    console.log('🎉 Database seeding completed successfully!');
    console.log('\n📊 Summary of created data:');
    console.log(`   👥 Owners: ${owners.length}`);
    console.log(`   ⚓ Berths: ${berths.length}`);
    console.log(`   🚤 Boats: ${boats.length}`);
    console.log(`   📋 Contracts: ${contracts.length}`);
    console.log(`   🧾 Invoices: ${invoices.length}`);
    console.log(`   🔧 Work Orders: ${workOrders.length}`);

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seeding
seedDatabase()
  .then(() => {
    console.log('✅ Seeding completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  });
