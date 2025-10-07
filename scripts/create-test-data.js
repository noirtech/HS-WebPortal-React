const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createTestData() {
  try {
    console.log('Creating test data...');

    // Create a marina group
    const marinaGroup = await prisma.marinaGroup.create({
      data: {
        name: 'Test Marina Group',
        description: 'Test group for development'
      }
    });
    console.log('Created marina group:', marinaGroup.id);

    // Create a marina
    const marina = await prisma.marina.create({
      data: {
        name: 'Test Marina',
        code: 'TEST001',
        address: '123 Test Street, Test City',
        phone: '555-0123',
        email: 'test@marina.com',
        marinaGroupId: marinaGroup.id
      }
    });
    console.log('Created marina:', marina.id);

    // Create an owner
    const owner = await prisma.owner.create({
      data: {
        externalId: 'OWNER-001',
        firstName: 'Alan',
        lastName: 'Smith',
        email: 'a@b.com',
        phone: '555-0124',
        address: '456 Owner Street, Owner City',
        marinaId: marina.id
      }
    });
    console.log('Created owner:', owner.id);

    console.log('Test data created successfully!');
    console.log('Marina ID:', marina.id);
    console.log('Owner ID:', owner.id);

  } catch (error) {
    console.error('Error creating test data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestData();
